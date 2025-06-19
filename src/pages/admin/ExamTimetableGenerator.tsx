
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchExamCourses, fetchAdminExamSchedule, publishExamSchedule } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import { FileText, Calendar, Settings, Users, Play, Square, Eye, BookOpen, CalendarDays, CheckCircle, ArrowRight } from "lucide-react";
import ExamCourseManagement from "@/components/admin/exam/ExamCourseManagement";
import ExamScheduleGenerator from "@/components/admin/exam/ExamScheduleGenerator";
import ExamSchedulePreview from "@/components/admin/exam/ExamSchedulePreview";

const ExamTimetableGenerator = () => {
  const [activeTab, setActiveTab] = useState("courses");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch exam courses
  const { data: examCourses = [], isLoading: isLoadingCourses } = useQuery({
    queryKey: ['exam-courses'],
    queryFn: fetchExamCourses,
  });

  // Fetch exam schedule
  const { data: examSchedule = [], isLoading: isLoadingSchedule } = useQuery({
    queryKey: ['admin-exam-schedule'],
    queryFn: fetchAdminExamSchedule,
  });

  // Publish/unpublish mutation
  const publishMutation = useMutation({
    mutationFn: publishExamSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-exam-schedule'] });
      toast({
        title: "Success",
        description: "Exam schedule publication status updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update publication status. Please try again.",
        variant: "destructive",
      });
      console.error("Publish error:", error);
    },
  });

  const handlePublish = () => {
    publishMutation.mutate(true);
  };

  const handleUnpublish = () => {
    publishMutation.mutate(false);
  };

  const isPublished = examSchedule.length > 0;
  const totalStudents = examCourses.reduce((sum, course) => sum + course.studentCount, 0);

  // Calculate shared courses
  const courseCodeCounts: Record<string, number> = {};
  examCourses.forEach(course => {
    courseCodeCounts[course.courseCode] = (courseCodeCounts[course.courseCode] || 0) + 1;
  });
  const sharedCoursesCount = Object.values(courseCodeCounts).filter(count => count > 1).length;

  // Workflow step determination
  const getWorkflowStep = () => {
    if (examCourses.length === 0) return 1;
    if (examSchedule.length === 0) return 2;
    return 3;
  };

  const currentStep = getWorkflowStep();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 py-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-white border rounded-xl shadow-sm">
              <CalendarDays className="h-8 w-8 text-gray-700" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-gray-900">
                Exam Timetable Generator
              </h1>
            </div>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Generate and manage exam schedules with intelligent conflict detection and resource allocation
          </p>
        </div>

        {/* Workflow Progress */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📋 3-Step Workflow Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-green-600' : 'text-gray-400'}`}>
                {currentStep >= 1 ? <CheckCircle className="h-5 w-5" /> : <div className="h-5 w-5 rounded-full border-2 border-current" />}
                <span className="font-medium">Step 1: Upload & Preview</span>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400" />
              <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-green-600' : 'text-gray-400'}`}>
                {currentStep >= 2 ? <CheckCircle className="h-5 w-5" /> : <div className="h-5 w-5 rounded-full border-2 border-current" />}
                <span className="font-medium">Step 2: Configure Parameters</span>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400" />
              <div className={`flex items-center gap-2 ${currentStep >= 3 ? 'text-green-600' : 'text-gray-400'}`}>
                {currentStep >= 3 ? <CheckCircle className="h-5 w-5" /> : <div className="h-5 w-5 rounded-full border-2 border-current" />}
                <span className="font-medium">Step 3: Generate & Publish</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
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

        {/* Main Content */}
        <Card className="border shadow-sm">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="p-6 pb-0">
              <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-lg">
                <TabsTrigger 
                  value="courses" 
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
                >
                  <FileText className="h-4 w-4" />
                  Step 1: Upload & Preview
                </TabsTrigger>
                <TabsTrigger 
                  value="generate" 
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
                  disabled={examCourses.length === 0}
                >
                  <Settings className="h-4 w-4" />
                  Step 2: Configure & Generate
                </TabsTrigger>
                <TabsTrigger 
                  value="preview" 
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
                  disabled={examSchedule.length === 0}
                >
                  <Eye className="h-4 w-4" />
                  Step 3: Review & Publish
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6 pt-0">
              <TabsContent value="courses" className="space-y-4 mt-0">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">Step 1: Upload and Preview Courses</h3>
                  <p className="text-muted-foreground">
                    Upload your exam courses and review the parsed data grouped by college and level.
                  </p>
                </div>
                <ExamCourseManagement />
                {examCourses.length > 0 && (
                  <div className="flex justify-end">
                    <Button onClick={() => setActiveTab("generate")} className="gap-2">
                      Proceed to Configuration <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="generate" className="space-y-4 mt-0">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">Step 2: Configure Generation Parameters</h3>
                  <p className="text-muted-foreground">
                    Set exam dates, duration, and constraints before generating the timetable.
                  </p>
                </div>
                <ExamScheduleGenerator onScheduleGenerated={() => setActiveTab("preview")} />
              </TabsContent>

              <TabsContent value="preview" className="space-y-4 mt-0">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">Step 3: Review and Publish Schedule</h3>
                  <p className="text-muted-foreground">
                    Review the generated exam schedule and publish it for students to view.
                  </p>
                </div>
                <ExamSchedulePreview />
              </TabsContent>
            </div>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default ExamTimetableGenerator;
