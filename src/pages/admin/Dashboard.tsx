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
import ErrorBoundary from "@/components/ErrorBoundary";
import { getActiveInstructors, getAcademicLevels } from "@/utils/scheduling/courseUtils";
import { fetchAdminSchedule, clearSchedule, publishSchedule } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { LogOut, Calendar, Home, Trash2, Eye, EyeOff } from "lucide-react";

const AdminDashboard = () => {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSchedulePublished, setIsSchedulePublished] = useState(false);
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

  // Ultra-strict validation function
  const isValidScheduleItem = (item: any): item is ScheduleItem => {
    console.log('🔍 Dashboard validation check:', { item, type: typeof item });
    
    // First check: must exist and be an object
    if (!item || typeof item !== 'object') {
      console.warn('❌ Dashboard: Item is not an object:', item);
      return false;
    }

    // Check all required string fields
    const requiredStringFields = ['id', 'code', 'name', 'lecturer', 'department'];
    for (const field of requiredStringFields) {
      if (!item[field] || typeof item[field] !== 'string' || item[field].trim() === '') {
        console.warn(`❌ Dashboard: Invalid ${field}:`, item[field]);
        return false;
      }
    }

    // Check classSize
    if (typeof item.classSize !== 'number' || item.classSize <= 0) {
      console.warn('❌ Dashboard: Invalid classSize:', item.classSize);
      return false;
    }

    // Check timeSlot
    if (!item.timeSlot || typeof item.timeSlot !== 'object') {
      console.warn('❌ Dashboard: Invalid timeSlot:', item.timeSlot);
      return false;
    }

    if (!item.timeSlot.day || !item.timeSlot.startTime || !item.timeSlot.endTime) {
      console.warn('❌ Dashboard: Invalid timeSlot properties:', item.timeSlot);
      return false;
    }

    // Check venue
    if (!item.venue || typeof item.venue !== 'object' || !item.venue.name) {
      console.warn('❌ Dashboard: Invalid venue:', item.venue);
      return false;
    }

    console.log('✅ Dashboard: Item is valid');
    return true;
  };

  // Bulletproof schedule filtering function
  const filterValidScheduleItems = (items: any[]): ScheduleItem[] => {
    console.log('🔍 Dashboard: Starting bulletproof filtering:', {
      input: items,
      isArray: Array.isArray(items),
      length: items?.length || 0
    });

    if (!Array.isArray(items)) {
      console.warn('❌ Dashboard: Input is not an array');
      return [];
    }

    const validItems: ScheduleItem[] = [];
    
    items.forEach((item, index) => {
      console.log(`🔍 Dashboard: Processing item ${index}:`, item);
      
      if (isValidScheduleItem(item)) {
        validItems.push(item);
        console.log(`✅ Dashboard: Added valid item ${index}`);
      } else {
        console.warn(`🚫 Dashboard: Rejected invalid item ${index}:`, item);
      }
    });

    console.log(`✅ Dashboard: Filtering complete: ${validItems.length} valid items out of ${items.length}`);
    return validItems;
  };

  // Enhanced validation for courses
  const isValidCourse = (course: any): course is Course => {
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
  };

  // Filter courses based on admin's college
  useEffect(() => {
    try {
      const validCourses = courses.filter(isValidCourse);
      
      if (userCollege) {
        const collegeDepartments = collegeStructure.find(c => c.college === userCollege)?.departments || [];
        const filtered = validCourses.filter(course => collegeDepartments.includes(course.department));
        setFilteredCourses(filtered);
      } else {
        setFilteredCourses(validCourses);
      }
    } catch (error) {
      console.error('Dashboard: Error filtering courses:', error);
      setFilteredCourses([]);
    }
  }, [courses, userCollege]);

  // Load existing schedule from database
  useEffect(() => {
    const loadSchedule = async () => {
      try {
        setIsLoadingSchedule(true);
        console.log('📡 Dashboard: Loading schedule from database...');
        const existingSchedule = await fetchAdminSchedule();
        console.log('📡 Dashboard: Raw schedule from database:', existingSchedule);
        
        if (existingSchedule) {
          const validSchedule = filterValidScheduleItems(existingSchedule);
          console.log('✅ Dashboard: Setting filtered schedule:', validSchedule);
          setSchedule(validSchedule);
          setIsSchedulePublished(validSchedule.length > 0);
        } else {
          console.log('📡 Dashboard: No schedule found');
          setSchedule([]);
          setIsSchedulePublished(false);
        }
      } catch (error) {
        console.error('❌ Dashboard: Error loading schedule:', error);
        setSchedule([]);
        toast({
          title: "Error",
          description: "Failed to load existing schedule",
          variant: "destructive",
        });
      } finally {
        setIsLoadingSchedule(false);
      }
    };

    loadSchedule();
  }, [toast]);

  // Handle adding a course, ensuring it belongs to admin's college
  const handleAdminAddCourse = (course: Omit<Course, "id">) => {
    try {
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
    } catch (error) {
      console.error('Error adding course:', error);
      toast({
        title: "Error",
        description: "Failed to add course. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle adding multiple courses
  const handleAdminAddCourses = (coursesToAdd: Omit<Course, "id">[]) => {
    try {
      if (userCollege) {
        const collegeDepartments = collegeStructure.find(c => c.college === userCollege)?.departments || [];
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
    } catch (error) {
      console.error('Error adding courses:', error);
      toast({
        title: "Error",
        description: "Failed to add courses. Please try again.",
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

  const handleScheduleGenerated = (newSchedule: ScheduleItem[]) => {
    try {
      console.log('🚀 Dashboard: Processing generated schedule:', newSchedule);
      
      if (!Array.isArray(newSchedule)) {
        console.error('❌ Dashboard: Invalid schedule format received:', typeof newSchedule);
        toast({
          title: "Error",
          description: "Invalid schedule format received. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Apply bulletproof filtering
      const validSchedule = filterValidScheduleItems(newSchedule);
      
      console.log('✅ Dashboard: Setting cleaned schedule:', validSchedule);
      setSchedule(validSchedule);
      setIsSchedulePublished(false);
      
      if (validSchedule.length > 0) {
        toast({
          title: "Schedule Generated Successfully",
          description: `${validSchedule.length} courses scheduled without conflicts.`,
        });
      } else {
        toast({
          title: "No Valid Schedule Generated",
          description: "No valid schedule items could be created. Please check your course data and try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ Dashboard: Error processing generated schedule:', error);
      setSchedule([]);
      setIsSchedulePublished(false);
      toast({
        title: "Error",
        description: "Failed to process generated schedule. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleTogglePublish = async () => {
    if (schedule.length === 0) {
      toast({
        title: "No Schedule to Publish",
        description: "Please generate a schedule first before publishing.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsPublishing(true);
      const newPublishStatus = !isSchedulePublished;
      await publishSchedule(newPublishStatus);
      setIsSchedulePublished(newPublishStatus);
      
      toast({
        title: newPublishStatus ? "Schedule Published" : "Schedule Unpublished",
        description: newPublishStatus 
          ? "The schedule is now visible to students." 
          : "The schedule has been hidden from students.",
      });
    } catch (error) {
      console.error('Error toggling publish status:', error);
      toast({
        title: "Error",
        description: "Failed to update publish status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleClearSchedule = async () => {
    if (window.confirm("Are you sure you want to clear the entire schedule? This action cannot be undone.")) {
      try {
        await clearSchedule();
        setSchedule([]);
        setIsSchedulePublished(false);
        toast({
          title: "Schedule Cleared",
          description: "All schedule entries have been removed.",
        });
      } catch (error) {
        console.error('Error clearing schedule:', error);
        toast({
          title: "Error",
          description: "Failed to clear schedule. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

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
    allValid: schedule.every(item => isValidScheduleItem(item))
  });

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
            {schedule.length > 0 && (
              <>
                <Button 
                  variant={isSchedulePublished ? "default" : "outline"}
                  size="sm" 
                  className="gap-2"
                  onClick={handleTogglePublish}
                  disabled={isPublishing}
                >
                  {isSchedulePublished ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  {isPublishing ? "Processing..." : (isSchedulePublished ? "Published" : "Publish")}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  onClick={handleClearSchedule}
                >
                  <Trash2 className="h-4 w-4" />
                  Clear Schedule
                </Button>
              </>
            )}
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
              onScheduleGenerated={handleScheduleGenerated}
            />
          </div>
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
