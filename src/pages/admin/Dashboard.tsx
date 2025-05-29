
import { useState, useEffect, useCallback } from "react";
import { Course } from "@/lib/types";
import { useCourses } from "@/hooks/useCourses";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useDashboardState } from "@/hooks/useDashboardState";
import { useDashboardHandlers } from "@/hooks/useDashboardHandlers";
import { filterCoursesByCollege } from "@/utils/dashboard/courseFiltering";
import StatsCards from "@/components/dashboard/StatsCards";
import CourseScheduleSection from "@/components/dashboard/CourseScheduleSection";
import CourseManagementSection from "@/components/dashboard/CourseManagementSection";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardActionButtons from "@/components/dashboard/DashboardActionButtons";
import ErrorBoundary from "@/components/ErrorBoundary";
import { getActiveInstructors, getAcademicLevels } from "@/utils/scheduling/courseUtils";

const AdminDashboard = () => {
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const {
    courses,
    isLoading,
    handleAddCourse,
    handleAddCourses,
    handleDeleteCourse,
    handleClearAllCourses,
  } = useCourses();
  const { signOut, userCollege } = useAuth();
  const navigate = useNavigate();
  
  const {
    schedule,
    isLoadingSchedule,
    isPublishing,
    isSchedulePublished,
    isClearingSchedule,
    handleTogglePublish,
    handleClearSchedule,
    handleScheduleGenerated,
  } = useDashboardState();

  // Enhanced validation for courses
  const isValidCourse = useCallback((course: any): course is Course => {
    if (!course || typeof course !== 'object') {
      return false;
    }

    const requiredFields = ['id', 'code', 'name', 'lecturer', 'department', 'classSize'];
    
    for (const field of requiredFields) {
      if (!course[field]) {
        return false;
      }
    }

    return true;
  }, []);

  const {
    handleAdminAddCourse,
    handleAdminAddCourses,
    handleEditCourse,
  } = useDashboardHandlers({
    userCollege,
    handleAddCourse,
    handleAddCourses,
  });

  // Filter courses based on admin's college
  useEffect(() => {
    const filtered = filterCoursesByCollege(courses, userCollege, isValidCourse);
    setFilteredCourses(filtered);
  }, [courses, userCollege, isValidCourse]);

  const handleNavigateHome = useCallback(() => navigate("/"), [navigate]);
  const handleNavigateStudentView = useCallback(() => navigate("/schedule"), [navigate]);

  if (isLoading || isLoadingSchedule) {
    return (
      <div className="container mx-auto py-8 min-h-screen bg-background">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  console.log('🎨 Dashboard: Final render with schedule:', {
    scheduleLength: schedule.length,
    filteredCoursesLength: filteredCourses.length,
    isClearingSchedule
  });

  return (
    <div className="container mx-auto py-8 min-h-screen bg-background">
      <div className="mb-8 bg-card rounded-lg p-6 shadow-sm">
        <DashboardHeader
          userCollege={userCollege}
          onNavigateHome={handleNavigateHome}
          onNavigateStudentView={handleNavigateStudentView}
          onSignOut={signOut}
        />

        <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-end mb-6">
          <DashboardActionButtons
            courses={filteredCourses}
            schedule={schedule}
            isSchedulePublished={isSchedulePublished}
            isPublishing={isPublishing}
            isClearingSchedule={isClearingSchedule}
            onScheduleGenerated={handleScheduleGenerated}
            onTogglePublish={handleTogglePublish}
            onClearSchedule={handleClearSchedule}
          />
        </div>

        <ErrorBoundary>
          <StatsCards
            totalCourses={filteredCourses.length}
            academicLevels={getAcademicLevels(filteredCourses)}
            activeInstructors={getActiveInstructors(filteredCourses)}
          />
        </ErrorBoundary>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          <div className="bg-card rounded-lg p-6 shadow-sm">
            <ErrorBoundary>
              <CourseScheduleSection 
                schedule={schedule} 
                isPublished={isSchedulePublished}
              />
            </ErrorBoundary>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-card rounded-lg p-6 shadow-sm">
            <ErrorBoundary>
              <CourseManagementSection
                courses={filteredCourses}
                onAddCourse={handleAdminAddCourse}
                onCoursesExtracted={handleAdminAddCourses}
                onEditCourse={handleEditCourse}
                onDeleteCourse={handleDeleteCourse}
                onClearAllCourses={handleClearAllCourses}
              />
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
