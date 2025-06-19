
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, Calendar } from "lucide-react";
import { ExamCourse, ExamScheduleItem } from "@/lib/types";

interface StatsCardsProps {
  examCourses: ExamCourse[];
  examSchedule: ExamScheduleItem[];
}

const StatsCards = ({ examCourses, examSchedule }: StatsCardsProps) => {
  const totalStudents = examCourses.reduce((sum, course) => sum + (course?.studentCount || 0), 0);

  // Calculate shared courses - with safety checks
  const courseCodeCounts: Record<string, number> = {};
  examCourses.forEach(course => {
    if (course?.courseCode) {
      courseCodeCounts[course.courseCode] = (courseCodeCounts[course.courseCode] || 0) + 1;
    }
  });
  const sharedCoursesCount = Object.values(courseCodeCounts).filter(count => count > 1).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card className="border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Total Courses</CardTitle>
          <BookOpen className="h-5 w-5 text-gray-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{examCourses.length}</div>
          <p className="text-xs text-gray-500 mt-1">
            Courses uploaded
          </p>
        </CardContent>
      </Card>

      <Card className="border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Total Students</CardTitle>
          <Users className="h-5 w-5 text-gray-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{totalStudents.toLocaleString()}</div>
          <p className="text-xs text-gray-500 mt-1">
            Students taking exams
          </p>
        </CardContent>
      </Card>

      <Card className="border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Shared Courses</CardTitle>
          <div className="h-5 w-5 text-gray-500">🔗</div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{sharedCoursesCount}</div>
          <p className="text-xs text-gray-500 mt-1">
            Cross-department courses
          </p>
        </CardContent>
      </Card>

      <Card className="border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Scheduled Exams</CardTitle>
          <Calendar className="h-5 w-5 text-gray-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{examSchedule.length}</div>
          <p className="text-xs text-gray-500 mt-1">
            {examSchedule.length > 0 ? "Exams in timetable" : "No schedule generated"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsCards;
