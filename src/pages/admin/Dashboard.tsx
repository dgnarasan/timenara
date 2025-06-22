
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

// More robust validation function that provides detailed logging
const isValidScheduleItem = (item: any): item is ScheduleItem => {
  console.log('=== Validating schedule item ===');
  console.log('Raw item:', JSON.stringify(item, null, 2));
  
  if (!item || typeof item !== 'object') {
    console.log('❌ Invalid: not an object');
    return false;
  }

  // Check essential fields with detailed logging
  const requiredFields = ['id', 'code', 'name', 'lecturer'];
  for (const field of requiredFields) {
    if (!item[field] || typeof item[field] !== 'string') {
      console.log(`❌ Invalid: missing or invalid ${field}:`, item[field]);
      return false;
    }
  }

  // TimeSlot validation with detailed logging
  if (!item.timeSlot || typeof item.timeSlot !== 'object') {
    console.log('❌ Invalid: timeSlot structure missing or invalid:', item.timeSlot);
    return false;
  }

  if (!item.timeSlot.day || !item.timeSlot.startTime || !item.timeSlot.endTime) {
    console.log('❌ Invalid: timeSlot missing required fields:', {
      day: item.timeSlot.day,
      startTime: item.timeSlot.startTime,
      endTime: item.timeSlot.endTime
    });
    return false;
  }

  const validDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  if (!validDays.includes(item.timeSlot.day)) {
    console.log('❌ Invalid: invalid day:', item.timeSlot.day);
    return false;
  }

  // Venue validation with detailed logging
  if (!item.venue || typeof item.venue !== 'object') {
    console.log('❌ Invalid: venue structure missing or invalid:', item.venue);
    return false;
  }

  if (!item.venue.id || !item.venue.name) {
    console.log('❌ Invalid: venue missing required fields:', {
      id: item.venue.id,
      name: item.venue.name
    });
    return false;
  }

  // Provide defaults for optional fields
  if (typeof item.classSize !== 'number' || item.classSize <= 0) {
    console.log('⚠️ Warning: invalid classSize, setting default:', item.classSize);
    item.classSize = 30;
  }
  
  if (!item.department) {
    console.log('⚠️ Warning: department missing, setting default');
    item.department = 'Unknown Department';
  }

  console.log('✅ Valid schedule item:', item.code);
  return true;
};

// Enhanced validation function that also normalizes the data
const validateAndNormalizeScheduleItems = (scheduleItems: any[]): ScheduleItem[] => {
  console.log('=== Starting validation of schedule items ===');
  console.log(`Processing ${scheduleItems?.length || 0} items`);
  
  if (!Array.isArray(scheduleItems)) {
    console.warn('❌ Schedule items is not an array:', scheduleItems);
    return [];
  }

  const validItems: ScheduleItem[] = [];
  
  scheduleItems.forEach((item, index) => {
    console.log(`\n--- Processing item ${index + 1} ---`);
    
    try {
      // Create a normalized copy of the item
      const normalizedItem = {
        id: item.id || `temp-${index}`,
        code: item.code || item.courseCode || 'UNKNOWN',
        name: item.name || item.courseName || item.title || 'Unknown Course',
        lecturer: item.lecturer || item.instructor || 'TBD',
        classSize: typeof item.classSize === 'number' ? item.classSize : (item.class_size || 30),
        department: item.department || 'Unknown Department',
        academicLevel: item.academicLevel || item.academic_level,
        timeSlot: {
          day: item.timeSlot?.day || item.day,
          startTime: item.timeSlot?.startTime || item.start_time || item.startTime,
          endTime: item.timeSlot?.endTime || item.end_time || item.endTime
        },
        venue: {
          id: item.venue?.id || item.venue_id || `venue-${index}`,
          name: item.venue?.name || item.venueName || item.venue_name || 'TBD',
          capacity: item.venue?.capacity || 50,
          availability: item.venue?.availability || []
        },
        constraints: item.constraints || [],
        preferredSlots: item.preferredSlots || item.preferred_slots
      };

      if (isValidScheduleItem(normalizedItem)) {
        validItems.push(normalizedItem);
        console.log(`✅ Item ${index + 1} added to valid items`);
      } else {
        console.log(`❌ Item ${index + 1} failed validation`);
      }
    } catch (error) {
      console.error(`❌ Error processing item ${index + 1}:`, error);
    }
  });
  
  console.log(`\n=== Validation Summary ===`);
  console.log(`Total items processed: ${scheduleItems.length}`);
  console.log(`Valid items: ${validItems.length}`);
  console.log(`Invalid items: ${scheduleItems.length - validItems.length}`);
  
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
        console.log('📊 Loading existing schedule from database...');
        const existingSchedule = await fetchAdminSchedule();
        console.log('📊 Raw schedule data from DB:', existingSchedule);
        
        // Validate and normalize schedule items
        const validSchedule = validateAndNormalizeScheduleItems(existingSchedule);
        console.log(`📊 Final processed schedule: ${validSchedule.length} items`);
        
        setSchedule(validSchedule);
        setIsSchedulePublished(validSchedule.length > 0);
      } catch (error) {
        console.error('❌ Error loading schedule:', error);
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
      console.log('🎯 Received new schedule from generator');
      console.log(`🎯 Raw schedule length: ${newSchedule?.length || 0}`);
      console.log('🎯 First few raw items:', newSchedule?.slice(0, 2));
      
      if (!newSchedule || !Array.isArray(newSchedule)) {
        console.error('❌ Invalid schedule data received');
        toast({
          title: "Error",
          description: "Invalid schedule data received from generator",
          variant: "destructive",
        });
        return;
      }
      
      // Use the enhanced validation and normalization
      const validSchedule = validateAndNormalizeScheduleItems(newSchedule);
      
      console.log(`🎯 Final validated schedule: ${validSchedule.length} items`);
      
      // Update state with a slight delay to prevent React conflicts
      setTimeout(() => {
        setSchedule(validSchedule);
        setIsSchedulePublished(false);
        
        if (validSchedule.length > 0) {
          toast({
            title: "Schedule Generated Successfully",
            description: `Generated schedule with ${validSchedule.length} courses`,
          });
        } else {
          toast({
            title: "Schedule Generation Issue",
            description: "No valid courses could be scheduled. Check console for details.",
            variant: "destructive",
          });
        }
      }, 100);
      
    } catch (error) {
      console.error('❌ Error in handleScheduleGenerated:', error);
      toast({
        title: "Error",
        description: "Failed to process generated schedule",
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
