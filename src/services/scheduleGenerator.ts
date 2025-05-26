
import { Course, ScheduleItem } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";

export type ScheduleConflict = {
  course: Course;
  reason: string;
  suggestion?: string;
  conflictType?: 'lecturer' | 'venue' | 'resource' | 'cross-departmental' | 'shared-course';
};

export const generateSchedule = async (
  courses: Course[]
): Promise<{ schedule: ScheduleItem[]; conflicts: ScheduleConflict[] }> => {
  try {
    console.log('Generating enhanced Caleb University schedule for courses:', courses);

    // Safely pre-process courses with fallback defaults
    const processedCourses = courses.map(course => ({
      ...course,
      lecturer: course.lecturer || 'TBD',
      venue: course.venue || 'Unassigned',
      group: course.group || '',
      sharedDepartments: course.sharedDepartments && course.sharedDepartments.length > 0 
        ? course.sharedDepartments 
        : [course.department],
      preferredDays: course.preferredDays || [],
      preferredTimeSlot: course.preferredTimeSlot || ''
    }));

    // Deduplicate shared courses to prevent multiple scheduling
    const deduplicatedCourses = deduplicateSharedCourses(processedCourses);

    console.log('Enhanced department groups after deduplication:', deduplicatedCourses.length);

    const { data, error } = await supabase.functions.invoke('generate-schedule', {
      body: { 
        courses: deduplicatedCourses,
        includeConflictAnalysis: true,
        useCalebVenues: true,
        timeRange: { start: '8:00', end: '16:00' }
      }
    });

    if (error) {
      console.error('Supabase function error:', error);
      throw new Error(`Failed to generate Caleb University schedule: ${error.message}`);
    }

    if (!data) {
      throw new Error('No response received from schedule generator');
    }

    if (!data.success) {
      console.log('Enhanced schedule generation failed with conflicts:', data.conflicts);
      
      const enhancedConflicts = (data.conflicts || []).map((conflict: any) => ({
        course: courses.find(c => c.id === conflict.courseId) || {
          id: '',
          code: '',
          name: '',
          lecturer: 'TBD',
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
      throw new Error('Invalid schedule format received');
    }

    // Add venue information and validate enhanced scheduling with safe defaults
    const scheduleWithEnhancements = data.schedule.map((item: any) => ({
      ...item,
      lecturer: item.lecturer || 'TBD',
      venue: item.venue || { name: "TBD", capacity: 0 },
      group: item.group || '',
      sharedDepartments: item.sharedDepartments || [item.department],
      preferredDays: item.preferredDays || [],
      preferredTimeSlot: item.preferredTimeSlot || ''
    }));

    const detectedConflicts = detectScheduleConflicts(scheduleWithEnhancements);

    console.log('Generated enhanced Caleb University schedule:', scheduleWithEnhancements);
    console.log(`Successfully scheduled ${scheduleWithEnhancements.length} courses with conflict detection`);
    
    return {
      schedule: scheduleWithEnhancements,
      conflicts: detectedConflicts
    };

  } catch (error) {
    console.error('Error in enhanced schedule generation:', error);
    return {
      schedule: [],
      conflicts: [{
        course: {
          id: '',
          code: '',
          name: '',
          lecturer: 'TBD',
          classSize: 0,
          department: 'Computer Science',
        },
        reason: error instanceof Error ? error.message : 'Failed to generate enhanced schedule',
        conflictType: 'cross-departmental'
      }]
    };
  }
};

// Deduplicate shared courses to prevent multiple scheduling
const deduplicateSharedCourses = (courses: Course[]): Course[] => {
  const deduplicatedMap = new Map<string, Course>();
  
  courses.forEach(course => {
    const baseKey = `${course.code}-${course.lecturer || 'TBD'}`;
    const key = course.group ? `${baseKey}-${course.group}` : baseKey;
    
    if (!deduplicatedMap.has(key)) {
      // For shared courses, aggregate the departments
      const existingCourse = Array.from(deduplicatedMap.values()).find(c => 
        c.code === course.code && 
        (c.lecturer || 'TBD') === (course.lecturer || 'TBD') &&
        (c.group || '') === (course.group || '')
      );
      
      if (existingCourse) {
        // Merge shared departments
        const allDepartments = [
          ...(existingCourse.sharedDepartments || [existingCourse.department]),
          ...(course.sharedDepartments || [course.department])
        ];
        existingCourse.sharedDepartments = [...new Set(allDepartments)];
      } else {
        deduplicatedMap.set(key, {
          ...course,
          sharedDepartments: course.sharedDepartments || [course.department]
        });
      }
    }
  });
  
  return Array.from(deduplicatedMap.values());
};

// Enhanced conflict detection with safe field access
const detectScheduleConflicts = (schedule: ScheduleItem[]): ScheduleConflict[] => {
  const conflicts: ScheduleConflict[] = [];
  
  // Check for lecturer conflicts
  const lecturerMap = new Map<string, ScheduleItem[]>();
  schedule.forEach(item => {
    const lecturer = item.lecturer || 'TBD';
    const key = `${lecturer}-${item.timeSlot.day}-${item.timeSlot.startTime}`;
    if (!lecturerMap.has(key)) {
      lecturerMap.set(key, []);
    }
    lecturerMap.get(key)!.push(item);
  });

  lecturerMap.forEach((items, key) => {
    if (items.length > 1) {
      items.forEach(item => {
        const course: Course = {
          id: item.id,
          code: item.code,
          name: item.name,
          lecturer: item.lecturer || 'TBD',
          classSize: item.classSize,
          department: item.department,
          academicLevel: item.academicLevel,
          preferredSlots: item.preferredSlots,
          constraints: item.constraints,
          group: item.group || '',
          sharedDepartments: item.sharedDepartments || [item.department],
          venue: typeof item.venue === 'string' ? item.venue : (item.venue?.name || 'TBD'),
          preferredDays: item.preferredDays || [],
          preferredTimeSlot: item.preferredTimeSlot || '',
        };

        conflicts.push({
          course,
          reason: `Lecturer ${item.lecturer || 'TBD'} has overlapping classes on ${item.timeSlot.day} at ${item.timeSlot.startTime}`,
          conflictType: 'lecturer',
          suggestion: 'Reschedule one of the conflicting classes'
        });
      });
    }
  });

  // Check for venue conflicts
  const venueMap = new Map<string, ScheduleItem[]>();
  schedule.forEach(item => {
    const venueName = typeof item.venue === 'string' ? item.venue : (item.venue?.name || 'TBD');
    const key = `${venueName}-${item.timeSlot.day}-${item.timeSlot.startTime}`;
    if (!venueMap.has(key)) {
      venueMap.set(key, []);
    }
    venueMap.get(key)!.push(item);
  });

  venueMap.forEach((items, key) => {
    if (items.length > 1) {
      items.forEach(item => {
        const venueName = typeof item.venue === 'string' ? item.venue : (item.venue?.name || 'TBD');
        const course: Course = {
          id: item.id,
          code: item.code,
          name: item.name,
          lecturer: item.lecturer || 'TBD',
          classSize: item.classSize,
          department: item.department,
          academicLevel: item.academicLevel,
          preferredSlots: item.preferredSlots,
          constraints: item.constraints,
          group: item.group || '',
          sharedDepartments: item.sharedDepartments || [item.department],
          venue: venueName,
          preferredDays: item.preferredDays || [],
          preferredTimeSlot: item.preferredTimeSlot || '',
        };

        conflicts.push({
          course,
          reason: `Venue ${venueName} is double-booked on ${item.timeSlot.day} at ${item.timeSlot.startTime}`,
          conflictType: 'venue',
          suggestion: 'Assign alternative venue or reschedule'
        });
      });
    }
  });

  return conflicts;
};
