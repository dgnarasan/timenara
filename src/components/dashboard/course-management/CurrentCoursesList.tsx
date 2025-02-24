
import { Course } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import CourseCard from "@/components/CourseCard";

interface CurrentCoursesListProps {
  courses: Course[];
  onEditCourse: (course: Course) => void;
  onDeleteCourse?: (courseId: string) => void;
  onClearAllCourses?: () => void;
}

const CurrentCoursesList = ({
  courses,
  onEditCourse,
  onDeleteCourse,
  onClearAllCourses,
}: CurrentCoursesListProps) => {
  if (courses.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Current Courses</h3>
        {onClearAllCourses && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (window.confirm("Are you sure you want to remove all courses?")) {
                onClearAllCourses();
              }
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        )}
      </div>
      <div className="grid gap-4">
        {courses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            onEdit={onEditCourse}
            onDelete={onDeleteCourse ? () => onDeleteCourse(course.id) : undefined}
          />
        ))}
      </div>
    </div>
  );
};

export default CurrentCoursesList;
