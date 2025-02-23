
import { Course, ScheduleItem, Venue } from "@/lib/types";
import { isFoundationalCourse } from "@/utils/scheduling/courseUtils";
import { findNextBestTimeSlot, generateAlternativeSchedule } from "@/utils/scheduling/timeSlotUtils";
import { suggestClassSplitting, getDefaultVenues, findAlternativeVenue } from "@/utils/scheduling/venueUtils";

export type ScheduleConflict = {
  course: Course;
  reason: string;
  suggestion?: string;
  alternativeSchedule?: ScheduleItem[];
};

export const generateSchedule = (
  courses: Course[]
): { schedule: ScheduleItem[]; conflicts: ScheduleConflict[] } => {
  const venues = getDefaultVenues();
  const newSchedule: ScheduleItem[] = [];
  const conflicts: ScheduleConflict[] = [];

  // Sort courses by priority and constraints
  const sortedCourses = [...courses].sort((a, b) => {
    // Foundational courses get highest priority
    if (isFoundationalCourse(a.code) && !isFoundationalCourse(b.code)) return -1;
    if (!isFoundationalCourse(a.code) && isFoundationalCourse(b.code)) return 1;
    
    // Then sort by class size (larger classes are harder to place)
    return b.classSize - a.classSize;
  });

  for (const course of sortedCourses) {
    // Check for venue capacity and suggest splitting if needed
    const splitSuggestion = suggestClassSplitting(course, venues);
    if (splitSuggestion) {
      conflicts.push({
        course,
        reason: `Class size (${course.classSize}) exceeds maximum venue capacity (${splitSuggestion.venue.capacity}).`,
        suggestion: `Consider splitting into ${splitSuggestion.groups} groups of ${splitSuggestion.suggestedSize} students.`
      });
      continue;
    }

    // Find suitable venues
    const suitableVenues = venues.filter(
      (venue) => venue.capacity >= course.classSize
    );

    if (suitableVenues.length === 0) {
      const alternativeVenue = findAlternativeVenue(course.classSize, venues);
      conflicts.push({
        course,
        reason: "No venue with sufficient capacity available.",
        suggestion: alternativeVenue 
          ? `Consider using ${alternativeVenue.name} (capacity: ${alternativeVenue.capacity}) and splitting the class.`
          : "Consider adding more venues or reducing class size."
      });
      continue;
    }

    // Try to find the best time slot
    let assignment = findNextBestTimeSlot(
      suitableVenues,
      course.lecturer,
      newSchedule,
      course.preferredSlots?.[0]?.day
    );

    // If no optimal slot found with preferred day, try without it
    if (!assignment && course.preferredSlots?.[0]?.day) {
      assignment = findNextBestTimeSlot(
        suitableVenues,
        course.lecturer,
        newSchedule
      );
    }

    if (assignment) {
      const scheduleItem: ScheduleItem = {
        ...course,
        venue: assignment.venue,
        timeSlot: assignment.timeSlot,
      };
      newSchedule.push(scheduleItem);

      // If the assignment isn't optimal, add it to conflicts with suggestions
      if (!assignment.isOptimal) {
        const alternativeSchedule = generateAlternativeSchedule(
          newSchedule,
          venues,
          course
        );
        
        conflicts.push({
          course,
          reason: "Course scheduled with relaxed constraints.",
          suggestion: "Consider reviewing this slot for potential improvements.",
          alternativeSchedule: alternativeSchedule
        });
      }
    } else {
      conflicts.push({
        course,
        reason: "No suitable time slot available.",
        suggestion: "Consider adding more time slots or reviewing lecturer availability."
      });
    }
  }

  return { schedule: newSchedule, conflicts };
};
