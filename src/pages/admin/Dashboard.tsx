
import { useState, useEffect } from "react";
import { Course, ScheduleItem } from "@/lib/types";
import { fetchCourses, addCourse, addCourses } from "@/lib/db";
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

  const handleGenerateSchedule = () => {
    const { schedule: newSchedule, conflicts } = generateSchedule(courses);
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
      setIsDialogOpen(false);
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
    <div className="container mx-auto py-8 min-h-screen bg-background">
      {/* Header Section */}
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

        {/* Stats Cards */}
        <StatsCards
          totalCourses={courses.length}
          academicLevels={getAcademicLevels(courses)}
          activeInstructors={getActiveInstructors(courses)}
        />
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Column - Schedule */}
        <div className="space-y-8">
          <div className="bg-card rounded-lg p-6 shadow-sm">
            <CourseScheduleSection schedule={schedule} />
          </div>
        </div>

        {/* Right Column - Course Management */}
        <div className="space-y-8">
          <div className="bg-card rounded-lg p-6 shadow-sm">
            <CourseManagementSection
              courses={courses}
              onAddCourse={handleAddCourse}
              onCoursesExtracted={handleCoursesExtracted}
              onEditCourse={handleEditCourse}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
