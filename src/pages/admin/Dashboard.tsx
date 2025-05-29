
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

  // Enhanced validation function for schedule items
  const validateScheduleItem = (item: any): item is ScheduleItem => {
    try {
      console.log('Validating schedule item:', item);
      
      if (!item || typeof item !== 'object') {
        console.warn('Item is null, undefined, or not an object:', item);
        return false;
      }

      const requiredStringFields = ['id', 'code', 'name', 'lecturer', 'department'];
      for (const field of requiredStringFields) {
        if (!item[field] || typeof item[field] !== 'string' || item[field].trim().length === 0) {
          console.warn(`Invalid or missing field '${field}' in schedule item:`, item[field]);
          return false;
        }
      }

      if (typeof item.classSize !== 'number' || item.classSize <= 0) {
        console.warn('Invalid classSize in schedule item:', item.classSize);
        return false;
      }

      if (!item.timeSlot || typeof item.timeSlot !== 'object') {
        console.warn('Invalid timeSlot in schedule item:', item.timeSlot);
        return false;
      }

      const requiredTimeSlotFields = ['day', 'startTime', 'endTime'];
      for (const field of requiredTimeSlotFields) {
        if (!item.timeSlot[field] || typeof item.timeSlot[field] !== 'string' || item.timeSlot[field].trim().length === 0) {
          console.warn(`Invalid timeSlot field '${field}' in schedule item:`, item.timeSlot[field]);
          return false;
        }
      }

      if (!item.venue || typeof item.venue !== 'object' || !item.venue.name || typeof item.venue.name !== 'string' || item.venue.name.trim().length === 0) {
        console.warn('Invalid venue in schedule item:', item.venue);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validating schedule item:', error, item);
      return false;
    }
  };

  // Robust schedule filtering function with better error handling
  const filterAndValidateSchedule = (rawSchedule: any[]): ScheduleItem[] => {
    try {
      console.log('Filtering and validating schedule. Input:', rawSchedule?.length || 0, 'items');
      
      if (!Array.isArray(rawSchedule)) {
        console.warn('Schedule is not an array:', typeof rawSchedule, rawSchedule);
        return [];
      }

      if (rawSchedule.length === 0) {
        console.log('Empty schedule array provided');
        return [];
      }

      const validItems: ScheduleItem[] = [];
      const invalidItems: any[] = [];

      rawSchedule.forEach((item, index) => {
        try {
          if (validateScheduleItem(item)) {
            validItems.push(item as ScheduleItem);
          } else {
            console.warn(`Item at index ${index} failed validation:`, item);
            invalidItems.push({ index, item });
          }
        } catch (error) {
          console.error(`Error processing item at index ${index}:`, error, item);
          invalidItems.push({ index, item, error: error.message });
        }
      });

      console.log(`Validation complete: ${validItems.length} valid items, ${invalidItems.length} invalid items`);
      
      if (invalidItems.length > 0) {
        console.warn('Invalid items found:', invalidItems);
      }

      return validItems;
    } catch (error) {
      console.error('Critical error in filterAndValidateSchedule:', error);
      return [];
    }
  };

  // Filter courses based on admin's college
  useEffect(() => {
    try {
      if (userCollege) {
        const collegeDepartments = collegeStructure.find(c => c.college === userCollege)?.departments || [];
        const filtered = courses.filter(course => {
          return course && 
                 course.department && 
                 typeof course.department === 'string' &&
                 collegeDepartments.includes(course.department);
        });
        setFilteredCourses(filtered);
      } else {
        const filtered = courses.filter(course => {
          return course && 
                 course.department && 
                 typeof course.department === 'string';
        });
        setFilteredCourses(filtered);
      }
    } catch (error) {
      console.error('Error filtering courses:', error);
      setFilteredCourses([]);
    }
  }, [courses, userCollege]);

  // Load existing schedule from database
  useEffect(() => {
    const loadSchedule = async () => {
      try {
        setIsLoadingSchedule(true);
        console.log('Loading schedule from database...');
        
        const existingSchedule = await fetchAdminSchedule();
        console.log('Raw schedule from database:', existingSchedule?.length || 0, 'items');
        
        // Use our robust filtering function
        const validSchedule = filterAndValidateSchedule(existingSchedule || []);
        
        console.log('Setting schedule in dashboard:', validSchedule.length, 'valid items');
        setSchedule(validSchedule);
        setIsSchedulePublished(validSchedule.length > 0);
      } catch (error) {
        console.error('Error loading schedule:', error);
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
  };

  const handleEditCourse = (course: Course) => {
    toast({
      title: "Edit Course",
      description: "Edit functionality coming soon",
    });
  };

  const handleScheduleGenerated = (newSchedule: ScheduleItem[]) => {
    try {
      console.log('Handling newly generated schedule. Input:', newSchedule?.length || 0, 'items');
      
      // Ensure we have a valid array
      if (!Array.isArray(newSchedule)) {
        console.error('Invalid schedule format received:', typeof newSchedule, newSchedule);
        toast({
          title: "Error",
          description: "Invalid schedule format received. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (newSchedule.length === 0) {
        console.log('Empty schedule received');
        setSchedule([]);
        setIsSchedulePublished(false);
        toast({
          title: "No Schedule Generated",
          description: "No valid schedule items could be created. Please check your course data and try again.",
          variant: "destructive",
        });
        return;
      }

      // Use our robust filtering function
      const validSchedule = filterAndValidateSchedule(newSchedule);

      console.log('Setting new schedule in dashboard:', validSchedule.length, 'valid items out of', newSchedule.length, 'total');
      
      // Use React's functional state update to ensure we're working with the latest state
      setSchedule(prevSchedule => {
        console.log('Previous schedule length:', prevSchedule.length);
        console.log('New schedule length:', validSchedule.length);
        return validSchedule;
      });
      
      setIsSchedulePublished(false); // New schedule is not published by default
      
      if (validSchedule.length < newSchedule.length) {
        const filteredCount = newSchedule.length - validSchedule.length;
        toast({
          title: "Schedule Generated with Warnings",
          description: `${validSchedule.length} valid courses scheduled. ${filteredCount} items were filtered out due to invalid data.`,
          variant: "default",
        });
      } else if (validSchedule.length > 0) {
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
      console.error('Critical error in handleScheduleGenerated:', error);
      setSchedule([]);
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

  // Additional safety check before rendering - ensure all schedule items are valid
  const safeSchedule = Array.isArray(schedule) ? schedule.filter(item => {
    try {
      return validateScheduleItem(item);
    } catch (error) {
      console.error('Error validating schedule item during render:', error, item);
      return false;
    }
  }) : [];

  // Log the final schedule state before rendering
  console.log('Rendering dashboard with schedule:', safeSchedule.length, 'items');

  return (
    <ErrorBoundary>
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
              {safeSchedule.length > 0 && (
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
                  schedule={safeSchedule} 
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
    </ErrorBoundary>
  );
};

export default AdminDashboard;
