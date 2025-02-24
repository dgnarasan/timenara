
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
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Download, Upload, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";

const AdminDashboard = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showTemplateUpload, setShowTemplateUpload] = useState(false);
  const [pendingCourses, setPendingCourses] = useState<Omit<Course, "id">[]>([]);

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

  const handleGenerateAI = async () => {
    try {
      if (courses.length === 0) {
        toast({
          title: "No Courses Found",
          description: "Please add courses before generating a schedule",
          variant: "destructive",
        });
        return;
      }

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
        setIsDialogOpen(false);
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

  const downloadTemplate = () => {
    const template = [
      ["Course Code*", "Course Name*", "Lecturer Name*", "Class Size*"],
      ["CS101", "Introduction to Computer Science", "Dr. John Doe", "30"],
    ];

    const ws = XLSX.utils.aoa_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Course Template");
    ws["!cols"] = [{ width: 15 }, { width: 40 }, { width: 25 }, { width: 15 }];
    XLSX.writeFile(wb, "course_template.xlsx");
    toast({
      title: "Template Downloaded",
      description: "Fill in the template and upload it back to add courses.",
    });
  };

  const validateAndProcessCourses = (rows: string[][]): Omit<Course, "id">[] => {
    const validationErrors: string[] = [];
    const processedCourses = rows.slice(1).map((row, index) => {
      if (row.length < 4) {
        validationErrors.push(`Row ${index + 2}: Missing required fields`);
        return null;
      }

      const code = row[0]?.toString().trim();
      const name = row[1]?.toString().trim();
      const lecturer = row[2]?.toString().trim();
      const classSize = parseInt(row[3]) || 0;

      if (!code || !/^[A-Z]{2,4}\d{3,4}$/.test(code)) {
        validationErrors.push(`Row ${index + 2}: Invalid course code format (e.g., CS101)`);
        return null;
      }

      if (!name || name.length < 3) {
        validationErrors.push(`Row ${index + 2}: Course name is too short`);
        return null;
      }

      if (!lecturer) {
        validationErrors.push(`Row ${index + 2}: Lecturer name is required`);
        return null;
      }

      if (classSize <= 0 || classSize > 1000) {
        validationErrors.push(`Row ${index + 2}: Invalid class size (must be between 1-1000)`);
        return null;
      }

      return { code, name, lecturer, classSize };
    }).filter((course): course is Omit<Course, "id"> => course !== null);

    if (validationErrors.length > 0) {
      throw new Error("Validation errors found:\n" + validationErrors.join("\n"));
    }

    return processedCourses;
  };

  const handleTemplateUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];

      const headers = rows[0];
      const expectedHeaders = ["Course Code*", "Course Name*", "Lecturer Name*", "Class Size*"];
      if (!expectedHeaders.every((header, index) => headers[index] === header)) {
        throw new Error("Invalid template format. Please use the provided template.");
      }

      const newCourses = validateAndProcessCourses(rows);
      
      if (newCourses.length === 0) {
        throw new Error("No valid courses found in template");
      }

      await handleCoursesExtracted(newCourses);
      setShowTemplateUpload(false);
      setIsDialogOpen(false);
      event.target.value = "";

    } catch (error) {
      toast({
        title: "Error Processing Template",
        description: error instanceof Error ? error.message : "Failed to process template",
        variant: "destructive",
      });
      event.target.value = "";
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
              <Button 
                className="shadow-sm"
                disabled={courses.length === 0}
              >
                Generate with AI
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate AI Schedule</DialogTitle>
                <DialogDescription>
                  Generate an optimized schedule for {courses.length} courses using AI
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Scheduling Constraints</h4>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                    <li>No lecturer teaches multiple classes simultaneously</li>
                    <li>No venue hosts multiple classes at the same time</li>
                    <li>Class sizes respect venue capacities</li>
                    <li>Courses are distributed evenly across the week</li>
                    <li>Time slots are from 9:00 to 17:00, Monday to Friday</li>
                  </ul>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleGenerateAI}>
                  Generate Schedule
                </Button>
              </DialogFooter>
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
