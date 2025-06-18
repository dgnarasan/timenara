
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, BookOpen, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchSchedule, fetchExamCourses } from "@/lib/db";
import Timetable from "../Timetable";
import ExamTimetableView from "./ExamTimetableView";

const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState<"regular" | "exam">("regular");

  // Fetch regular schedule
  const { data: schedule = [], isLoading: scheduleLoading } = useQuery({
    queryKey: ['schedule'],
    queryFn: fetchSchedule,
  });

  // Fetch exam courses for stats
  const { data: examCourses = [], isLoading: examLoading } = useQuery({
    queryKey: ['exam-courses'],
    queryFn: fetchExamCourses,
  });

  const totalCourses = schedule.length;
  const totalExamCourses = examCourses.length;
  const uniqueDepartments = new Set(schedule.map(item => item.department)).size;
  const uniqueExamDepartments = new Set(examCourses.map(course => course.department)).size;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-primary">Student Dashboard</h1>
        <p className="text-muted-foreground">
          View your class schedules and examination timetables
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Regular Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalCourses}</div>
            <p className="text-xs text-muted-foreground">scheduled courses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exam Courses</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalExamCourses}</div>
            <p className="text-xs text-muted-foreground">total courses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{uniqueDepartments}</div>
            <p className="text-xs text-muted-foreground">in regular schedule</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exam Departments</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{uniqueExamDepartments}</div>
            <p className="text-xs text-muted-foreground">in exam courses</p>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        <Button
          variant={activeTab === "regular" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("regular")}
          className="flex items-center gap-2"
        >
          <BookOpen className="h-4 w-4" />
          Regular Classes
        </Button>
        <Button
          variant={activeTab === "exam" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("exam")}
          className="flex items-center gap-2"
        >
          <Calendar className="h-4 w-4" />
          Examinations
        </Button>
      </div>

      {/* Content based on active tab */}
      {activeTab === "regular" ? (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Regular Class Timetable</CardTitle>
              <CardDescription>
                Your weekly class schedule with all course information
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scheduleLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <Timetable schedule={schedule} />
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <ExamTimetableView />
      )}
    </div>
  );
};

export default StudentDashboard;
