
import { Course, ScheduleItem, Venue } from "@/lib/types";
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

// Helper function to validate schedule items
const validateScheduleItem = (item: any): item is ScheduleItem => {
  return (
    item &&
    typeof item.id === 'string' &&
    typeof item.code === 'string' &&
    typeof item.name === 'string' &&
    typeof item.lecturer === 'string' &&
    typeof item.classSize === 'number' &&
    item.timeSlot &&
    typeof item.timeSlot.day === 'string' &&
    typeof item.timeSlot.startTime === 'string' &&
    typeof item.timeSlot.endTime === 'string' &&
    item.venue &&
    typeof item.venue.name === 'string'
  );
};

export const generateEnhancedSchedule = async (
  courses: Course[],
  enableFallbacks: boolean = true
): Promise<EnhancedGenerationResult> => {
  const startTime = Date.now();
  console.log('Starting enhanced schedule generation with pre-validation...');

  try {
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
    const validationResult = performPreGenerationValidation(courses, venues);
    
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
          totalCourses: courses.length,
          scheduledCourses: 0,
          conflictedCourses: courses.length,
          successRate: 0
        },
        validationResult,
        preValidationPassed: false
      };
    }

    // Step 2: Course grouping for shared courses
    console.log('Analyzing course groups...');
    const courseGroups = identifySharedCourses(courses);
    const sharedGroups = courseGroups.filter(shouldGroupCourses);
    
    let processedCourses = [...courses];
    
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
          course: courses[0] || {} as Course,
          reason: error?.message || 'Enhanced generation failed',
          conflictType: 'system-error',
          severity: 'high'
        }],
        summary: {
          totalCourses: courses.length,
          scheduledCourses: 0,
          conflictedCourses: courses.length,
          successRate: 0
        },
        validationResult,
        fallbacksApplied: fallbackResult?.fallbacksApplied,
        courseGroups: sharedGroups,
        preValidationPassed: criticalErrors.length === 0
      };
    }

    // Validate and filter schedule items to prevent crashes
    const rawSchedule = data.schedule || [];
    const validSchedule = rawSchedule.filter((item: any) => {
      const isValid = validateScheduleItem(item);
      if (!isValid) {
        console.warn('Invalid schedule item filtered out:', item);
      }
      return isValid;
    });

    const scheduleWithVenues = validSchedule.map((item: any) => {
      // Ensure venue has a valid ID from our actual database venues
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

    console.log('Generated schedule successfully:', scheduleWithVenues.length, 'valid items out of', rawSchedule.length, 'total');
    
    const scheduledCourses = scheduleWithVenues.length;
    const conflictedCourses = courses.length - scheduledCourses;
    const successRate = Math.round((scheduledCourses / courses.length) * 100);

    if (validSchedule.length < rawSchedule.length) {
      console.warn(`Filtered out ${rawSchedule.length - validSchedule.length} invalid schedule items`);
    }

    return {
      schedule: scheduleWithVenues,
      conflicts: data.conflicts || [],
      summary: {
        totalCourses: courses.length,
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
