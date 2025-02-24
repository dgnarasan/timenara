
import { Course, ScheduleItem } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";

export type ScheduleConflict = {
  course: Course;
  reason: string;
  suggestion?: string;
};

export const generateSchedule = async (
  courses: Course[]
): Promise<{ schedule: ScheduleItem[]; conflicts: ScheduleConflict[] }> => {
  try {
    console.log('Generating schedule for courses:', courses);

    const { data, error } = await supabase.functions.invoke('generate-schedule', {
      body: { courses }
    });

    if (error) {
      console.error('Supabase function error:', error);
      throw error;
    }

    if (!data.success) {
      console.log('Schedule generation failed with conflicts:', data.conflicts);
      return {
        schedule: [],
        conflicts: data.conflicts.map((conflict: any) => ({
          course: {
            id: '',
            code: '',
            name: '',
            lecturer: '',
            classSize: 0,
            department: 'Computer Science', // Default department for error cases
          },
          reason: conflict.reason
        }))
      };
    }

    // Add a default venue for display purposes
    const scheduleWithVenues = data.schedule.map((item: any) => ({
      ...item,
      venue: { name: "TBD", capacity: 0 } // Venue will be assigned later
    }));

    return {
      schedule: scheduleWithVenues,
      conflicts: data.conflicts || []
    };

  } catch (error) {
    console.error('Error in generateSchedule:', error);
    return {
      schedule: [],
      conflicts: [{
        course: {
          id: '',
          code: '',
          name: '',
          lecturer: '',
          classSize: 0,
          department: 'Computer Science', // Default department for error cases
        },
        reason: error instanceof Error ? error.message : 'Failed to generate schedule'
      }]
    };
  }
};
