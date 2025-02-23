import { useState, useEffect } from "react";
import { Course, ScheduleItem, Venue, TimeSlot } from "@/lib/types";
import { fetchCourses, addCourse, addCourses } from "@/lib/db";
import CourseCard from "@/components/CourseCard";
import AddCourseForm from "@/components/AddCourseForm";
import PDFUploader from "@/components/PDFUploader";
import Timetable from "@/components/Timetable";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const loadedCourses = await fetchCourses();
        setCourses(loadedCourses);
      } catch (error) {
        toast({
          title: "Error Loading Courses",
          description: error instanceof Error ? error.message : "Failed to load courses",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadCourses();
  }, [toast]);

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

  const handleAddCourse = async (newCourse: Omit<Course, "id">) => {
    try {
      const course = await addCourse(newCourse);
      setCourses((prev) => [...prev, course]);
      toast({
        title: "Course Added",
        description: "Successfully added new course",
      });
    } catch (error) {
      toast({
        title: "Error Adding Course",
        description: error instanceof Error ? error.message : "Failed to add course",
        variant: "destructive",
      });
    }
  };

  const handleCoursesExtracted = async (extractedCourses: Omit<Course, "id">[]) => {
    try {
      const newCourses = await addCourses(extractedCourses);
      setCourses((prev) => [...prev, ...newCourses]);
      toast({
        title: "Courses Added",
        description: `Successfully added ${newCourses.length} courses from PDF`,
      });
    } catch (error) {
      toast({
        title: "Error Adding Courses",
        description: error instanceof Error ? error.message : "Failed to add courses",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="text-center space-y-4">
        <div className="inline-block px-3 py-1 bg-secondary rounded-full text-sm font-medium">
          Schedule Generator
        </div>
        <h1 className="text-4xl font-bold tracking-tight">University Timetable</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Create optimal class schedules while preventing time overlaps and
          considering various constraints.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Import Courses from PDF</h2>
            <PDFUploader onCoursesExtracted={handleCoursesExtracted} />
          </div>
          
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Add New Course</h2>
            <AddCourseForm onSubmit={handleAddCourse} />
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Course List</h2>
          <div className="grid gap-4">
            {isLoading ? (
              <p className="text-muted-foreground text-center py-8">Loading courses...</p>
            ) : courses.length > 0 ? (
              courses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onEdit={handleEditCourse}
                />
              ))
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No courses added yet. Add your first course or import from PDF to get started.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Generated Timetable</h2>
          <Button onClick={generateSchedule} disabled={courses.length === 0}>
            Generate Schedule
          </Button>
        </div>
        <Timetable schedule={schedule} />
      </div>
    </div>
  );
};

export default Index;
