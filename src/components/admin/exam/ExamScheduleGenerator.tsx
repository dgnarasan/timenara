
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
    maxExamsPerDay: "4",
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
      console.log("Starting schedule generation for", examCourses.length, "courses");
      
      // Enhanced scheduling algorithm
      const schedule: ExamScheduleItem[] = [];
      const sessions = ['Morning', 'Midday', 'Afternoon', 'Evening'] as const;
      const startDate = new Date(config.startDate);
      const endDate = new Date(config.endDate);
      
      const sessionDuration = parseInt(config.sessionDuration);
      const breakTime = parseInt(config.breakBetweenSessions);
      const maxExamsPerDay = parseInt(config.maxExamsPerDay);
      
      // Calculate session times
      const getSessionTime = (sessionIndex: number) => {
        const baseHour = parseInt(config.preferredStartTime.split(':')[0]);
        const startHour = baseHour + (sessionIndex * (sessionDuration + breakTime));
        const endHour = startHour + sessionDuration;
        
        return {
          startTime: `${startHour.toString().padStart(2, '0')}:00`,
          endTime: `${endHour.toString().padStart(2, '0')}:00`
        };
      };

      let courseIndex = 0;
      let currentDate = new Date(startDate);
      
      // Sort courses by student count (larger classes first for better venue allocation)
      const sortedCourses = [...examCourses].sort((a, b) => b.studentCount - a.studentCount);
      
      while (currentDate <= endDate && courseIndex < sortedCourses.length) {
        // Include weekends if needed to accommodate all courses
        const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
        
        // Determine how many sessions to use this day
        const remainingCourses = sortedCourses.length - courseIndex;
        const sessionsToday = Math.min(maxExamsPerDay, remainingCourses, sessions.length);
        
        for (let sessionIndex = 0; sessionIndex < sessionsToday; sessionIndex++) {
          if (courseIndex >= sortedCourses.length) break;

          const course = sortedCourses[courseIndex];
          const session = sessions[sessionIndex];
          const { startTime, endTime } = getSessionTime(sessionIndex);
          
          // Smart venue assignment based on student count
          let venueName: string;
          if (course.studentCount > 200) {
            venueName = `Main Examination Hall ${Math.floor(courseIndex / 50) + 1}`;
          } else if (course.studentCount > 100) {
            venueName = `Large Hall ${Math.floor(courseIndex / 30) + 1}`;
          } else if (course.studentCount > 50) {
            venueName = `Medium Hall ${Math.floor(courseIndex / 20) + 1}`;
          } else {
            venueName = `Small Hall ${Math.floor(courseIndex / 10) + 1}`;
          }

          schedule.push({
            ...course,
            day: currentDate.toISOString().split('T')[0],
            startTime,
            endTime,
            sessionName: session,
            venueName,
          });

          courseIndex++;
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      console.log(`Successfully scheduled ${courseIndex} out of ${sortedCourses.length} courses`);

      if (courseIndex < sortedCourses.length) {
        const scheduledPercentage = Math.round((courseIndex / sortedCourses.length) * 100);
        toast({
          title: "Partial Schedule Generated",
          description: `Scheduled ${courseIndex} out of ${sortedCourses.length} courses (${scheduledPercentage}%). Consider extending the date range or increasing max exams per day.`,
          variant: "destructive",
        });
      }

      // Save the schedule even if it's partial
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

  const calculateEstimatedDays = () => {
    if (examCourses.length === 0) return 0;
    const maxExamsPerDay = parseInt(config.maxExamsPerDay);
    return Math.ceil(examCourses.length / maxExamsPerDay);
  };

  const isConfigValid = config.startDate && config.endDate && config.startDate <= config.endDate;
  const estimatedDays = calculateEstimatedDays();
  const selectedDateRange = config.startDate && config.endDate 
    ? Math.ceil((new Date(config.endDate).getTime() - new Date(config.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
    : 0;

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
                  <SelectItem value="2">2 exams</SelectItem>
                  <SelectItem value="3">3 exams</SelectItem>
                  <SelectItem value="4">4 exams</SelectItem>
                  <SelectItem value="5">5 exams</SelectItem>
                  <SelectItem value="6">6 exams</SelectItem>
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

          {/* Schedule Analysis */}
          {examCourses.length > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg space-y-2">
              <h4 className="font-medium text-blue-900">Schedule Analysis</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Total Courses:</span>
                  <span className="font-medium ml-2">{examCourses.length}</span>
                </div>
                <div>
                  <span className="text-blue-700">Estimated Days Needed:</span>
                  <span className="font-medium ml-2">{estimatedDays}</span>
                </div>
                <div>
                  <span className="text-blue-700">Selected Date Range:</span>
                  <span className="font-medium ml-2">{selectedDateRange} days</span>
                </div>
              </div>
              {selectedDateRange > 0 && selectedDateRange < estimatedDays && (
                <Alert className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Warning: Selected date range ({selectedDateRange} days) may be insufficient. 
                    Consider extending to at least {estimatedDays} days or increasing max exams per day.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

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
