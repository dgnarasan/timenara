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
    maxExamsPerStudent: "2", // Changed from maxExamsPerDay to maxExamsPerStudent
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

  // Define available venues with real Caleb University venues
  const availableVenues = [
    { name: "Mass Comm Auditorium", capacity: 300 },
    { name: "Multipurpose Hall", capacity: 250 },
    { name: "L101", capacity: 80 },
    { name: "L102", capacity: 80 },
    { name: "R101", capacity: 60 },
    { name: "R102", capacity: 60 },
    { name: "Psychology Building", capacity: 120 },
    { name: "UPEB Room 1", capacity: 100 },
    { name: "UPEB Room 2", capacity: 100 },
    { name: "Computer Lab 1", capacity: 40 },
    { name: "Computer Lab 2", capacity: 40 },
    { name: "Cafeteria", capacity: 200 },
    { name: "Chapel Hall", capacity: 500 },
    { name: "Library Hall", capacity: 150 },
  ];

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
      console.log("Starting IMPROVED exam schedule generation for", examCourses.length, "courses");
      
      const schedule: ExamScheduleItem[] = [];
      const sessions: Array<{ name: 'Morning' | 'Midday' | 'Afternoon'; startTime: string; endTime: string }> = [
        { name: 'Morning', startTime: '08:00', endTime: '11:00' },
        { name: 'Midday', startTime: '12:00', endTime: '15:00' },
        { name: 'Afternoon', startTime: '15:30', endTime: '18:30' }
      ];

      const startDate = new Date(config.startDate);
      const endDate = new Date(config.endDate);
      
      // Sort courses by student count (larger classes first for better venue allocation)
      const sortedCourses = [...examCourses].sort((a, b) => b.studentCount - a.studentCount);
      console.log("Sorted courses:", sortedCourses.length, "courses to schedule");
      
      let currentDate = new Date(startDate);
      let scheduledCount = 0;
      
      // Generate schedule spanning across exam period
      while (currentDate <= endDate && scheduledCount < sortedCourses.length) {
        const dayKey = currentDate.toISOString().split('T')[0];
        const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
        
        console.log(`Processing date: ${dayKey} (${dayName})`);
        
        // Skip weekends for now (can be enabled if needed)
        const isWeekend = dayName === 'Saturday' || dayName === 'Sunday';
        if (isWeekend) {
          console.log(`Skipping weekend: ${dayName}`);
          currentDate.setDate(currentDate.getDate() + 1);
          continue;
        }

        // Schedule courses for each session of the day
        for (const session of sessions) {
          if (scheduledCount >= sortedCourses.length) break;

          console.log(`Processing session: ${session.name} (${session.startTime} - ${session.endTime})`);

          // Try to schedule courses in parallel (different venues)
          for (let venueIndex = 0; venueIndex < availableVenues.length && scheduledCount < sortedCourses.length; venueIndex++) {
            const venue = availableVenues[venueIndex];
            const course = sortedCourses[scheduledCount];

            console.log(`Attempting to schedule course ${course.courseCode} (${course.studentCount} students) in ${venue.name} (capacity: ${venue.capacity})`);

            // Simple capacity check - allow some flexibility
            const canFitInVenue = course.studentCount <= venue.capacity * 1.1; // Allow 10% over capacity
            
            if (canFitInVenue) {
              // Schedule the course
              const scheduleItem: ExamScheduleItem = {
                id: course.id,
                courseCode: course.courseCode,
                courseTitle: course.courseTitle,
                department: course.department,
                college: course.college,
                level: course.level,
                studentCount: course.studentCount,
                createdAt: course.createdAt,
                updatedAt: course.updatedAt,
                day: dayKey,
                startTime: session.startTime,
                endTime: session.endTime,
                sessionName: session.name,
                venueName: venue.name,
              };

              schedule.push(scheduleItem);
              scheduledCount++;
              
              console.log(`✅ Successfully scheduled: ${course.courseCode} in ${venue.name} on ${dayKey} at ${session.startTime}`);
            } else {
              console.log(`❌ Cannot fit ${course.courseCode} (${course.studentCount} students) in ${venue.name} (capacity: ${venue.capacity})`);
            }
          }
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      console.log(`FINAL RESULT: Successfully scheduled ${schedule.length} out of ${sortedCourses.length} courses`);

      if (schedule.length === 0) {
        toast({
          title: "No Courses Scheduled",
          description: "No courses could be scheduled with the current configuration. Please check venue capacities and date range.",
          variant: "destructive",
        });
        return;
      }

      if (schedule.length < sortedCourses.length) {
        const scheduledPercentage = Math.round((schedule.length / sortedCourses.length) * 100);
        toast({
          title: "Partial Schedule Generated",
          description: `Scheduled ${schedule.length} out of ${sortedCourses.length} courses (${scheduledPercentage}%). Consider extending the date range or adding more venues.`,
        });
      } else {
        toast({
          title: "Complete Schedule Generated",
          description: `Successfully scheduled all ${schedule.length} courses!`,
        });
      }

      // Save the schedule
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
    const availableSlots = 3; // sessions per day
    const availableVenues = 14; // total venues
    const slotsPerDay = availableSlots * availableVenues;
    return Math.ceil(examCourses.length / slotsPerDay);
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
                className="cursor-pointer"
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
                className="cursor-pointer"
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
              <Label htmlFor="max-exams">Max Exams Per Student Per Day</Label>
              <Select
                value={config.maxExamsPerStudent}
                onValueChange={(value) => setConfig(prev => ({ ...prev, maxExamsPerStudent: value }))}
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
                  <span className="text-blue-700">Course Registrations:</span>
                  <span className="font-medium ml-2">{examCourses.reduce((sum, course) => sum + course.studentCount, 0).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-blue-700">Available Venues:</span>
                  <span className="font-medium ml-2">{availableVenues.length}</span>
                </div>
              </div>
              <div className="text-xs text-blue-600 mt-2">
                * Course Registrations represents total enrollment across all courses (students may be counted multiple times)
              </div>
              {selectedDateRange > 0 && estimatedDays > selectedDateRange && (
                <Alert className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Warning: Selected date range ({selectedDateRange} days) may be insufficient. 
                    Consider extending the exam period for optimal scheduling.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Venue Information */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">Available Venues</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-xs">
              {availableVenues.slice(0, 8).map((venue, index) => (
                <div key={index} className="text-green-700">
                  {venue.name} ({venue.capacity})
                </div>
              ))}
              {availableVenues.length > 8 && (
                <div className="text-green-600">+{availableVenues.length - 8} more...</div>
              )}
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
                Ready to generate schedule for {examCourses.length} exam courses using {availableVenues.length} venues.
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
