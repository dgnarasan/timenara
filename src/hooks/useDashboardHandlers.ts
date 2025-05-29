
import { useCallback } from "react";
import { Course, collegeStructure } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { validateCourseForCollege } from "@/utils/dashboard/courseFiltering";

interface UseDashboardHandlersProps {
  userCollege: string | null;
  handleAddCourse: (course: Omit<Course, "id">) => void;
  handleAddCourses: (courses: Omit<Course, "id">[]) => void;
}

export const useDashboardHandlers = ({
  userCollege,
  handleAddCourse,
  handleAddCourses,
}: UseDashboardHandlersProps) => {
  const { toast } = useToast();

  const handleAdminAddCourse = useCallback((course: Omit<Course, "id">) => {
    try {
      if (!validateCourseForCollege(course, userCollege)) {
        toast({
          title: "Access Denied",
          description: "You can only add courses for your assigned college.",
          variant: "destructive",
        });
        return;
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

  const handleAdminAddCourses = useCallback((coursesToAdd: Omit<Course, "id">[]) => {
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
  }, [userCollege, handleAddCourses, toast]);

  const handleEditCourse = useCallback((course: Course) => {
    toast({
      title: "Edit Course",
      description: "Edit functionality coming soon",
    });
  }, [toast]);

  return {
    handleAdminAddCourse,
    handleAdminAddCourses,
    handleEditCourse,
  };
};
