
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

export const generateSchedule = async (
  courses: Course[]
): Promise<{ schedule: ScheduleItem[]; conflicts: ScheduleConflict[] }> => {
  try {
    console.log('Starting schedule generation for courses:', courses.length);

    // Ensure default venues exist and get their actual IDs
    const venues = await ensureDefaultVenues();
    if (!venues || venues.length === 0) {
      throw new Error('No venues available for scheduling');
    }

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
