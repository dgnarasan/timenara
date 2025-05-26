
import { useState, useEffect } from "react";
import { Course } from "@/lib/types";
import { fetchCourses, addCourse, addCourses, deleteCourse, deleteAllCourses } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";

export const useCourses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const loadedCourses = await fetchCourses();
      setCourses(loadedCourses);
    } catch (error) {
      console.error("Error loading courses:", error);
      toast({
        title: "Error Loading Courses",
        description: error instanceof Error ? error.message : "Failed to load courses",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCourse = async (newCourse: Omit<Course, "id">) => {
    try {
      const course = await addCourse(newCourse);
      setCourses((prev) => [...prev, course]);
      toast({
        title: "Course Added",
        description: "Successfully added new course",
      });
      return true;
    } catch (error) {
      console.error("Error adding course:", error);
      toast({
        title: "Error Adding Course",
        description: error instanceof Error ? error.message : "Failed to add course",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleAddCourses = async (extractedCourses: Omit<Course, "id">[]): Promise<boolean> => {
    console.log("handleAddCourses called with:", extractedCourses.length, "courses");
    
    try {
      // Validate the courses before attempting to add them
      if (!extractedCourses || extractedCourses.length === 0) {
        throw new Error("No courses provided for addition");
      }

      // Log each course being added for debugging
      extractedCourses.forEach((course, index) => {
        console.log(`Course ${index + 1}:`, {
          code: course.code,
          name: course.name,
          lecturer: course.lecturer,
          classSize: course.classSize,
          department: course.department,
          academicLevel: course.academicLevel
        });
      });

      console.log("Calling addCourses function...");
      const newCourses = await addCourses(extractedCourses);
      console.log("addCourses returned:", newCourses.length, "courses");
      
      setCourses((prev) => {
        const updated = [...prev, ...newCourses];
        console.log("Updated courses state, total count:", updated.length);
        return updated;
      });
      
      toast({
        title: "Courses Added Successfully",
        description: `Successfully added ${newCourses.length} courses from template`,
      });
      
      return true;
    } catch (error) {
      console.error("Error in handleAddCourses:", error);
      
      let errorMessage = "Failed to add courses to the database.";
      if (error instanceof Error) {
        errorMessage = error.message;
        console.error("Error details:", {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
      }
      
      toast({
        title: "Database Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      return false;
    }
  };

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

  return {
    courses,
    isLoading,
    handleAddCourse,
    handleAddCourses,
    handleDeleteCourse,
    handleClearAllCourses,
  };
};
