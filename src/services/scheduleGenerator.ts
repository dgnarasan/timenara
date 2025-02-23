
import { Course, ScheduleItem, Venue } from "@/lib/types";
import { isFoundationalCourse } from "@/utils/scheduling/courseUtils";
import { findNextBestTimeSlot } from "@/utils/scheduling/timeSlotUtils";
import { suggestClassSplitting, getDefaultVenues } from "@/utils/scheduling/venueUtils";

export type ScheduleConflict = {
  course: Course;
  reason: string;
};

export const generateSchedule = (
  courses: Course[]
): { schedule: ScheduleItem[]; conflicts: ScheduleConflict[] } => {
  const venues = getDefaultVenues();
  const newSchedule: ScheduleItem[] = [];
  const conflicts: ScheduleConflict[] = [];

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
