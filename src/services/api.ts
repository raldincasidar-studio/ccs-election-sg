/**
 * API Service Layer
 * All functions here use mock data but are structured to be easily replaced with
 * actual fetch/axios API calls later. Each function mimics an async API call pattern.
 */

import type {
  Student,
  Candidate,
  Position,
  Vote,
  Admin,
  ElectionSettings,
  Course,
  YearLevel,
  Program,
} from '../types';

import {
  mockAdmins,
  mockStudents,
  mockPositions,
  mockCandidates,
  mockVotes,
  mockElectionSettings,
  mockPrograms,
} from '../data/mockData';

// ─── In-memory state (replaces DB) ───────────────────────────────────────────
let _programs: Program[] = [...mockPrograms];
let _students: Student[] = [...mockStudents];
let _positions: Position[] = [...mockPositions];
let _candidates: Candidate[] = [...mockCandidates];
let _votes: Vote[] = [...mockVotes];
let _settings: ElectionSettings = { ...mockElectionSettings };

function delay(ms = 300) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Programs ─────────────────────────────────────────────────────────────────

export async function getPrograms(): Promise<Program[]> {
  await delay(100);
  return [..._programs];
}

export async function createProgram(data: Omit<Program, 'id'>): Promise<Program> {
  await delay();
  const exists = _programs.find(
    (p) => p.code.toLowerCase() === data.code.toLowerCase()
  );
  if (exists) throw new Error('A program with that code already exists.');
  const newProg: Program = { ...data, id: `prog-${Date.now()}` };
  _programs.push(newProg);
  return newProg;
}

export async function updateProgram(id: string, data: Partial<Omit<Program, 'id'>>): Promise<Program> {
  await delay();
  const idx = _programs.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error('Program not found.');
  if (data.code) {
    const dup = _programs.find(
      (p) => p.id !== id && p.code.toLowerCase() === data.code!.toLowerCase()
    );
    if (dup) throw new Error('A program with that code already exists.');
  }
  _programs[idx] = { ..._programs[idx], ...data };
  return { ..._programs[idx] };
}

export async function deleteProgram(id: string): Promise<void> {
  await delay();
  _programs = _programs.filter((p) => p.id !== id);
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function loginAdmin(username: string, password: string): Promise<Admin> {
  await delay();
  const admin = mockAdmins.find(
    (a) => a.username === username && a.password === password
  );
  if (!admin) throw new Error('Invalid admin credentials.');
  return admin;
}

export async function loginStudent(student_id: string, password: string): Promise<Student> {
  await delay();
  const student = _students.find(
    (s) => s.student_id === student_id && s.password === password
  );
  if (!student) throw new Error('Invalid student ID or password.');
  return student;
}

export async function registerStudent(data: Omit<Student, 'id' | 'has_voted' | 'voted_positions'>): Promise<Student> {
  await delay();
  const exists = _students.find((s) => s.student_id === data.student_id);
  if (exists) throw new Error('Student ID already registered.');
  const newStudent: Student = {
    ...data,
    id: `stu-${Date.now()}`,
    has_voted: false,
    voted_positions: [],
  };
  _students.push(newStudent);
  return newStudent;
}

// ─── Election Settings ────────────────────────────────────────────────────────

export async function getElectionSettings(): Promise<ElectionSettings> {
  await delay(100);
  return { ..._settings };
}

export async function updateElectionSettings(data: Partial<ElectionSettings>): Promise<ElectionSettings> {
  await delay();
  _settings = { ..._settings, ...data };
  return { ..._settings };
}

// ─── Positions ────────────────────────────────────────────────────────────────

export async function getPositions(): Promise<Position[]> {
  await delay(100);
  return [..._positions].sort((a, b) => a.order - b.order);
}

export async function createPosition(data: Omit<Position, 'id'>): Promise<Position> {
  await delay();
  const newPos: Position = { ...data, id: `pos-${Date.now()}` };
  _positions.push(newPos);
  return newPos;
}

export async function updatePosition(id: string, data: Partial<Omit<Position, 'id'>>): Promise<Position> {
  await delay();
  const idx = _positions.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error('Position not found.');
  _positions[idx] = { ..._positions[idx], ...data };
  return { ..._positions[idx] };
}

export async function deletePosition(id: string): Promise<void> {
  await delay();
  _positions = _positions.filter((p) => p.id !== id);
  _candidates = _candidates.filter((c) => c.position_id !== id);
}

// ─── Candidates ───────────────────────────────────────────────────────────────

export async function getCandidates(): Promise<Candidate[]> {
  await delay(100);
  return [..._candidates];
}

export async function getCandidatesByPosition(position_id: string): Promise<Candidate[]> {
  await delay(100);
  return _candidates.filter((c) => c.position_id === position_id);
}

export async function createCandidate(data: Omit<Candidate, 'id' | 'vote_count'>): Promise<Candidate> {
  await delay();
  const newCand: Candidate = { ...data, id: `cand-${Date.now()}`, vote_count: 0 };
  _candidates.push(newCand);
  return newCand;
}

export async function updateCandidate(id: string, data: Partial<Omit<Candidate, 'id' | 'vote_count'>>): Promise<Candidate> {
  await delay();
  const idx = _candidates.findIndex((c) => c.id === id);
  if (idx === -1) throw new Error('Candidate not found.');
  _candidates[idx] = { ..._candidates[idx], ...data };
  return { ..._candidates[idx] };
}

export async function deleteCandidate(id: string): Promise<void> {
  await delay();
  _candidates = _candidates.filter((c) => c.id !== id);
}

// ─── Students ─────────────────────────────────────────────────────────────────

export async function getStudents(): Promise<Student[]> {
  await delay(100);
  return [..._students];
}

export async function createStudentAdmin(data: Omit<Student, 'id' | 'has_voted' | 'voted_positions'>): Promise<Student> {
  await delay();
  const exists = _students.find((s) => s.student_id === data.student_id);
  if (exists) throw new Error('Student ID already exists.');
  const newStudent: Student = {
    ...data,
    id: `stu-${Date.now()}`,
    has_voted: false,
    voted_positions: [],
  };
  _students.push(newStudent);
  return newStudent;
}

export async function updateStudent(id: string, data: Partial<Student>): Promise<Student> {
  await delay();
  const idx = _students.findIndex((s) => s.id === id);
  if (idx === -1) throw new Error('Student not found.');
  _students[idx] = { ..._students[idx], ...data };
  return { ..._students[idx] };
}

export async function deleteStudent(id: string): Promise<void> {
  await delay();
  _students = _students.filter((s) => s.id !== id);
}

// ─── Voting ───────────────────────────────────────────────────────────────────

export async function getEligiblePositions(student: Student): Promise<Position[]> {
  await delay(100);
  return _positions
    .filter((p) => p.is_active && isStudentEligible(student, p))
    .sort((a, b) => a.order - b.order);
}

export function isStudentEligible(student: Student, position: Position): boolean {
  switch (position.voter_eligibility) {
    case 'all':
      return true;
    case 'by_course':
      return position.eligible_courses.includes(student.course as Course);
    case 'by_year_level':
      return position.eligible_year_levels.includes(student.year_level as YearLevel);
    case 'by_course_and_year':
      return (
        position.eligible_courses.includes(student.course as Course) &&
        position.eligible_year_levels.includes(student.year_level as YearLevel)
      );
    default:
      return false;
  }
}

export async function submitVotes(
  student: Student,
  votesMap: Record<string, string[]> // position_id -> candidate_ids[]
): Promise<Student> {
  await delay(500);

  const newVotes: Vote[] = [];
  const votedPositionIds: string[] = [...student.voted_positions];

  for (const [positionId, candidateIds] of Object.entries(votesMap)) {
    if (votedPositionIds.includes(positionId)) continue;
    for (const candidateId of candidateIds) {
      newVotes.push({
        id: `v-${Date.now()}-${Math.random()}`,
        student_id: student.id,
        position_id: positionId,
        candidate_id: candidateId,
        timestamp: new Date().toISOString(),
      });
      // update candidate vote count
      const cIdx = _candidates.findIndex((c) => c.id === candidateId);
      if (cIdx !== -1) _candidates[cIdx].vote_count++;
    }
    votedPositionIds.push(positionId);
  }

  _votes.push(...newVotes);

  // Update student
  const sIdx = _students.findIndex((s) => s.id === student.id);
  const allPositions = _positions.filter((p) => p.is_active && isStudentEligible(student, p));
  const allVotedNow = allPositions.every((p) => votedPositionIds.includes(p.id));

  _students[sIdx] = {
    ..._students[sIdx],
    has_voted: allVotedNow,
    voted_positions: votedPositionIds,
  };

  return { ..._students[sIdx] };
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export async function getVotes(): Promise<Vote[]> {
  await delay(100);
  return [..._votes];
}

export interface PositionReport {
  position: Position;
  candidates: (Candidate & { rank: number; is_winner: boolean })[];
  total_votes: number;
}

export async function getElectionResults(): Promise<PositionReport[]> {
  await delay(200);
  const results: PositionReport[] = [];

  for (const position of _positions.sort((a, b) => a.order - b.order)) {
    const candidates = _candidates
      .filter((c) => c.position_id === position.id)
      .sort((a, b) => b.vote_count - a.vote_count);

    const total_votes = candidates.reduce((sum, c) => sum + c.vote_count, 0);

    const ranked = candidates.map((c, i) => ({
      ...c,
      rank: i + 1,
      is_winner: i < position.max_votes,
    }));

    results.push({ position, candidates: ranked, total_votes });
  }

  return results;
}

export interface VoterMasterlist {
  voted: Student[];
  not_voted: Student[];
  total: number;
  voted_count: number;
  not_voted_count: number;
}

export async function getVoterMasterlist(): Promise<VoterMasterlist> {
  await delay(100);
  const voted = _students.filter((s) => s.has_voted);
  const not_voted = _students.filter((s) => !s.has_voted);
  return {
    voted,
    not_voted,
    total: _students.length,
    voted_count: voted.length,
    not_voted_count: not_voted.length,
  };
}
