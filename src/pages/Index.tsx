
import { useState } from "react";
import { Course, ScheduleItem } from "@/lib/types";
import CourseCard from "@/components/CourseCard";
import AddCourseForm from "@/components/AddCourseForm";
import PDFUploader from "@/components/PDFUploader";
import Timetable from "@/components/Timetable";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { FileText, Users, GraduationCap, BookOpen } from "lucide-react";
import { useCourses } from "@/hooks/useCourses";
import { generateScheduleFromCourses } from "@/utils/scheduling/scheduleUtils";

const Index = () => {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const { toast } = useToast();
  
  // Use the useCourses hook for all course operations
  const {
    courses,
    isLoading,
    handleAddCourse,
    handleAddCourses,
    handleDeleteCourse,
    handleClearAllCourses,
  } = useCourses();

  const generateSchedule = () => {
    const { schedule: newSchedule, conflicts } = generateScheduleFromCourses(courses);
    
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

  const getActiveInstructors = () => {
    return new Set(courses.map(course => course.lecturer)).size;
  };

  const getAcademicLevels = () => {
    return new Set(courses.map(course => course.code.substring(0, 4))).size;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading courses...</p>
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
              <PDFUploader onCoursesExtracted={handleAddCourses} />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Manual Input</h3>
              <AddCourseForm onSubmit={handleAddCourse} />
            </div>

            {courses.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Current Courses</h3>
                <div className="grid gap-4">
                  {courses.map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      onEdit={handleEditCourse}
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
