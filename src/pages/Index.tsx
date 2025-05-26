
import { useState, useEffect } from "react";
import { Course, ScheduleItem, Venue, TimeSlot } from "@/lib/types";
import { useCourses } from "@/hooks/useCourses";
import CourseCard from "@/components/CourseCard";
import AddCourseForm from "@/components/AddCourseForm";
import PDFUploader from "@/components/PDFUploader";
import Timetable from "@/components/Timetable";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { FileText, Users, GraduationCap, BookOpen } from "lucide-react";

const Index = () => {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const { toast } = useToast();
  const { 
    courses, 
    isLoading, 
    handleAddCourse, 
    handleAddCourses, 
    handleDeleteCourse, 
    handleClearAllCourses 
  } = useCourses();

  const isFoundationalCourse = (courseCode: string): boolean => {
    return /^[A-Z]{2}10[0-9]/.test(courseCode);
  };

  const hasConsecutiveClasses = (
    lecturer: string,
    timeSlot: TimeSlot,
    existingSchedule: ScheduleItem[]
  ): boolean => {
    const lecturerClasses = existingSchedule.filter(
      (item) => item.lecturer === lecturer && item.timeSlot.day === timeSlot.day
    );
    
    const currentHour = parseInt(timeSlot.startTime);
    let consecutiveCount = 1;

    lecturerClasses.forEach((item) => {
      const itemHour = parseInt(item.timeSlot.startTime);
      if (Math.abs(itemHour - currentHour) <= 2) {
        consecutiveCount++;
      }
    });

    return consecutiveCount > 3;
  };

  const hasConflict = (
    timeSlot: TimeSlot,
    venue: Venue,
    lecturer: string,
    existingSchedule: ScheduleItem[]
  ): boolean => {
    return existingSchedule.some(
      (item) =>
        item.timeSlot.day === timeSlot.day &&
        item.timeSlot.startTime === timeSlot.startTime &&
        (item.venue.id === venue.id || item.lecturer === lecturer)
    );
  };

  const findNextBestTimeSlot = (
    venues: Venue[],
    lecturer: string,
    currentSchedule: ScheduleItem[],
    preferredDay?: string
  ): { timeSlot: TimeSlot; venue: Venue } | null => {
    const days = preferredDay 
      ? [preferredDay] 
      : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const times = Array.from({ length: 9 }, (_, i) => `${i + 9}:00`);

    for (const day of days) {
      for (const startTime of times) {
        for (const venue of venues) {
          const timeSlot: TimeSlot = {
            day: day as TimeSlot["day"],
            startTime,
            endTime: `${parseInt(startTime) + 1}:00`,
          };

          if (!hasConflict(timeSlot, venue, lecturer, currentSchedule) &&
              !hasConsecutiveClasses(lecturer, timeSlot, currentSchedule)) {
            return { timeSlot, venue };
          }
        }
      }
    }

    return null;
  };

  const suggestClassSplitting = (
    course: Course,
    venues: Venue[]
  ): { groups: number; suggestedSize: number; venue: Venue } | null => {
    const largestVenue = venues.reduce((max, venue) => 
      venue.capacity > max.capacity ? venue : max
    );

    if (course.classSize > largestVenue.capacity) {
      const groups = Math.ceil(course.classSize / largestVenue.capacity);
      const suggestedSize = Math.ceil(course.classSize / groups);
      return {
        groups,
        suggestedSize,
        venue: largestVenue
      };
    }

    return null;
  };

  const generateSchedule = () => {
    const venues: Venue[] = [
      {
        id: "v1",
        name: "Room 101",
        capacity: 30,
        availability: [],
      },
      {
        id: "v2",
        name: "Room 102",
        capacity: 50,
        availability: [],
      },
      {
        id: "v3",
        name: "Lecture Hall 1",
        capacity: 100,
        availability: [],
      },
    ];

    const newSchedule: ScheduleItem[] = [];
    const conflicts: Array<{ course: Course; reason: string }> = [];

    const sortedCourses = [...courses].sort((a, b) => {
      if (isFoundationalCourse(a.code) && !isFoundationalCourse(b.code)) return -1;
      if (!isFoundationalCourse(a.code) && isFoundationalCourse(b.code)) return 1;
      return b.classSize - a.classSize;
    });

    for (const course of sortedCourses) {
      const splitSuggestion = suggestClassSplitting(course, venues);
      if (splitSuggestion) {
        conflicts.push({
          course,
          reason: `Class size (${course.classSize}) exceeds maximum venue capacity (${splitSuggestion.venue.capacity}). ` +
                  `Suggestion: Split into ${splitSuggestion.groups} groups of ${splitSuggestion.suggestedSize} students.`
        });
        continue;
      }

      const suitableVenues = venues.filter(
        (venue) => venue.capacity >= course.classSize
      );

      if (suitableVenues.length === 0) {
        conflicts.push({
          course,
          reason: "No venue with sufficient capacity available."
        });
        continue;
      }

      let assignment = findNextBestTimeSlot(
        suitableVenues,
        course.lecturer,
        newSchedule,
        course.preferredSlots?.[0]?.day
      );

      if (!assignment && course.preferredSlots?.[0]?.day) {
        assignment = findNextBestTimeSlot(
          suitableVenues,
          course.lecturer,
          newSchedule
        );
      }

      if (assignment) {
        newSchedule.push({
          ...course,
          venue: assignment.venue,
          timeSlot: assignment.timeSlot,
        });
      } else {
        conflicts.push({
          course,
          reason: "No suitable time slot available due to lecturer scheduling constraints."
        });
      }
    }

    setSchedule(newSchedule);

    if (conflicts.length > 0) {
      conflicts.forEach(({ course, reason }) => {
        toast({
          title: `Scheduling Conflict: ${course.code}`,
          description: reason,
          variant: "destructive",
        });
      });
    } else {
      toast({
        title: "Schedule Generated Successfully",
        description: "All courses have been scheduled without conflicts.",
      });
    }
  };

  const handleEditCourse = (course: Course) => {
    toast({
      title: "Edit Course",
      description: "Edit functionality coming soon",
    });
  };

  const handleCoursesExtracted = async (extractedCourses: Omit<Course, "id">[]) => {
    const success = await handleAddCourses(extractedCourses);
    if (!success) {
      toast({
        title: "Error Adding Courses",
        description: "Failed to add courses from PDF",
        variant: "destructive",
      });
    }
  };

  const getActiveInstructors = () => {
    return new Set(courses.map(course => course.lecturer)).size;
  };

  const getAcademicLevels = () => {
    return new Set(courses.map(course => course.code.substring(0, 4))).size;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Course Timetable</h1>
            <p className="text-muted-foreground">
              Manage and view your department's course schedule
            </p>
          </div>
          <Button onClick={generateSchedule}>
            Generate Schedule
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Courses</p>
                <h3 className="text-2xl font-bold">{courses.length}</h3>
                <p className="text-sm text-muted-foreground">Courses in current schedule</p>
              </div>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </div>
          </Card>

          <Card className="p-6 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Academic Levels</p>
                <h3 className="text-2xl font-bold">{getAcademicLevels()}</h3>
                <p className="text-sm text-muted-foreground">Different course levels</p>
              </div>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </div>
          </Card>

          <Card className="p-6 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Instructors</p>
                <h3 className="text-2xl font-bold">{getActiveInstructors()}</h3>
                <p className="text-sm text-muted-foreground">Active instructors</p>
              </div>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
          </Card>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Course Schedule</h2>
            <div className="space-x-2">
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>
          <Timetable schedule={schedule} />
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Add Courses</h2>
          <p className="text-sm text-muted-foreground">
            Upload course lists to generate an AI-optimized timetable
          </p>
          
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Course Input Assistant</h3>
              <PDFUploader onCoursesExtracted={handleCoursesExtracted} />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Manual Input</h3>
              <AddCourseForm onSubmit={handleAddCourse} />
            </div>

            {courses.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Current Courses</h3>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (window.confirm("Are you sure you want to remove all courses?")) {
                        handleClearAllCourses();
                      }
                    }}
                  >
                    Clear All
                  </Button>
                </div>
                <div className="grid gap-4">
                  {courses.map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      onEdit={handleEditCourse}
                      onDelete={() => handleDeleteCourse(course.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
