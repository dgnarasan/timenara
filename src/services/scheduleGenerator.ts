
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

    // Pre-process courses to handle shared departments
    const processedCourses = courses.map(course => ({
      ...course,
      // Ensure shared departments are properly formatted
      sharedDepartments: course.sharedDepartments || [course.department]
    }));

    // Group courses by shared status and department
    const departmentGroups = processedCourses.reduce((groups, course) => {
      const key = course.sharedDepartments && course.sharedDepartments.length > 1 
        ? 'SHARED' 
        : course.department;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(course);
      return groups;
    }, {} as Record<string, Course[]>);

    console.log('Enhanced department groups:', Object.keys(departmentGroups));

    const { data, error } = await supabase.functions.invoke('generate-schedule', {
      body: { 
        courses: processedCourses,
        includeConflictAnalysis: true,
        departmentGroups: Object.keys(departmentGroups),
        useCalebVenues: true,
        timeRange: { start: '8:00', end: '16:00' } // Caleb's 8 AM - 4 PM schedule
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
      
      // Enhanced conflict reporting for shared courses and groups
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
      throw new Error('Invalid schedule format received');
    }

    // Add venue information and validate enhanced scheduling
    const scheduleWithEnhancements = data.schedule.map((item: any) => ({
      ...item,
      venue: item.venue || { name: "TBD", capacity: 0 },
      // Preserve group and shared department information
      group: item.group,
      sharedDepartments: item.sharedDepartments
    }));

    // Detect and report conflicts
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
          lecturer: '',
          classSize: 0,
          department: 'Computer Science',
        },
        reason: error instanceof Error ? error.message : 'Failed to generate enhanced schedule',
        conflictType: 'cross-departmental'
      }]
    };
  }
};

// Enhanced conflict detection
const detectScheduleConflicts = (schedule: ScheduleItem[]): ScheduleConflict[] => {
  const conflicts: ScheduleConflict[] = [];
  
  // Check for lecturer conflicts
  const lecturerMap = new Map<string, ScheduleItem[]>();
  schedule.forEach(item => {
    const key = `${item.lecturer}-${item.timeSlot.day}-${item.timeSlot.startTime}`;
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
          lecturer: item.lecturer,
          classSize: item.classSize,
          department: item.department,
          academicLevel: item.academicLevel,
          preferredSlots: item.preferredSlots,
          constraints: item.constraints,
          group: item.group,
          sharedDepartments: item.sharedDepartments,
          venue: typeof item.venue === 'string' ? item.venue : item.venue?.name,
          preferredDays: item.preferredDays,
          preferredTimeSlot: item.preferredTimeSlot,
        };

        conflicts.push({
          course,
          reason: `Lecturer ${item.lecturer} has overlapping classes on ${item.timeSlot.day} at ${item.timeSlot.startTime}`,
          conflictType: 'lecturer',
          suggestion: 'Reschedule one of the conflicting classes'
        });
      });
    }
  });

  // Check for venue conflicts
  const venueMap = new Map<string, ScheduleItem[]>();
  schedule.forEach(item => {
    const venueName = typeof item.venue === 'string' ? item.venue : item.venue?.name || 'TBD';
    const key = `${venueName}-${item.timeSlot.day}-${item.timeSlot.startTime}`;
    if (!venueMap.has(key)) {
      venueMap.set(key, []);
    }
    venueMap.get(key)!.push(item);
  });

  venueMap.forEach((items, key) => {
    if (items.length > 1) {
      items.forEach(item => {
        const venueName = typeof item.venue === 'string' ? item.venue : item.venue?.name || 'TBD';
        const course: Course = {
          id: item.id,
          code: item.code,
          name: item.name,
          lecturer: item.lecturer,
          classSize: item.classSize,
          department: item.department,
          academicLevel: item.academicLevel,
          preferredSlots: item.preferredSlots,
          constraints: item.constraints,
          group: item.group,
          sharedDepartments: item.sharedDepartments,
          venue: venueName,
          preferredDays: item.preferredDays,
          preferredTimeSlot: item.preferredTimeSlot,
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
