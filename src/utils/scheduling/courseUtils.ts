
import { Course } from "@/lib/types";

export const isFoundationalCourse = (courseCode: string): boolean => {
  return /^[A-Z]{2}10[0-9]/.test(courseCode);
};

export const getActiveInstructors = (courses: Course[]): number => {
  return new Set(courses.map(course => course.lecturer)).size;
};

export const getAcademicLevels = (courses: Course[]): number => {
  return new Set(courses.map(course => course.code.substring(0, 4))).size;
};
