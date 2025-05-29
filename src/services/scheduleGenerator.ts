
import { Course, ScheduleItem } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";
import { saveSchedule } from "@/lib/db";

export type ScheduleConflict = {
  course: Course;
  reason: string;
  suggestion?: string;
  conflictType?: 'lecturer' | 'venue' | 'resource' | 'cross-departmental' | 'system-error' | 'database-error';
  severity?: 'low' | 'medium' | 'high' | 'critical';
  affectedCourses?: Course[];
};

export type GenerationResult = {
  schedule: ScheduleItem[];
  conflicts: ScheduleConflict[];
  summary: {
    totalCourses: number;
    scheduledCourses: number;
    conflictedCourses: number;
    successRate: number;
  };
};

// Ensure default venues exist in the database
const ensureDefaultVenues = async () => {
  const defaultVenues = [
    { name: "Room 101", capacity: 50 },
    { name: "Room 102", capacity: 100 },
    { name: "Lecture Hall A", capacity: 150 },
    { name: "Lecture Hall B", capacity: 200 },
    { name: "Laboratory 1", capacity: 30 },
    { name: "Laboratory 2", capacity: 30 },
    { name: "Seminar Room 1", capacity: 25 },
    { name: "Seminar Room 2", capacity: 25 },
    { name: "Computer Lab", capacity: 40 },
    { name: "Conference Hall", capacity: 300 },
  ];

  try {
    // Check if any venues exist
    const { data: existingVenues } = await supabase
      .from('venues')
      .select('id, name, capacity')
      .limit(10);

    if (!existingVenues || existingVenues.length === 0) {
      console.log('No venues found, inserting default venues...');
      const { data: insertedVenues, error } = await supabase
        .from('venues')
        .insert(defaultVenues.map(v => ({
          name: v.name,
          capacity: v.capacity,
          availability: []
        })))
        .select('id, name, capacity');

      if (error) {
        console.error('Error inserting venues:', error);
        throw error;
      } else {
        console.log('Successfully inserted venues:', insertedVenues?.length);
        return insertedVenues || [];
      }
    } else {
      console.log('Using existing venues:', existingVenues.length);
      return existingVenues;
    }
  } catch (error) {
    console.error('Error ensuring default venues:', error);
    throw error;
  }
};

const createEnhancedConflict = (
  course: Course,
  reason: string,
  type: ScheduleConflict['conflictType'] = 'cross-departmental',
  severity: ScheduleConflict['severity'] = 'medium',
  suggestion?: string,
  affectedCourses?: Course[]
): ScheduleConflict => ({
  course,
  reason,
  conflictType: type,
  severity,
  suggestion,
  affectedCourses
});

const analyzeScheduleErrors = (
  courses: Course[],
  edgeFunctionResponse: any,
  venues: any[]
): ScheduleConflict[] => {
  const conflicts: ScheduleConflict[] = [];

  // System-related errors
  if (edgeFunctionResponse.error) {
    const errorMessage = edgeFunctionResponse.error.toLowerCase();
    
    if (errorMessage.includes('api key') || errorMessage.includes('authentication')) {
      conflicts.push(createEnhancedConflict(
        courses[0] || {} as Course,
        'System authentication failed. Please check configuration and try again.',
        'system-error',
        'critical',
        'Verify your system configuration is correctly set up in the project settings.'
      ));
    } else if (errorMessage.includes('timeout') || errorMessage.includes('network')) {
      conflicts.push(createEnhancedConflict(
        courses[0] || {} as Course,
        'Network timeout occurred during schedule generation.',
        'system-error',
        'high',
        'Check your internet connection and try again. If the problem persists, try with fewer courses.'
      ));
    } else {
      conflicts.push(createEnhancedConflict(
        courses[0] || {} as Course,
        `System Error: ${edgeFunctionResponse.error}`,
        'system-error',
        'high',
        'Please try again or contact support if the issue persists.'
      ));
    }
  }

  // Venue capacity analysis
  if (venues.length === 0) {
    conflicts.push(createEnhancedConflict(
      courses[0] || {} as Course,
      'No venues available for scheduling.',
      'database-error',
      'critical',
      'Please contact your administrator to add venues to the system.'
    ));
  } else {
    const maxVenueCapacity = Math.max(...venues.map(v => v.capacity));
    const oversizedCourses = courses.filter(course => course.classSize > maxVenueCapacity);
    
    oversizedCourses.forEach(course => {
      conflicts.push(createEnhancedConflict(
        course,
        `Class size (${course.classSize}) exceeds maximum venue capacity (${maxVenueCapacity}).`,
        'venue',
        'high',
        `Consider splitting this course into ${Math.ceil(course.classSize / maxVenueCapacity)} smaller sections or requesting a larger venue.`
      ));
    });
  }

  // Lecturer workload analysis
  const lecturerCourses = courses.reduce((acc, course) => {
    if (!acc[course.lecturer]) acc[course.lecturer] = [];
    acc[course.lecturer].push(course);
    return acc;
  }, {} as Record<string, Course[]>);

  Object.entries(lecturerCourses).forEach(([lecturer, lecturerCourseList]) => {
    if (lecturerCourseList.length > 8) { // More than 8 courses per week
      conflicts.push(createEnhancedConflict(
        lecturerCourseList[0],
        `Lecturer ${lecturer} is assigned ${lecturerCourseList.length} courses, which may be excessive.`,
        'lecturer',
        'medium',
        'Consider redistributing some courses to other lecturers or adjusting the schedule.',
        lecturerCourseList
      ));
    }
  });

  // Department distribution analysis
  const departmentCourses = courses.reduce((acc, course) => {
    if (!acc[course.department]) acc[course.department] = 0;
    acc[course.department]++;
    return acc;
  }, {} as Record<string, number>);

  const totalCourses = courses.length;
  Object.entries(departmentCourses).forEach(([department, count]) => {
    if (count > totalCourses * 0.6) { // More than 60% of all courses
      conflicts.push(createEnhancedConflict(
        courses.find(c => c.department === department) || courses[0],
        `Department ${department} has ${count} courses (${Math.round(count/totalCourses*100)}% of total), which may cause scheduling conflicts.`,
        'cross-departmental',
        'medium',
        'Consider coordinating with other departments or spreading courses across different time slots.'
      ));
    }
  });

  return conflicts;
};

export const generateSchedule = async (
  courses: Course[]
): Promise<GenerationResult> => {
  const startTime = Date.now();
  console.log('Starting enhanced schedule generation for courses:', courses.length);

  try {
    // Ensure default venues exist and get their actual IDs
    const venues = await ensureDefaultVenues();
    if (!venues || venues.length === 0) {
      return {
        schedule: [],
        conflicts: [createEnhancedConflict(
          courses[0] || {} as Course,
          'No venues available for scheduling',
          'database-error',
          'critical',
          'Please contact your administrator to add venues to the system.'
        )],
        summary: {
          totalCourses: courses.length,
          scheduledCourses: 0,
          conflictedCourses: courses.length,
          successRate: 0
        }
      };
    }

    // Pre-generation analysis
    const preAnalysisConflicts = analyzeScheduleErrors(courses, {}, venues);

    const departmentGroups = courses.reduce((groups, course) => {
      if (!groups[course.department]) {
        groups[course.department] = [];
      }
      groups[course.department].push(course);
      return groups;
    }, {} as Record<string, Course[]>);

    console.log('Department groups:', Object.keys(departmentGroups));
    console.log('Available venues:', venues.length);

    console.log('Calling Supabase edge function...');
    const { data, error } = await supabase.functions.invoke('generate-schedule', {
      body: { 
        courses,
        venues,
        includeConflictAnalysis: true,
        departmentGroups: Object.keys(departmentGroups)
      }
    });

    const generationTime = Date.now() - startTime;
    console.log(`Schedule generation completed in ${generationTime}ms`);

    if (error) {
      console.error('Supabase function error:', error);
      const systemConflicts = analyzeScheduleErrors(courses, { error: error.message }, venues);
      return {
        schedule: [],
        conflicts: [...preAnalysisConflicts, ...systemConflicts],
        summary: {
          totalCourses: courses.length,
          scheduledCourses: 0,
          conflictedCourses: courses.length,
          successRate: 0
        }
      };
    }

    if (!data) {
      console.error('No data received from edge function');
      return {
        schedule: [],
        conflicts: [createEnhancedConflict(
          courses[0] || {} as Course,
          'No response received from schedule generator',
          'system-error',
          'high',
          'Please try again or contact support if the issue persists.'
        )],
        summary: {
          totalCourses: courses.length,
          scheduledCourses: 0,
          conflictedCourses: courses.length,
          successRate: 0
        }
      };
    }

    console.log('Edge function response:', data);

    if (!data.success) {
      console.log('Schedule generation failed with conflicts:', data.conflicts);
      
      const enhancedConflicts = (data.conflicts || []).map((conflict: any) => 
        createEnhancedConflict(
          courses.find(c => c.id === conflict.courseId) || courses[0] || {} as Course,
          conflict.reason || 'Unknown scheduling conflict',
          conflict.type || 'cross-departmental',
          conflict.severity || 'medium',
          conflict.suggestion
        )
      );

      // Add post-generation analysis
      const postAnalysisConflicts = analyzeScheduleErrors(courses, data, venues);

      return {
        schedule: [],
        conflicts: [...preAnalysisConflicts, ...enhancedConflicts, ...postAnalysisConflicts],
        summary: {
          totalCourses: courses.length,
          scheduledCourses: 0,
          conflictedCourses: courses.length,
          successRate: 0
        }
      };
    }

    if (!Array.isArray(data.schedule)) {
      console.error('Invalid schedule format received:', data.schedule);
      return {
        schedule: [],
        conflicts: [createEnhancedConflict(
          courses[0] || {} as Course,
          'Invalid schedule format received from server',
          'system-error',
          'high',
          'Please try again or contact support if the issue persists.'
        )],
        summary: {
          totalCourses: courses.length,
          scheduledCourses: 0,
          conflictedCourses: courses.length,
          successRate: 0
        }
      };
    }

    const scheduleWithVenues = data.schedule.map((item: any) => {
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

    console.log('Generated schedule successfully:', scheduleWithVenues.length, 'items');
    
    const scheduledCourses = scheduleWithVenues.length;
    const conflictedCourses = courses.length - scheduledCourses;
    const successRate = Math.round((scheduledCourses / courses.length) * 100);

    if (scheduleWithVenues.length > 0) {
      console.log('Saving schedule to database...');
      try {
        await saveSchedule(scheduleWithVenues);
        console.log('Schedule saved to database successfully');
      } catch (saveError) {
        console.error('Error saving schedule to database:', saveError);
        // Add database save error to conflicts but don't fail the generation
        preAnalysisConflicts.push(createEnhancedConflict(
          courses[0] || {} as Course,
          'Schedule generated successfully but failed to save to database',
          'database-error',
          'medium',
          'The schedule was created but may not persist. Please try saving again.'
        ));
      }
    }
    
    // Process any remaining conflicts from the edge function
    const remainingConflicts = (data.conflicts || []).map((conflict: any) => 
      createEnhancedConflict(
        courses.find(c => c.id === conflict.courseId) || courses[0] || {} as Course,
        conflict.reason || 'Scheduling constraint issue',
        conflict.type || 'cross-departmental',
        'low',
        conflict.suggestion
      )
    );

    return {
      schedule: scheduleWithVenues,
      conflicts: [...preAnalysisConflicts, ...remainingConflicts],
      summary: {
        totalCourses: courses.length,
        scheduledCourses,
        conflictedCourses,
        successRate
      }
    };

  } catch (error) {
    console.error('Error in schedule generation:', error);
    
    const errorConflicts = analyzeScheduleErrors(courses, { error: error instanceof Error ? error.message : 'Unknown error' }, []);
    
    return {
      schedule: [],
      conflicts: errorConflicts.length > 0 ? errorConflicts : [createEnhancedConflict(
        courses[0] || {} as Course,
        error instanceof Error ? error.message : 'An unexpected error occurred during schedule generation',
        'system-error',
        'critical',
        'Please check your internet connection and try again. If the problem persists, contact support.'
      )],
      summary: {
        totalCourses: courses.length,
        scheduledCourses: 0,
        conflictedCourses: courses.length,
        successRate: 0
      }
    };
  }
};
