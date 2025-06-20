export interface Course {
  id: string;
  code: string;
  name: string;
  lecturer: string;
  classSize: number;
  department: Department;
  academicLevel?: string;
  preferredSlots?: TimeSlot[];
  constraints?: string[];
}

export interface Room {
  id: string;
  name: string;
  capacity: number;
  availability: TimeSlot[];
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
}

export type College = 
  | 'COLLEGE OF ENVIRONMENTAL SCIENCES & MANAGEMENT (COLENSMA)'
  | 'COLLEGE OF ARTS, SOCIAL AND MANAGEMENT SCIENCES (CASMAS)'
  | 'COLLEGE OF PURE AND APPLIED SCIENCES (COPAS)'
  | 'COLLEGE OF NURSING AND BASIC MEDICAL SCIENCES'
  | 'COLLEGE OF EDUCATION (COLED)';

export type Department = 
  // COLENSMA
  | 'Architecture'
  | 'Estate Management'
  // CASMAS
  | 'Accounting'
  | 'Banking and Finance'
  | 'Business Administration'
  | 'Criminology and Security Studies'
  | 'Economics'
  | 'International Relations'
  | 'Mass Communication'
  | 'Peace Studies and Conflict Resolution'
  | 'Political Science'
  | 'Public Administration'
  | 'Psychology'
  | 'Taxation'
  // COPAS
  | 'Biochemistry'
  | 'Computer Science'
  | 'Cyber Security'
  | 'Environmental Management and Toxicology'
  | 'Industrial Chemistry'
  | 'Information Systems'
  | 'Microbiology and Industrial Biotechnology'
  | 'Software Engineering'
  // COLLEGE OF NURSING AND BASIC MEDICAL SCIENCES
  | 'Maternal and Child Health Nursing'
  | 'Community and Public Health Nursing'
  | 'Adult Health/Medical and Surgical Nursing'
  | 'Mental Health and Psychiatric Nursing'
  | 'Nursing Management and Education'
  | 'Human Physiology'
  | 'Human Anatomy'
  // COLED
  | 'Education/Christian Religious Studies'
  | 'Guidance & Counselling'
  | 'Early Childhood Education'
  | 'Educational Management';

export interface Venue {
  id: string;
  name: string;
  capacity: number;
  availability: TimeSlot[];
}

export interface TimeSlot {
  day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";
  startTime: string;
  endTime: string;
}

export interface ScheduleItem extends Course {
  venue: Venue;
  timeSlot: TimeSlot;
}

export type DBCourse = {
  id: string;
  code: string;
  name: string;
  lecturer: string;
  class_size: number;
  department: Department;
  academic_level?: string;
  preferred_slots: TimeSlot[] | null;
  constraints: string[] | null;
  created_at: string;
};

export type DBVenue = {
  id: string;
  name: string;
  capacity: number;
  availability: TimeSlot[];
  created_at: string;
};

export type UserRole = 'student' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
}

export interface AuthState {
  user: UserProfile | null;
  loading: boolean;
}

export interface CollegeWithDepartments {
  college: College;
  departments: Department[];
}

// New exam-related types
export interface ExamCourse {
  id: string;
  courseCode: string;
  courseTitle: string;
  department: string;
  college: string;
  level: string;
  studentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExamScheduleItem extends ExamCourse {
  day: string;
  startTime: string;
  endTime: string;
  sessionName: 'Morning' | 'Midday' | 'Afternoon';
  venueName?: string;
}

export type DBExamCourse = {
  id: string;
  course_code: string;
  course_title: string;
  department: string;
  college: string;
  level: string;
  student_count: number;
  created_at: string;
  updated_at: string;
};

export type DBExamSchedule = {
  id: string;
  exam_course_id: string | null;
  day: string;
  start_time: string;
  end_time: string;
  session_name: string;
  venue_name: string | null;
  created_by: string | null;
  published: boolean | null;
  created_at: string;
};

// Upload-specific interface for exam courses
export interface ExamCourseForUpload {
  courseCode: string;
  courseTitle: string;
  department: string;
  college: string;
  level: string;
  studentCount: number;
}

export const collegeStructure: CollegeWithDepartments[] = [
  {
    college: 'COLLEGE OF ENVIRONMENTAL SCIENCES & MANAGEMENT (COLENSMA)',
    departments: ['Architecture', 'Estate Management']
  },
  {
    college: 'COLLEGE OF ARTS, SOCIAL AND MANAGEMENT SCIENCES (CASMAS)',
    departments: [
      'Accounting', 'Banking and Finance', 'Business Administration',
      'Criminology and Security Studies', 'Economics', 'International Relations',
      'Mass Communication', 'Peace Studies and Conflict Resolution',
      'Political Science', 'Public Administration', 'Psychology', 'Taxation'
    ]
  },
  {
    college: 'COLLEGE OF PURE AND APPLIED SCIENCES (COPAS)',
    departments: [
      'Biochemistry', 'Computer Science', 'Cyber Security',
      'Environmental Management and Toxicology', 'Industrial Chemistry',
      'Information Systems', 'Microbiology and Industrial Biotechnology',
      'Software Engineering'
    ]
  },
  {
    college: 'COLLEGE OF NURSING AND BASIC MEDICAL SCIENCES',
    departments: [
      'Maternal and Child Health Nursing', 'Community and Public Health Nursing',
      'Adult Health/Medical and Surgical Nursing', 'Mental Health and Psychiatric Nursing',
      'Nursing Management and Education', 'Human Physiology', 'Human Anatomy'
    ]
  },
  {
    college: 'COLLEGE OF EDUCATION (COLED)',
    departments: [
      'Education/Christian Religious Studies', 'Guidance & Counselling',
      'Early Childhood Education', 'Educational Management'
    ]
  }
];
