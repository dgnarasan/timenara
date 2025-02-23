import { useState, useEffect } from "react";
import { Course, ScheduleItem } from "@/lib/types";
import { fetchCourses, addCourse, addCourses, deleteCourse, deleteAllCourses } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import StatsCards from "@/components/dashboard/StatsCards";
import CourseScheduleSection from "@/components/dashboard/CourseScheduleSection";
import CourseManagementSection from "@/components/dashboard/CourseManagementSection";
import { generateSchedule } from "@/services/scheduleGenerator";
import { getActiveInstructors, getAcademicLevels } from "@/utils/scheduling/courseUtils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import PDFUploader from "@/components/PDFUploader";

const AdminDashboard = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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

  const handleDeleteCourse = async (courseId: string) => {
    try {
      await deleteCourse(courseId);
      setCourses(prev => prev.filter(course => course.id !== courseId));
      toast({
        title: "Course Deleted",
        description: "The course has been removed successfully.",
      });
    } catch (error) {
      toast({
        title: "Error Deleting Course",
        description: error instanceof Error ? error.message : "Failed to delete course",
        variant: "destructive",
      });
    }
  };

  const handleClearAllCourses = async () => {
    try {
      await deleteAllCourses();
      setCourses([]);
      toast({
        title: "All Courses Deleted",
        description: "All courses have been removed successfully.",
      });
    } catch (error) {
      toast({
        title: "Error Deleting Courses",
        description: error instanceof Error ? error.message : "Failed to delete courses",
        variant: "destructive",
      });
    }
  };

  const handleGenerateSchedule = async () => {
    try {
      const { schedule: newSchedule, conflicts } = await generateSchedule(courses);
      
      if (conflicts.length > 0) {
        conflicts.forEach(({ reason }) => {
          toast({
            title: "Scheduling Conflict",
            description: reason,
            variant: "destructive",
          });
        });
      }

      if (newSchedule.length > 0) {
        setSchedule(newSchedule);
        toast({
          title: "Schedule Generated",
          description: `Successfully scheduled ${newSchedule.length} courses${
            conflicts.length > 0 ? ' with some conflicts' : ''
          }`,
        });
      } else {
        toast({
          title: "Generation Failed",
          description: "Could not generate a valid schedule. Please check the conflicts and try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate schedule",
        variant: "destructive",
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
      setIsDialogOpen(false);
      toast({
        title: "Courses Added",
        description: `Successfully added ${newCourses.length} courses`,
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
    <div className="container mx-auto py-8 min-h-screen bg-background">
      <div className="mb-8 bg-card rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Manage and generate your department's course schedule
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="shadow-sm">Generate with AI</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Course Input Assistant</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <PDFUploader onCoursesExtracted={handleCoursesExtracted} />
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <StatsCards
          totalCourses={courses.length}
          academicLevels={getAcademicLevels(courses)}
          activeInstructors={getActiveInstructors(courses)}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          <div className="bg-card rounded-lg p-6 shadow-sm">
            <CourseScheduleSection schedule={schedule} />
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-card rounded-lg p-6 shadow-sm">
            <CourseManagementSection
              courses={courses}
              onAddCourse={handleAddCourse}
              onCoursesExtracted={handleCoursesExtracted}
              onEditCourse={handleEditCourse}
              onDeleteCourse={handleDeleteCourse}
              onClearAllCourses={handleClearAllCourses}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
