
import { Course, ScheduleItem } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";
import { saveSchedule } from "@/lib/db";

export type ScheduleConflict = {
  course: Course;
  reason: string;
  suggestion?: string;
  conflictType?: 'lecturer' | 'venue' | 'resource' | 'cross-departmental';
};

// Ensure default venues exist in the database
const ensureDefaultVenues = async () => {
  const defaultVenues = [
    { id: "venue_1", name: "Room 101", capacity: 50 },
    { id: "venue_2", name: "Room 102", capacity: 100 },
    { id: "venue_3", name: "Lecture Hall A", capacity: 150 },
    { id: "venue_4", name: "Lecture Hall B", capacity: 200 },
    { id: "venue_5", name: "Laboratory 1", capacity: 30 },
    { id: "venue_6", name: "Laboratory 2", capacity: 30 },
    { id: "venue_7", name: "Seminar Room 1", capacity: 25 },
    { id: "venue_8", name: "Seminar Room 2", capacity: 25 },
    { id: "venue_9", name: "Computer Lab", capacity: 40 },
    { id: "venue_10", name: "Conference Hall", capacity: 300 },
  ];

  try {
    // Check if venues exist
    const { data: existingVenues } = await supabase
      .from('venues')
      .select('id')
      .in('id', defaultVenues.map(v => v.id));

    const existingIds = new Set(existingVenues?.map(v => v.id) || []);
    const venuesToInsert = defaultVenues.filter(v => !existingIds.has(v.id));

    if (venuesToInsert.length > 0) {
      console.log('Inserting missing venues:', venuesToInsert.length);
      const { error } = await supabase
        .from('venues')
        .insert(venuesToInsert.map(v => ({
          id: v.id,
          name: v.name,
          capacity: v.capacity,
          availability: []
        })));

      if (error) {
        console.error('Error inserting venues:', error);
      } else {
        console.log('Successfully inserted venues');
      }
    }
  } catch (error) {
    console.error('Error ensuring default venues:', error);
  }
};

export const generateSchedule = async (
  courses: Course[]
): Promise<{ schedule: ScheduleItem[]; conflicts: ScheduleConflict[] }> => {
  try {
    console.log('Starting schedule generation for courses:', courses.length);

    // Ensure default venues exist
    await ensureDefaultVenues();

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

    const scheduleWithVenues = data.schedule.map((item: any) => ({
      ...item,
      venue: item.venue || { id: "venue_1", name: "Room 101", capacity: 50 }
    }));

    console.log('Generated schedule successfully:', scheduleWithVenues.length, 'items');
    
    if (scheduleWithVenues.length > 0) {
      console.log('Saving schedule to database...');
      try {
        await saveSchedule(scheduleWithVenues);
        console.log('Schedule saved to database successfully');
      } catch (saveError) {
        console.error('Error saving schedule to database:', saveError);
        // Don't throw here, just log the error and continue
        // The schedule was generated successfully, saving is secondary
      }
    }
    
    return {
      schedule: scheduleWithVenues,
      conflicts: data.conflicts || []
    };

  } catch (error) {
    console.error('Error in schedule generation:', error);
    
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
