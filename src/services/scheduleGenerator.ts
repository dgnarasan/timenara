
import { Course, ScheduleItem } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";

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
    console.log('Generating college-wide schedule for courses:', courses);

    // Group courses by department for better conflict analysis
    const departmentGroups = courses.reduce((groups, course) => {
      if (!groups[course.department]) {
        groups[course.department] = [];
      }
      groups[course.department].push(course);
      return groups;
    }, {} as Record<string, Course[]>);

    console.log('Department groups:', Object.keys(departmentGroups));

    const { data, error } = await supabase.functions.invoke('generate-schedule', {
      body: { 
        courses,
        includeConflictAnalysis: true,
        departmentGroups: Object.keys(departmentGroups)
      }
    });

    if (error) {
      console.error('Supabase function error:', error);
      throw new Error(`Failed to generate college schedule: ${error.message}`);
    }

    if (!data) {
      throw new Error('No response received from schedule generator');
    }

    if (!data.success) {
      console.log('College schedule generation failed with conflicts:', data.conflicts);
      
      // Enhanced conflict reporting for college-wide scheduling
      const enhancedConflicts = (data.conflicts || []).map((conflict: any) => ({
        course: courses.find(c => c.id === conflict.courseId) || courses[0] || {
          id: '',
          code: '',
          name: '',
          lecturer: '',
          classSize: 0,
          department: 'Computer Science',
        },
        reason: conflict.reason || 'Unknown college-wide scheduling conflict',
        conflictType: conflict.type || 'cross-departmental',
        suggestion: conflict.suggestion
      }));

      return {
        schedule: [],
        conflicts: enhancedConflicts
      };
    }

    if (!Array.isArray(data.schedule)) {
      throw new Error('Invalid schedule format received');
    }

    // Add venue information and validate cross-departmental scheduling
    const scheduleWithVenues = data.schedule.map((item: any) => ({
      ...item,
      venue: item.venue || { name: "TBD", capacity: 0 }
    }));

    console.log('Generated college-wide schedule:', scheduleWithVenues);
    console.log(`Successfully scheduled ${scheduleWithVenues.length} courses across ${Object.keys(departmentGroups).length} departments`);
    
    return {
      schedule: scheduleWithVenues,
      conflicts: data.conflicts || []
    };

  } catch (error) {
    console.error('Error in college-wide schedule generation:', error);
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
        reason: error instanceof Error ? error.message : 'Failed to generate college-wide schedule',
        conflictType: 'cross-departmental'
      }]
    };
  }
};
