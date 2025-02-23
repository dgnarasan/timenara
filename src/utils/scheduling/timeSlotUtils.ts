
import { TimeSlot, Venue, ScheduleItem } from "@/lib/types";

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

  lecturerClasses.forEach((item) => {
    const itemHour = parseInt(item.timeSlot.startTime);
    if (Math.abs(itemHour - currentHour) <= 2) {
      consecutiveCount++;
    }
  });

  return consecutiveCount > 3;
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

export const findNextBestTimeSlot = (
  venues: Venue[],
  lecturer: string,
  currentSchedule: ScheduleItem[],
  preferredDay?: string
): { timeSlot: TimeSlot; venue: Venue } | null => {
  const days = preferredDay 
    ? [preferredDay] 
    : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const times = Array.from({ length: 9 }, (_, i) => `${i + 9}:00`);

  for (const day of days) {
    for (const startTime of times) {
      for (const venue of venues) {
        const timeSlot: TimeSlot = {
          day: day as TimeSlot["day"],
          startTime,
          endTime: `${parseInt(startTime) + 1}:00`,
        };

        if (!hasConflict(timeSlot, venue, lecturer, currentSchedule) &&
            !hasConsecutiveClasses(lecturer, timeSlot, currentSchedule)) {
          return { timeSlot, venue };
        }
      }
    }
  }

  return null;
};
