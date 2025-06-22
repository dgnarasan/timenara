
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

// Helper function to normalize schedule item data
const normalizeScheduleItem = (item: any): ScheduleItem | null => {
  try {
    console.log('🔄 Normalizing schedule item:', item);
    
    // Ensure all required fields exist
    const normalized: ScheduleItem = {
      id: item.id || `generated-${Date.now()}-${Math.random()}`,
      code: item.code || item.courseCode || 'UNKNOWN',
      name: item.name || item.courseName || item.title || 'Unknown Course',
      lecturer: item.lecturer || item.instructor || 'TBD',
      classSize: typeof item.classSize === 'number' ? item.classSize : (item.class_size || 30),
      department: item.department || 'Unknown Department',
      academicLevel: item.academicLevel || item.academic_level,
      constraints: item.constraints || [],
      preferredSlots: item.preferredSlots || item.preferred_slots || [],
      timeSlot: {
        day: item.timeSlot?.day || item.day || 'Monday',
        startTime: item.timeSlot?.startTime || item.start_time || item.startTime || '09:00',
        endTime: item.timeSlot?.endTime || item.end_time || item.endTime || '11:00'
      },
      venue: {
        id: item.venue?.id || item.venue_id || `venue-${Date.now()}`,
        name: item.venue?.name || item.venueName || item.venue_name || 'TBD',
        capacity: item.venue?.capacity || 50,
        availability: item.venue?.availability || []
      }
    };

    console.log('✅ Normalized schedule item:', normalized.code);
    return normalized;
  } catch (error) {
    console.error('❌ Error normalizing schedule item:', error, item);
    return null;
  }
};

export const generateEnhancedSchedule = async (
  courses: Course[],
  enableFallbacks: boolean = true
): Promise<EnhancedGenerationResult> => {
  const startTime = Date.now();
  console.log('🚀 Starting enhanced schedule generation...');
  console.log(`📊 Processing ${courses.length} courses`);

  try {
    // Get venues from database
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
      availability: []
    }));

    console.log(`🏢 Using ${venues.length} venues for scheduling`);

    // Step 1: Pre-generation validation
    console.log('🔍 Performing pre-generation validation...');
    const validationResult = performPreGenerationValidation(courses, venues);
    
    const criticalErrors = validationResult.errors.filter(e => 
      e.severity === 'critical' || e.severity === 'high'
    );

    if (criticalErrors.length > 0 && !enableFallbacks) {
      console.log(`❌ ${criticalErrors.length} critical errors found, generation stopped`);
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
    console.log('👥 Analyzing course groups...');
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
      console.log('🔧 Applying fallback strategies...');
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
        console.log('✅ Fallback strategies applied:', fallbackResult.fallbacksApplied);
      }
    }

    // Step 4: Call the generation service
    console.log('🤖 Calling AI schedule generation service...');
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
    console.log(`⏱️ Generation completed in ${generationTime}ms`);

    if (error || !data?.success) {
      console.error('❌ Generation service error:', error);
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

    console.log('📊 Raw schedule data from service:', data.schedule?.length || 0, 'items');

    // Step 5: Normalize the schedule items
    const rawSchedule = data.schedule || [];
    const normalizedSchedule: ScheduleItem[] = [];
    
    rawSchedule.forEach((item: any, index: number) => {
      const normalized = normalizeScheduleItem(item);
      if (normalized) {
        normalizedSchedule.push(normalized);
      } else {
        console.warn(`⚠️ Failed to normalize item ${index + 1}`);
      }
    });

    const scheduledCourses = normalizedSchedule.length;
    const successRate = Math.round((scheduledCourses / courses.length) * 100);

    console.log(`✅ Final result: ${scheduledCourses}/${courses.length} courses scheduled (${successRate}%)`);

    return {
      schedule: normalizedSchedule,
      conflicts: data.conflicts || [],
      summary: {
        totalCourses: courses.length,
        scheduledCourses,
        conflictedCourses: courses.length - scheduledCourses,
        successRate
      },
      validationResult,
      fallbacksApplied: fallbackResult?.fallbacksApplied,
      courseGroups: sharedGroups,
      preValidationPassed: criticalErrors.length === 0
    };

  } catch (error) {
    console.error('❌ Error in enhanced schedule generation:', error);
    
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
