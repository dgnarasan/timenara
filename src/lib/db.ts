
import { supabase } from "@/integrations/supabase/client";
import { Course, DBCourse, Venue, DBVenue } from "./types";

export const mapDBCourseToClient = (dbCourse: DBCourse): Course => ({
  id: dbCourse.id,
  code: dbCourse.code,
  name: dbCourse.name,
  lecturer: dbCourse.lecturer,
  classSize: dbCourse.class_size,
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
  return (data as DBCourse[]).map(mapDBCourseToClient);
};

export const addCourse = async (course: Omit<Course, "id">): Promise<Course> => {
  const { data, error } = await supabase
    .from('courses')
    .insert({
      code: course.code,
      name: course.name,
      lecturer: course.lecturer,
      class_size: course.classSize,
      preferred_slots: course.preferredSlots || null,
      constraints: course.constraints || null,
    })
    .select()
    .single();

  if (error) throw error;
  return mapDBCourseToClient(data as DBCourse);
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
        preferred_slots: course.preferredSlots || null,
        constraints: course.constraints || null,
      }))
    )
    .select();

  if (error) throw error;
  return (data as DBCourse[]).map(mapDBCourseToClient);
};
