import { supabase } from "@/integrations/supabase/client";
import { Course, DBCourse, Venue, DBVenue, TimeSlot, Department, ScheduleItem, ExamCourse, DBExamCourse, ExamScheduleItem, DBExamSchedule } from "./types";
import { PostgrestResponse } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";

export const mapDBCourseToClient = (dbCourse: DBCourse): Course => ({
  id: dbCourse.id,
  code: dbCourse.code,
  name: dbCourse.name,
  lecturer: dbCourse.lecturer,
  classSize: dbCourse.class_size,
  department: dbCourse.department,
  academicLevel: dbCourse.academic_level,
  preferredSlots: dbCourse.preferred_slots || undefined,
  constraints: dbCourse.constraints || undefined,
});

export const mapDBVenueToClient = (dbVenue: DBVenue): Venue => ({
  id: dbVenue.id,
  name: dbVenue.name,
  capacity: dbVenue.capacity,
  availability: dbVenue.availability,
});

export const mapDBExamCourseToClient = (dbExamCourse: DBExamCourse): ExamCourse => ({
  id: dbExamCourse.id,
  courseCode: dbExamCourse.course_code,
  courseTitle: dbExamCourse.course_title,
  department: dbExamCourse.department,
  college: dbExamCourse.college,
  level: dbExamCourse.level,
  studentCount: dbExamCourse.student_count,
  createdAt: dbExamCourse.created_at,
  updatedAt: dbExamCourse.updated_at,
});

export const fetchCourses = async (): Promise<Course[]> => {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data as unknown as DBCourse[]).map(mapDBCourseToClient);
};

export const addCourse = async (course: Omit<Course, "id">): Promise<Course> => {
  const { data, error } = await supabase
    .from('courses')
    .insert({
      code: course.code,
      name: course.name,
      lecturer: course.lecturer,
      class_size: course.classSize,
      department: course.department,
      academic_level: course.academicLevel,
      preferred_slots: course.preferredSlots ? JSON.stringify(course.preferredSlots) : null,
      constraints: course.constraints || null,
    })
    .select()
    .single();

  if (error) throw error;
  const dbCourse = data as unknown as DBCourse;
  if (dbCourse.preferred_slots) {
    dbCourse.preferred_slots = JSON.parse(dbCourse.preferred_slots as unknown as string);
  }
  return mapDBCourseToClient(dbCourse);
};

export const addCourses = async (courses: Omit<Course, "id">[]): Promise<Course[]> => {
  const { data, error } = await supabase
    .from('courses')
    .insert(
      courses.map(course => ({
        code: course.code,
        name: course.name,
        lecturer: course.lecturer,
        class_size: course.classSize,
        department: course.department,
        academic_level: course.academicLevel,
        preferred_slots: course.preferredSlots ? JSON.stringify(course.preferredSlots) : null,
        constraints: course.constraints || null,
      }))
    )
    .select();

  if (error) throw error;
  return (data as unknown as DBCourse[]).map(course => {
    if (course.preferred_slots) {
      course.preferred_slots = JSON.parse(course.preferred_slots as unknown as string);
    }
    return mapDBCourseToClient(course);
  });
};

export const deleteCourse = async (courseId: string): Promise<void> => {
  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', courseId);

  if (error) throw error;
};

export const deleteAllCourses = async (): Promise<void> => {
  const { error } = await supabase
    .from('courses')
    .delete()
    .gte('created_at', '1970-01-01'); // Delete all rows by using a condition that matches all

  if (error) throw error;
};

export const fetchSchedule = async (): Promise<ScheduleItem[]> => {
  const { data: scheduleData, error } = await supabase
    .from('schedules')
    .select(`
      id,
      day,
      start_time,
      end_time,
      published,
      created_at,
      courses!inner (
        id,
        code,
        name,
        lecturer,
        class_size,
        department,
        academic_level
      ),
      venues!inner (
        id,
        name,
        capacity
      )
    `)
    .eq('published', true)
    .order('day', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) throw error;

  return (scheduleData || []).map((item: any) => ({
    id: item.courses.id,
    code: item.courses.code,
    name: item.courses.name,
    lecturer: item.courses.lecturer,
    classSize: item.courses.class_size,
    department: item.courses.department,
    academicLevel: item.courses.academic_level,
    timeSlot: {
      day: item.day as TimeSlot["day"],
      startTime: item.start_time,
      endTime: item.end_time,
    },
    venue: {
      id: item.venues.id,
      name: item.venues.name,
      capacity: item.venues.capacity,
      availability: [],
    },
  }));
};

export const fetchAdminSchedule = async (): Promise<ScheduleItem[]> => {
  const { data: scheduleData, error } = await supabase
    .from('schedules')
    .select(`
      id,
      day,
      start_time,
      end_time,
      published,
      created_at,
      courses!inner (
        id,
        code,
        name,
        lecturer,
        class_size,
        department,
        academic_level
      ),
      venues!inner (
        id,
        name,
        capacity
      )
    `)
    .order('day', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) throw error;

  return (scheduleData || []).map((item: any) => ({
    id: item.courses.id,
    code: item.courses.code,
    name: item.courses.name,
    lecturer: item.courses.lecturer,
    classSize: item.courses.class_size,
    department: item.courses.department,
    academicLevel: item.courses.academic_level,
    timeSlot: {
      day: item.day as TimeSlot["day"],
      startTime: item.start_time,
      endTime: item.end_time,
    },
    venue: {
      id: item.venues.id,
      name: item.venues.name,
      capacity: item.venues.capacity,
      availability: [],
    },
  }));
};

export const saveSchedule = async (schedule: ScheduleItem[], shouldPublish: boolean = false): Promise<void> => {
  // Prepare schedule data for the database function
  const scheduleData = schedule.map(item => ({
    course_id: item.id,
    venue_id: item.venue.id,
    day: item.timeSlot.day,
    start_time: item.timeSlot.startTime,
    end_time: item.timeSlot.endTime,
  }));

  const { error } = await supabase.rpc('clear_and_insert_schedule', {
    schedule_data: scheduleData,
    should_publish: shouldPublish
  });

  if (error) throw error;
};

export const publishSchedule = async (shouldPublish: boolean): Promise<void> => {
  const { error } = await supabase.rpc('publish_schedule', {
    should_publish: shouldPublish
  });

  if (error) throw error;
};

export const clearSchedule = async (): Promise<void> => {
  const { error } = await supabase
    .from('schedules')
    .delete()
    .gte('created_at', '1970-01-01'); // Delete all rows

  if (error) throw error;
};

export const fetchExamCourses = async (): Promise<ExamCourse[]> => {
  const { data, error } = await supabase
    .from('exam_courses')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data as unknown as DBExamCourse[]).map(mapDBExamCourseToClient);
};

export const addExamCourses = async (courses: Omit<ExamCourse, "id" | "createdAt" | "updatedAt">[]): Promise<ExamCourse[]> => {
  const { error } = await supabase.rpc('clear_and_insert_exam_courses', {
    courses_data: courses.map(course => ({
      course_code: course.courseCode,
      course_title: course.courseTitle,
      department: course.department,
      college: course.college,
      level: course.level,
      student_count: course.studentCount,
    }))
  });

  if (error) throw error;
  
  // Fetch the newly inserted courses
  return await fetchExamCourses();
};

export const deleteAllExamCourses = async (): Promise<void> => {
  const { error } = await supabase
    .from('exam_courses')
    .delete()
    .gte('created_at', '1970-01-01');

  if (error) throw error;
};

export const fetchExamSchedule = async (): Promise<ExamScheduleItem[]> => {
  const { data: scheduleData, error } = await supabase
    .from('exam_schedules')
    .select(`
      id,
      day,
      start_time,
      end_time,
      session_name,
      venue_name,
      published,
      created_at,
      exam_courses!inner (
        id,
        course_code,
        course_title,
        department,
        college,
        level,
        student_count
      )
    `)
    .eq('published', true)
    .order('day', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) throw error;

  return (scheduleData || []).map((item: any) => ({
    id: item.exam_courses.id,
    courseCode: item.exam_courses.course_code,
    courseTitle: item.exam_courses.course_title,
    department: item.exam_courses.department,
    college: item.exam_courses.college,
    level: item.exam_courses.level,
    studentCount: item.exam_courses.student_count,
    day: item.day,
    startTime: item.start_time,
    endTime: item.end_time,
    sessionName: item.session_name as 'Morning' | 'Midday' | 'Afternoon',
    venueName: item.venue_name,
    createdAt: item.exam_courses.created_at || '',
    updatedAt: item.exam_courses.updated_at || '',
  }));
};

export const fetchAdminExamSchedule = async (): Promise<ExamScheduleItem[]> => {
  const { data: scheduleData, error } = await supabase
    .from('exam_schedules')
    .select(`
      id,
      day,
      start_time,
      end_time,
      session_name,
      venue_name,
      published,
      created_at,
      exam_courses!inner (
        id,
        course_code,
        course_title,
        department,
        college,
        level,
        student_count
      )
    `)
    .order('day', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) throw error;

  return (scheduleData || []).map((item: any) => ({
    id: item.exam_courses.id,
    courseCode: item.exam_courses.course_code,
    courseTitle: item.exam_courses.course_title,
    department: item.exam_courses.department,
    college: item.exam_courses.college,
    level: item.exam_courses.level,
    studentCount: item.exam_courses.student_count,
    day: item.day,
    startTime: item.start_time,
    endTime: item.end_time,
    sessionName: item.session_name as 'Morning' | 'Midday' | 'Afternoon',
    venueName: item.venue_name,
    createdAt: item.exam_courses.created_at || '',
    updatedAt: item.exam_courses.updated_at || '',
  }));
};

export const saveExamSchedule = async (schedule: ExamScheduleItem[], shouldPublish: boolean = false): Promise<void> => {
  const scheduleData = schedule.map(item => ({
    exam_course_id: item.id,
    day: item.day,
    start_time: item.startTime,
    end_time: item.endTime,
    session_name: item.sessionName,
    venue_name: item.venueName,
  }));

  const { error } = await supabase.rpc('clear_and_insert_exam_schedule', {
    schedule_data: scheduleData,
    should_publish: shouldPublish
  });

  if (error) throw error;
};

export const publishExamSchedule = async (shouldPublish: boolean): Promise<void> => {
  const { error } = await supabase.rpc('publish_exam_schedule', {
    should_publish: shouldPublish
  });

  if (error) throw error;
};

export const clearExamSchedule = async (): Promise<void> => {
  const { error } = await supabase
    .from('exam_schedules')
    .delete()
    .gte('created_at', '1970-01-01');

  if (error) throw error;
};
