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

export type Department = 'Computer Science' | 'Cyber Security' | 'Information Technology' | 'Software Engineering';

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
