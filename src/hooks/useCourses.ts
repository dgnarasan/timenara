
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
    } catch (error) {
      console.error("Error adding course:", error);
      toast({
        title: "Error Adding Course",
        description: error instanceof Error ? error.message : "Failed to add course",
        variant: "destructive",
      });
    }
  };

  const handleAddCourses = async (extractedCourses: Omit<Course, "id">[]) => {
    try {
      const newCourses = await addCourses(extractedCourses);
      setCourses((prev) => [...prev, ...newCourses]);
      toast({
        title: "Courses Added",
        description: `Successfully added ${newCourses.length} courses`,
      });
      return true;
    } catch (error) {
      console.error("Error adding courses:", error);
      toast({
        title: "Error Adding Courses",
        description: error instanceof Error ? error.message : "Failed to add courses",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    try {
      await deleteCourse(Number(courseId)); // Convert string to number for the API
      setCourses(prev => prev.filter(course => course.id !== courseId));
      toast({
        title: "Course Deleted",
        description: "The course has been removed successfully.",
      });
    } catch (error) {
      console.error("Error deleting course:", error);
      toast({
        title: "Error Deleting Course",
        description: error instanceof Error ? error.message : "Failed to delete course",
        variant: "destructive",
      });
    }
  };

  const handleClearAllCourses = async () => {
    try {
      console.log("Clearing all courses...");
      await deleteAllCourses();
      setCourses([]);
      toast({
        title: "All Courses Deleted",
        description: "All courses have been removed successfully.",
      });
      console.log("All courses cleared successfully");
    } catch (error) {
      console.error("Error deleting all courses:", error);
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
