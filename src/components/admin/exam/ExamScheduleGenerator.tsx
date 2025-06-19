
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

// Official Caleb University venue list with exact capacities
const OFFICIAL_VENUES = [
  { name: "Mass Comm Auditorium", capacity: 300 },
  { name: "Multipurpose Hall", capacity: 250 }, 
  { name: "Psychology Building", capacity: 120 },
  { name: "UPEB Room 1", capacity: 100 },
  { name: "UPEB Room 2", capacity: 100 },
  { name: "R101", capacity: 80 },
  { name: "R102", capacity: 80 },
  { name: "L101", capacity: 60 },
  { name: "L102", capacity: 60 },
  { name: "Library Hall", capacity: 100 },
  { name: "CHM Lab", capacity: 80 },
  { name: "Conference Room A", capacity: 40 },
  { name: "Conference Room B", capacity: 40 },
  { name: "Computer Lab 1", capacity: 30 },
];

// Official time slots matching Caleb University format
const TIME_SLOTS = [
  { name: "Morning", startTime: "08:00", endTime: "11:00", label: "8:00 a.m - 11 Noon" },
  { name: "Midday", startTime: "12:00", endTime: "15:00", label: "12pm - 3:00pm" },
  { name: "Evening", startTime: "15:30", endTime: "18:30", label: "3:30pm - 6:30pm" },
];

interface StudentGroup {
  college: string;
  level: string;
  key: string;
}

interface DailyScheduleTracker {
  [studentGroupKey: string]: {
    [day: string]: number; // number of exams scheduled for this group on this day
  };
}

const ExamScheduleGenerator = ({ onScheduleGenerated }: ExamScheduleGeneratorProps) => {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSchedule, setGeneratedSchedule] = useState<ExamScheduleItem[]>([]);
  const [scheduleStats, setScheduleStats] = useState<any>(null);
  const [schedulingErrors, setSchedulingErrors] = useState<string[]>([]);

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

  const generateExamSchedule = async () => {
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
    setSchedulingErrors([]);

    try {
      console.log("🚀 OFFICIAL CALEB EXAM SCHEDULING STARTED");
      console.log(`📊 Total courses to schedule: ${examCourses.length}`);

      // Generate weekdays only (skip weekends)
      const examDays = [];
      let currentDate = new Date(startDate);
      while (currentDate <= endDate && examDays.length < 10) {
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Skip Sunday (0) and Saturday (6)
          examDays.push(new Date(currentDate));
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      console.log(`📅 Exam days: ${examDays.length} weekdays`);
      
      if (examDays.length === 0) {
        throw new Error("No valid exam days found in the selected date range.");
      }

      // Initialize student daily tracker
      const studentDailyTracker: DailyScheduleTracker = {};
      
      // Initialize tracker for all student groups
      examCourses.forEach(course => {
        const studentGroupKey = `${course.college}-${course.level}`;
        if (!studentDailyTracker[studentGroupKey]) {
          studentDailyTracker[studentGroupKey] = {};
        }
        examDays.forEach(day => {
          const dayKey = format(day, 'yyyy-MM-dd');
          studentDailyTracker[studentGroupKey][dayKey] = 0;
        });
      });

      const schedule: ExamScheduleItem[] = [];
      const errors: string[] = [];
      const totalSlots = examDays.length * TIME_SLOTS.length; // 10 days × 3 slots = 30 slots
      
      console.log(`🎯 Total available slots: ${totalSlots}`);

      // Sort courses by student count (largest first) for better scheduling
      const sortedCourses = [...examCourses].sort((a, b) => (b.studentCount || 0) - (a.studentCount || 0));
      
      let scheduledCount = 0;
      let currentSlotIndex = 0;

      // Main scheduling loop
      for (const course of sortedCourses) {
        let courseScheduled = false;
        let attemptCount = 0;
        const maxAttempts = totalSlots;

        while (!courseScheduled && attemptCount < maxAttempts) {
          const dayIndex = Math.floor(currentSlotIndex / TIME_SLOTS.length) % examDays.length;
          const slotIndex = currentSlotIndex % TIME_SLOTS.length;
          const examDay = examDays[dayIndex];
          const timeSlot = TIME_SLOTS[slotIndex];
          const dayKey = format(examDay, 'yyyy-MM-dd');
          
          const studentGroupKey = `${course.college}-${course.level}`;

          // Check if this student group has reached their daily limit (2 exams per day)
          const currentExamsForGroup = studentDailyTracker[studentGroupKey]?.[dayKey] || 0;
          
          if (currentExamsForGroup < 2) {
            // Find suitable venue
            const suitableVenue = OFFICIAL_VENUES.find(venue => 
              venue.capacity >= (course.studentCount || 0)
            );

            if (suitableVenue) {
              // Schedule the course
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
                startTime: timeSlot.startTime,
                endTime: timeSlot.endTime,
                sessionName: timeSlot.name as 'Morning' | 'Midday' | 'Afternoon',
                venueName: suitableVenue.name,
              };

              schedule.push(scheduleItem);
              studentDailyTracker[studentGroupKey][dayKey]++;
              courseScheduled = true;
              scheduledCount++;

              console.log(`✅ Scheduled: ${course.courseCode} (${course.studentCount} students) - ${format(examDay, 'EEEE, MMMM dd')} ${timeSlot.name} in ${suitableVenue.name}`);
            } else {
              // Try to split large course across multiple venues
              const largestVenue = OFFICIAL_VENUES[0]; // Mass Comm Auditorium
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
                startTime: timeSlot.startTime,
                endTime: timeSlot.endTime,
                sessionName: timeSlot.name as 'Morning' | 'Midday' | 'Afternoon',
                venueName: largestVenue.name,
              };

              schedule.push(scheduleItem);
              studentDailyTracker[studentGroupKey][dayKey]++;
              courseScheduled = true;
              scheduledCount++;

              console.log(`⚠️ Large course scheduled: ${course.courseCode} (${course.studentCount} students) in ${largestVenue.name} - may need multiple sessions`);
            }
          }

          currentSlotIndex = (currentSlotIndex + 1) % totalSlots;
          attemptCount++;
        }

        if (!courseScheduled) {
          const errorMsg = `❌ Could not schedule ${course.courseCode} - ${course.courseTitle} (${course.studentCount} students)`;
          errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

      console.log(`\n🎯 SCHEDULING RESULTS:`);
      console.log(`✅ Successfully scheduled: ${scheduledCount}/${examCourses.length} courses`);
      console.log(`📊 Success rate: ${Math.round((scheduledCount / examCourses.length) * 100)}%`);
      console.log(`⚠️ Scheduling errors: ${errors.length}`);

      setGeneratedSchedule(schedule);
      setSchedulingErrors(errors);
      setScheduleStats({
        totalCourses: examCourses.length,
        scheduledCourses: scheduledCount,
        unscheduledCourses: examCourses.length - scheduledCount,
        successRate: Math.round((scheduledCount / examCourses.length) * 100),
        totalSlots: totalSlots,
        usedSlots: schedule.length,
        utilizationRate: Math.round((schedule.length / totalSlots) * 100),
      });

      const successRate = Math.round((scheduledCount / examCourses.length) * 100);

      if (scheduledCount === examCourses.length) {
        toast({
          title: "Perfect Schedule Generated!",
          description: `All ${examCourses.length} courses successfully scheduled across ${examDays.length} exam days!`,
        });
      } else {
        toast({
          title: "Schedule Generated",
          description: `${successRate}% success: ${scheduledCount}/${examCourses.length} courses scheduled. Check console for details.`,
          variant: errors.length > 0 ? "destructive" : "default",
        });
      }

    } catch (error) {
      console.error("❌ Scheduling error:", error);
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

    console.log("Saving official Caleb exam schedule with", generatedSchedule.length, "items");
    saveScheduleMutation.mutate({ 
      schedule: generatedSchedule, 
      isPublished: publish 
    });
  };

  const totalStudentRegistrations = examCourses.reduce((sum, course) => sum + (course.studentCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Configuration Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Official Caleb University Exam Scheduler
          </CardTitle>
          <CardDescription>
            Generate exam schedule following official Caleb University format and constraints
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

          {/* Generate Button */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <Button 
              onClick={generateExamSchedule} 
              disabled={isGenerating || isLoading || !startDate || !endDate}
              className="w-full sm:w-auto"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Generating Official Schedule...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Generate Official Exam Schedule
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

      {/* Official Format Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Official Caleb University Format</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{examCourses.length}</div>
              <p className="text-sm text-gray-600">Total Courses</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{totalStudentRegistrations.toLocaleString()}</div>
              <p className="text-sm text-gray-600">Student Registrations</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">30</div>
              <p className="text-sm text-gray-600">Available Slots (10 days × 3 sessions)</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TIME_SLOTS.map((slot, index) => (
              <div key={index} className="p-3 bg-blue-50 rounded-lg text-center">
                <div className="font-semibold text-blue-800">{slot.name}</div>
                <div className="text-sm text-blue-600">{slot.label}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Official Venues */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Official Caleb University Venues
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {OFFICIAL_VENUES.map((venue, index) => (
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
              Official Caleb Exam Schedule Generated
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
                <div className="text-2xl font-bold text-blue-600">{scheduleStats.usedSlots}/{scheduleStats.totalSlots}</div>
                <p className="text-sm text-gray-600">Slots Used</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{scheduleStats.successRate}%</div>
                <p className="text-sm text-gray-600">Success Rate</p>
              </div>
            </div>
            
            {schedulingErrors.length > 0 && (
              <div className="mb-4 p-3 bg-red-50 rounded-lg">
                <p className="text-sm font-medium text-red-800 mb-2">Scheduling Issues:</p>
                <ul className="text-xs text-red-700 space-y-1">
                  {schedulingErrors.slice(0, 5).map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                  {schedulingErrors.length > 5 && (
                    <li className="font-medium">... and {schedulingErrors.length - 5} more issues</li>
                  )}
                </ul>
              </div>
            )}

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
                View Official Schedule
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
              Ready to generate official Caleb University exam schedule
            </div>
            <p className="text-sm text-gray-400">
              Following official format: 2 exams per student per day, capacity-aware venue allocation.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ExamScheduleGenerator;
