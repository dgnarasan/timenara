
import { Course } from "@/lib/types";

export const isFoundationalCourse = (courseCode: string): boolean => {
  return /^[A-Z]{2}10[0-9]/.test(courseCode);
};

export const getActiveInstructors = (courses: Course[]): number => {
  return new Set(courses.map(course => course.lecturer)).size;
};

export const getAcademicLevels = (courses: Course[]): number => {
  // Extract level numbers from course codes (e.g., CS101 -> 1, CS201 -> 2)
  const levelSet = new Set(
    courses.map(course => {
      // Find the first number in the course code
      const match = course.code.match(/\d/);
      return match ? parseInt(match[0]) : null;
    }).filter((level): level is number => 
      // Only keep valid levels (1-4 for standard undergraduate courses)
      level !== null && level >= 1 && level <= 4
    )
  );
  
  return levelSet.size;
};

export const getStandardAcademicLevels = (): string[] => {
  return ["100 Level", "200 Level", "300 Level", "400 Level"];
};
