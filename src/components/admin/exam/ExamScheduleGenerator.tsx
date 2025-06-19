import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, AlertCircle, CheckCircle, Play, Settings, Clock, Users, Building } from "lucide-react";
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
  const [maxExamsPerDay, setMaxExamsPerDay] = useState("2");
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

  // Sample venues with capacities
  const venues = [
    { name: "Mass Comm Auditorium", capacity: 300 },
    { name: "L102", capacity: 80 },
    { name: "Psychology Building", capacity: 120 },
    { name: "Multipurpose Hall", capacity: 250 },
    { name: "R101", capacity: 60 },
    { name: "UPFR Room 1", capacity: 100 },
    { name: "L101", capacity: 80 },
    { name: "R102", capacity: 60 },
    { name: "Chapel Hall", capacity: 150 },
    { name: "Main Auditorium", capacity: 400 },
    { name: "Conference Room A", capacity: 50 },
    { name: "Conference Room B", capacity: 50 },
    { name: "Computer Lab 1", capacity: 40 },
    { name: "Library Hall", capacity: 150 },
  ];

  // Multi-venue splitting logic
  const splitCourseAcrossVenues = (course: ExamCourse, availableVenuesForSlot: any[], session: any, dayKey: string) => {
    const scheduleItems: ExamScheduleItem[] = [];
    let remainingStudents = course.studentCount;
    let venueIndex = 0;
    
    console.log(`Splitting course ${course.courseCode} (${course.studentCount} students) across venues`);
    
    while (remainingStudents > 0 && venueIndex < availableVenuesForSlot.length) {
      const venue = availableVenuesForSlot[venueIndex];
      
      const studentsInThisVenue = Math.min(remainingStudents, venue.capacity);
      
      // Create a schedule item for this venue - include all required properties from ExamCourse
      const scheduleItem: ExamScheduleItem = {
        id: course.id, // Use the original exam course ID from the database
        courseCode: course.courseCode,
        courseTitle: course.courseTitle,
        department: course.department,
        college: course.college || '',
        level: course.level || '',
        studentCount: studentsInThisVenue, // Students assigned to this venue
        createdAt: course.createdAt, // Include required createdAt property
        updatedAt: course.updatedAt, // Include required updatedAt property
        day: dayKey,
        startTime: session.startTime,
        endTime: session.endTime,
        sessionName: session.name,
        venueName: venue.name,
      };
      
      scheduleItems.push(scheduleItem);
      console.log(`  - ${venue.name}: ${studentsInThisVenue} students (${remainingStudents - studentsInThisVenue} remaining)`);
      
      remainingStudents -= studentsInThisVenue;
      venueIndex++;
    }
    
    if (remainingStudents > 0) {
      console.warn(`Could not accommodate ${remainingStudents} students for course ${course.courseCode}`);
    }
    
    return scheduleItems;
  };

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
      console.log("Starting exam schedule generation...");
      console.log("Total courses to schedule:", examCourses.length);
      console.log("Total course registrations:", examCourses.reduce((sum, course) => sum + course.studentCount, 0));

      // Generate date range
      const dateRange = [];
      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        // Skip weekends for now
        if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
          dateRange.push(new Date(currentDate));
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      console.log("Available exam days:", dateRange.length);

      if (dateRange.length === 0) {
        throw new Error("No valid exam days found in the selected date range.");
      }

      // Generate time sessions based on configuration
      const sessions = [];
      const maxExams = parseInt(maxExamsPerDay);
      const duration = parseInt(sessionDuration);
      const breakDuration = parseInt(breakBetweenSessions);
      
      // Morning session
      sessions.push({
        name: "Morning",
        startTime: "08:00",
        endTime: `${8 + duration}:00`.padStart(5, '0'),
      });

      // Midday session (if we need more than 1 session per day)
      if (maxExams > 1) {
        const middayStart = 8 + duration + breakDuration;
        sessions.push({
          name: "Midday",
          startTime: `${middayStart}:00`.padStart(5, '0'),
          endTime: `${middayStart + duration}:00`.padStart(5, '0'),
        });
      }

      // Afternoon session (if we need more than 2 sessions per day)
      if (maxExams > 2) {
        const afternoonStart = 8 + (duration + breakDuration) * 2;
        sessions.push({
          name: "Afternoon",
          startTime: `${afternoonStart}:00`.padStart(5, '0'),
          endTime: `${afternoonStart + duration}:00`.padStart(5, '0'),
        });
      }

      console.log("Generated sessions:", sessions);

      const schedule: ExamScheduleItem[] = [];
      const unscheduledCourses: ExamCourse[] = [];
      let scheduledCourses = 0;

      // Create a copy of courses to schedule
      const coursesToSchedule = [...examCourses];
      
      // Sort courses by student count (largest first) for better venue utilization
      coursesToSchedule.sort((a, b) => b.studentCount - a.studentCount);

      // Track venue usage per time slot
      const venueUsage: { [key: string]: string[] } = {};

      // Schedule courses
      for (const date of dateRange) {
        const dayKey = format(date, 'yyyy-MM-dd');
        console.log(`\nProcessing day: ${dayKey}`);

        for (const session of sessions) {
          const timeSlotKey = `${dayKey}_${session.startTime}`;
          console.log(`\nProcessing session: ${session.name} (${session.startTime} - ${session.endTime})`);
          
          // Get available venues for this time slot
          const usedVenues = venueUsage[timeSlotKey] || [];
          const availableVenues = venues.filter(v => !usedVenues.includes(v.name));
          
          console.log(`Total available capacity: ${availableVenues.reduce((sum, v) => sum + v.capacity, 0)}`);

          // Try to schedule courses in this time slot
          const coursesScheduledInSlot = [];
          
          for (let i = coursesToSchedule.length - 1; i >= 0; i--) {
            const course = coursesToSchedule[i];
            console.log(`\nAttempting to schedule course ${course.courseCode} (${course.studentCount} students)`);
            
            // Calculate total available capacity
            const totalCapacity = availableVenues.reduce((sum, v) => sum + v.capacity, 0);
            
            if (course.studentCount <= totalCapacity && availableVenues.length > 0) {
              console.log(`Splitting course ${course.courseCode} (${course.studentCount} students) across venues`);
              
              // Split course across venues
              const courseScheduleItems = splitCourseAcrossVenues(course, availableVenues, session, dayKey);
              
              // Mark venues as used
              const venuesUsed = courseScheduleItems.map(item => item.venueName!);
              venueUsage[timeSlotKey] = [...(venueUsage[timeSlotKey] || []), ...venuesUsed];
              
              // Add to schedule
              schedule.push(...courseScheduleItems);
              coursesScheduledInSlot.push(course.courseCode);
              scheduledCourses++;
              
              // Remove venues that are now full
              courseScheduleItems.forEach(item => {
                const venueIndex = availableVenues.findIndex(v => v.name === item.venueName);
                if (venueIndex >= 0) {
                  availableVenues.splice(venueIndex, 1);
                }
              });
              
              // Remove course from list
              coursesToSchedule.splice(i, 1);
              
              console.log(`✅ Successfully scheduled ${course.courseCode} across ${courseScheduleItems.length} venues on ${dayKey} at ${session.startTime}`);
            } else {
              console.log(`❌ Cannot fit course ${course.courseCode} (needs ${course.studentCount}, available: ${totalCapacity})`);
            }
          }

          console.log(`Courses scheduled in this slot: ${coursesScheduledInSlot.join(', ') || 'None'}`);
        }
      }

      // Add remaining courses to unscheduled list
      unscheduledCourses.push(...coursesToSchedule);

      console.log(`\nFINAL RESULT: Successfully scheduled ${scheduledCourses} out of ${examCourses.length} courses`);
      console.log(`Total schedule items created: ${schedule.length}`);

      if (unscheduledCourses.length > 0) {
        console.warn("Unscheduled courses:", unscheduledCourses.map(c => `${c.courseCode} (${c.studentCount} students)`));
      }

      setGeneratedSchedule(schedule);
      setScheduleStats({
        totalCourses: examCourses.length,
        scheduledCourses,
        unscheduledCourses: unscheduledCourses.length,
        totalScheduleItems: schedule.length,
        venueAssignments: schedule.length,
      });

      toast({
        title: "Schedule Generated!",
        description: `Successfully scheduled ${scheduledCourses} out of ${examCourses.length} courses across ${schedule.length} venue assignments!`,
      });

    } catch (error) {
      console.error("Schedule generation error:", error);
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
    console.log("Sample schedule item:", generatedSchedule[0]);
    
    saveScheduleMutation.mutate({ 
      schedule: generatedSchedule, 
      isPublished: publish 
    });
  };

  const totalCourseRegistrations = examCourses.reduce((sum, course) => sum + (course.studentCount || 0), 0);
  const totalVenueCapacity = venues.reduce((sum, venue) => sum + venue.capacity, 0);

  return (
    <div className="space-y-6">
      {/* Configuration Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Schedule Configuration
          </CardTitle>
          <CardDescription>
            Configure the exam schedule parameters and generate the timetable
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
              <Label htmlFor="max-exams">Max Exams Per Student Per Day</Label>
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
                  Generating Schedule...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Generate Schedule
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
          <CardTitle className="text-xl">Schedule Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{totalVenueCapacity.toLocaleString()}</div>
              <p className="text-sm text-gray-600">
                Multi-Venue Splitting: <Badge className="ml-1" variant="secondary">Enabled</Badge>
              </p>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              * Large courses will be automatically split across multiple venues within the same exam session
            </p>
          </div>

          {startDate && endDate && (
            <div className="mt-4 p-3 bg-amber-50 rounded-lg">
              <p className="text-sm text-amber-800 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Warning: Selected date range ({Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} days) may be insufficient for 
                optimal scheduling. Consider extending the exam period for {examCourses.length} courses.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Venues */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Available Venues
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {venues.slice(0, 9).map((venue, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm font-medium">{venue.name}</span>
                <Badge variant="outline">({venue.capacity})</Badge>
              </div>
            ))}
            {venues.length > 9 && (
              <div className="flex items-center justify-center p-2 text-sm text-gray-500">
                +{venues.length - 9} more...
              </div>
            )}
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Total combined capacity: <span className="font-semibold">{totalVenueCapacity.toLocaleString()}</span> students per session
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Generation Results */}
      {scheduleStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Complete Schedule Generated
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
                <p className="text-sm text-gray-600">Total Schedule Items</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{scheduleStats.venueAssignments}</div>
                <p className="text-sm text-gray-600">Venue Assignments</p>
              </div>
            </div>
            
            <p className="text-center text-gray-600 mb-4">
              Successfully scheduled all {scheduleStats.scheduledCourses} courses across {scheduleStats.venueAssignments} venue assignments!
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
            </div>
          </CardContent>
        </Card>
      )}

      {generatedSchedule.length === 0 && !isGenerating && (
        <Card>
          <CardContent className="text-center py-8">
            <div className="flex items-center justify-center gap-2 text-gray-500 mb-2">
              <CheckCircle className="h-5 w-5" />
              Ready to generate schedule for {examCourses.length} exam courses with multi-venue splitting enabled.
            </div>
            <p className="text-sm text-gray-400">
              Configure the parameters above and click "Generate Schedule" to create the exam timetable.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ExamScheduleGenerator;
