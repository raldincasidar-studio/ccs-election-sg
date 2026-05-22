export type YearLevel = '1st Year' | '2nd Year' | '3rd Year' | '4th Year';

export type Course =
  | 'BS Computer Science'
  | 'BS Information Technology'
  | 'BS Information Systems'
  | 'Associate in Computer Technology';

export type Gender = 'Male' | 'Female' | 'Other';

export interface Student {
  id: string;
  student_id: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  year_level: YearLevel;
  course: Course;
  gender: Gender;
  birth_date: string;
  school_year: string;
  password: string;
  has_voted: boolean;
  voted_positions: string[]; // position IDs already voted
}

export interface Candidate {
  id: string;
  position_id: string;
  name: string;
  party: string;
  party_color: string;
  description: string;
  candidate_photo: string;
  vote_count: number;
}

export type VoterEligibility =
  | 'all'
  | 'by_course'
  | 'by_year_level'
  | 'by_course_and_year';

export interface Position {
  id: string;
  title: string;
  order: number;
  max_votes: number; // how many candidates a student can vote for this position
  voter_eligibility: VoterEligibility;
  eligible_courses: Course[];
  eligible_year_levels: YearLevel[];
  is_active: boolean;
}

export interface Vote {
  id: string;
  student_id: string;
  position_id: string;
  candidate_id: string;
  timestamp: string;
}

export interface Admin {
  id: string;
  username: string;
  password: string;
  name: string;
}

export type AuthUser =
  | { type: 'admin'; data: Admin }
  | { type: 'student'; data: Student };

export interface ElectionSettings {
  title: string;
  school_year: string;
  is_open: boolean;
  start_date: string;
  end_date: string;
}
