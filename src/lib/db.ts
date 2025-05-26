
import { supabase } from "@/integrations/supabase/client";
import { Course, DBCourse, Venue, DBVenue, TimeSlot, Department } from "./types";
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
  group: dbCourse.group,
  sharedDepartments: dbCourse.shared_departments,
  venue: dbCourse.venue,
  preferredDays: dbCourse.preferred_days,
  preferredTimeSlot: dbCourse.preferred_time_slot,
});

export const mapDBVenueToClient = (dbVenue: DBVenue): Venue => ({
  id: dbVenue.id,
  name: dbVenue.name,
  capacity: dbVenue.capacity,
  availability: dbVenue.availability,
});

export const fetchCourses = async (): Promise<Course[]> => {
  console.log("Fetching courses from database...");
  
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error("Error fetching courses:", error);
    throw error;
  }
  
  console.log("Fetched courses from DB:", data?.length || 0);
  return (data as unknown as DBCourse[]).map(mapDBCourseToClient);
};

export const addCourse = async (course: Omit<Course, "id">): Promise<Course> => {
  console.log("Adding single course to database:", course.code);
  
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
      group: course.group || null,
      shared_departments: course.sharedDepartments || null,
      venue: course.venue || null,
      preferred_days: course.preferredDays || null,
      preferred_time_slot: course.preferredTimeSlot || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error adding course:", error);
    throw error;
  }
  
  const dbCourse = data as unknown as DBCourse;
  if (dbCourse.preferred_slots) {
    dbCourse.preferred_slots = JSON.parse(dbCourse.preferred_slots as unknown as string);
  }
  console.log("Successfully added course:", dbCourse.code);
  return mapDBCourseToClient(dbCourse);
};

export const addCourses = async (courses: Omit<Course, "id">[]): Promise<Course[]> => {
  console.log("Adding multiple courses to database:", courses.length);
  
  if (!courses || courses.length === 0) {
    throw new Error("No courses provided for insertion");
  }

  // Validate each course before insertion
  const validatedCourses = courses.map((course, index) => {
    if (!course.code || !course.name || !course.lecturer || !course.classSize || !course.department) {
      console.error(`Course ${index + 1} missing required fields:`, course);
      throw new Error(`Course ${index + 1} (${course.code || 'NO CODE'}) is missing required fields`);
    }

    const insertData = {
      code: course.code.trim(),
      name: course.name.trim(),
      lecturer: course.lecturer.trim(),
      class_size: Number(course.classSize),
      department: course.department,
      academic_level: course.academicLevel?.trim() || null,
      preferred_slots: course.preferredSlots ? JSON.stringify(course.preferredSlots) : null,
      constraints: course.constraints || null,
      group: course.group?.trim() || null,
      shared_departments: course.sharedDepartments || null,
      venue: course.venue?.trim() || null,
      preferred_days: course.preferredDays || null,
      preferred_time_slot: course.preferredTimeSlot?.trim() || null,
    };

    console.log(`Prepared course ${index + 1} for insertion:`, {
      code: insertData.code,
      name: insertData.name,
      lecturer: insertData.lecturer,
      class_size: insertData.class_size,
      department: insertData.department,
      academic_level: insertData.academic_level
    });

    return insertData;
  });

  console.log("Attempting to insert courses into database...");
  
  const { data, error } = await supabase
    .from('courses')
    .insert(validatedCourses)
    .select();

  if (error) {
    console.error("Database insertion error:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    throw new Error(`Database error: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error("No data returned from database insertion");
  }

  console.log("Successfully inserted courses, processing response...");
  
  const processedCourses = (data as unknown as DBCourse[]).map(course => {
    if (course.preferred_slots && typeof course.preferred_slots === 'string') {
      try {
        course.preferred_slots = JSON.parse(course.preferred_slots);
      } catch (parseError) {
        console.warn("Failed to parse preferred_slots for course:", course.code, parseError);
        course.preferred_slots = null;
      }
    }
    return mapDBCourseToClient(course);
  });

  console.log("Successfully processed", processedCourses.length, "courses");
  return processedCourses;
};

export const deleteCourse = async (courseId: string): Promise<void> => {
  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', courseId);

  if (error) {
    console.error('Delete course error:', error);
    throw new Error(`Failed to delete course: ${error.message}`);
  }
};

export const deleteAllCourses = async (): Promise<void> => {
  const { error } = await supabase
    .from('courses')
    .delete()
    .gte('created_at', '1970-01-01'); // Delete all rows using a condition that matches all

  if (error) {
    console.error('Delete all courses error:', error);
    throw new Error(`Failed to delete all courses: ${error.message}`);
  }
};
