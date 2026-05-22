import axios from 'axios';
import type { Student, Candidate, Position, Program, Partylist, Admin, ElectionSettings } from '../types';

// ─── Axios Instance ────────────────────────────────────────────────────────────

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('election_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('election_token');
      localStorage.removeItem('election_user');
      window.location.reload();
    }
    const message = err.response?.data?.error || err.message || 'Request failed';
    return Promise.reject(new Error(message));
  }
);

// ─── Pagination Types ──────────────────────────────────────────────────────────

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function loginAdmin(username: string, password: string): Promise<Admin> {
  const { data } = await api.post('/auth/login/admin', { username, password });
  localStorage.setItem('election_token', data.token);
  return data.user as Admin;
}

export async function loginStudent(student_id: string, password: string): Promise<Student> {
  const { data } = await api.post('/auth/login/student', { student_id, password });
  localStorage.setItem('election_token', data.token);
  return data.user as Student;
}

export async function registerStudent(
  studentData: Omit<Student, 'id' | 'has_voted' | 'voted_positions'>
): Promise<Student> {
  const { data } = await api.post('/auth/register', studentData);
  return data as Student;
}

// ─── Partylists ───────────────────────────────────────────────────────────────

export async function getPartylists(): Promise<Partylist[]> {
  const { data } = await api.get('/partylists');
  return data as Partylist[];
}

export async function createPartylist(payload: Omit<Partylist, 'id'>): Promise<Partylist> {
  const { data } = await api.post('/partylists', payload);
  return data as Partylist;
}

export async function updatePartylist(id: string, payload: Partial<Omit<Partylist, 'id'>>): Promise<Partylist> {
  const { data } = await api.put(`/partylists/${id}`, payload);
  return data as Partylist;
}

export async function deletePartylist(id: string): Promise<void> {
  await api.delete(`/partylists/${id}`);
}

// ─── Programs ─────────────────────────────────────────────────────────────────

export async function getPrograms(): Promise<Program[]> {
  const { data } = await api.get<PaginatedResponse<Program>>('/programs', { params: { limit: 100 } });
  return data.data;
}

export async function createProgram(payload: Omit<Program, 'id'>): Promise<Program> {
  const { data } = await api.post('/programs', payload);
  return data as Program;
}

export async function updateProgram(id: string, payload: Partial<Omit<Program, 'id'>>): Promise<Program> {
  const { data } = await api.put(`/programs/${id}`, payload);
  return data as Program;
}

export async function deleteProgram(id: string): Promise<void> {
  await api.delete(`/programs/${id}`);
}

// ─── Positions ────────────────────────────────────────────────────────────────

export async function getPositions(): Promise<Position[]> {
  const { data } = await api.get<PaginatedResponse<Position>>('/positions', { params: { limit: 100 } });
  return data.data;
}

export async function createPosition(payload: Omit<Position, 'id'>): Promise<Position> {
  const { data } = await api.post('/positions', payload);
  return data as Position;
}

export async function updatePosition(id: string, payload: Partial<Omit<Position, 'id'>>): Promise<Position> {
  const { data } = await api.put(`/positions/${id}`, payload);
  return data as Position;
}

export async function deletePosition(id: string): Promise<void> {
  await api.delete(`/positions/${id}`);
}

// ─── Candidates ───────────────────────────────────────────────────────────────

export async function getCandidates(params?: {
  search?: string;
  position_id?: string;
  page?: number;
  limit?: number;
}): Promise<Candidate[]> {
  const { data } = await api.get<PaginatedResponse<Candidate>>('/candidates', {
    params: { limit: 500, ...params },
  });
  return data.data;
}

export async function getCandidatesByPosition(position_id: string): Promise<Candidate[]> {
  return getCandidates({ position_id });
}

export async function createCandidate(
  payload: Omit<Candidate, 'id' | 'vote_count'>
): Promise<Candidate> {
  const { data } = await api.post('/candidates', payload);
  return data as Candidate;
}

export async function updateCandidate(
  id: string,
  payload: Partial<Omit<Candidate, 'id' | 'vote_count'>>
): Promise<Candidate> {
  const { data } = await api.put(`/candidates/${id}`, payload);
  return data as Candidate;
}

export async function deleteCandidate(id: string): Promise<void> {
  await api.delete(`/candidates/${id}`);
}

// ─── Students ─────────────────────────────────────────────────────────────────

export interface StudentsFilter {
  page?: number;
  limit?: number;
  search?: string;
  year_level?: string;
  course?: string;
  voted?: string;
}

export async function getStudents(params?: StudentsFilter): Promise<PaginatedResponse<Student>> {
  const { data } = await api.get('/students', { params });
  return data as PaginatedResponse<Student>;
}

export async function createStudentAdmin(
  payload: Omit<Student, 'id' | 'has_voted' | 'voted_positions'>
): Promise<Student> {
  const { data } = await api.post('/students', payload);
  return data as Student;
}

export async function updateStudent(id: string, payload: Partial<Student>): Promise<Student> {
  const { data } = await api.put(`/students/${id}`, payload);
  return data as Student;
}

export async function deleteStudent(id: string): Promise<void> {
  await api.delete(`/students/${id}`);
}

// ─── Voting ───────────────────────────────────────────────────────────────────

export interface BallotEntry {
  position: Position;
  candidates: Candidate[];
}

export interface BallotData {
  student: Student;
  ballot: BallotEntry[];
}

export async function getBallot(): Promise<BallotData> {
  const { data } = await api.get('/votes/ballot');
  return data as BallotData;
}

export async function getEligiblePositions(_student: Student): Promise<Position[]> {
  const ballot = await getBallot();
  return ballot.ballot.map((b) => b.position);
}

export async function submitVotes(
  _student: Student,
  votesMap: Record<string, string[]>
): Promise<Student> {
  const { data } = await api.post('/votes/submit', { votesMap });
  if (data.token) localStorage.setItem('election_token', data.token);
  return data.student as Student;
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export async function getElectionSettings(): Promise<ElectionSettings> {
  const { data } = await api.get('/settings');
  return data as ElectionSettings;
}

export async function updateElectionSettings(
  payload: Partial<ElectionSettings>
): Promise<ElectionSettings> {
  const { data } = await api.put('/settings', payload);
  return data as ElectionSettings;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardLeader {
  position: Position;
  leader: Candidate | null;
  total_votes: number;
}

export interface DashboardStats {
  students_total: number;
  voted_count: number;
  not_voted_count: number;
  positions_count: number;
  active_positions_count: number;
  candidates_count: number;
  turnout_percent: number;
  leading_by_position: DashboardLeader[];
  settings: ElectionSettings;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data } = await api.get('/dashboard/stats');
  return data as DashboardStats;
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export interface PositionReport {
  position: Position;
  candidates: (Candidate & { rank: number; is_winner: boolean })[];
  total_votes: number;
}

export async function getElectionResults(): Promise<PositionReport[]> {
  const { data } = await api.get('/reports/results');
  return data as PositionReport[];
}

export interface VoterMasterlist {
  voted: Student[];
  not_voted: Student[];
  total: number;
  voted_count: number;
  not_voted_count: number;
}

export async function getVoterMasterlist(): Promise<VoterMasterlist> {
  const { data } = await api.get('/reports/masterlist', { params: { limit: 1000 } });
  const all: Student[] = data.data;
  return {
    voted:           all.filter((s) => s.has_voted),
    not_voted:       all.filter((s) => !s.has_voted),
    total:           data.summary.total,
    voted_count:     data.summary.voted_count,
    not_voted_count: data.summary.not_voted_count,
  };
}

// ─── Compat helper ────────────────────────────────────────────────────────────

export function isStudentEligible(student: Student, position: Position): boolean {
  switch (position.voter_eligibility) {
    case 'all': return true;
    case 'by_course': return position.eligible_courses.includes(student.course);
    case 'by_year_level': return position.eligible_year_levels.includes(student.year_level);
    case 'by_course_and_year':
      return (
        position.eligible_courses.includes(student.course) &&
        position.eligible_year_levels.includes(student.year_level)
      );
    default: return false;
  }
}
