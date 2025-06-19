
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAdminExamSchedule, publishExamSchedule, clearExamSchedule } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import { Eye, Download, Trash2, Play, Square, Calendar } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import CalebExamTimetableView from "./CalebExamTimetableView";

const ExamSchedulePreview = () => {
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

  // Check if any exams are published (simplified for demo)
  const isPublished = examSchedule.length > 0;
  
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

      {/* Schedule View - Using Caleb University Format */}
      <CalebExamTimetableView schedule={examSchedule} />
    </div>
  );
};

export default ExamSchedulePreview;
