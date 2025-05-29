
import { Course, Venue } from "@/lib/types";
import { CourseGroup, identifySharedCourses } from "./courseGrouping";

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  type: 'venue_capacity' | 'lecturer_overload' | 'missing_data' | 'cross_level_conflict';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  affectedCourses: Course[];
  suggestion: string;
}

export interface ValidationWarning {
  type: 'lecturer_workload' | 'venue_utilization' | 'time_distribution';
  message: string;
  affectedCourses: Course[];
  suggestion: string;
}

export const performPreGenerationValidation = (
  courses: Course[], 
  venues: Venue[]
): ValidationResult => {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // 1. Venue capacity validation
  const venueCapacityErrors = validateVenueCapacity(courses, venues);
  errors.push(...venueCapacityErrors);

  // 2. Lecturer overload validation
  const lecturerErrors = validateLecturerWorkload(courses);
  errors.push(...lecturerErrors);

  // 3. Missing data validation
  const missingDataErrors = validateMissingData(courses);
  errors.push(...missingDataErrors);

  // 4. Cross-level conflict validation
  const crossLevelErrors = validateCrossLevelConflicts(courses);
  errors.push(...crossLevelErrors);

  // 5. Generate warnings
  const lecturerWarnings = generateLecturerWarnings(courses);
  warnings.push(...lecturerWarnings);

  const venueWarnings = generateVenueWarnings(courses, venues);
  warnings.push(...venueWarnings);

  return {
    isValid: errors.filter(e => e.severity === 'critical' || e.severity === 'high').length === 0,
    errors,
    warnings
  };
};

const validateVenueCapacity = (courses: Course[], venues: Venue[]): ValidationError[] => {
  const errors: ValidationError[] = [];
  const maxVenueCapacity = Math.max(...venues.map(v => v.capacity), 0);

  courses.forEach(course => {
    if (course.classSize > maxVenueCapacity) {
      errors.push({
        type: 'venue_capacity',
        severity: 'critical',
        message: `Course ${course.code} has ${course.classSize} students but largest venue only holds ${maxVenueCapacity}`,
        affectedCourses: [course],
        suggestion: `Split course into ${Math.ceil(course.classSize / maxVenueCapacity)} sections or find a larger venue`
      });
    }
  });

  return errors;
};

const validateLecturerWorkload = (courses: Course[]): ValidationError[] => {
  const errors: ValidationError[] = [];
  const lecturerCourses = new Map<string, Course[]>();

  courses.forEach(course => {
    if (!lecturerCourses.has(course.lecturer)) {
      lecturerCourses.set(course.lecturer, []);
    }
    lecturerCourses.get(course.lecturer)!.push(course);
  });

  lecturerCourses.forEach((lecturerCourseList, lecturer) => {
    if (lecturerCourseList.length > 10) {
      errors.push({
        type: 'lecturer_overload',
        severity: 'high',
        message: `Lecturer ${lecturer} is assigned ${lecturerCourseList.length} courses, which exceeds recommended maximum`,
        affectedCourses: lecturerCourseList,
        suggestion: `Redistribute some courses to other lecturers or adjust the schedule`
      });
    }
  });

  return errors;
};

const validateMissingData = (courses: Course[]): ValidationError[] => {
  const errors: ValidationError[] = [];

  courses.forEach(course => {
    const missingFields = [];
    if (!course.code) missingFields.push('course code');
    if (!course.name) missingFields.push('course name');
    if (!course.lecturer) missingFields.push('lecturer');
    if (!course.department) missingFields.push('department');
    if (!course.classSize || course.classSize <= 0) missingFields.push('class size');

    if (missingFields.length > 0) {
      errors.push({
        type: 'missing_data',
        severity: 'critical',
        message: `Course ${course.code || 'Unknown'} is missing: ${missingFields.join(', ')}`,
        affectedCourses: [course],
        suggestion: `Complete all required course information before scheduling`
      });
    }
  });

  return errors;
};

const validateCrossLevelConflicts = (courses: Course[]): ValidationError[] => {
  const errors: ValidationError[] = [];
  const courseGroups = identifySharedCourses(courses);
  
  courseGroups.forEach(group => {
    if (group.isSharedCourse) {
      const levels = new Set(group.courses.map(c => c.code.match(/\d/)?.[0]));
      if (levels.size > 1) {
        errors.push({
          type: 'cross_level_conflict',
          severity: 'medium',
          message: `Shared course ${group.courseCode} spans multiple levels: ${Array.from(levels).join(', ')}`,
          affectedCourses: group.courses,
          suggestion: `Consider grouping these courses in the same time slot to accommodate carryover students`
        });
      }
    }
  });

  return errors;
};

const generateLecturerWarnings = (courses: Course[]): ValidationWarning[] => {
  const warnings: ValidationWarning[] = [];
  const lecturerCourses = new Map<string, Course[]>();

  courses.forEach(course => {
    if (!lecturerCourses.has(course.lecturer)) {
      lecturerCourses.set(course.lecturer, []);
    }
    lecturerCourses.get(course.lecturer)!.push(course);
  });

  lecturerCourses.forEach((lecturerCourseList, lecturer) => {
    if (lecturerCourseList.length >= 6 && lecturerCourseList.length <= 10) {
      warnings.push({
        type: 'lecturer_workload',
        message: `Lecturer ${lecturer} has ${lecturerCourseList.length} courses - consider workload balance`,
        affectedCourses: lecturerCourseList,
        suggestion: `Monitor lecturer workload and consider redistributing if needed`
      });
    }
  });

  return warnings;
};

const generateVenueWarnings = (courses: Course[], venues: Venue[]): ValidationWarning[] => {
  const warnings: ValidationWarning[] = [];
  const totalStudents = courses.reduce((sum, course) => sum + course.classSize, 0);
  const totalCapacity = venues.reduce((sum, venue) => sum + venue.capacity, 0);

  if (totalStudents > totalCapacity * 0.8) {
    warnings.push({
      type: 'venue_utilization',
      message: `High venue utilization: ${totalStudents} students across ${totalCapacity} total capacity`,
      affectedCourses: courses,
      suggestion: `Consider adding more venues or adjusting class sizes`
    });
  }

  return warnings;
};
