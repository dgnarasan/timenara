
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAdminExamSchedule, publishExamSchedule, clearExamSchedule } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import { Eye, Download, Trash2, Play, Square, Calendar, CalendarDays, BookOpen, Users, Building } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExamScheduleItem } from "@/lib/types";

const ExamSchedulePreview = () => {
  const [viewMode, setViewMode] = useState<"simple" | "detailed">("simple");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch exam schedule with proper typing
  const { data: examScheduleData, isLoading } = useQuery({
    queryKey: ['admin-exam-schedule'],
    queryFn: fetchAdminExamSchedule,
  });

  // Ensure examSchedule is properly typed as an array
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

  const handleExportCSV = () => {
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

  // Calculate summary statistics
  const totalExamDays = new Set(examSchedule.map(item => item.day)).size;
  const totalVenues = new Set(examSchedule.map(item => item.venueName)).size;
  const totalStudents = examSchedule.reduce((sum, item) => sum + item.studentCount, 0);
  const isPublished = examSchedule.length > 0; // Simplified check

  // Group by date for display
  const scheduleByDate = examSchedule.reduce((acc, item) => {
    const date = item.day;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(item);
    return acc;
  }, {} as Record<string, ExamScheduleItem[]>);

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
      <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Published Schedule Summary
              </CardTitle>
              <CardDescription>
                Complete exam schedule overview
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant={isPublished ? "default" : "secondary"}>
                {isPublished ? "📅 Published" : "📝 Draft"}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Summary Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <CalendarDays className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-600">{totalExamDays}</div>
              <div className="text-sm text-blue-700">📅 Total Exam Days</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <BookOpen className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-600">{examSchedule.length}</div>
              <div className="text-sm text-green-700">📘 Courses Scheduled</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Building className="h-6 w-6 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-purple-600">{totalVenues}</div>
              <div className="text-sm text-purple-700">🏛 Venues Used</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
              <div className="text-2xl font-bold text-orange-600">{totalStudents.toLocaleString()}</div>
              <div className="text-sm text-orange-700">👨‍🎓 Total Students Writing</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === "simple" ? "detailed" : "simple")}
            >
              <Calendar className="h-4 w-4 mr-2" />
              {viewMode === "simple" ? "Detailed View" : "Simple View"}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>

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
        </CardContent>
      </Card>

      {/* Simple Schedule View */}
      <Card>
        <CardHeader>
          <CardTitle>Exam Schedule</CardTitle>
          <CardDescription>
            {viewMode === "simple" ? "Simplified schedule view" : "Detailed schedule with grouping"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {viewMode === "simple" ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Course Code</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Venue</TableHead>
                    <TableHead className="text-right">Students</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {examSchedule
                    .sort((a, b) => new Date(a.day).getTime() - new Date(b.day).getTime() || 
                                     a.startTime.localeCompare(b.startTime))
                    .map((item, index) => (
                    <TableRow key={item.id} className={index % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                      <TableCell className="font-medium">
                        {new Date(item.day).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{item.startTime} - {item.endTime}</div>
                          <div className="text-muted-foreground">{item.sessionName}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono font-semibold text-primary">
                        {item.courseCode}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.department}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.venueName}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {item.studentCount.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            // Detailed view grouped by date
            <div className="space-y-6">
              {Object.entries(scheduleByDate)
                .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
                .map(([date, items]) => (
                <Card key={date} className="border-l-4 border-l-primary">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">
                      {new Date(date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </CardTitle>
                    <CardDescription>
                      {items.length} exams scheduled • {items.reduce((sum, item) => sum + item.studentCount, 0).toLocaleString()} students
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3">
                      {items
                        .sort((a, b) => a.startTime.localeCompare(b.startTime))
                        .map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="text-sm font-medium">
                              {item.startTime} - {item.endTime}
                            </div>
                            <div className="font-mono font-semibold text-primary">
                              {item.courseCode}
                            </div>
                            <div className="text-muted-foreground">
                              {item.department}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{item.venueName}</Badge>
                            <Badge variant="secondary">
                              {item.studentCount} students
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExamSchedulePreview;
