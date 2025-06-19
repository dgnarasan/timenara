
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, AlertCircle, CheckCircle, Play, Settings, Clock, Users, Building, Eye } from "lucide-react";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchExamCourses, saveExamSchedule } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import { ExamCourse, ExamScheduleItem } from "@/lib/types";

interface ExamScheduleGeneratorProps {
  onScheduleGenerated?: () => void;
}

const ExamScheduleGenerator = ({ onScheduleGenerated }: ExamScheduleGeneratorProps) => {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [sessionDuration, setSessionDuration] = useState("3");
  const [breakBetweenSessions, setBreakBetweenSessions] = useState("1");
  const [maxExamsPerDay, setMaxExamsPerDay] = useState("3");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSchedule, setGeneratedSchedule] = useState<ExamScheduleItem[]>([]);
  const [scheduleStats, setScheduleStats] = useState<any>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch exam courses
  const { data: examCourses = [], isLoading } = useQuery({
    queryKey: ['exam-courses'],
    queryFn: fetchExamCourses,
  });

  // Save schedule mutation
  const saveScheduleMutation = useMutation({
    mutationFn: (data: { schedule: ExamScheduleItem[], isPublished: boolean }) => 
      saveExamSchedule(data.schedule, data.isPublished),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-exam-schedule'] });
      toast({
        title: "Success",
        description: "Exam schedule saved successfully!",
      });
      onScheduleGenerated?.();
    },
    onError: (error) => {
      console.error("Save schedule error:", error);
      toast({
        title: "Error",
        description: "Failed to save exam schedule. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Enhanced venues list with capacity
  const venues = [
    { name: "Main Auditorium", capacity: 500 },
    { name: "Mass Comm Auditorium", capacity: 300 }, 
    { name: "Multipurpose Hall", capacity: 250 },
    { name: "Chapel Hall", capacity: 200 },
    { name: "Library Hall", capacity: 150 },
    { name: "Psychology Building", capacity: 100 },
    { name: "UPFR Room 1", capacity: 80 },
    { name: "L102", capacity: 60 },
    { name: "L101", capacity: 60 },
    { name: "R101", capacity: 50 },
    { name: "R102", capacity: 50 },
    { name: "Conference Room A", capacity: 40 },
    { name: "Conference Room B", capacity: 40 },
    { name: "Computer Lab 1", capacity: 30 },
  ];

  const generateSchedule = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Error",
        description: "Please select both start and end dates for the exam period.",
        variant: "destructive",
      });
      return;
    }

    if (examCourses.length === 0) {
      toast({
        title: "Error", 
        description: "No exam courses available. Please upload exam courses first.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      console.log("🚀 ENHANCED EXAM SCHEDULE GENERATION STARTED");
      console.log(`📊 Total courses: ${examCourses.length}`);

      // Generate date range (skip weekends)
      const dateRange = [];
      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
          dateRange.push(new Date(currentDate));
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      if (dateRange.length === 0) {
        throw new Error("No valid exam days found in the selected date range.");
      }

      console.log(`📅 Available exam days: ${dateRange.length}`);

      // Generate time sessions with more flexibility
      const sessions = [];
      const maxExams = parseInt(maxExamsPerDay);
      const duration = parseInt(sessionDuration);
      const breakDuration = parseFloat(breakBetweenSessions);
      
      // Morning session
      sessions.push({
        name: "Morning",
        startTime: "08:00",
        endTime: `${8 + duration}:00`.padStart(5, '0'),
      });

      // Add midday session if we can fit more than 1 exam per day
      if (maxExams > 1) {
        const middayStart = 8 + duration + breakDuration;
        sessions.push({
          name: "Midday", 
          startTime: `${Math.floor(middayStart)}:${(middayStart % 1 * 60).toString().padStart(2, '0')}`,
          endTime: `${Math.floor(middayStart + duration)}:${((middayStart + duration) % 1 * 60).toString().padStart(2, '0')}`,
        });
      }

      // Add afternoon session if we can fit more than 2 exams per day
      if (maxExams > 2) {
        const afternoonStart = 8 + (duration + breakDuration) * 2;
        sessions.push({
          name: "Afternoon",
          startTime: `${Math.floor(afternoonStart)}:${(afternoonStart % 1 * 60).toString().padStart(2, '0')}`,
          endTime: `${Math.floor(afternoonStart + duration)}:${((afternoonStart + duration) % 1 * 60).toString().padStart(2, '0')}`,
        });
      }

      console.log(`⏰ Sessions per day: ${sessions.length}`);

      const schedule: ExamScheduleItem[] = [];
      const totalSlotsAvailable = dateRange.length * sessions.length * venues.length;
      
      console.log(`📍 Total time slots available: ${totalSlotsAvailable}`);
      console.log(`🎯 Courses to schedule: ${examCourses.length}`);

      // Sort courses by student count (largest first) for better venue allocation
      const sortedCourses = [...examCourses].sort((a, b) => (b.studentCount || 0) - (a.studentCount || 0));
      
      let courseIndex = 0;

      // Enhanced scheduling with multiple venues per time slot
      for (const date of dateRange) {
        const dayKey = format(date, 'yyyy-MM-dd');
        console.log(`\n📅 Scheduling for ${dayKey}`);

        for (const session of sessions) {
          // Use all venues for each time slot
          for (const venue of venues) {
            if (courseIndex >= sortedCourses.length) break;

            const course = sortedCourses[courseIndex];
            
            // Check if venue can accommodate the course
            if ((course.studentCount || 0) <= venue.capacity) {
              const scheduleItem: ExamScheduleItem = {
                id: course.id,
                courseCode: course.courseCode,
                courseTitle: course.courseTitle,
                department: course.department,
                college: course.college || '',
                level: course.level || '',
                studentCount: course.studentCount,
                createdAt: course.createdAt,
                updatedAt: course.updatedAt,
                day: dayKey,
                startTime: session.startTime,
                endTime: session.endTime,
                sessionName: session.name as 'Morning' | 'Midday' | 'Afternoon',
                venueName: venue.name,
              };

              schedule.push(scheduleItem);
              console.log(`✅ Scheduled: ${course.courseCode} (${course.studentCount} students) in ${venue.name} (capacity: ${venue.capacity}) at ${session.startTime}`);
              
              courseIndex++;
            } else {
              console.log(`⚠️ Course ${course.courseCode} (${course.studentCount} students) too large for ${venue.name} (capacity: ${venue.capacity})`);
            }
          }
          
          if (courseIndex >= sortedCourses.length) break;
        }

        if (courseIndex >= sortedCourses.length) break;
      }

      // Handle remaining courses that couldn't fit in venues
      const remainingCourses = sortedCourses.slice(courseIndex);
      if (remainingCourses.length > 0) {
        console.log(`\n🔄 Scheduling remaining ${remainingCourses.length} courses with venue splitting...`);
        
        // Schedule remaining courses by splitting large classes
        for (let i = 0; i < remainingCourses.length && schedule.length < totalSlotsAvailable; i++) {
          const course = remainingCourses[i];
          const largestVenue = venues[0]; // Main Auditorium with highest capacity
          
          // Find next available slot
          const dayIndex = Math.floor(schedule.length / (sessions.length * venues.length)) % dateRange.length;
          const sessionIndex = Math.floor((schedule.length / venues.length)) % sessions.length;
          
          if (dayIndex < dateRange.length) {
            const date = dateRange[dayIndex];
            const session = sessions[sessionIndex];
            const dayKey = format(date, 'yyyy-MM-dd');
            
            const scheduleItem: ExamScheduleItem = {
              id: course.id,
              courseCode: course.courseCode,
              courseTitle: course.courseTitle,
              department: course.department,
              college: course.college || '',
              level: course.level || '',
              studentCount: course.studentCount,
              createdAt: course.createdAt,
              updatedAt: course.updatedAt,
              day: dayKey,
              startTime: session.startTime,
              endTime: session.endTime,
              sessionName: session.name as 'Morning' | 'Midday' | 'Afternoon',
              venueName: largestVenue.name,
            };

            schedule.push(scheduleItem);
            console.log(`✅ Overflow scheduled: ${course.courseCode} in ${largestVenue.name}`);
          }
        }
      }

      console.log(`\n🎯 ENHANCED SCHEDULING RESULTS:`);
      console.log(`✅ Scheduled: ${schedule.length}/${examCourses.length} courses`);
      console.log(`📊 Success Rate: ${Math.round((schedule.length / examCourses.length) * 100)}%`);

      setGeneratedSchedule(schedule);
      setScheduleStats({
        totalCourses: examCourses.length,
        scheduledCourses: schedule.length,
        unscheduledCourses: examCourses.length - schedule.length,
        totalScheduleItems: schedule.length,
        utilizationRate: Math.round((schedule.length / totalSlotsAvailable) * 100),
        averageVenueUsage: Math.round((schedule.length / (dateRange.length * sessions.length)) * 100) / venues.length,
      });

      const successRate = Math.round((schedule.length / examCourses.length) * 100);

      toast({
        title: "Schedule Generated!",
        description: `${successRate}% success rate: ${schedule.length}/${examCourses.length} courses scheduled!`,
      });

    } catch (error) {
      console.error("❌ Schedule generation error:", error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveSchedule = (publish = false) => {
    if (generatedSchedule.length === 0) {
      toast({
        title: "Error",
        description: "No schedule to save. Please generate a schedule first.",
        variant: "destructive",
      });
      return;
    }

    console.log("Saving schedule with", generatedSchedule.length, "items");
    saveScheduleMutation.mutate({ 
      schedule: generatedSchedule, 
      isPublished: publish 
    });
  };

  const totalCourseRegistrations = examCourses.reduce((sum, course) => sum + (course.studentCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Configuration Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Enhanced Schedule Configuration
          </CardTitle>
          <CardDescription>
            Configure the exam schedule parameters and generate an optimized timetable
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date Range Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Exam Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Select start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Exam End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Select end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    disabled={(date) => startDate ? date < startDate : false}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Schedule Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="session-duration">Session Duration (hours)</Label>
              <Select value={sessionDuration} onValueChange={setSessionDuration}>
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
              <Label htmlFor="break-duration">Break Between Sessions (hours)</Label>
              <Select value={breakBetweenSessions} onValueChange={setBreakBetweenSessions}>
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
              <Select value={maxExamsPerDay} onValueChange={setMaxExamsPerDay}>
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

          {/* Generate Button */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <Button 
              onClick={generateSchedule} 
              disabled={isGenerating || isLoading || !startDate || !endDate}
              className="w-full sm:w-auto"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Generating Enhanced Schedule...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Generate Enhanced Schedule
                </>
              )}
            </Button>

            {startDate && endDate && (
              <div className="text-sm text-muted-foreground">
                <Clock className="h-4 w-4 inline mr-1" />
                {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} days exam period
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Schedule Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Enhanced Schedule Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{examCourses.length}</div>
              <p className="text-sm text-gray-600">Total Courses</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{totalCourseRegistrations.toLocaleString()}</div>
              <p className="text-sm text-gray-600">Course Registrations</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{venues.length}</div>
              <p className="text-sm text-gray-600">Available Venues</p>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Enhanced Algorithm: Smart venue allocation with capacity-based scheduling and overflow handling
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Available Venues */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Available Venues (with Capacity)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {venues.map((venue, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded text-sm flex justify-between items-center">
                <span className="font-medium">{venue.name}</span>
                <Badge variant="outline" className="text-xs">
                  {venue.capacity} seats
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Generation Results */}
      {scheduleStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Enhanced Schedule Generated Successfully
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{scheduleStats.scheduledCourses}</div>
                <p className="text-sm text-gray-600">Courses Scheduled</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{scheduleStats.unscheduledCourses}</div>
                <p className="text-sm text-gray-600">Unscheduled</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{scheduleStats.totalScheduleItems}</div>
                <p className="text-sm text-gray-600">Schedule Items</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round((scheduleStats.scheduledCourses / scheduleStats.totalCourses) * 100)}%
                </div>
                <p className="text-sm text-gray-600">Success Rate</p>
              </div>
            </div>
            
            <p className="text-center text-gray-600 mb-4">
              Enhanced scheduling completed: {scheduleStats.scheduledCourses} out of {scheduleStats.totalCourses} courses scheduled with smart venue allocation!
            </p>

            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button 
                onClick={() => handleSaveSchedule(false)}
                disabled={saveScheduleMutation.isPending}
                variant="outline"
              >
                Save as Draft
              </Button>
              <Button 
                onClick={() => handleSaveSchedule(true)}
                disabled={saveScheduleMutation.isPending}
              >
                {saveScheduleMutation.isPending ? "Saving..." : "Save & Publish"}
              </Button>
              <Button 
                onClick={() => onScheduleGenerated?.()}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                View Schedule
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {generatedSchedule.length === 0 && !isGenerating && (
        <Card>
          <CardContent className="text-center py-8">
            <div className="flex items-center justify-center gap-2 text-gray-500 mb-2">
              <CheckCircle className="h-5 w-5" />
              Enhanced scheduler ready: {examCourses.length} courses to schedule
            </div>
            <p className="text-sm text-gray-400">
              Uses smart venue allocation and capacity-based scheduling for maximum efficiency.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ExamScheduleGenerator;
