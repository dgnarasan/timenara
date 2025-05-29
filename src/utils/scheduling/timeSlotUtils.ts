import { TimeSlot, Venue, ScheduleItem, Course } from "@/lib/types";

export const HOURS_PER_DAY = 9; // 9 hours total (8:00-17:00)
const MAX_CLASSES_PER_DAY = 4;
const MAX_CONSECUTIVE_CLASSES = 2; // Allow up to 2 consecutive hours (no 3-hour blocks)

// Generate all possible flexible time slots within 8 AM to 5 PM (1-2 hour classes only)
export const generateFlexibleTimeSlots = (): string[] => {
  const slots = [];
  
  // 1-hour slots
  for (let hour = 8; hour < 17; hour++) {
    slots.push(`${hour}:00 - ${hour + 1}:00`);
  }
  
  // 2-hour slots only (removed 3-hour slots)
  for (let hour = 8; hour <= 15; hour++) {
    slots.push(`${hour}:00 - ${hour + 2}:00`);
  }
  
  // Sort by start time and duration
  return slots.sort((a, b) => {
    const startA = parseInt(a.split(':')[0]);
    const startB = parseInt(b.split(':')[0]);
    if (startA !== startB) return startA - startB;
    
    const durationA = parseInt(a.split(' - ')[1].split(':')[0]) - startA;
    const durationB = parseInt(b.split(' - ')[1].split(':')[0]) - startB;
    return durationA - durationB;
  });
};

export const hasConsecutiveClasses = (
  lecturer: string,
  timeSlot: TimeSlot,
  existingSchedule: ScheduleItem[]
): boolean => {
  const lecturerClasses = existingSchedule.filter(
    (item) => item.lecturer === lecturer && item.timeSlot.day === timeSlot.day
  );
  
  const currentStart = parseInt(timeSlot.startTime.split(':')[0]);
  const currentEnd = parseInt(timeSlot.endTime.split(':')[0]);
  
  let totalConsecutiveHours = currentEnd - currentStart;
  
  lecturerClasses.forEach((item) => {
    const itemStart = parseInt(item.timeSlot.startTime.split(':')[0]);
    const itemEnd = parseInt(item.timeSlot.endTime.split(':')[0]);
    
    // Check if times are adjacent or overlapping
    if (itemEnd === currentStart || itemStart === currentEnd) {
      totalConsecutiveHours += (itemEnd - itemStart);
    }
  });

  return totalConsecutiveHours > MAX_CONSECUTIVE_CLASSES;
};

export const hasConflict = (
  timeSlot: TimeSlot,
  venue: Venue,
  lecturer: string,
  existingSchedule: ScheduleItem[]
): boolean => {
  const newStart = parseInt(timeSlot.startTime.split(':')[0]);
  const newEnd = parseInt(timeSlot.endTime.split(':')[0]);
  
  return existingSchedule.some((item) => {
    if (item.timeSlot.day !== timeSlot.day) return false;
    
    const existingStart = parseInt(item.timeSlot.startTime.split(':')[0]);
    const existingEnd = parseInt(item.timeSlot.endTime.split(':')[0]);
    
    // Check for time overlap
    const timeOverlap = newStart < existingEnd && existingStart < newEnd;
    
    // Check for venue or lecturer conflict
    const resourceConflict = item.venue.id === venue.id || item.lecturer === lecturer;
    
    return timeOverlap && resourceConflict;
  });
};

export const getDayLoad = (
  day: string,
  lecturer: string,
  existingSchedule: ScheduleItem[]
): number => {
  return existingSchedule.filter(
    (item) => item.timeSlot.day === day && item.lecturer === lecturer
  ).length;
};

export const findNextBestTimeSlot = (
  venues: Venue[],
  lecturer: string,
  currentSchedule: ScheduleItem[],
  preferredDay?: string,
  attempt: number = 0,
  courseDuration?: number // Limited to 1-2 hours only
): { timeSlot: TimeSlot; venue: Venue; isOptimal: boolean } | null => {
  const days = preferredDay 
    ? [preferredDay] 
    : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    
  // Generate dynamic time slots based on course duration (1-2 hours only)
  const duration = Math.min(courseDuration || 2, 2); // Cap at 2 hours maximum
  const timeSlots = [];
  
  for (let hour = 8; hour <= (17 - duration); hour++) {
    timeSlots.push({
      startTime: `${hour}:00`,
      endTime: `${hour + duration}:00`
    });
  }

  // Sort days by current load to ensure balanced distribution
  const sortedDays = days.sort((a, b) => {
    const loadA = getDayLoad(a, lecturer, currentSchedule);
    const loadB = getDayLoad(b, lecturer, currentSchedule);
    return loadA - loadB;
  });

  // Try to find an optimal slot first
  for (const day of sortedDays) {
    if (getDayLoad(day, lecturer, currentSchedule) >= MAX_CLASSES_PER_DAY) {
      continue;
    }

    for (const slot of timeSlots) {
      // Sort venues by capacity to optimize room allocation
      const sortedVenues = [...venues].sort((a, b) => a.capacity - b.capacity);

      for (const venue of sortedVenues) {
        const timeSlot: TimeSlot = {
          day: day as TimeSlot["day"],
          startTime: slot.startTime,
          endTime: slot.endTime,
        };

        if (!hasConflict(timeSlot, venue, lecturer, currentSchedule) &&
            !hasConsecutiveClasses(lecturer, timeSlot, currentSchedule)) {
          return { timeSlot, venue, isOptimal: true };
        }
      }
    }
  }

  // If no optimal slot found and this is the first attempt, try with relaxed constraints
  if (attempt === 0) {
    return findNextBestTimeSlot(venues, lecturer, currentSchedule, preferredDay, 1, courseDuration);
  }

  // As a last resort, find any available slot
  for (const day of sortedDays) {
    for (const slot of timeSlots) {
      for (const venue of venues) {
        const timeSlot: TimeSlot = {
          day: day as TimeSlot["day"],
          startTime: slot.startTime,
          endTime: slot.endTime,
        };

        if (!hasConflict(timeSlot, venue, lecturer, currentSchedule)) {
          return { timeSlot, venue, isOptimal: false };
        }
      }
    }
  }

  return null;
};

export const generateAlternativeSchedule = (
  currentSchedule: ScheduleItem[],
  venues: Venue[],
  conflictingCourse: Course
): ScheduleItem[] => {
  const newSchedule = [...currentSchedule];
  const conflictIndex = newSchedule.findIndex(item => item.id === conflictingCourse.id);
  
  if (conflictIndex === -1) return newSchedule;

  // Try only 1-2 hour durations (removed 3-hour option)
  const possibleDurations = [1, 2];
  
  for (const duration of possibleDurations) {
    const assignment = findNextBestTimeSlot(
      venues,
      conflictingCourse.lecturer,
      newSchedule.filter((_, i) => i !== conflictIndex),
      undefined,
      0,
      duration
    );

    if (assignment) {
      newSchedule[conflictIndex] = {
        ...conflictingCourse,
        venue: assignment.venue,
        timeSlot: assignment.timeSlot,
      };
      return newSchedule;
    }
  }

  return newSchedule;
};
