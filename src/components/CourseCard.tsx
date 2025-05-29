
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
  // Bulletproof validation
  if (!course || typeof course !== 'object') {
    console.warn('CourseCard: Invalid course object:', course);
    return null;
  }

  // Extract and validate all properties with defaults
  const courseCode = course.code || '';
  const courseName = course.name || '';
  const courseLecturer = course.lecturer || 'No lecturer assigned';
  const courseDepartment = course.department || 'No department';
  const courseClassSize = course.classSize || 0;

  // Validate essential fields
  if (!courseCode.trim() || !courseName.trim()) {
    console.warn('CourseCard: Missing essential fields:', { code: courseCode, name: courseName });
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
              {courseLecturer}
            </p>
            <p className="text-xs md:text-sm text-muted-foreground truncate">
              {courseDepartment}
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
