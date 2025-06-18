import { supabase } from '@/integrations/supabase/client';
import { Course, ExamCourse, Room, ScheduleItem, User, ExamScheduleItem, ExamCourseForUpload, TimeSlot, UserProfile } from './types';

// Helper function to safely convert TimeSlot[] to Json
const timeSlotArrayToJson = (timeSlots: TimeSlot[] | undefined): any => {
  return timeSlots ? JSON.parse(JSON.stringify(timeSlots)) : null;
};

// Helper function to safely convert Json to TimeSlot[]
const jsonToTimeSlotArray = (json: any): TimeSlot[] => {
  if (!json || !Array.isArray(json)) return [];
  
  return json.map((slot: any) => ({
    day: slot.day as "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday",
    startTime: slot.startTime,
    endTime: slot.endTime,
  }));
};

// Helper function to safely convert constraints
const constraintsToArray = (constraints: any): string[] => {
  if (!constraints) return [];
  if (Array.isArray(constraints)) return constraints;
  return [];
};

// Helper function to transform database course to frontend course
const transformDbCourseToFrontend = (dbCourse: any): Course => {
  return {
    id: dbCourse.id,
    code: dbCourse.code,
    name: dbCourse.name,
    lecturer: dbCourse.lecturer,
    classSize: dbCourse.class_size,
    department: dbCourse.department,
    academicLevel: dbCourse.academic_level,
    preferredSlots: jsonToTimeSlotArray(dbCourse.preferred_slots),
    constraints: constraintsToArray(dbCourse.constraints),
  };
};

// Helper function to transform frontend course to database format
const transformFrontendCourseToDb = (course: Omit<Course, 'id'>) => {
  return {
    code: course.code,
    name: course.name,
    lecturer: course.lecturer,
    class_size: course.classSize,
    department: course.department,
    academic_level: course.academicLevel,
    preferred_slots: timeSlotArrayToJson(course.preferredSlots),
    constraints: course.constraints || null,
  };
};

// Helper function to transform database venue to frontend room
const transformDbVenueToRoom = (dbVenue: any): Room => {
  return {
    id: dbVenue.id,
    name: dbVenue.name,
    capacity: dbVenue.capacity,
    availability: jsonToTimeSlotArray(dbVenue.availability),
  };
};

// Helper function to transform frontend room to database venue format
const transformRoomToDbVenue = (room: Omit<Room, 'id'>) => {
  return {
    name: room.name,
    capacity: room.capacity,
    availability: timeSlotArrayToJson(room.availability),
  };
};

// Function to fetch courses
export const fetchCourses = async (): Promise<Course[]> => {
  const { data: courses, error } = await supabase
    .from('courses')
    .select('*')
    .order('code', { ascending: true });

  if (error) {
    console.error('Error fetching courses:', error);
    throw error;
  }

  return (courses || []).map(transformDbCourseToFrontend);
};

// Function to add a new course
export const addCourse = async (course: Omit<Course, 'id'>): Promise<Course> => {
  const dbCourse = transformFrontendCourseToDb(course);
  
  const { data, error } = await supabase
    .from('courses')
    .insert([dbCourse])
    .select()
    .single();

  if (error) {
    console.error('Error adding course:', error);
    throw error;
  }

  return transformDbCourseToFrontend(data);
};

// Function to update an existing course
export const updateCourse = async (id: string, updates: Partial<Omit<Course, 'id'>>): Promise<Course | null> => {
  const dbUpdates: any = {};
  
  if (updates.code !== undefined) dbUpdates.code = updates.code;
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.lecturer !== undefined) dbUpdates.lecturer = updates.lecturer;
  if (updates.classSize !== undefined) dbUpdates.class_size = updates.classSize;
  if (updates.department !== undefined) dbUpdates.department = updates.department;
  if (updates.academicLevel !== undefined) dbUpdates.academic_level = updates.academicLevel;
  if (updates.preferredSlots !== undefined) dbUpdates.preferred_slots = timeSlotArrayToJson(updates.preferredSlots);
  if (updates.constraints !== undefined) dbUpdates.constraints = updates.constraints;

  const { data, error } = await supabase
    .from('courses')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating course:', error);
    throw error;
  }

  return data ? transformDbCourseToFrontend(data) : null;
};

// Function to delete a course
export const deleteCourse = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting course:', error);
    throw error;
  }
};

// Function to fetch rooms (venues)
export const fetchRooms = async (): Promise<Room[]> => {
  const { data: venues, error } = await supabase
    .from('venues')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching venues:', error);
    throw error;
  }

  return (venues || []).map(transformDbVenueToRoom);
};

// Function to add a new room (venue)
export const addRoom = async (room: Omit<Room, 'id'>): Promise<Room> => {
  const dbVenue = transformRoomToDbVenue(room);
  
  const { data, error } = await supabase
    .from('venues')
    .insert([dbVenue])
    .select()
    .single();

  if (error) {
    console.error('Error adding venue:', error);
    throw error;
  }

  return transformDbVenueToRoom(data);
};

// Function to update an existing room (venue)
export const updateRoom = async (id: string, updates: Partial<Omit<Room, 'id'>>): Promise<Room | null> => {
  const dbUpdates: any = {};
  
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.capacity !== undefined) dbUpdates.capacity = updates.capacity;
  if (updates.availability !== undefined) dbUpdates.availability = timeSlotArrayToJson(updates.availability);

  const { data, error } = await supabase
    .from('venues')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating venue:', error);
    throw error;
  }

  return data ? transformDbVenueToRoom(data) : null;
};

// Function to delete a room (venue)
export const deleteRoom = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('venues')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting venue:', error);
    throw error;
  }
};

// Function to fetch schedule
export const fetchSchedule = async (): Promise<ScheduleItem[]> => {
  const { data: schedule, error } = await supabase
    .from('schedules')
    .select(`
      *,
      course:course_id(*),
      venue:venue_id(*)
    `)
    .eq('published', true)
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching schedule:', error);
    throw error;
  }

  return (schedule || []).map((item: any) => ({
    id: item.course.id,
    code: item.course.code,
    name: item.course.name,
    lecturer: item.course.lecturer,
    classSize: item.course.class_size,
    department: item.course.department,
    academicLevel: item.course.academic_level,
    preferredSlots: jsonToTimeSlotArray(item.course.preferred_slots),
    constraints: constraintsToArray(item.course.constraints),
    venue: {
      id: item.venue.id,
      name: item.venue.name,
      capacity: item.venue.capacity,
      availability: jsonToTimeSlotArray(item.venue.availability),
    },
    timeSlot: {
      day: item.day as "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday",
      startTime: item.start_time,
      endTime: item.end_time,
    },
  }));
};

// Function to add a schedule item
export const addScheduleItem = async (item: Omit<ScheduleItem, 'course' | 'room'>): Promise<ScheduleItem> => {
  const { data, error } = await supabase
    .from('schedules')
    .insert([{
      course_id: item.id,
      venue_id: item.venue.id,
      day: item.timeSlot.day,
      start_time: item.timeSlot.startTime,
      end_time: item.timeSlot.endTime,
    }])
    .select(`
      *,
      course:course_id(*),
      venue:venue_id(*)
    `)
    .single();

  if (error) {
    console.error('Error adding schedule item:', error);
    throw error;
  }

  return {
    id: data.course.id,
    code: data.course.code,
    name: data.course.name,
    lecturer: data.course.lecturer,
    classSize: data.course.class_size,
    department: data.course.department,
    academicLevel: data.course.academic_level,
    preferredSlots: jsonToTimeSlotArray(data.course.preferred_slots),
    constraints: constraintsToArray(data.course.constraints),
    venue: {
      id: data.venue.id,
      name: data.venue.name,
      capacity: data.venue.capacity,
      availability: jsonToTimeSlotArray(data.venue.availability),
    },
    timeSlot: {
      day: data.day as "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday",
      startTime: data.start_time,
      endTime: data.end_time,
    },
  };
};

// Function to update a schedule item
export const updateScheduleItem = async (id: string, updates: Partial<Omit<ScheduleItem, 'id' | 'course' | 'room'>>): Promise<ScheduleItem | null> => {
  const dbUpdates: any = {};
  
  if (updates.venue?.id) dbUpdates.venue_id = updates.venue.id;
  if (updates.timeSlot?.day) dbUpdates.day = updates.timeSlot.day;
  if (updates.timeSlot?.startTime) dbUpdates.start_time = updates.timeSlot.startTime;
  if (updates.timeSlot?.endTime) dbUpdates.end_time = updates.timeSlot.endTime;

  const { data, error } = await supabase
    .from('schedules')
    .update(dbUpdates)
    .eq('id', id)
    .select(`
      *,
      course:course_id(*),
      venue:venue_id(*)
    `)
    .single();

  if (error) {
    console.error('Error updating schedule item:', error);
    throw error;
  }

  if (!data) return null;

  return {
    id: data.course.id,
    code: data.course.code,
    name: data.course.name,
    lecturer: data.course.lecturer,
    classSize: data.course.class_size,
    department: data.course.department,
    academicLevel: data.course.academic_level,
    preferredSlots: jsonToTimeSlotArray(data.course.preferred_slots),
    constraints: constraintsToArray(data.course.constraints),
    venue: {
      id: data.venue.id,
      name: data.venue.name,
      capacity: data.venue.capacity,
      availability: jsonToTimeSlotArray(data.venue.availability),
    },
    timeSlot: {
      day: data.day as "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday",
      startTime: data.start_time,
      endTime: data.end_time,
    },
  };
};

// Function to delete a schedule item
export const deleteScheduleItem = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('schedules')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting schedule item:', error);
  }
};

// Function to fetch users
export const fetchUsers = async (): Promise<UserProfile[]> => {
  const { data: users, error } = await supabase
    .from('profiles')
    .select('id, email, role');

  if (error) {
    console.error('Error fetching users:', error);
    throw error;
  }

  return (users || []).map(user => ({
    id: user.id,
    email: user.email,
    role: (user.role === 'admin' ? 'admin' : 'student') as 'admin' | 'student',
  }));
};

// Function to update user role
export const updateUserRole = async (id: string, role: 'admin' | 'student'): Promise<User | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating user role:', error);
    throw error;
  }

  if (!data) return null;

  // Ensure the role is one of the expected values with proper typing
  const validRole: 'admin' | 'student' = (data.role === 'admin') ? 'admin' : 'student';

  return {
    id: data.id,
    email: data.email,
    role: validRole,
  };
};

// Function to fetch exam courses
export const fetchExamCourses = async (): Promise<ExamCourse[]> => {
  const { data: exam_courses, error } = await supabase
    .from('exam_courses')
    .select('*')
    .order('course_code', { ascending: true });

  if (error) {
    console.error('Error fetching exam courses:', error);
    throw error;
  }

  return (exam_courses || []).map(course => ({
    id: course.id,
    courseCode: course.course_code,
    courseTitle: course.course_title,
    department: course.department,
    college: course.college,
    level: course.level,
    studentCount: course.student_count,
    createdAt: course.created_at,
    updatedAt: course.updated_at,
  }));
};

// Function to add exam courses
export const addExamCourses = async (courses: ExamCourseForUpload[]) => {
  console.log("Adding exam courses to database:", courses);
  
  const validatedCourses = courses.map(course => ({
    course_code: course.courseCode,
    course_title: course.courseTitle,
    department: course.department,
    college: course.college,
    level: course.level,
    student_count: course.studentCount,
  }));
  
  console.log("Validated courses for database:", validatedCourses);
  
  try {
    const { data, error } = await supabase
      .rpc('clear_and_insert_exam_courses', {
        courses_data: validatedCourses
      });

    if (error) {
      console.error("Database error details:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw new Error(`Database error: ${error.message}`);
    }

    console.log("Successfully added exam courses:", data);
    return data;
  } catch (error) {
    console.error("Exam courses upload error:", error);
    throw error;
  }
};

// Function to delete all exam courses
export const deleteAllExamCourses = async (): Promise<void> => {
  const { error } = await supabase
    .from('exam_courses')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (error) {
    console.error('Error deleting all exam courses:', error);
    throw error;
  }
};

// Function to fetch admin exam schedule
export const fetchAdminExamSchedule = async (): Promise<any[]> => {
    const { data, error } = await supabase
        .from('exam_schedules')
        .select('*');

    if (error) {
        console.error('Error fetching exam schedule:', error);
        throw error;
    }

    return data || [];
};

// Function to publish exam schedule
export const publishExamSchedule = async (isPublished: boolean): Promise<void> => {
  const { error } = await supabase
    .from('exam_schedules')
    .update({ published: isPublished })
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (error) {
    console.error('Error publishing exam schedule:', error);
    throw error;
  }
};

// Function to add multiple courses
export const addCourses = async (courses: Omit<Course, 'id'>[]): Promise<Course[]> => {
  const dbCourses = courses.map(transformFrontendCourseToDb);
  
  const { data, error } = await supabase
    .from('courses')
    .insert(dbCourses)
    .select();

  if (error) {
    console.error('Error adding courses:', error);
    throw error;
  }

  return (data || []).map(transformDbCourseToFrontend);
};

// Function to delete all courses
export const deleteAllCourses = async (): Promise<void> => {
  const { error } = await supabase
    .from('courses')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (error) {
    console.error('Error deleting all courses:', error);
    throw error;
  }
};

// Function to save general schedule
export const saveSchedule = async (schedule: ScheduleItem[], isPublished: boolean = false): Promise<void> => {
  const scheduleData = schedule.map(item => ({
    course_id: item.id,
    venue_id: item.venue.id,
    day: item.timeSlot.day,
    start_time: item.timeSlot.startTime,
    end_time: item.timeSlot.endTime,
  }));

  const { error } = await supabase
    .rpc('clear_and_insert_schedule', {
      schedule_data: scheduleData,
      should_publish: isPublished
    });

  if (error) {
    console.error('Error saving schedule:', error);
    throw error;
  }
};

// Function to fetch admin schedule
export const fetchAdminSchedule = async (): Promise<any[]> => {
  const { data, error } = await supabase
    .from('schedules')
    .select('*');

  if (error) {
    console.error('Error fetching admin schedule:', error);
    throw error;
  }

  return data || [];
};

// Function to clear schedule
export const clearSchedule = async (): Promise<void> => {
  const { error } = await supabase
    .from('schedules')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (error) {
    console.error('Error clearing schedule:', error);
    throw error;
  }
};

// Function to publish schedule
export const publishSchedule = async (isPublished: boolean): Promise<void> => {
  const { error } = await supabase
    .rpc('publish_schedule', { should_publish: isPublished });

  if (error) {
    console.error('Error publishing schedule:', error);
    throw error;
  }
};

// Function to save exam schedule
export const saveExamSchedule = async (schedule: ExamScheduleItem[], isPublished: boolean = false): Promise<void> => {
  const scheduleData = schedule.map(item => ({
    exam_course_id: item.id,
    day: item.day,
    start_time: item.startTime,
    end_time: item.endTime,
    session_name: item.sessionName,
    venue_name: item.venueName,
  }));

  const { error } = await supabase
    .rpc('clear_and_insert_exam_schedule', {
      schedule_data: scheduleData,
      should_publish: isPublished
    });

  if (error) {
    console.error('Error saving exam schedule:', error);
    throw error;
  }
};

// Function to clear exam schedule
export const clearExamSchedule = async (): Promise<void> => {
  const { error } = await supabase
    .from('exam_schedules')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (error) {
    console.error('Error clearing exam schedule:', error);
    throw error;
  }
};

// Function to fetch exam schedule (for students)
export const fetchExamSchedule = async (): Promise<any[]> => {
  const { data, error } = await supabase
    .from('exam_schedules')
    .select('*')
    .eq('published', true);

  if (error) {
    console.error('Error fetching exam schedule:', error);
    throw error;
  }

  return data || [];
};

// Function to fetch user
export const fetchUser = async (userId: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, role')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }

  return data ? {
    id: data.id,
    email: data.email,
    role: data.role === 'admin' || data.role === 'student' ? data.role : 'student',
  } : null;
};
