
import { supabase } from "@/integrations/supabase/client";
import { Course, DBCourse, Venue, DBVenue, TimeSlot, Department } from "./types";
import { PostgrestResponse } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";

// Type to match the Supabase database schema
type SupabaseDepartment = Database["public"]["Enums"]["department"];

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

export const fetchCourses = async (): Promise<Course[]> => {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data as unknown as DBCourse[]).map(mapDBCourseToClient);
};

export const addCourse = async (course: Omit<Course, "id">): Promise<Course> => {
  // Cast department to the type expected by Supabase
  const { data, error } = await supabase
    .from('courses')
    .insert({
      code: course.code,
      name: course.name,
      lecturer: course.lecturer,
      class_size: course.classSize,
      department: course.department as unknown as SupabaseDepartment,
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
  // Cast department to the type expected by Supabase for each course
  const { data, error } = await supabase
    .from('courses')
    .insert(
      courses.map(course => ({
        code: course.code,
        name: course.name,
        lecturer: course.lecturer,
        class_size: course.classSize,
        department: course.department as unknown as SupabaseDepartment,
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
    .neq('id', 'none'); // Delete all rows

  if (error) throw error;
};
