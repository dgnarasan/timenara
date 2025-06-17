
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchExamCourses, fetchAdminExamSchedule, publishExamSchedule } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import { FileText, Calendar, Settings, Download, Upload, Play, Square, Eye } from "lucide-react";
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

  const publishedScheduleCount = examSchedule.filter(item => 
    examSchedule.some(s => s.courseCode === item.courseCode)
  ).length;

  const isPublished = examSchedule.length > 0 && examSchedule.some(item => 
    examSchedule.find(s => s.id === item.id)
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Exam Timetable Generator</h1>
          <p className="text-muted-foreground">
            Manage exam courses and generate optimized exam schedules
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={isPublished ? "default" : "secondary"}>
            {isPublished ? "Published" : "Draft"}
          </Badge>
          {examSchedule.length > 0 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={isPublished ? handleUnpublish : handlePublish}
                disabled={publishMutation.isPending}
              >
                {isPublished ? (
                  <>
                    <Square className="h-4 w-4 mr-2" />
                    Unpublish
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Publish
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{examCourses.length}</div>
            <p className="text-xs text-muted-foreground">
              Exam courses registered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled Exams</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{examSchedule.length}</div>
            <p className="text-xs text-muted-foreground">
              Exams in timetable
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {examCourses.reduce((sum, course) => sum + course.studentCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Students taking exams
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="courses" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Course Management
          </TabsTrigger>
          <TabsTrigger value="generate" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Generate Schedule
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Schedule Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-4">
          <ExamCourseManagement />
        </TabsContent>

        <TabsContent value="generate" className="space-y-4">
          <ExamScheduleGenerator onScheduleGenerated={() => setActiveTab("preview")} />
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <ExamSchedulePreview />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExamTimetableGenerator;
