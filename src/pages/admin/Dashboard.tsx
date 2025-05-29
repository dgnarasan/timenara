import { useState, useEffect, useCallback } from "react";
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
import { fetchAdminSchedule, clearSchedule, publishSchedule } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { LogOut, Calendar, Home, Trash2, Eye, EyeOff } from "lucide-react";

// More flexible validation function
const isValidScheduleItem = (item: any): item is ScheduleItem => {
  console.log('Validating schedule item:', item);
  
  // Basic structure check
  if (!item || typeof item !== 'object') {
    console.log('Invalid: not an object');
    return false;
  }

  // Required string fields
  const requiredStringFields = ['id', 'code', 'name', 'lecturer', 'department'];
  for (const field of requiredStringFields) {
    if (!item[field] || typeof item[field] !== 'string') {
      console.log(`Invalid: missing or invalid ${field}:`, item[field]);
      return false;
    }
  }

  // Required number field
  if (typeof item.classSize !== 'number' || item.classSize <= 0) {
    console.log('Invalid: classSize:', item.classSize);
    return false;
  }

  // Venue validation - more flexible
  if (!item.venue || typeof item.venue !== 'object') {
    console.log('Invalid: venue structure:', item.venue);
    return false;
  }

  if (!item.venue.id || !item.venue.name) {
    console.log('Invalid: venue missing id or name:', item.venue);
    return false;
  }

  // TimeSlot validation - more flexible
  if (!item.timeSlot || typeof item.timeSlot !== 'object') {
    console.log('Invalid: timeSlot structure:', item.timeSlot);
    return false;
  }

  if (!item.timeSlot.day || !item.timeSlot.startTime) {
    console.log('Invalid: timeSlot missing day or startTime:', item.timeSlot);
    return false;
  }

  console.log('Valid schedule item:', item.code);
  return true;
};

// Function to filter and validate schedule items
const validateScheduleItems = (scheduleItems: any[]): ScheduleItem[] => {
  console.log('Validating schedule items array:', scheduleItems);
  
  if (!Array.isArray(scheduleItems)) {
    console.warn('Schedule items is not an array:', scheduleItems);
    return [];
  }

  console.log(`Starting validation of ${scheduleItems.length} items`);
  
  const validItems = scheduleItems.filter((item, index) => {
    console.log(`Validating item ${index + 1}:`, item);
    const isValid = isValidScheduleItem(item);
    console.log(`Item ${index + 1} is ${isValid ? 'valid' : 'invalid'}`);
    return isValid;
  });
  
  const invalidCount = scheduleItems.length - validItems.length;
  
  console.log(`Validation complete: ${validItems.length} valid, ${invalidCount} invalid`);
  
  if (invalidCount > 0) {
    console.warn(`Filtered out ${invalidCount} invalid schedule items`);
  }
  
  return validItems;
};

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

  // Filter courses based on admin's college
  useEffect(() => {
    try {
      if (userCollege) {
        const collegeDepartments = collegeStructure.find(c => c.college === userCollege)?.departments || [];
        const filtered = courses.filter(course => collegeDepartments.includes(course.department));
        setFilteredCourses(filtered);
      } else {
        setFilteredCourses(courses);
      }
    } catch (error) {
      console.error('Error filtering courses:', error);
      setFilteredCourses(courses);
    }
  }, [courses, userCollege]);

  // Load existing schedule from database
  useEffect(() => {
    const loadSchedule = async () => {
      try {
        setIsLoadingSchedule(true);
        const existingSchedule = await fetchAdminSchedule();
        console.log('Loaded existing schedule from DB:', existingSchedule);
        
        // Validate and filter schedule items
        const validSchedule = validateScheduleItems(existingSchedule);
        console.log(`Loaded ${validSchedule.length} valid schedule items out of ${existingSchedule.length} total`);
        
        setSchedule(validSchedule);
        setIsSchedulePublished(validSchedule.length > 0);
      } catch (error) {
        console.error('Error loading schedule:', error);
        toast({
          title: "Error",
          description: "Failed to load existing schedule",
          variant: "destructive",
        });
        setSchedule([]);
      } finally {
        setIsLoadingSchedule(false);
      }
    };

    loadSchedule();
  }, [toast]);

  // Handle adding a course, ensuring it belongs to admin's college
  const handleAdminAddCourse = useCallback((course: Omit<Course, "id">) => {
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
  }, [userCollege, handleAddCourse, toast]);

  // Handle adding multiple courses
  const handleAdminAddCourses = useCallback((coursesToAdd: Omit<Course, "id">[]) => {
    try {
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
    } catch (error) {
      console.error('Error adding courses:', error);
      toast({
        title: "Error",
        description: "Failed to add courses. Please try again.",
        variant: "destructive",
      });
    }
  }, [userCollege, handleAddCourses, toast]);

  const handleEditCourse = useCallback((course: Course) => {
    toast({
      title: "Edit Course",
      description: "Edit functionality coming soon",
    });
  }, [toast]);

  const handleScheduleGenerated = useCallback((newSchedule: ScheduleItem[]) => {
    try {
      console.log('Received new schedule with', newSchedule.length, 'items');
      console.log('First few items:', newSchedule.slice(0, 3));
      
      // Validate the new schedule items
      const validSchedule = validateScheduleItems(newSchedule);
      console.log(`Setting ${validSchedule.length} valid schedule items in dashboard`);
      
      // Use setTimeout to prevent React rendering conflicts
      setTimeout(() => {
        setSchedule(validSchedule);
        setIsSchedulePublished(false);
        
        if (validSchedule.length > 0) {
          toast({
            title: "Schedule Updated",
            description: `Successfully loaded ${validSchedule.length} courses`,
          });
        } else {
          toast({
            title: "No Valid Schedule Items",
            description: "All schedule items were filtered out. Check console for validation details.",
            variant: "destructive",
          });
        }
      }, 100);
      
    } catch (error) {
      console.error('Error setting schedule:', error);
      toast({
        title: "Error",
        description: "Failed to update schedule display. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleTogglePublish = useCallback(async () => {
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
  }, [schedule.length, isSchedulePublished, toast]);

  const handleClearSchedule = useCallback(async () => {
    if (window.confirm("Are you sure you want to clear the entire schedule? This action cannot be undone.")) {
      try {
        await clearSchedule();
        setTimeout(() => {
          setSchedule([]);
          setIsSchedulePublished(false);
        }, 100);
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
  }, [toast]);

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

        <StatsCards
          totalCourses={filteredCourses.length}
          academicLevels={getAcademicLevels(filteredCourses)}
          activeInstructors={getActiveInstructors(filteredCourses)}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          <div className="bg-card rounded-lg p-6 shadow-sm">
            <CourseScheduleSection 
              schedule={schedule} 
              isPublished={isSchedulePublished}
            />
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
