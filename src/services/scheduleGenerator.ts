
import { Course, ScheduleItem } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";
import { saveSchedule } from "@/lib/db";

export type ScheduleConflict = {
  course: Course;
  reason: string;
  suggestion?: string;
  conflictType?: 'lecturer' | 'venue' | 'resource' | 'cross-departmental';
};

export const generateSchedule = async (
  courses: Course[]
): Promise<{ schedule: ScheduleItem[]; conflicts: ScheduleConflict[] }> => {
  try {
    console.log('Starting schedule generation for courses:', courses.length);

    // Group courses by department for better conflict analysis
    const departmentGroups = courses.reduce((groups, course) => {
      if (!groups[course.department]) {
        groups[course.department] = [];
      }
      groups[course.department].push(course);
      return groups;
    }, {} as Record<string, Course[]>);

    console.log('Department groups:', Object.keys(departmentGroups));

    console.log('Calling Supabase edge function...');
    const { data, error } = await supabase.functions.invoke('generate-schedule', {
      body: { 
        courses,
        includeConflictAnalysis: true,
        departmentGroups: Object.keys(departmentGroups)
      }
    });

    if (error) {
      console.error('Supabase function error:', error);
      throw new Error(`Failed to generate schedule: ${error.message}`);
    }

    if (!data) {
      console.error('No data received from edge function');
      throw new Error('No response received from schedule generator');
    }

    console.log('Edge function response:', data);

    if (!data.success) {
      console.log('Schedule generation failed with conflicts:', data.conflicts);
      
      // Enhanced conflict reporting
      const enhancedConflicts = (data.conflicts || []).map((conflict: any) => ({
        course: courses.find(c => c.id === conflict.courseId) || courses[0] || {
          id: '',
          code: '',
          name: '',
          lecturer: '',
          classSize: 0,
          department: 'Computer Science',
        },
        reason: conflict.reason || 'Unknown scheduling conflict',
        conflictType: conflict.type || 'cross-departmental',
        suggestion: conflict.suggestion
      }));

      return {
        schedule: [],
        conflicts: enhancedConflicts
      };
    }

    if (!Array.isArray(data.schedule)) {
      console.error('Invalid schedule format received:', data.schedule);
      throw new Error('Invalid schedule format received from server');
    }

    // Add venue information and validate
    const scheduleWithVenues = data.schedule.map((item: any) => ({
      ...item,
      venue: item.venue || { name: "TBD", capacity: 0 }
    }));

    console.log('Generated schedule successfully:', scheduleWithVenues.length, 'items');
    
    // Save the schedule to the database
    if (scheduleWithVenues.length > 0) {
      console.log('Saving schedule to database...');
      await saveSchedule(scheduleWithVenues);
      console.log('Schedule saved to database successfully');
    }
    
    return {
      schedule: scheduleWithVenues,
      conflicts: data.conflicts || []
    };

  } catch (error) {
    console.error('Error in schedule generation:', error);
    
    // Return a more informative error
    return {
      schedule: [],
      conflicts: [{
        course: {
          id: '',
          code: '',
          name: '',
          lecturer: '',
          classSize: 0,
          department: 'Computer Science',
        },
        reason: error instanceof Error ? error.message : 'An unexpected error occurred during schedule generation',
        conflictType: 'cross-departmental'
      }]
    };
  }
};
