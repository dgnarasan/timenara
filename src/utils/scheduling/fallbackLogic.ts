
import { Course, ScheduleItem, Venue, TimeSlot } from "@/lib/types";
import { ValidationError } from "./preValidation";

export interface FallbackOptions {
  splitLargeClasses: boolean;
  useAlternativeTimeSlots: boolean;
  redistributeLecturers: boolean;
  relaxConstraints: boolean;
}

export interface FallbackResult {
  success: boolean;
  modifiedCourses: Course[];
  suggestedVenues: Venue[];
  fallbacksApplied: string[];
  schedule?: ScheduleItem[];
}

export const applyFallbackStrategies = async (
  courses: Course[],
  venues: Venue[],
  errors: ValidationError[],
  options: FallbackOptions = {
    splitLargeClasses: true,
    useAlternativeTimeSlots: true,
    redistributeLecturers: false,
    relaxConstraints: true
  }
): Promise<FallbackResult> => {
  const fallbacksApplied: string[] = [];
  let modifiedCourses = [...courses];
  let suggestedVenues = [...venues];

  // Strategy 1: Split oversized classes
  if (options.splitLargeClasses) {
    const splitResult = splitOversizedClasses(modifiedCourses, venues);
    if (splitResult.modified) {
      modifiedCourses = splitResult.courses;
      fallbacksApplied.push(`Split ${splitResult.splitCount} oversized classes`);
    }
  }

  // Strategy 2: Create additional venue slots
  const venueCapacityErrors = errors.filter(e => e.type === 'venue_capacity');
  if (venueCapacityErrors.length > 0) {
    const additionalVenues = createAdditionalVenueSlots(venues);
    suggestedVenues = [...venues, ...additionalVenues];
    fallbacksApplied.push(`Added ${additionalVenues.length} additional venue slots`);
  }

  // Strategy 3: Adjust time preferences
  if (options.useAlternativeTimeSlots) {
    modifiedCourses = adjustTimePreferences(modifiedCourses);
    fallbacksApplied.push('Relaxed time slot preferences');
  }

  // Strategy 4: Redistribute lecturer load
  if (options.redistributeLecturers) {
    const redistributeResult = redistributeLecturerLoad(modifiedCourses);
    if (redistributeResult.modified) {
      modifiedCourses = redistributeResult.courses;
      fallbacksApplied.push(`Redistributed courses for ${redistributeResult.affectedLecturers} lecturers`);
    }
  }

  return {
    success: fallbacksApplied.length > 0,
    modifiedCourses,
    suggestedVenues,
    fallbacksApplied
  };
};

const splitOversizedClasses = (
  courses: Course[], 
  venues: Venue[]
): { courses: Course[]; modified: boolean; splitCount: number } => {
  const maxVenueCapacity = Math.max(...venues.map(v => v.capacity));
  const modifiedCourses: Course[] = [];
  let splitCount = 0;

  courses.forEach(course => {
    if (course.classSize > maxVenueCapacity) {
      const sectionsNeeded = Math.ceil(course.classSize / maxVenueCapacity);
      const studentsPerSection = Math.ceil(course.classSize / sectionsNeeded);
      
      for (let i = 0; i < sectionsNeeded; i++) {
        modifiedCourses.push({
          ...course,
          id: `${course.id}_section_${i + 1}`,
          code: `${course.code}.${i + 1}`,
          name: `${course.name} (Section ${i + 1})`,
          classSize: Math.min(studentsPerSection, course.classSize - (i * studentsPerSection))
        });
      }
      splitCount++;
    } else {
      modifiedCourses.push(course);
    }
  });

  return {
    courses: modifiedCourses,
    modified: splitCount > 0,
    splitCount
  };
};

const createAdditionalVenueSlots = (venues: Venue[]): Venue[] => {
  return venues.slice(0, 3).map((venue, index) => ({
    id: `${venue.id}_extended_${index}`,
    name: `${venue.name} (Extended Hours)`,
    capacity: venue.capacity,
    availability: []
  }));
};

const adjustTimePreferences = (courses: Course[]): Course[] => {
  return courses.map(course => ({
    ...course,
    preferredSlots: undefined, // Remove time preferences to allow more flexibility
    constraints: course.constraints?.filter(c => !c.includes('time')) || []
  }));
};

const redistributeLecturerLoad = (
  courses: Course[]
): { courses: Course[]; modified: boolean; affectedLecturers: number } => {
  const lecturerCourses = new Map<string, Course[]>();
  
  courses.forEach(course => {
    if (!lecturerCourses.has(course.lecturer)) {
      lecturerCourses.set(course.lecturer, []);
    }
    lecturerCourses.get(course.lecturer)!.push(course);
  });

  const overloadedLecturers = Array.from(lecturerCourses.entries())
    .filter(([_, courses]) => courses.length > 8);

  if (overloadedLecturers.length === 0) {
    return { courses, modified: false, affectedLecturers: 0 };
  }

  const modifiedCourses = [...courses];
  let affectedLecturers = 0;

  // Simple redistribution logic - in practice, this would need admin input
  overloadedLecturers.forEach(([lecturer, lecturerCourses]) => {
    if (lecturerCourses.length > 8) {
      const excessCourses = lecturerCourses.slice(8);
      excessCourses.forEach(course => {
        const courseIndex = modifiedCourses.findIndex(c => c.id === course.id);
        if (courseIndex !== -1) {
          modifiedCourses[courseIndex] = {
            ...course,
            lecturer: `${lecturer} (Reassignment Needed)` // Mark for manual reassignment
          };
        }
      });
      affectedLecturers++;
    }
  });

  return {
    courses: modifiedCourses,
    modified: affectedLecturers > 0,
    affectedLecturers
  };
};

export const generateAlternativeTimeSlots = (): TimeSlot[] => {
  const days: TimeSlot["day"][] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const timeSlots: TimeSlot[] = [];

  days.forEach(day => {
    // Extended hours for more flexibility
    for (let hour = 8; hour <= 18; hour++) {
      timeSlots.push({
        day,
        startTime: `${hour}:00`,
        endTime: `${hour + 1}:00`
      });
    }
  });

  return timeSlots;
};
