
import { Course, ScheduleItem, Venue, TimeSlot } from "@/lib/types";
import { findNextBestTimeSlot, hasConsecutiveClasses, hasConflict } from "./timeSlotUtils";

export const isFoundationalCourse = (courseCode: string): boolean => {
  return /^[A-Z]{2}10[0-9]/.test(courseCode);
};

export const suggestClassSplitting = (
  course: Course,
  venues: Venue[]
): { groups: number; suggestedSize: number; venue: Venue } | null => {
  const largestVenue = venues.reduce((max, venue) => 
    venue.capacity > max.capacity ? venue : max
  );

  if (course.classSize > largestVenue.capacity) {
    const groups = Math.ceil(course.classSize / largestVenue.capacity);
    const suggestedSize = Math.ceil(course.classSize / groups);
    return {
      groups,
      suggestedSize,
      venue: largestVenue
    };
  }

  return null;
};

export const getDefaultVenues = (): Venue[] => [
  {
    id: "v1",
    name: "Room 101",
    capacity: 30,
    availability: [],
  },
  {
    id: "v2",
    name: "Room 102",
    capacity: 50,
    availability: [],
  },
  {
    id: "v3",
    name: "Lecture Hall 1",
    capacity: 100,
    availability: [],
  },
];

export const generateScheduleFromCourses = (
  courses: Course[],
  venues: Venue[] = getDefaultVenues()
): { schedule: ScheduleItem[]; conflicts: Array<{ course: Course; reason: string }> } => {
  const newSchedule: ScheduleItem[] = [];
  const conflicts: Array<{ course: Course; reason: string }> = [];

  const sortedCourses = [...courses].sort((a, b) => {
    if (isFoundationalCourse(a.code) && !isFoundationalCourse(b.code)) return -1;
    if (!isFoundationalCourse(a.code) && isFoundationalCourse(b.code)) return 1;
    return b.classSize - a.classSize;
  });

  for (const course of sortedCourses) {
    const splitSuggestion = suggestClassSplitting(course, venues);
    if (splitSuggestion) {
      conflicts.push({
        course,
        reason: `Class size (${course.classSize}) exceeds maximum venue capacity (${splitSuggestion.venue.capacity}). ` +
                `Suggestion: Split into ${splitSuggestion.groups} groups of ${splitSuggestion.suggestedSize} students.`
      });
      continue;
    }

    const suitableVenues = venues.filter(
      (venue) => venue.capacity >= course.classSize
    );

    if (suitableVenues.length === 0) {
      conflicts.push({
        course,
        reason: "No venue with sufficient capacity available."
      });
      continue;
    }

    let assignment = findNextBestTimeSlot(
      suitableVenues,
      course.lecturer,
      newSchedule,
      course.preferredSlots?.[0]?.day
    );

    if (!assignment && course.preferredSlots?.[0]?.day) {
      assignment = findNextBestTimeSlot(
        suitableVenues,
        course.lecturer,
        newSchedule
      );
    }

    if (assignment) {
      newSchedule.push({
        ...course,
        venue: assignment.venue,
        timeSlot: assignment.timeSlot,
      });
    } else {
      conflicts.push({
        course,
        reason: "No suitable time slot available due to lecturer scheduling constraints."
      });
    }
  }

  return { schedule: newSchedule, conflicts };
};
