
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchExamCourses, saveExamSchedule } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import { Settings, Play, Calendar, Clock, AlertCircle, CheckCircle } from "lucide-react";
import { ExamScheduleItem } from "@/lib/types";

interface ExamScheduleGeneratorProps {
  onScheduleGenerated: () => void;
}

const ExamScheduleGenerator = ({ onScheduleGenerated }: ExamScheduleGeneratorProps) => {
  const [config, setConfig] = useState({
    startDate: "",
    endDate: "",
    sessionDuration: "3", // hours
    breakBetweenSessions: "1", // hours
    maxExamsPerDay: "3",
    preferredStartTime: "08:00",
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch exam courses
  const { data: examCourses = [], isLoading } = useQuery({
    queryKey: ['exam-courses'],
    queryFn: fetchExamCourses,
  });

  // Save schedule mutation
  const saveScheduleMutation = useMutation({
    mutationFn: (schedule: ExamScheduleItem[]) => saveExamSchedule(schedule, false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-exam-schedule'] });
      toast({
        title: "Schedule Generated",
        description: "Exam schedule has been generated successfully.",
      });
      onScheduleGenerated();
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: "Failed to generate exam schedule. Please try again.",
        variant: "destructive",
      });
      console.error("Generation error:", error);
    },
  });

  const generateSchedule = async () => {
    if (!config.startDate || !config.endDate) {
      toast({
        title: "Invalid Configuration",
        description: "Please select both start and end dates.",
        variant: "destructive",
      });
      return;
    }

    if (examCourses.length === 0) {
      toast({
        title: "No Courses",
        description: "Please upload exam courses before generating schedule.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Simple scheduling algorithm
      const schedule: ExamScheduleItem[] = [];
      const sessions = ['Morning', 'Midday', 'Afternoon'] as const;
      const startDate = new Date(config.startDate);
      const endDate = new Date(config.endDate);
      
      let currentDate = new Date(startDate);
      let courseIndex = 0;
      
      while (currentDate <= endDate && courseIndex < examCourses.length) {
        // Skip weekends for now
        if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
          currentDate.setDate(currentDate.getDate() + 1);
          continue;
        }

        for (let sessionIndex = 0; sessionIndex < Math.min(parseInt(config.maxExamsPerDay), sessions.length); sessionIndex++) {
          if (courseIndex >= examCourses.length) break;

          const course = examCourses[courseIndex];
          const session = sessions[sessionIndex];
          
          // Calculate session times
          let startTime: string;
          let endTime: string;
          
          const sessionDuration = parseInt(config.sessionDuration);
          const breakTime = parseInt(config.breakBetweenSessions);
          
          switch (session) {
            case 'Morning':
              startTime = config.preferredStartTime;
              break;
            case 'Midday':
              const morningStart = new Date(`2000-01-01T${config.preferredStartTime}`);
              const middayStart = new Date(morningStart.getTime() + (sessionDuration + breakTime) * 60 * 60 * 1000);
              startTime = middayStart.toTimeString().slice(0, 5);
              break;
            case 'Afternoon':
              const morningStartTime = new Date(`2000-01-01T${config.preferredStartTime}`);
              const afternoonStart = new Date(morningStartTime.getTime() + 2 * (sessionDuration + breakTime) * 60 * 60 * 1000);
              startTime = afternoonStart.toTimeString().slice(0, 5);
              break;
          }
          
          const startDateTime = new Date(`2000-01-01T${startTime}`);
          const endDateTime = new Date(startDateTime.getTime() + sessionDuration * 60 * 60 * 1000);
          endTime = endDateTime.toTimeString().slice(0, 5);

          schedule.push({
            ...course,
            day: currentDate.toISOString().split('T')[0],
            startTime,
            endTime,
            sessionName: session,
            venueName: `Exam Hall ${Math.floor(courseIndex / 10) + 1}`, // Simple venue assignment
          });

          courseIndex++;
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      if (courseIndex < examCourses.length) {
        toast({
          title: "Incomplete Schedule",
          description: `Only ${courseIndex} out of ${examCourses.length} courses could be scheduled. Consider extending the date range.`,
          variant: "destructive",
        });
      }

      await saveScheduleMutation.mutateAsync(schedule);
    } catch (error) {
      console.error("Schedule generation error:", error);
      toast({
        title: "Generation Error",
        description: "An error occurred while generating the schedule.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const isConfigValid = config.startDate && config.endDate && config.startDate <= config.endDate;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading configuration...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Schedule Configuration
          </CardTitle>
          <CardDescription>
            Configure the parameters for exam schedule generation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={config.startDate}
                onChange={(e) => setConfig(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={config.endDate}
                onChange={(e) => setConfig(prev => ({ ...prev, endDate: e.target.value }))}
                min={config.startDate}
              />
            </div>
          </div>

          {/* Session Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="session-duration">Session Duration (hours)</Label>
              <Select
                value={config.sessionDuration}
                onValueChange={(value) => setConfig(prev => ({ ...prev, sessionDuration: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 hours</SelectItem>
                  <SelectItem value="3">3 hours</SelectItem>
                  <SelectItem value="4">4 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="break-time">Break Between Sessions (hours)</Label>
              <Select
                value={config.breakBetweenSessions}
                onValueChange={(value) => setConfig(prev => ({ ...prev, breakBetweenSessions: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.5">30 minutes</SelectItem>
                  <SelectItem value="1">1 hour</SelectItem>
                  <SelectItem value="1.5">1.5 hours</SelectItem>
                  <SelectItem value="2">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-exams">Max Exams Per Day</Label>
              <Select
                value={config.maxExamsPerDay}
                onValueChange={(value) => setConfig(prev => ({ ...prev, maxExamsPerDay: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 exam</SelectItem>
                  <SelectItem value="2">2 exams</SelectItem>
                  <SelectItem value="3">3 exams</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Start Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-time">Preferred Start Time</Label>
              <Input
                id="start-time"
                type="time"
                value={config.preferredStartTime}
                onChange={(e) => setConfig(prev => ({ ...prev, preferredStartTime: e.target.value }))}
              />
            </div>
          </div>

          {/* Validation Messages */}
          {examCourses.length === 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No exam courses available. Please upload courses first.
              </AlertDescription>
            </Alert>
          )}

          {!isConfigValid && examCourses.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please ensure start date is before or equal to end date.
              </AlertDescription>
            </Alert>
          )}

          {isConfigValid && examCourses.length > 0 && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Ready to generate schedule for {examCourses.length} exam courses.
              </AlertDescription>
            </Alert>
          )}

          {/* Generate Button */}
          <div className="flex justify-end">
            <Button
              onClick={generateSchedule}
              disabled={!isConfigValid || examCourses.length === 0 || isGenerating}
              size="lg"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Generate Schedule
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExamScheduleGenerator;
