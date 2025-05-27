

export interface Course {
  id: string;
  code: string;
  name: string;
  lecturer: string;
  classSize: number;
  department: string;
  academicLevel?: string;
  preferredSlots?: TimeSlot[];
  constraints?: string[];
}

export interface DBCourse {
  id: string;
  code: string;
  name: string;
  lecturer: string;
  class_size: number;
  department: string;
  academic_level?: string;
  preferred_slots?: TimeSlot[] | string;
  constraints?: string[];
}

export interface Venue {
  id: string;
  name: string;
  capacity: number;
  availability: TimeSlot[];
}

export interface DBVenue {
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
  timeSlot: TimeSlot;
  venue: Venue;
  published?: boolean;
}

export type Department = 
  | "Computer Science"
  | "Software Engineering" 
  | "Information Systems"
  | "Cyber Security"
  | "Biochemistry"
  | "Microbiology and Industrial Biotechnology"
  | "Peace Studies and Conflict Resolution"
  | "Industrial Chemistry";

export type College = 
  | "College of Computing and Information Sciences (CoCIS)"
  | "College of Natural and Applied Sciences (CoNAS)"
  | "College of Humanities and Social Sciences (CHUSS)";

export const collegeStructure = [
  {
    college: "College of Computing and Information Sciences (CoCIS)" as College,
    departments: [
      "Computer Science",
      "Software Engineering", 
      "Information Systems",
      "Cyber Security"
    ]
  },
  {
    college: "College of Natural and Applied Sciences (CoNAS)" as College,
    departments: [
      "Biochemistry",
      "Microbiology and Industrial Biotechnology",
      "Industrial Chemistry"
    ]
  },
  {
    college: "College of Humanities and Social Sciences (CHUSS)" as College,
    departments: [
      "Peace Studies and Conflict Resolution"
    ]
  }
];

