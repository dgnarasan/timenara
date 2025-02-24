
import { useState } from "react";
import { ScheduleItem } from "@/lib/types";
import { useCourses } from "@/hooks/useCourses";
import StatsCards from "@/components/dashboard/StatsCards";
import CourseScheduleSection from "@/components/dashboard/CourseScheduleSection";
import CourseManagementSection from "@/components/dashboard/CourseManagementSection";
import GenerateScheduleDialog from "@/components/dashboard/GenerateScheduleDialog";
import { getActiveInstructors, getAcademicLevels } from "@/utils/scheduling/courseUtils";

const AdminDashboard = () => {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const {
    courses,
    isLoading,
    handleAddCourse,
    handleAddCourses,
    handleDeleteCourse,
    handleClearAllCourses,
  } = useCourses();

  const handleEditCourse = (course: Course) => {
    toast({
      title: "Edit Course",
      description: "Edit functionality coming soon",
    });
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
          <GenerateScheduleDialog 
            courses={courses}
            onScheduleGenerated={setSchedule}
          />
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
              onCoursesExtracted={handleAddCourses}
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
