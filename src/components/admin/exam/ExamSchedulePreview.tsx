
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAdminExamSchedule, publishExamSchedule, clearExamSchedule } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import { Eye, Download, Trash2, Play, Square, Calendar } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ExamTimetableView from "@/components/student/ExamTimetableView";

const ExamSchedulePreview = () => {
  const [viewMode, setViewMode] = useState<"timetable" | "list">("timetable");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch exam schedule
  const { data: examSchedule = [], isLoading } = useQuery({
    queryKey: ['admin-exam-schedule'],
    queryFn: fetchAdminExamSchedule,
  });

  // Publish/unpublish mutation
  const publishMutation = useMutation({
    mutationFn: publishExamSchedule,
    onSuccess: (_, published) => {
      queryClient.invalidateQueries({ queryKey: ['admin-exam-schedule'] });
      toast({
        title: "Success",
        description: `Exam schedule ${published ? 'published' : 'unpublished'} successfully.`,
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

  // Clear schedule mutation
  const clearMutation = useMutation({
    mutationFn: clearExamSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-exam-schedule'] });
      toast({
        title: "Schedule Cleared",
        description: "Exam schedule has been cleared successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to clear exam schedule. Please try again.",
        variant: "destructive",
      });
      console.error("Clear error:", error);
    },
  });

  const handlePublish = () => {
    publishMutation.mutate(true);
  };

  const handleUnpublish = () => {
    publishMutation.mutate(false);
  };

  const handleClear = () => {
    if (window.confirm("Are you sure you want to clear the entire exam schedule? This action cannot be undone.")) {
      clearMutation.mutate();
    }
  };

  const handleExportPDF = () => {
    // Simple export functionality - in production, this would generate a proper PDF
    const scheduleData = examSchedule.map(item => ({
      'Course Code': item.courseCode,
      'Course Title': item.courseTitle,
      'Date': new Date(item.day).toLocaleDateString(),
      'Time': `${item.startTime} - ${item.endTime}`,
      'Session': item.sessionName,
      'Venue': item.venueName || 'TBD',
      'Department': item.department,
      'Students': item.studentCount,
    }));

    const csvContent = "data:text/csv;charset=utf-8," + 
      Object.keys(scheduleData[0] || {}).join(",") + "\n" +
      scheduleData.map(row => Object.values(row).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `exam_schedule_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Successful",
      description: "Exam schedule has been exported to CSV.",
    });
  };

  // Check if any exams are published
  const isPublished = examSchedule.length > 0; // For this demo, we'll consider any schedule as potentially published
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading exam schedule...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (examSchedule.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Schedule Preview
          </CardTitle>
          <CardDescription>
            Preview and manage the generated exam schedule
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Calendar className="h-4 w-4" />
            <AlertDescription>
              No exam schedule generated yet. Go to the "Generate Schedule" tab to create one.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Schedule Preview
              </CardTitle>
              <CardDescription>
                {examSchedule.length} exams scheduled
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant={isPublished ? "default" : "secondary"}>
                {isPublished ? "Published" : "Draft"}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === "timetable" ? "list" : "timetable")}
              >
                <Calendar className="h-4 w-4 mr-2" />
                {viewMode === "timetable" ? "List View" : "Timetable View"}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>

            <div className="flex items-center gap-2">
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
              
              <Button
                variant="destructive"
                size="sm"
                onClick={handleClear}
                disabled={clearMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Schedule
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedule View */}
      <ExamTimetableView schedule={examSchedule} viewMode={viewMode} />
    </div>
  );
};

export default ExamSchedulePreview;
