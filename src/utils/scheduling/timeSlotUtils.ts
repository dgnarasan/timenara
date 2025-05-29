
import { TimeSlot, Venue, ScheduleItem, Course } from "@/lib/types";

export const HOURS_PER_DAY = 5; // 5 time slots of 2 hours each (8:00-18:00)
const MAX_CLASSES_PER_DAY = 4;
const MAX_CONSECUTIVE_CLASSES = 2; // Since each class is 2 hours

export const hasConsecutiveClasses = (
  lecturer: string,
  timeSlot: TimeSlot,
  existingSchedule: ScheduleItem[]
): boolean => {
  const lecturerClasses = existingSchedule.filter(
    (item) => item.lecturer === lecturer && item.timeSlot.day === timeSlot.day
  );
  
  const currentHour = parseInt(timeSlot.startTime);
  let consecutiveCount = 1;
  let consecutiveHours: number[] = [currentHour];

  lecturerClasses.forEach((item) => {
    const itemHour = parseInt(item.timeSlot.startTime);
    if (Math.abs(itemHour - currentHour) <= 2) { // 2-hour gap check
      consecutiveCount++;
      consecutiveHours.push(itemHour);
    }
  });

  return consecutiveCount > MAX_CONSECUTIVE_CLASSES;
};

export const hasConflict = (
  timeSlot: TimeSlot,
  venue: Venue,
  lecturer: string,
  existingSchedule: ScheduleItem[]
): boolean => {
  return existingSchedule.some(
    (item) =>
      item.timeSlot.day === timeSlot.day &&
      item.timeSlot.startTime === timeSlot.startTime &&
      (item.venue.id === venue.id || item.lecturer === lecturer)
  );
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
  attempt: number = 0
): { timeSlot: TimeSlot; venue: Venue; isOptimal: boolean } | null => {
  const days = preferredDay 
    ? [preferredDay] 
    : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  // 2-hour time slots from 8 AM to 3 PM (ending at 5 PM)
  const times = ["8:00", "10:00", "12:00", "14:00"];

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

    for (const startTime of times) {
      // Sort venues by capacity to optimize room allocation
      const sortedVenues = [...venues].sort((a, b) => a.capacity - b.capacity);

      for (const venue of sortedVenues) {
        const startHour = parseInt(startTime.split(':')[0]);
        const timeSlot: TimeSlot = {
          day: day as TimeSlot["day"],
          startTime,
          endTime: `${startHour + 2}:00`,
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
    return findNextBestTimeSlot(venues, lecturer, currentSchedule, preferredDay, 1);
  }

  // As a last resort, find any available slot
  for (const day of sortedDays) {
    for (const startTime of times) {
      for (const venue of venues) {
        const startHour = parseInt(startTime.split(':')[0]);
        const timeSlot: TimeSlot = {
          day: day as TimeSlot["day"],
          startTime,
          endTime: `${startHour + 2}:00`,
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

  const assignment = findNextBestTimeSlot(
    venues,
    conflictingCourse.lecturer,
    newSchedule.filter((_, i) => i !== conflictIndex)
  );

  if (assignment) {
    newSchedule[conflictIndex] = {
      ...conflictingCourse,
      venue: assignment.venue,
      timeSlot: assignment.timeSlot,
    };
  }

  return newSchedule;
};
