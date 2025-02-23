
import { useState } from "react";
import { Course, ScheduleItem, Venue, TimeSlot } from "@/lib/types";
import CourseCard from "@/components/CourseCard";
import AddCourseForm from "@/components/AddCourseForm";
import Timetable from "@/components/Timetable";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const { toast } = useToast();

  const handleAddCourse = (newCourse: Omit<Course, "id">) => {
    const course: Course = {
      ...newCourse,
      id: Math.random().toString(36).substr(2, 9),
    };
    setCourses([...courses, course]);
  };

  const handleEditCourse = (course: Course) => {
    // Implement edit functionality
    toast({
      title: "Edit Course",
      description: "Edit functionality coming soon",
    });
  };

  // Helper function to check if a time slot conflicts with existing schedules
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

  // Helper function to get available time slots
  const getAvailableTimeSlot = (
    venues: Venue[],
    lecturer: string,
    currentSchedule: ScheduleItem[]
  ): { timeSlot: TimeSlot; venue: Venue } | null => {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const times = Array.from({ length: 9 }, (_, i) => `${i + 9}:00`);

    // Try each possible combination of day, time, and venue
    for (const day of days) {
      for (const startTime of times) {
        for (const venue of venues) {
          const timeSlot: TimeSlot = {
            day: day as TimeSlot["day"],
            startTime,
            endTime: `${parseInt(startTime) + 1}:00`,
          };

          if (!hasConflict(timeSlot, venue, lecturer, currentSchedule)) {
            return { timeSlot, venue };
          }
        }
      }
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
    const unscheduledCourses: Course[] = [];

    // Sort courses by class size (descending) to schedule larger classes first
    const sortedCourses = [...courses].sort((a, b) => b.classSize - a.classSize);

    for (const course of sortedCourses) {
      // Filter suitable venues based on capacity
      const suitableVenues = venues.filter(
        (venue) => venue.capacity >= course.classSize
      );

      if (suitableVenues.length === 0) {
        unscheduledCourses.push(course);
        continue;
      }

      // Find an available time slot and venue
      const assignment = getAvailableTimeSlot(
        suitableVenues,
        course.lecturer,
        newSchedule
      );

      if (assignment) {
        newSchedule.push({
          ...course,
          venue: assignment.venue,
          timeSlot: assignment.timeSlot,
        });
      } else {
        unscheduledCourses.push(course);
      }
    }

    setSchedule(newSchedule);

    if (unscheduledCourses.length > 0) {
      toast({
        title: "Schedule Generated with Conflicts",
        description: `${unscheduledCourses.length} courses could not be scheduled due to constraints.`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Schedule Generated Successfully",
        description: "All courses have been scheduled without conflicts.",
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
          <h2 className="text-2xl font-semibold">Add New Course</h2>
          <AddCourseForm onSubmit={handleAddCourse} />
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Course List</h2>
          <div className="grid gap-4">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onEdit={handleEditCourse}
              />
            ))}
            {courses.length === 0 && (
              <p className="text-muted-foreground text-center py-8">
                No courses added yet. Add your first course to get started.
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
