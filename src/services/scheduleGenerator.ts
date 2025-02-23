
import { Course, ScheduleItem, Venue } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";

export type ScheduleConflict = {
  course: Course;
  reason: string;
  suggestion?: string;
  alternativeSchedule?: ScheduleItem[];
};

export const generateSchedule = async (
  courses: Course[]
): Promise<{ schedule: ScheduleItem[]; conflicts: ScheduleConflict[] }> => {
  try {
    // Get default venues (you might want to fetch this from Supabase in a real app)
    const venues = [
      {
        name: "Room 101",
        capacity: 30,
      },
      {
        name: "Room 102",
        capacity: 40,
      },
      {
        name: "Lecture Hall 1",
        capacity: 100,
      },
      {
        name: "Lecture Hall 2",
        capacity: 150,
      },
    ];

    const { data, error } = await supabase.functions.invoke('generate-schedule', {
      body: { courses, venues }
    });

    if (error) throw error;

    if (!data.success) {
      return {
        schedule: [],
        conflicts: data.conflicts.map((error: string) => ({
          course: { id: '', code: '', name: '', lecturer: '', classSize: 0 },
          reason: error
        }))
      };
    }

    return {
      schedule: data.schedule,
      conflicts: data.conflicts || []
    };

  } catch (error) {
    console.error('Error generating schedule:', error);
    return {
      schedule: [],
      conflicts: [{
        course: { id: '', code: '', name: '', lecturer: '', classSize: 0 },
        reason: error instanceof Error ? error.message : 'Failed to generate schedule'
      }]
    };
  }
};
