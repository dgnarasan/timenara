
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { fetchExamCourses, fetchAdminExamSchedule } from "@/lib/db";
import { CalendarDays, BookOpen, Users } from "lucide-react";
import ExamCourseManagement from "@/components/admin/exam/ExamCourseManagement";
import ExamScheduleGenerator from "@/components/admin/exam/ExamScheduleGenerator";
import ExamSchedulePreview from "@/components/admin/exam/ExamSchedulePreview";

const ExamTimetableGenerator = () => {
  // Fetch exam courses
  const { data: examCourses = [] } = useQuery({
    queryKey: ['exam-courses'],
    queryFn: fetchExamCourses,
  });

  // Fetch exam schedule
  const { data: examSchedule = [] } = useQuery({
    queryKey: ['admin-exam-schedule'],
    queryFn: fetchAdminExamSchedule,
  });

  const totalStudents = examCourses.reduce((sum, course) => sum + (course.studentCount || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 py-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <CalendarDays className="h-8 w-8 text-gray-700" />
            <h1 className="text-4xl font-bold tracking-tight text-gray-900">
              Exam Timetable Generator
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Manage exam courses and generate optimized exam schedules with intelligent conflict detection and resource allocation
          </p>
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-600">
            📝 Draft
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Courses</p>
                  <p className="text-3xl font-bold text-gray-900">{examCourses.length}</p>
                  <p className="text-sm text-gray-500">Exam courses registered</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-full">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Students</p>
                  <p className="text-3xl font-bold text-gray-900">{totalStudents.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">Students taking exams</p>
                </div>
                <div className="p-3 bg-green-50 rounded-full">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Scheduled Exams</p>
                  <p className="text-3xl font-bold text-gray-900">{examSchedule.length}</p>
                  <p className="text-sm text-gray-500">No schedule generated</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-full">
                  <CalendarDays className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Course Management Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <BookOpen className="h-6 w-6 text-gray-700" />
            <h2 className="text-2xl font-semibold text-gray-900">Course Management</h2>
          </div>
          <ExamCourseManagement />
        </div>

        {/* Generate Schedule Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <CalendarDays className="h-6 w-6 text-gray-700" />
            <h2 className="text-2xl font-semibold text-gray-900">Generate Schedule</h2>
          </div>
          <ExamScheduleGenerator onScheduleGenerated={() => {}} />
        </div>

        {/* Schedule Preview Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <CalendarDays className="h-6 w-6 text-gray-700" />
            <h2 className="text-2xl font-semibold text-gray-900">Schedule Preview</h2>
          </div>
          <ExamSchedulePreview />
        </div>
      </div>
    </div>
  );
};

export default ExamTimetableGenerator;
