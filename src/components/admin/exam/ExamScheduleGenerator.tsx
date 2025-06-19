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

  // Enhanced venues with better distribution
  const venues = [
    { name: "Main Auditorium", capacity: 400 },
    { name: "Mass Comm Auditorium", capacity: 300 },
    { name: "Multipurpose Hall", capacity: 250 },
    { name: "Chapel Hall", capacity: 150 },
    { name: "Library Hall", capacity: 150 },
    { name: "Psychology Building", capacity: 120 },
    { name: "UPFR Room 1", capacity: 100 },
    { name: "L102", capacity: 80 },
    { name: "L101", capacity: 80 },
    { name: "R101", capacity: 60 },
    { name: "R102", capacity: 60 },
    { name: "Conference Room A", capacity: 50 },
    { name: "Conference Room B", capacity: 50 },
    { name: "Computer Lab 1", capacity: 40 },
  ];

  // Improved multi-venue splitting with better capacity utilization
  const splitCourseAcrossVenues = (course: ExamCourse, availableVenues: any[], session: any, dayKey: string) => {
    const scheduleItems: ExamScheduleItem[] = [];
    let remainingStudents = course.studentCount;
    
    console.log(`\n=== Splitting ${course.courseCode} (${course.studentCount} students) ===`);
    console.log(`Available venues: ${availableVenues.map(v => `${v.name}(${v.capacity})`).join(', ')}`);
    
    // Sort venues by capacity (largest first) for better utilization
    const sortedVenues = [...availableVenues].sort((a, b) => b.capacity - a.capacity);
    
    for (const venue of sortedVenues) {
      if (remainingStudents <= 0) break;
      
      const studentsInThisVenue = Math.min(remainingStudents, venue.capacity);
      
      const scheduleItem: ExamScheduleItem = {
        id: course.id,
        courseCode: course.courseCode,
        courseTitle: course.courseTitle,
        department: course.department,
        college: course.college || '',
        level: course.level || '',
        studentCount: studentsInThisVenue,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
        day: dayKey,
        startTime: session.startTime,
        endTime: session.endTime,
        sessionName: session.name,
        venueName: venue.name,
      };
      
      scheduleItems.push(scheduleItem);
      remainingStudents -= studentsInThisVenue;
      
      console.log(`  → ${venue.name}: ${studentsInThisVenue} students`);
    }
    
    if (remainingStudents > 0) {
      console.warn(`⚠️  Could not accommodate ${remainingStudents} students for ${course.courseCode}`);
    }
    
    console.log(`✅ Split into ${scheduleItems.length} venue assignments`);
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
      console.log("\n🚀 ENHANCED EXAM SCHEDULE GENERATION STARTED");
      console.log(`📊 Total courses: ${examCourses.length}`);
      console.log(`👥 Total students: ${examCourses.reduce((sum, course) => sum + course.studentCount, 0)}`);
      console.log(`🏢 Total venue capacity per session: ${venues.reduce((sum, v) => sum + v.capacity, 0)}`);

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

      // Generate time sessions
      const sessions = [];
      const maxExams = parseInt(maxExamsPerDay);
      const duration = parseInt(sessionDuration);
      const breakDuration = parseInt(breakBetweenSessions);
      
      sessions.push({
        name: "Morning",
        startTime: "08:00",
        endTime: `${8 + duration}:00`.padStart(5, '0'),
      });

      if (maxExams > 1) {
        const middayStart = 8 + duration + breakDuration;
        sessions.push({
          name: "Midday", 
          startTime: `${middayStart}:00`.padStart(5, '0'),
          endTime: `${middayStart + duration}:00`.padStart(5, '0'),
        });
      }

      if (maxExams > 2) {
        const afternoonStart = 8 + (duration + breakDuration) * 2;
        sessions.push({
          name: "Afternoon",
          startTime: `${afternoonStart}:00`.padStart(5, '0'),
          endTime: `${afternoonStart + duration}:00`.padStart(5, '0'),
        });
      }

      console.log(`⏰ Sessions per day: ${sessions.length}`);

      const schedule: ExamScheduleItem[] = [];
      const unscheduledCourses: ExamCourse[] = [];
      let scheduledCourses = 0;

      // Sort courses by student count (largest first) for optimal packing
      const coursesToSchedule = [...examCourses].sort((a, b) => b.studentCount - a.studentCount);
      
      console.log("\n📋 SCHEDULING ALGORITHM:");
      console.log("Strategy: Largest courses first, optimal venue packing");

      // Track venue usage per time slot  
      const venueUsage: { [key: string]: string[] } = {};
      const totalCapacityPerSlot = venues.reduce((sum, v) => sum + v.capacity, 0);

      // Schedule courses across all time slots
      for (const date of dateRange) {
        const dayKey = format(date, 'yyyy-MM-dd');
        console.log(`\n📅 === ${dayKey} ===`);

        for (const session of sessions) {
          const timeSlotKey = `${dayKey}_${session.startTime}`;
          console.log(`\n⏰ ${session.name} Session (${session.startTime} - ${session.endTime})`);
          
          // Get available venues for this slot
          const usedVenues = venueUsage[timeSlotKey] || [];
          const availableVenues = venues.filter(v => !usedVenues.includes(v.name));
          const availableCapacity = availableVenues.reduce((sum, v) => sum + v.capacity, 0);
          
          console.log(`🏢 Available capacity: ${availableCapacity} students`);

          // Try to fit courses in this time slot
          const coursesInThisSlot = [];
          let slotCapacityUsed = 0;

          for (let i = coursesToSchedule.length - 1; i >= 0; i--) {
            const course = coursesToSchedule[i];
            
            // Check if course can fit in remaining capacity
            const remainingCapacity = availableCapacity - slotCapacityUsed;
            
            if (course.studentCount <= remainingCapacity) {
              console.log(`\n📚 Scheduling: ${course.courseCode} (${course.studentCount} students)`);
              
              // Get venues still available for this course
              const courseAvailableVenues = availableVenues.filter(v => 
                !venueUsage[timeSlotKey]?.includes(v.name)
              );
              
              if (courseAvailableVenues.length > 0) {
                // Split course across available venues
                const courseScheduleItems = splitCourseAcrossVenues(course, courseAvailableVenues, session, dayKey);
                
                // Add to schedule
                schedule.push(...courseScheduleItems);
                coursesInThisSlot.push(course.courseCode);
                scheduledCourses++;
                slotCapacityUsed += course.studentCount;
                
                // Mark venues as used
                const venuesUsed = courseScheduleItems.map(item => item.venueName!);
                venueUsage[timeSlotKey] = [...(venueUsage[timeSlotKey] || []), ...venuesUsed];
                
                // Remove course from list
                coursesToSchedule.splice(i, 1);
              }
            }
          }

          console.log(`✅ Courses in slot: ${coursesInThisSlot.join(', ') || 'None'}`);
          console.log(`📊 Capacity used: ${slotCapacityUsed}/${availableCapacity}`);
        }
      }

      // Add remaining courses to unscheduled
      unscheduledCourses.push(...coursesToSchedule);

      console.log(`\n🎯 FINAL RESULTS:`);
      console.log(`✅ Scheduled: ${scheduledCourses}/${examCourses.length} courses`);
      console.log(`📋 Schedule items: ${schedule.length}`);
      console.log(`❌ Unscheduled: ${unscheduledCourses.length}`);

      if (unscheduledCourses.length > 0) {
        console.log(`⚠️  Unscheduled courses:`, unscheduledCourses.map(c => `${c.courseCode}(${c.studentCount})`));
      }

      setGeneratedSchedule(schedule);
      setScheduleStats({
        totalCourses: examCourses.length,
        scheduledCourses,
        unscheduledCourses: unscheduledCourses.length,
        totalScheduleItems: schedule.length,
        venueAssignments: schedule.length,
      });

      const successRate = Math.round((scheduledCourses / examCourses.length) * 100);

      toast({
        title: "Schedule Generated!",
        description: `${successRate}% success rate: ${scheduledCourses}/${examCourses.length} courses scheduled across ${schedule.length} venue assignments!`,
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
          <CardTitle className="text-xl">Enhanced Schedule Analysis</CardTitle>
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
              <p className="text-sm text-gray-600">Total Capacity/Session</p>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-green-800 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Enhanced Algorithm: Optimized venue packing + largest-first scheduling strategy
            </p>
          </div>

          {startDate && endDate && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Selected date range: {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} days, 
                {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) * parseInt(maxExamsPerDay)} total time slots available
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
            Enhanced Venue Distribution
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
              Enhanced capacity: <span className="font-semibold">{totalVenueCapacity.toLocaleString()}</span> students per session 
              (optimized venue distribution)
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
              Enhanced Schedule Generated
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
              Enhanced algorithm scheduled {scheduleStats.scheduledCourses} out of {scheduleStats.totalCourses} courses 
              with optimal venue utilization!
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
              Enhanced scheduler ready: {examCourses.length} courses, optimized venue packing enabled
            </div>
            <p className="text-sm text-gray-400">
              The enhanced algorithm uses largest-first scheduling with optimized venue capacity utilization.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ExamScheduleGenerator;
