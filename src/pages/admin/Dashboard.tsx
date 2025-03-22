
import { useState, useEffect } from "react";
import { Course, ScheduleItem, collegeStructure } from "@/lib/types";
import { useCourses } from "@/hooks/useCourses";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import StatsCards from "@/components/dashboard/StatsCards";
import CourseScheduleSection from "@/components/dashboard/CourseScheduleSection";
import CourseManagementSection from "@/components/dashboard/CourseManagementSection";
import GenerateScheduleDialog from "@/components/dashboard/GenerateScheduleDialog";
import { getActiveInstructors, getAcademicLevels } from "@/utils/scheduling/courseUtils";
import { Button } from "@/components/ui/button";
import { LogOut, Calendar, Home } from "lucide-react";

const AdminDashboard = () => {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const {
    courses,
    isLoading,
    handleAddCourse,
    handleAddCourses,
    handleDeleteCourse,
    handleClearAllCourses,
  } = useCourses();
  const { toast } = useToast();
  const { signOut, userCollege } = useAuth();
  const navigate = useNavigate();

  // Filter courses based on admin's college
  useEffect(() => {
    if (userCollege) {
      const collegeDepartments = collegeStructure.find(c => c.college === userCollege)?.departments || [];
      const filtered = courses.filter(course => collegeDepartments.includes(course.department));
      setFilteredCourses(filtered);
    } else {
      setFilteredCourses(courses);
    }
  }, [courses, userCollege]);

  // Handle adding a course, ensuring it belongs to admin's college
  const handleAdminAddCourse = (course: Omit<Course, "id">) => {
    if (userCollege) {
      const collegeDepartments = collegeStructure.find(c => c.college === userCollege)?.departments || [];
      
      if (!collegeDepartments.includes(course.department)) {
        toast({
          title: "Access Denied",
          description: "You can only add courses for your assigned college.",
          variant: "destructive",
        });
        return;
      }
    }
    
    handleAddCourse(course);
  };

  // Handle adding multiple courses
  const handleAdminAddCourses = (coursesToAdd: Omit<Course, "id">[]) => {
    if (userCollege) {
      const collegeDepartments = collegeStructure.find(c => c.college === userCollege)?.departments || [];
      
      // Filter out courses not in admin's college
      const validCourses = coursesToAdd.filter(course => collegeDepartments.includes(course.department));
      
      if (validCourses.length < coursesToAdd.length) {
        toast({
          title: "Notice",
          description: `${coursesToAdd.length - validCourses.length} courses were skipped as they don't belong to your college.`,
          variant: "default",
        });
      }
      
      if (validCourses.length === 0) {
        toast({
          title: "No courses added",
          description: "None of the provided courses belong to your college.",
          variant: "destructive",
        });
        return;
      }
      
      handleAddCourses(validCourses);
    } else {
      handleAddCourses(coursesToAdd);
    }
  };

  const handleEditCourse = (course: Course) => {
    toast({
      title: "Edit Course",
      description: "Edit functionality coming soon",
    });
  };

  return (
    <div className="container mx-auto py-8 min-h-screen bg-background">
      <div className="mb-8 bg-card rounded-lg p-6 shadow-sm">
        <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              {userCollege ? `Manage timetables for ${userCollege.replace(/\s*\([^)]*\)/g, '')}` : 'Manage and generate your department\'s course schedule'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={() => navigate("/")}
            >
              <Home className="h-4 w-4" />
              Home
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={() => navigate("/schedule")}
            >
              <Calendar className="h-4 w-4" />
              Student View
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={() => signOut()}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
            <GenerateScheduleDialog 
              courses={filteredCourses}
              onScheduleGenerated={setSchedule}
            />
          </div>
        </div>

        <StatsCards
          totalCourses={filteredCourses.length}
          academicLevels={getAcademicLevels(filteredCourses)}
          activeInstructors={getActiveInstructors(filteredCourses)}
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
              courses={filteredCourses}
              onAddCourse={handleAdminAddCourse}
              onCoursesExtracted={handleAdminAddCourses}
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
