import { Course, ScheduleItem, Venue, Department } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";
import { performPreGenerationValidation, ValidationResult } from "@/utils/scheduling/preValidation";
import { identifySharedCourses, shouldGroupCourses, calculateOptimalClassSize } from "@/utils/scheduling/courseGrouping";
import { applyFallbackStrategies, FallbackResult, FallbackOptions } from "@/utils/scheduling/fallbackLogic";
import { GenerationResult, ScheduleConflict } from "./scheduleGenerator";

export interface EnhancedGenerationResult extends GenerationResult {
  validationResult: ValidationResult;
  fallbacksApplied?: string[];
  courseGroups?: any[];
  preValidationPassed: boolean;
}

// Helper function to validate if a string is a valid Department
const isValidDepartment = (dept: string): dept is Department => {
  const validDepartments: Department[] = [
    'Architecture', 'Estate Management', 'Accounting', 'Banking and Finance',
    'Business Administration', 'Criminology and Security Studies', 'Economics',
    'International Relations', 'Mass Communication', 'Peace Studies and Conflict Resolution',
    'Political Science', 'Public Administration', 'Psychology', 'Taxation',
    'Biochemistry', 'Computer Science', 'Cyber Security', 'Environmental Management and Toxicology',
    'Industrial Chemistry', 'Information Systems', 'Microbiology and Industrial Biotechnology',
    'Software Engineering', 'Maternal and Child Health Nursing', 'Community and Public Health Nursing',
    'Adult Health/Medical and Surgical Nursing', 'Mental Health and Psychiatric Nursing',
    'Nursing Management and Education', 'Human Physiology', 'Human Anatomy',
    'Education/Christian Religious Studies', 'Guidance & Counselling', 'Early Childhood Education',
    'Educational Management'
  ];
  return validDepartments.includes(dept as Department);
};

// Helper function to validate if a string is a valid day
const isValidDay = (day: string): day is "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" => {
  return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(day);
};

// Enhanced validation function to validate schedule items thoroughly
const validateScheduleItem = (item: any): item is ScheduleItem => {
  try {
    return (
      item &&
      typeof item === 'object' &&
      typeof item.id === 'string' &&
      item.id.length > 0 &&
      typeof item.code === 'string' &&
      item.code.length > 0 &&
      typeof item.name === 'string' &&
      item.name.length > 0 &&
      typeof item.lecturer === 'string' &&
      item.lecturer.length > 0 &&
      typeof item.department === 'string' &&
      item.department.length > 0 &&
      typeof item.classSize === 'number' &&
      item.classSize > 0 &&
      item.timeSlot &&
      typeof item.timeSlot === 'object' &&
      typeof item.timeSlot.day === 'string' &&
      item.timeSlot.day.length > 0 &&
      typeof item.timeSlot.startTime === 'string' &&
      item.timeSlot.startTime.length > 0 &&
      typeof item.timeSlot.endTime === 'string' &&
      item.timeSlot.endTime.length > 0 &&
      item.venue &&
      typeof item.venue === 'object' &&
      typeof item.venue.name === 'string' &&
      item.venue.name.length > 0 &&
      typeof item.venue.capacity === 'number' &&
      item.venue.capacity > 0
    );
  } catch (error) {
    console.warn('Error validating schedule item:', error, item);
    return false;
  }
};

// Function to sanitize and ensure all required properties exist
const sanitizeScheduleItem = (item: any): ScheduleItem | null => {
  try {
    if (!item || typeof item !== 'object') return null;

    // Validate and sanitize department
    const departmentValue = String(item.department || 'Computer Science');
    const validDepartment: Department = isValidDepartment(departmentValue) 
      ? departmentValue 
      : 'Computer Science';

    // Validate and sanitize day
    const dayValue = String(item.timeSlot?.day || 'Monday');
    const validDay: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" = isValidDay(dayValue)
      ? dayValue
      : 'Monday';

    // Create a properly structured schedule item with all required fields
    const sanitized: ScheduleItem = {
      id: String(item.id || `temp-${Math.random()}`),
      code: String(item.code || 'UNKNOWN'),
      name: String(item.name || 'Unknown Course'),
      lecturer: String(item.lecturer || 'TBA'),
      department: validDepartment,
      classSize: Number(item.classSize) || 0,
      timeSlot: {
        day: validDay,
        startTime: String(item.timeSlot?.startTime || '09:00'),
        endTime: String(item.timeSlot?.endTime || '10:00')
      },
      venue: {
        id: String(item.venue?.id || `venue-${Math.random()}`),
        name: String(item.venue?.name || 'TBA'),
        capacity: Number(item.venue?.capacity) || 30,
        availability: item.venue?.availability || []
      },
      preferredSlots: item.preferredSlots || [],
      constraints: item.constraints || []
    };

    return sanitized;
  } catch (error) {
    console.warn('Error sanitizing schedule item:', error, item);
    return null;
  }
};

export const generateEnhancedSchedule = async (
  courses: Course[],
  enableFallbacks: boolean = true
): Promise<EnhancedGenerationResult> => {
  const startTime = Date.now();
  console.log('Starting enhanced schedule generation with pre-validation...');

  try {
    // Validate input courses first
    const validCourses = courses.filter(course => {
      return course && 
             typeof course.code === 'string' && 
             typeof course.name === 'string' && 
             typeof course.lecturer === 'string';
    });

    if (validCourses.length === 0) {
      console.warn('No valid courses provided for schedule generation');
      return {
        schedule: [],
        conflicts: [],
        summary: {
          totalCourses: courses.length,
          scheduledCourses: 0,
          conflictedCourses: courses.length,
          successRate: 0
        },
        validationResult: {
          isValid: false,
          errors: [],
          warnings: []
        },
        preValidationPassed: false
      };
    }

    // Get venues from database and ensure they have required properties
    const { data: venueData } = await supabase
      .from('venues')
      .select('id, name, capacity')
      .limit(15);

    if (!venueData || venueData.length === 0) {
      throw new Error('No venues available for scheduling');
    }

    // Transform venues to include required availability property
    const venues: Venue[] = venueData.map(venue => ({
      ...venue,
      availability: [] // Initialize with empty availability array
    }));

    // Step 1: Pre-generation validation
    console.log('Performing pre-generation validation...');
    const validationResult = performPreGenerationValidation(validCourses, venues);
    
    // Check if we have critical errors that prevent generation
    const criticalErrors = validationResult.errors.filter(e => 
      e.severity === 'critical' || e.severity === 'high'
    );

    if (criticalErrors.length > 0 && !enableFallbacks) {
      return {
        schedule: [],
        conflicts: criticalErrors.map(error => ({
          course: error.affectedCourses[0] || {} as Course,
          reason: error.message,
          conflictType: mapValidationErrorToConflictType(error.type),
          severity: error.severity,
          suggestion: error.suggestion
        })),
        summary: {
          totalCourses: validCourses.length,
          scheduledCourses: 0,
          conflictedCourses: validCourses.length,
          successRate: 0
        },
        validationResult,
        preValidationPassed: false
      };
    }

    // Step 2: Course grouping for shared courses
    console.log('Analyzing course groups...');
    const courseGroups = identifySharedCourses(validCourses);
    const sharedGroups = courseGroups.filter(shouldGroupCourses);
    
    let processedCourses = [...validCourses];
    
    // Group shared courses by assigning them optimal class sizes
    sharedGroups.forEach(group => {
      const optimalSize = calculateOptimalClassSize(group);
      group.courses.forEach(course => {
        const courseIndex = processedCourses.findIndex(c => c.id === course.id);
        if (courseIndex !== -1) {
          processedCourses[courseIndex] = {
            ...course,
            classSize: Math.min(optimalSize, course.classSize),
            constraints: [...(course.constraints || []), `grouped_with:${group.courseCode}`]
          };
        }
      });
    });

    // Step 3: Apply fallback strategies if needed
    let fallbackResult: FallbackResult | null = null;
    if (enableFallbacks && (criticalErrors.length > 0 || validationResult.warnings.length > 3)) {
      console.log('Applying fallback strategies...');
      const fallbackOptions: FallbackOptions = {
        splitLargeClasses: true,
        useAlternativeTimeSlots: true,
        redistributeLecturers: false,
        relaxConstraints: true
      };
      
      fallbackResult = await applyFallbackStrategies(
        processedCourses,
        venues,
        validationResult.errors,
        fallbackOptions
      );
      
      if (fallbackResult.success) {
        processedCourses = fallbackResult.modifiedCourses;
        console.log('Fallback strategies applied:', fallbackResult.fallbacksApplied);
      }
    }

    // Step 4: Call the generation service with processed courses
    console.log('Calling enhanced generation service...');
    const { data, error } = await supabase.functions.invoke('generate-schedule', {
      body: { 
        courses: processedCourses,
        venues: fallbackResult?.suggestedVenues || venues,
        courseGroups: sharedGroups,
        validationResult,
        enableEnhancedFeatures: true
      }
    });

    const generationTime = Date.now() - startTime;
    console.log(`Enhanced generation completed in ${generationTime}ms`);

    if (error || !data?.success) {
      return {
        schedule: [],
        conflicts: [{
          course: validCourses[0] || {} as Course,
          reason: error?.message || 'Enhanced generation failed',
          conflictType: 'system-error',
          severity: 'high'
        }],
        summary: {
          totalCourses: validCourses.length,
          scheduledCourses: 0,
          conflictedCourses: validCourses.length,
          successRate: 0
        },
        validationResult,
        fallbacksApplied: fallbackResult?.fallbacksApplied,
        courseGroups: sharedGroups,
        preValidationPassed: criticalErrors.length === 0
      };
    }

    // Enhanced validation and sanitization of schedule items
    const rawSchedule = data.schedule || [];
    console.log('Processing raw schedule items:', rawSchedule.length);

    // First pass: sanitize all items
    const sanitizedItems = rawSchedule
      .map((item: any) => sanitizeScheduleItem(item))
      .filter((item: ScheduleItem | null): item is ScheduleItem => item !== null);

    console.log('Sanitized items:', sanitizedItems.length);

    // Second pass: validate sanitized items
    const validSchedule = sanitizedItems.filter((item: ScheduleItem) => {
      const isValid = validateScheduleItem(item);
      if (!isValid) {
        console.warn('Invalid schedule item filtered out after sanitization:', item);
      }
      return isValid;
    });

    // Ensure venues have valid database IDs
    const scheduleWithVenues = validSchedule.map((item: ScheduleItem) => {
      const venue = venues.find(v => v.capacity >= item.classSize) || venues[0];
      return {
        ...item,
        venue: {
          id: venue.id,
          name: venue.name,
          capacity: venue.capacity,
          availability: []
        }
      };
    });

    console.log('Final valid schedule items:', scheduleWithVenues.length, 'out of', rawSchedule.length, 'raw items');
    
    const scheduledCourses = scheduleWithVenues.length;
    const conflictedCourses = validCourses.length - scheduledCourses;
    const successRate = Math.round((scheduledCourses / validCourses.length) * 100);

    if (scheduleWithVenues.length < rawSchedule.length) {
      console.warn(`Filtered out ${rawSchedule.length - scheduleWithVenues.length} invalid/incomplete schedule items`);
    }

    return {
      schedule: scheduleWithVenues,
      conflicts: data.conflicts || [],
      summary: {
        totalCourses: validCourses.length,
        scheduledCourses,
        conflictedCourses,
        successRate
      },
      validationResult,
      fallbacksApplied: fallbackResult?.fallbacksApplied,
      courseGroups: sharedGroups,
      preValidationPassed: criticalErrors.length === 0
    };

  } catch (error) {
    console.error('Error in enhanced schedule generation:', error);
    
    return {
      schedule: [],
      conflicts: [{
        course: courses[0] || {} as Course,
        reason: error instanceof Error ? error.message : 'Unknown error in enhanced generation',
        conflictType: 'system-error',
        severity: 'critical'
      }],
      summary: {
        totalCourses: courses.length,
        scheduledCourses: 0,
        conflictedCourses: courses.length,
        successRate: 0
      },
      validationResult: {
        isValid: false,
        errors: [],
        warnings: []
      },
      preValidationPassed: false
    };
  }
};

// Helper function to map validation error types to conflict types
const mapValidationErrorToConflictType = (errorType: string): ScheduleConflict['conflictType'] => {
  switch (errorType) {
    case 'venue_capacity':
      return 'venue';
    case 'lecturer_overload':
      return 'lecturer';
    case 'cross_level_conflict':
      return 'cross-departmental';
    case 'missing_data':
      return 'system-error';
    default:
      return 'resource';
  }
};
