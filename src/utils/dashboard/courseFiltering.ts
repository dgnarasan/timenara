
import { Course, collegeStructure } from "@/lib/types";

export const filterCoursesByCollege = (
  courses: Course[], 
  userCollege: string | null,
  isValidCourse: (course: any) => course is Course
): Course[] => {
  try {
    const validCourses = courses.filter(isValidCourse);
    
    if (userCollege) {
      const collegeDepartments = collegeStructure.find(c => c.college === userCollege)?.departments || [];
      const filtered = validCourses.filter(course => collegeDepartments.includes(course.department));
      return filtered;
    } else {
      return validCourses;
    }
  } catch (error) {
    console.error('Dashboard: Error filtering courses:', error);
    return [];
  }
};

export const validateCourseForCollege = (
  course: Omit<Course, "id">,
  userCollege: string | null
): boolean => {
  if (userCollege) {
    const collegeDepartments = collegeStructure.find(c => c.college === userCollege)?.departments || [];
    return collegeDepartments.includes(course.department);
  }
  return true;
};
