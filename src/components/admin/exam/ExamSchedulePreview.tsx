
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAdminExamSchedule, publishExamSchedule, clearExamSchedule } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import { Eye, Calendar } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExamScheduleItem } from "@/lib/types";
import ExamScheduleSummary from "./preview/ExamScheduleSummary";
import ExamScheduleActions from "./preview/ExamScheduleActions";
import ExamScheduleTable from "./preview/ExamScheduleTable";
import ExamScheduleDetailed from "./preview/ExamScheduleDetailed";

const ExamSchedulePreview = () => {
  const [viewMode, setViewMode] = useState<"simple" | "detailed">("simple");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch exam schedule with proper typing
  const { data: examScheduleData, isLoading } = useQuery({
    queryKey: ['admin-exam-schedule'],
    queryFn: fetchAdminExamSchedule,
  });

  // Ensure examSchedule is properly typed as an array with safety checks
  const examSchedule: ExamScheduleItem[] = Array.isArray(examScheduleData) ? examScheduleData : [];

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

  const isPublished = examSchedule.length > 0; // Simplified check

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
      {/* Schedule Summary Header */}
      <ExamScheduleSummary 
        examSchedule={examSchedule}
        isPublished={isPublished}
      />

      {/* Action Buttons */}
      <Card>
        <CardContent className="p-6">
          <ExamScheduleActions
            examSchedule={examSchedule}
            isPublished={isPublished}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onPublish={handlePublish}
            onUnpublish={handleUnpublish}
            onClear={handleClear}
            isPublishPending={publishMutation.isPending}
            isClearPending={clearMutation.isPending}
          />
        </CardContent>
      </Card>

      {/* Schedule View */}
      <Card>
        <CardHeader>
          <CardTitle>Exam Schedule</CardTitle>
          <CardDescription>
            {viewMode === "simple" ? "Simplified schedule view" : "Detailed schedule with grouping"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {viewMode === "simple" ? (
            <ExamScheduleTable examSchedule={examSchedule} />
          ) : (
            <ExamScheduleDetailed examSchedule={examSchedule} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExamSchedulePreview;
