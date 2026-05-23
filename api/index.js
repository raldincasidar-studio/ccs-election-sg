require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const sharp = require('sharp');
const path = require('path');

const app = express();

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL || true : true,
  credentials: true,
}));
app.use(express.json({ limit: '20mb' }));

// ─── MongoDB Connection ───────────────────────────────────────────────────────
// M0 free tier allows ~500 connections total.
// Keep the pool small so restarts and multiple deployments don't exhaust it.

const MONGO_OPTS = {
  maxPoolSize: 5,                 // max simultaneous connections per process
  minPoolSize: 1,                 // keep 1 alive so first request is fast
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  bufferCommands: false,          // fail fast instead of queuing forever
};

let isConnected = false;

async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) return;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI environment variable is not set.');
  await mongoose.connect(uri, MONGO_OPTS);
  isConnected = true;
}

// Close connections cleanly on process exit so Atlas doesn't hold
// zombie connections open after deploys or restarts.
async function gracefulShutdown(signal) {
  console.log(`\n${signal} — closing MongoDB connections…`);
  if (ssaamConn) {
    try { await ssaamConn.close(); } catch (_) {}
  }
  await mongoose.disconnect();
  process.exit(0);
}
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ error: 'Database connection failed: ' + err.message });
  }
});

// ─── Schema JSON Transform ────────────────────────────────────────────────────

const toJsonOpts = {
  transform: (_, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
};

// ─── Models ───────────────────────────────────────────────────────────────────

const ProgramSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
}, { timestamps: true, toJSON: toJsonOpts });

const AdminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name:     { type: String, required: true },
}, { timestamps: true, toJSON: toJsonOpts });

const StudentSchema = new mongoose.Schema({
  student_id:      { type: String, required: true, unique: true },
  first_name:      { type: String, required: true },
  middle_name:     { type: String, default: '' },
  last_name:       { type: String, required: true },
  year_level:      { type: String, required: true },
  course:          { type: String, required: true },
  gender:          { type: String, enum: ['Male', 'Female', 'Other'], default: 'Other' },
  birth_date:      { type: String, default: '' },
  school_year:     { type: String, default: '2025-2026' },
  password:        { type: String, required: true },
  has_voted:       { type: Boolean, default: false },
  voted_positions: [{ type: String }],
}, {
  timestamps: true,
  toJSON: {
    transform: (_, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      delete ret.password;
      return ret;
    },
  },
});

const PositionSchema = new mongoose.Schema({
  title:              { type: String, required: true },
  order:              { type: Number, default: 1 },
  max_votes:          { type: Number, default: 1 },
  voter_eligibility:  { type: String, enum: ['all', 'by_course', 'by_year_level', 'by_course_and_year'], default: 'all' },
  eligible_courses:   [{ type: String }],
  eligible_year_levels: [{ type: String }],
  is_active:          { type: Boolean, default: true },
}, { timestamps: true, toJSON: toJsonOpts });

const PartylistSchema = new mongoose.Schema({
  name:  { type: String, required: true, unique: true },
  color: { type: String, default: '#2b2378' },
}, { timestamps: true, toJSON: toJsonOpts });

const CandidateSchema = new mongoose.Schema({
  position_id:     { type: String, required: true },
  partylist_id:    { type: String, default: '' },
  name:            { type: String, required: true },
  party:           { type: String, required: true },
  party_color:     { type: String, default: '#2b2378' },
  description:     { type: String, default: '' },
  candidate_photo: { type: String, default: '' },
  vote_count:      { type: Number, default: 0 },
}, { timestamps: true, toJSON: toJsonOpts });

const VoteSchema = new mongoose.Schema({
  student_id:   { type: String, required: true },
  position_id:  { type: String, required: true },
  candidate_id: { type: String, required: true },
  timestamp:    { type: Date, default: Date.now },
}, { timestamps: true, toJSON: toJsonOpts });

const ElectionSettingsSchema = new mongoose.Schema({
  title:       { type: String, default: 'JRMSU CCS Student Org Election' },
  school_year: { type: String, default: '2025-2026' },
  is_open:     { type: Boolean, default: false },
  start_date:  { type: String, default: '' },
  end_date:    { type: String, default: '' },
}, { timestamps: true, toJSON: toJsonOpts });

const Program         = mongoose.model('Program', ProgramSchema);
const Partylist       = mongoose.model('Partylist', PartylistSchema);
const Admin           = mongoose.model('Admin', AdminSchema);
const Student         = mongoose.model('Student', StudentSchema);
const Position        = mongoose.model('Position', PositionSchema);
const Candidate       = mongoose.model('Candidate', CandidateSchema);
const Vote            = mongoose.model('Vote', VoteSchema);
const ElectionSettings = mongoose.model('ElectionSettings', ElectionSettingsSchema);

// ─── SSAAM Connection (read-only, separate connection) ────────────────────────

const PROGRAM_MAP = {
  BSCS: 'BS Computer Science',
  BSIT: 'BS Information Technology',
  BSIS: 'BS Information Systems',
  ACT:  'Associate in Computer Technology',
};

let ssaamConn = null;
let CcsStudent = null;

async function getSSAAMStudent(student_id) {
  if (!ssaamConn || ssaamConn.readyState !== 1) {
    const uri = process.env.SSAAM_MONGODB_URI;
    if (!uri) throw new Error('SSAAM_MONGODB_URI is not configured.');
    // Close any stale connection before opening a new one
    if (ssaamConn && ssaamConn.readyState !== 0) {
      try { await ssaamConn.close(); } catch (_) {}
    }
    ssaamConn = await mongoose.createConnection(uri, {
      maxPoolSize: 3,
      minPoolSize: 0,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    }).asPromise();
    CcsStudent = null; // reset model so it's re-registered on the new connection
  }
  if (!CcsStudent) {
    const schema = new mongoose.Schema({
      student_id:  String,
      first_name:  String,
      middle_name: String,
      last_name:   String,
      year_level:  String,
      program:     String,
      email:       String,
      status:      String,
    }, { collection: 'ccs_students' });
    CcsStudent = ssaamConn.model('CcsStudent', schema);
  }
  return CcsStudent.findOne({ student_id });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function compressBase64Image(base64String, maxKb = 100) {
  if (!base64String || !base64String.startsWith('data:image')) return base64String;
  const matches = base64String.match(/^data:([A-Za-z+/]+);base64,(.+)$/);
  if (!matches) return base64String;
  const buffer = Buffer.from(matches[2], 'base64');
  let quality = 80;
  let compressed = buffer;
  do {
    compressed = await sharp(buffer)
      .resize({ width: 400, height: 400, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality })
      .toBuffer();
    quality -= 10;
  } while (compressed.length > maxKb * 1024 && quality > 10);
  return `data:image/jpeg;base64,${compressed.toString('base64')}`;
}

function isStudentEligible(student, position) {
  switch (position.voter_eligibility) {
    case 'all': return true;
    case 'by_course': return position.eligible_courses.includes(student.course);
    case 'by_year_level': return position.eligible_year_levels.includes(student.year_level);
    case 'by_course_and_year':
      return position.eligible_courses.includes(student.course) &&
             position.eligible_year_levels.includes(student.year_level);
    default: return false;
  }
}

async function getOrCreateSettings() {
  let s = await ElectionSettings.findOne();
  if (!s) s = await ElectionSettings.create({});
  return s;
}

function paginate(query, defaultLimit = 20) {
  const page  = Math.max(1, parseInt(query.page)  || 1);
  const limit = Math.min(1000, Math.max(1, parseInt(query.limit) || defaultLimit));
  const skip  = (page - 1) * limit;
  return { page, limit, skip };
}

const JWT_SECRET = process.env.JWT_SECRET || 'jrmsu-election-default-secret';

// ─── Auth Middleware ──────────────────────────────────────────────────────────

function auth(req, res, next) {
  const token = (req.headers.authorization || '').split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Authentication required.' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin access required.' });
  next();
}

function studentOnly(req, res, next) {
  if (req.user?.role !== 'student') return res.status(403).json({ error: 'Student access required.' });
  next();
}

// ─── Auth Routes ──────────────────────────────────────────────────────────────

app.post('/api/auth/login/admin', async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username });
    if (!admin || !(await bcrypt.compare(password, admin.password)))
      return res.status(401).json({ error: 'Invalid username or password.' });
    const token = jwt.sign({ id: admin._id, role: 'admin' }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, user: admin.toJSON() });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/auth/login/student', async (req, res) => {
  try {
    const student_id = String(req.body.student_id || '').trim().toUpperCase();
    const password = String(req.body.password || '').trim().toUpperCase();
    if (!student_id || !password)
      return res.status(400).json({ error: 'Student ID and last name are required.' });

    // 1. Check our own database first
    const existing = await Student.findOne({ student_id });
    if (existing) {
      const match = await bcrypt.compare(password, existing.password);
      if (!match) return res.status(401).json({ error: 'Invalid Student ID or password.' });
      const token = jwt.sign({ id: existing._id, role: 'student' }, JWT_SECRET, { expiresIn: '12h' });
      return res.json({ token, user: existing.toJSON() });
    }

    // 2. Not in our DB — look up in SSAAM
    let ssaamStudent;
    try {
      ssaamStudent = await getSSAAMStudent(student_id);
    } catch (e) {
      return res.status(503).json({ error: 'Could not connect to SSAAM database. Please try again later.' });
    }

    if (!ssaamStudent) {
      return res.status(404).json({
        error: 'You are not yet registered in SSAAM. Please create your account at ssaam.vercel.app first.',
        ssaam_url: 'https://ssaam.vercel.app/',
      });
    }

    // 3. Verify last name as password (case-insensitive)
    if (password !== String(ssaamStudent.last_name || '').trim().toUpperCase()) {
      return res.status(401).json({ error: 'Incorrect last name. Your password is your last name as registered in SSAAM.' });
    }

    // 4. Auto-register the student into our system
    const hashedPassword = await bcrypt.hash(String(ssaamStudent.last_name || '').trim().toUpperCase(), 10);
    const newStudent = await Student.create({
      student_id:  ssaamStudent.student_id,
      first_name:  ssaamStudent.first_name,
      middle_name: ssaamStudent.middle_name || '',
      last_name:   ssaamStudent.last_name,
      year_level:  ssaamStudent.year_level,
      course:      PROGRAM_MAP[ssaamStudent.program] || ssaamStudent.program,
      school_year: '2025-2026',
      password:    hashedPassword,
    });

    const token = jwt.sign({ id: newStudent._id, role: 'student' }, JWT_SECRET, { expiresIn: '12h' });
    return res.json({ token, user: newStudent.toJSON() });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { student_id, first_name, middle_name, last_name, year_level, course, gender, birth_date, school_year, password } = req.body;
    const exists = await Student.findOne({ student_id });
    if (exists) return res.status(409).json({ error: 'Student ID is already registered.' });
    const hashed = await bcrypt.hash(password, 10);
    const student = await Student.create({
      student_id, first_name, middle_name: middle_name || '', last_name,
      year_level, course, gender, birth_date, school_year, password: hashed,
    });
    res.status(201).json(student.toJSON());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Program Routes ───────────────────────────────────────────────────────────

app.get('/api/programs', async (req, res) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const search = req.query.search || '';
    const filter = search
      ? { $or: [{ code: new RegExp(search, 'i') }, { name: new RegExp(search, 'i') }] }
      : {};
    const [programs, total] = await Promise.all([
      Program.find(filter).skip(skip).limit(limit).sort({ name: 1 }),
      Program.countDocuments(filter),
    ]);
    res.json({ data: programs.map(p => p.toJSON()), pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/programs', auth, adminOnly, async (req, res) => {
  try {
    const { code, name } = req.body;
    const dup = await Program.findOne({ code: code.toUpperCase() });
    if (dup) return res.status(409).json({ error: 'A program with that code already exists.' });
    const program = await Program.create({ code: code.toUpperCase(), name });
    res.status(201).json(program.toJSON());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/programs/:id', auth, adminOnly, async (req, res) => {
  try {
    const { code, name } = req.body;
    const dup = await Program.findOne({ code: code.toUpperCase(), _id: { $ne: req.params.id } });
    if (dup) return res.status(409).json({ error: 'A program with that code already exists.' });
    const program = await Program.findByIdAndUpdate(req.params.id, { code: code.toUpperCase(), name }, { new: true });
    if (!program) return res.status(404).json({ error: 'Program not found.' });
    res.json(program.toJSON());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/programs/:id', auth, adminOnly, async (req, res) => {
  try {
    await Program.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Partylist Routes ─────────────────────────────────────────────────────────

app.get('/api/partylists', auth, async (req, res) => {
  try {
    const partylists = await Partylist.find().sort({ name: 1 });
    res.json(partylists.map(p => p.toJSON()));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/partylists', auth, adminOnly, async (req, res) => {
  try {
    const { name, color } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Partylist name is required.' });
    const dup = await Partylist.findOne({ name: new RegExp(`^${name.trim()}$`, 'i') });
    if (dup) return res.status(409).json({ error: 'A partylist with that name already exists.' });
    const partylist = await Partylist.create({ name: name.trim(), color: color || '#2b2378' });
    res.status(201).json(partylist.toJSON());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/partylists/:id', auth, adminOnly, async (req, res) => {
  try {
    const { name, color } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Partylist name is required.' });
    const dup = await Partylist.findOne({ name: new RegExp(`^${name.trim()}$`, 'i'), _id: { $ne: req.params.id } });
    if (dup) return res.status(409).json({ error: 'A partylist with that name already exists.' });
    const partylist = await Partylist.findByIdAndUpdate(req.params.id, { name: name.trim(), color }, { new: true });
    if (!partylist) return res.status(404).json({ error: 'Partylist not found.' });
    await Candidate.updateMany({ partylist_id: req.params.id }, { party: name.trim(), party_color: color });
    res.json(partylist.toJSON());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/partylists/:id', auth, adminOnly, async (req, res) => {
  try {
    await Partylist.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Position Routes ──────────────────────────────────────────────────────────

app.get('/api/positions', auth, async (req, res) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const search = req.query.search || '';
    const filter = search ? { title: new RegExp(search, 'i') } : {};
    const [positions, total] = await Promise.all([
      Position.find(filter).skip(skip).limit(limit).sort({ order: 1, title: 1 }),
      Position.countDocuments(filter),
    ]);
    res.json({ data: positions.map(p => p.toJSON()), pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/positions', auth, adminOnly, async (req, res) => {
  try {
    const position = await Position.create(req.body);
    res.status(201).json(position.toJSON());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/positions/:id', auth, adminOnly, async (req, res) => {
  try {
    const position = await Position.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!position) return res.status(404).json({ error: 'Position not found.' });
    res.json(position.toJSON());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/positions/:id', auth, adminOnly, async (req, res) => {
  try {
    const posId = req.params.id;
    await Promise.all([
      Position.findByIdAndDelete(posId),
      Candidate.deleteMany({ position_id: posId }),
    ]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Candidate Routes ─────────────────────────────────────────────────────────

app.get('/api/candidates', auth, async (req, res) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const { search, position_id } = req.query;
    const filter = {};
    if (position_id && position_id !== 'all') filter.position_id = position_id;
    if (search) filter.$or = [{ name: new RegExp(search, 'i') }, { party: new RegExp(search, 'i') }];
    const [candidates, total] = await Promise.all([
      Candidate.find(filter).skip(skip).limit(limit).sort({ name: 1 }),
      Candidate.countDocuments(filter),
    ]);
    res.json({ data: candidates.map(c => c.toJSON()), pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/candidates', auth, adminOnly, async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.candidate_photo) data.candidate_photo = await compressBase64Image(data.candidate_photo);
    const candidate = await Candidate.create(data);
    res.status(201).json(candidate.toJSON());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/candidates/:id', auth, adminOnly, async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.candidate_photo && data.candidate_photo.startsWith('data:image'))
      data.candidate_photo = await compressBase64Image(data.candidate_photo);
    const candidate = await Candidate.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!candidate) return res.status(404).json({ error: 'Candidate not found.' });
    res.json(candidate.toJSON());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/candidates/:id', auth, adminOnly, async (req, res) => {
  try {
    await Candidate.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Student Routes ───────────────────────────────────────────────────────────

app.get('/api/students', auth, adminOnly, async (req, res) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const { search, year_level, course, voted } = req.query;
    const filter = {};
    if (search) filter.$or = [
      { student_id: new RegExp(search, 'i') },
      { first_name: new RegExp(search, 'i') },
      { last_name: new RegExp(search, 'i') },
      { course: new RegExp(search, 'i') },
    ];
    if (year_level && year_level !== 'all') filter.year_level = year_level;
    if (course && course !== 'all') filter.course = course;
    if (voted === 'voted') filter.has_voted = true;
    if (voted === 'not_voted') filter.has_voted = false;
    const [students, total] = await Promise.all([
      Student.find(filter).skip(skip).limit(limit).sort({ last_name: 1, first_name: 1 }),
      Student.countDocuments(filter),
    ]);
    res.json({ data: students.map(s => s.toJSON()), pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/students', auth, adminOnly, async (req, res) => {
  try {
    const data = { ...req.body };
    const exists = await Student.findOne({ student_id: data.student_id });
    if (exists) return res.status(409).json({ error: 'Student ID already exists.' });
    data.password = await bcrypt.hash(data.password, 10);
    const student = await Student.create(data);
    res.status(201).json(student.toJSON());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/students/:id', auth, adminOnly, async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    } else {
      delete data.password;
    }
    const student = await Student.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!student) return res.status(404).json({ error: 'Student not found.' });
    res.json(student.toJSON());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/students/:id', auth, adminOnly, async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Vote Routes ──────────────────────────────────────────────────────────────

app.get('/api/votes/ballot', auth, studentOnly, async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);
    if (!student) return res.status(404).json({ error: 'Student not found.' });
    const positions = await Position.find({ is_active: true }).sort({ order: 1 });
    const eligible = positions.filter(p => isStudentEligible(student, p));
    const ballot = [];
    for (const pos of eligible) {
      const candidates = await Candidate.find({ position_id: pos.id });
      ballot.push({ position: pos.toJSON(), candidates: candidates.map(c => c.toJSON()) });
    }
    res.json({ student: student.toJSON(), ballot });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/votes/submit', auth, studentOnly, async (req, res) => {
  try {
    const { votesMap } = req.body;
    const student = await Student.findById(req.user.id);
    if (!student) return res.status(404).json({ error: 'Student not found.' });

    const newVotes = [];
    const newVotedPositions = [...student.voted_positions];

    for (const [positionId, candidateIds] of Object.entries(votesMap)) {
      if (newVotedPositions.includes(positionId)) continue;
      for (const candidateId of candidateIds) {
        newVotes.push({ student_id: student.id, position_id: positionId, candidate_id: candidateId, timestamp: new Date() });
        await Candidate.findByIdAndUpdate(candidateId, { $inc: { vote_count: 1 } });
      }
      newVotedPositions.push(positionId);
    }

    if (newVotes.length > 0) await Vote.insertMany(newVotes);

    const positions = await Position.find({ is_active: true });
    const eligible = positions.filter(p => isStudentEligible(student, p));
    const allVoted = eligible.length > 0 && eligible.every(p => newVotedPositions.includes(p.id));

    const updated = await Student.findByIdAndUpdate(
      student.id,
      { has_voted: allVoted, voted_positions: newVotedPositions },
      { new: true }
    );
    const token = jwt.sign({ id: updated._id, role: 'student' }, JWT_SECRET, { expiresIn: '12h' });
    res.json({ student: updated.toJSON(), token });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Settings Routes ──────────────────────────────────────────────────────────

app.get('/api/settings', async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    res.json(settings.toJSON());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/settings', auth, adminOnly, async (req, res) => {
  try {
    let settings = await ElectionSettings.findOne();
    if (!settings) settings = new ElectionSettings();
    Object.assign(settings, req.body);
    await settings.save();
    res.json(settings.toJSON());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

app.get('/api/dashboard/stats', auth, adminOnly, async (req, res) => {
  try {
    const [students_total, voted_count, positions_all, candidates_count, settings] = await Promise.all([
      Student.countDocuments(),
      Student.countDocuments({ has_voted: true }),
      Position.find().sort({ order: 1 }),
      Candidate.countDocuments(),
      getOrCreateSettings(),
    ]);

    const active_positions = positions_all.filter(p => p.is_active);
    const turnout_percent = students_total > 0 ? Math.round((voted_count / students_total) * 100) : 0;

    const leading_by_position = [];
    for (const pos of active_positions) {
      const candidates = await Candidate.find({ position_id: pos.id }).sort({ vote_count: -1 });
      const total_votes = candidates.reduce((s, c) => s + c.vote_count, 0);
      leading_by_position.push({
        position: pos.toJSON(),
        leader: candidates[0] ? candidates[0].toJSON() : null,
        total_votes,
      });
    }

    res.json({
      students_total,
      voted_count,
      not_voted_count: students_total - voted_count,
      positions_count: positions_all.length,
      active_positions_count: active_positions.length,
      candidates_count,
      turnout_percent,
      leading_by_position,
      settings: settings.toJSON(),
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Reports Routes ───────────────────────────────────────────────────────────

app.get('/api/reports/results', auth, adminOnly, async (req, res) => {
  try {
    const positions = await Position.find().sort({ order: 1 });
    const results = [];
    for (const pos of positions) {
      const candidates = await Candidate.find({ position_id: pos.id }).sort({ vote_count: -1 });
      const total_votes = candidates.reduce((s, c) => s + c.vote_count, 0);
      results.push({
        position: pos.toJSON(),
        candidates: candidates.map((c, i) => ({ ...c.toJSON(), rank: i + 1, is_winner: i < pos.max_votes })),
        total_votes,
      });
    }
    res.json(results);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/reports/masterlist', auth, adminOnly, async (req, res) => {
  try {
    const { page, limit, skip } = paginate({ ...req.query, limit: req.query.limit || 50 });
    const voted_param = req.query.voted;
    const filter = {};
    if (voted_param === 'voted') filter.has_voted = true;
    if (voted_param === 'not_voted') filter.has_voted = false;

    const [students, total, total_all, voted_count] = await Promise.all([
      Student.find(filter).skip(skip).limit(limit).sort({ last_name: 1, first_name: 1 }),
      Student.countDocuments(filter),
      Student.countDocuments(),
      Student.countDocuments({ has_voted: true }),
    ]);

    res.json({
      data: students.map(s => s.toJSON()),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      summary: { total: total_all, voted_count, not_voted_count: total_all - voted_count },
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Reset Votes ──────────────────────────────────────────────────────────────

app.post('/api/reset-votes', auth, adminOnly, async (req, res) => {
  try {
    await Promise.all([
      Candidate.updateMany({}, { $set: { vote_count: 0 } }),
      Student.updateMany({}, { $set: { has_voted: false, voted_positions: [] } }),
    ]);
    res.json({ message: 'All votes and student vote records have been reset.' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Production: Serve Frontend Build ────────────────────────────────────────

if (process.env.NODE_ENV === 'production') {
  const distDir = path.join(__dirname, '..', 'dist');
  app.use(express.static(distDir));
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('🌱 Seeding database...');

  const adminExists = await Admin.findOne({ username: 'CCS_ELECTION_ADMIN' });
  if (!adminExists) {
    await Admin.create({
      username: 'CCS_ELECTION_ADMIN',
      password: await bcrypt.hash('CCX_3LECTION_ADMIN2026', 10),
      name: 'Election Administrator',
    });
    console.log('✅ Admin created  →  username: CCS_ELECTION_ADMIN');
  } else {
    console.log('⚪ Admin already exists, skipping.');
  }

  const defaultPrograms = [
    { code: 'BSCS', name: 'BS Computer Science' },
    { code: 'BSIT', name: 'BS Information Technology' },
    { code: 'BSIS', name: 'BS Information Systems' },
    { code: 'ACT',  name: 'Associate in Computer Technology' },
  ];
  for (const prog of defaultPrograms) {
    if (!(await Program.findOne({ code: prog.code }))) {
      await Program.create(prog);
      console.log(`✅ Program created: ${prog.code} — ${prog.name}`);
    }
  }

  if (!(await ElectionSettings.findOne())) {
    await ElectionSettings.create({
      title: 'JRMSU CCS Student Org Election',
      school_year: '2025-2026',
      is_open: false,
      start_date: '2026-09-01',
      end_date: '2026-09-30',
    });
    console.log('✅ Election settings initialized.');
  }

  console.log('🎉 Seeding complete!');
}

// ─── Export for Vercel / Local Dev ───────────────────────────────────────────

module.exports = app;

if (require.main === module) {
  connectDB()
    .then(async () => {
      console.log('✅ Connected to MongoDB');
      if (process.argv.includes('--seed')) {
        await seed();
        await mongoose.disconnect();
        process.exit(0);
      }
      const PORT = process.env.PORT || 3001;
      app.listen(PORT, () => console.log(`🚀 API server running on port ${PORT}`));
    })
    .catch((err) => {
      console.error('❌ Failed to start:', err.message);
      process.exit(1);
    });
}
