
export interface Course {
  id: string;
  code: string;
  name: string;
  lecturer: string;
  classSize: number;
  preferredSlots?: TimeSlot[];
  constraints?: string[];
}

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
