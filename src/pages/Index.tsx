
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

  const generateSchedule = () => {
    // This is a simplified version of schedule generation
    // In a real application, this would be more complex
    const dummyVenue: Venue = {
      id: "v1",
      name: "Room 101",
      capacity: 50,
      availability: [],
    };

    const dummyTimeSlot: TimeSlot = {
      day: "Monday",
      startTime: "9:00",
      endTime: "10:00",
    };

    const newSchedule: ScheduleItem[] = courses.map((course) => ({
      ...course,
      venue: dummyVenue,
      timeSlot: dummyTimeSlot,
    }));

    setSchedule(newSchedule);
    toast({
      title: "Schedule Generated",
      description: "Timetable has been created successfully",
    });
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
