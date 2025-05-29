
import { Course, Department } from "@/lib/types";

export interface CourseGroup {
  courseCode: string;
  departments: Department[];
  totalStudents: number;
  courses: Course[];
  isSharedCourse: boolean;
}

export const identifySharedCourses = (courses: Course[]): CourseGroup[] => {
  const courseGroups = new Map<string, CourseGroup>();

  courses.forEach(course => {
    const baseCode = extractBaseCourseCode(course.code);
    
    if (!courseGroups.has(baseCode)) {
      courseGroups.set(baseCode, {
        courseCode: baseCode,
        departments: [],
        totalStudents: 0,
        courses: [],
        isSharedCourse: false
      });
    }

    const group = courseGroups.get(baseCode)!;
    group.courses.push(course);
    group.totalStudents += course.classSize;
    
    if (!group.departments.includes(course.department)) {
      group.departments.push(course.department);
    }
    
    // Mark as shared if taught across multiple departments
    group.isSharedCourse = group.departments.length > 1;
  });

  return Array.from(courseGroups.values());
};

export const extractBaseCourseCode = (courseCode: string): string => {
  // Remove department prefix variations and extract core code
  // GST 101, GST101, GS101 -> GST101
  const match = courseCode.match(/([A-Z]{2,4})\s?(\d{3})/i);
  return match ? `${match[1]}${match[2]}`.toUpperCase() : courseCode;
};

export const getSharedCoursesList = (): string[] => {
  // Common shared courses across departments
  return [
    'GST101', 'GST102', 'GST103', 'GST201', 'GST202', 'GST301',
    'ENG101', 'ENG102', 'MTH101', 'MTH102', 'PHY101', 'CHM101',
    'BIO101', 'STA101', 'CSC101', 'ECO101', 'POL101'
  ];
};

export const shouldGroupCourses = (group: CourseGroup): boolean => {
  return group.isSharedCourse && 
         group.courses.length > 1 && 
         getSharedCoursesList().includes(group.courseCode);
};

export const calculateOptimalClassSize = (group: CourseGroup): number => {
  return Math.ceil(group.totalStudents / group.departments.length);
};
