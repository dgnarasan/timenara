
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchExamCourses, fetchAdminExamSchedule, publishExamSchedule } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import { FileText, Calendar, Settings, Users, Play, Square, Eye, BookOpen, CalendarDays } from "lucide-react";
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

  const isPublished = examSchedule.length > 0 && examSchedule.some(item => 
    examSchedule.find(s => s.id === item.id)
  );

  const totalCourseRegistrations = examCourses.reduce((sum, course) => sum + course.studentCount, 0);

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
            Manage exam courses and generate optimized exam schedules with intelligent conflict detection and resource allocation
          </p>
          
          {/* Publication Status */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <Badge 
              variant={isPublished ? "default" : "secondary"} 
              className="px-4 py-2 text-sm font-medium"
            >
              {isPublished ? "📅 Published" : "📝 Draft"}
            </Badge>
            {examSchedule.length > 0 && (
              <Button
                variant={isPublished ? "outline" : "default"}
                size="sm"
                onClick={isPublished ? handleUnpublish : handlePublish}
                disabled={publishMutation.isPending}
                className="transition-all duration-200"
              >
                {isPublished ? (
                  <>
                    <Square className="h-4 w-4 mr-2" />
                    Unpublish
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Publish Schedule
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Courses</CardTitle>
              <BookOpen className="h-5 w-5 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{examCourses.length}</div>
              <p className="text-xs text-gray-500 mt-1">
                Exam courses registered
              </p>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Course Registrations</CardTitle>
              <Users className="h-5 w-5 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{totalCourseRegistrations.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">
                Total course enrollments*
              </p>
              <p className="text-xs text-gray-400 mt-1">
                *Students may be counted multiple times
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
                  Course Management
                </TabsTrigger>
                <TabsTrigger 
                  value="generate" 
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
                >
                  <Settings className="h-4 w-4" />
                  Generate Schedule
                </TabsTrigger>
                <TabsTrigger 
                  value="preview" 
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
                >
                  <Eye className="h-4 w-4" />
                  Schedule Preview
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6 pt-0">
              <TabsContent value="courses" className="space-y-4 mt-0">
                <ExamCourseManagement />
              </TabsContent>

              <TabsContent value="generate" className="space-y-4 mt-0">
                <ExamScheduleGenerator onScheduleGenerated={() => setActiveTab("preview")} />
              </TabsContent>

              <TabsContent value="preview" className="space-y-4 mt-0">
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
