import { createClient } from '@supabase/supabase-js';
import { Course, ExamCourse, Room, ScheduleItem, User } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
export const supabase = createClient(supabaseUrl, supabaseKey);

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

  return courses || [];
};

// Function to add a new course
export const addCourse = async (course: Omit<Course, 'id'>): Promise<Course> => {
  const { data, error } = await supabase
    .from('courses')
    .insert([course])
    .select()
    .single();

  if (error) {
    console.error('Error adding course:', error);
    throw error;
  }

  return data;
};

// Function to update an existing course
export const updateCourse = async (id: number, updates: Partial<Omit<Course, 'id'>>): Promise<Course | null> => {
  const { data, error } = await supabase
    .from('courses')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating course:', error);
    throw error;
  }

  return data;
};

// Function to delete a course
export const deleteCourse = async (id: number): Promise<void> => {
  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting course:', error);
    throw error;
  }
};

// Function to fetch rooms
export const fetchRooms = async (): Promise<Room[]> => {
  const { data: rooms, error } = await supabase
    .from('rooms')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching rooms:', error);
    throw error;
  }

  return rooms || [];
};

// Function to add a new room
export const addRoom = async (room: Omit<Room, 'id'>): Promise<Room> => {
  const { data, error } = await supabase
    .from('rooms')
    .insert([room])
    .select()
    .single();

  if (error) {
    console.error('Error adding room:', error);
    throw error;
  }

  return data;
};

// Function to update an existing room
export const updateRoom = async (id: number, updates: Partial<Omit<Room, 'id'>>): Promise<Room | null> => {
  const { data, error } = await supabase
    .from('rooms')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating room:', error);
    throw error;
  }

  return data;
};

// Function to delete a room
export const deleteRoom = async (id: number): Promise<void> => {
  const { error } = await supabase
    .from('rooms')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting room:', error);
    throw error;
  }
};

// Function to fetch schedule
export const fetchSchedule = async (): Promise<ScheduleItem[]> => {
  const { data: schedule, error } = await supabase
    .from('schedule')
    .select('*, course:course_id(*), room:room_id(*)')
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching schedule:', error);
    throw error;
  }

  return schedule || [];
};

// Function to add a schedule item
export const addScheduleItem = async (item: Omit<ScheduleItem, 'id' | 'course' | 'room'>): Promise<ScheduleItem> => {
  const { data, error } = await supabase
    .from('schedule')
    .insert([item])
    .select('*, course:course_id(*), room:room_id(*)')
    .single();

  if (error) {
    console.error('Error adding schedule item:', error);
    throw error;
  }

  return data;
};

// Function to update a schedule item
export const updateScheduleItem = async (id: number, updates: Partial<Omit<ScheduleItem, 'id' | 'course' | 'room'>>): Promise<ScheduleItem | null> => {
  const { data, error } = await supabase
    .from('schedule')
    .update(updates)
    .eq('id', id)
    .select('*, course:course_id(*), room:room_id(*)')
    .single();

  if (error) {
    console.error('Error updating schedule item:', error);
    throw error;
  }

  return data;
};

// Function to delete a schedule item
export const deleteScheduleItem = async (id: number): Promise<void> => {
  const { error } = await supabase
    .from('schedule')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting schedule item:', error);
  }
};

// Function to fetch users
export const fetchUsers = async (): Promise<User[]> => {
  const { data: users, error } = await supabase
    .from('users')
    .select('*');

  if (error) {
    console.error('Error fetching users:', error);
    throw error;
  }

  return users || [];
};

// Function to update user role
export const updateUserRole = async (id: string, role: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('users')
    .update({ role })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating user role:', error);
    throw error;
  }

  return data;
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

  return exam_courses || [];
};

// Function to add exam courses
export const addExamCourses = async (courses: Omit<ExamCourse, "id">[]) => {
  console.log("Adding exam courses to database:", courses);
  
  // Validate the course data before sending to the backend
  const validatedCourses = courses.map(course => ({
    course_code: course.courseCode,
    course_title: course.courseTitle,
    department: course.department,
    college: course.college,
    level: course.level,
    student_count: course.studentCount,
  }));
  
  console.log("Validated courses for database:", validatedCourses);
  
  const { data, error } = await supabase
    .rpc('clear_and_insert_exam_courses', {
      courses_data: validatedCourses
    });

  if (error) {
    console.error("Database error:", error);
    throw error;
  }

  return data;
};

// Function to delete all exam courses
export const deleteAllExamCourses = async (): Promise<void> => {
  const { error } = await supabase
    .from('exam_courses')
    .delete()
    .neq('id', 0); // This will delete all rows

  if (error) {
    console.error('Error deleting all exam courses:', error);
    throw error;
  }
};

// Function to fetch admin exam schedule
export const fetchAdminExamSchedule = async (): Promise<any[]> => {
    const { data, error } = await supabase
        .from('exam_schedule')
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
    .from('exam_schedule')
    .update({ is_published: isPublished })
    .neq('id', 0); // Update all rows

  if (error) {
    console.error('Error publishing exam schedule:', error);
    throw error;
  }
};
