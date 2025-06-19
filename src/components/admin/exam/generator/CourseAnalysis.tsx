
import { ExamCourse } from "@/lib/types";

interface CourseAnalysisProps {
  examCourses: ExamCourse[];
}

const CourseAnalysis = ({ examCourses }: CourseAnalysisProps) => {
  // Calculate shared courses with safety checks
  const courseCodeCounts: Record<string, number> = {};
  examCourses.forEach(course => {
    if (course?.courseCode) {
      courseCodeCounts[course.courseCode] = (courseCodeCounts[course.courseCode] || 0) + 1;
    }
  });
  const sharedCoursesCount = Object.values(courseCodeCounts).filter(count => count > 1).length;
  const uniqueCoursesCount = Object.keys(courseCodeCounts).length;

  return (
    <div className="bg-blue-50 p-4 rounded-lg">
      <h4 className="font-medium mb-2">Course Analysis</h4>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="font-medium">{examCourses.length}</span> Total Courses
        </div>
        <div>
          <span className="font-medium">{uniqueCoursesCount}</span> Unique Courses
        </div>
        <div>
          <span className="font-medium">{sharedCoursesCount}</span> Shared Courses
        </div>
        <div>
          <span className="font-medium">{examCourses.reduce((sum, c) => sum + (c?.studentCount || 0), 0).toLocaleString()}</span> Total Students
        </div>
      </div>
    </div>
  );
};

export default CourseAnalysis;
