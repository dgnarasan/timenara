
import { Course } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Users, Clock } from "lucide-react";

interface CourseCardProps {
  course: Course;
  onEdit?: (course: Course) => void;
  onDelete?: () => void;
}

const CourseCard = ({ course, onEdit, onDelete }: CourseCardProps) => {
  // Early return for null/undefined course
  if (!course) {
    console.warn('CourseCard: course is null/undefined, returning null');
    return null;
  }

  // Validate course is an object
  if (typeof course !== 'object') {
    console.warn('CourseCard: course is not an object:', typeof course, course);
    return null;
  }

  // Safe property access with strict validation
  const courseCode = course.code;
  const courseName = course.name;
  const courseLecturer = course.lecturer;
  const courseDepartment = course.department;
  const courseClassSize = course.classSize;

  // Strict validation of required properties
  if (!courseCode || typeof courseCode !== 'string' || courseCode.trim() === '') {
    console.warn('CourseCard: Invalid course code:', courseCode, 'Full course:', course);
    return null;
  }

  if (!courseName || typeof courseName !== 'string' || courseName.trim() === '') {
    console.warn('CourseCard: Invalid course name:', courseName, 'Full course:', course);
    return null;
  }

  if (!courseLecturer || typeof courseLecturer !== 'string') {
    console.warn('CourseCard: Invalid lecturer:', courseLecturer, 'Full course:', course);
    return null;
  }

  if (!courseDepartment || typeof courseDepartment !== 'string') {
    console.warn('CourseCard: Invalid department:', courseDepartment, 'Full course:', course);
    return null;
  }

  if (typeof courseClassSize !== 'number' || courseClassSize <= 0) {
    console.warn('CourseCard: Invalid class size:', courseClassSize, 'Full course:', course);
    return null;
  }

  // Safe rendering of preferred slots
  const renderPreferredSlots = () => {
    try {
      if (course.preferredSlots && 
          Array.isArray(course.preferredSlots) && 
          course.preferredSlots.length > 0) {
        const firstSlot = course.preferredSlots[0];
        if (firstSlot && typeof firstSlot === 'object' && firstSlot.day && firstSlot.startTime) {
          return (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span className="truncate">
                Preferred: {firstSlot.day} {firstSlot.startTime}
              </span>
            </div>
          );
        }
      }
      return null;
    } catch (error) {
      console.warn('CourseCard: Error rendering preferred slots:', error);
      return null;
    }
  };

  const handleEdit = () => {
    try {
      if (onEdit && course) {
        onEdit(course);
      }
    } catch (error) {
      console.error('CourseCard: Error in onEdit callback:', error);
    }
  };

  const handleDelete = () => {
    try {
      if (onDelete) {
        if (window.confirm(`Are you sure you want to delete ${courseCode}?`)) {
          onDelete();
        }
      }
    } catch (error) {
      console.error('CourseCard: Error in onDelete callback:', error);
    }
  };

  return (
    <Card className="p-3 md:p-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <h3 className="font-semibold text-sm md:text-base">{courseCode}</h3>
            <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>{courseClassSize} students</span>
            </div>
          </div>
          
          <p className="text-sm md:text-base font-medium truncate">{courseName}</p>
          
          <div className="space-y-1">
            <p className="text-xs md:text-sm text-muted-foreground truncate">
              {courseLecturer || 'No lecturer assigned'}
            </p>
            <p className="text-xs md:text-sm text-muted-foreground truncate">
              {courseDepartment || 'No department'}
            </p>
          </div>
          
          {renderPreferredSlots()}
        </div>
        
        <div className="flex gap-2 sm:flex-col sm:gap-1">
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleEdit}
              className="h-8 w-8 flex-1 sm:flex-none"
            >
              <Edit2 className="h-4 w-4" />
              <span className="sr-only">Edit course</span>
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              className="h-8 w-8 text-destructive hover:text-destructive/90 flex-1 sm:flex-none"
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete course</span>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default CourseCard;
