
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
  // Ultra-defensive validation with early returns
  if (!course) {
    console.warn('CourseCard: course is null/undefined, returning null');
    return null;
  }

  if (typeof course !== 'object') {
    console.warn('CourseCard: course is not an object:', typeof course, course);
    return null;
  }

  // Check for required properties with fallbacks
  const courseCode = course.code || '';
  const courseName = course.name || '';
  const courseLecturer = course.lecturer || '';
  const courseDepartment = course.department || '';
  const courseClassSize = course.classSize || 0;

  if (!courseCode || !courseName) {
    console.warn('CourseCard: Missing required course data:', { 
      code: courseCode, 
      name: courseName, 
      hasCode: !!course.code,
      hasName: !!course.name 
    });
    return null;
  }

  console.log('CourseCard: Rendering course with safe data:', { 
    code: courseCode, 
    name: courseName,
    lecturer: courseLecturer,
    department: courseDepartment 
  });

  // Safe rendering with fallbacks
  const renderPreferredSlots = () => {
    try {
      if (course.preferredSlots && 
          Array.isArray(course.preferredSlots) && 
          course.preferredSlots.length > 0 && 
          course.preferredSlots[0] &&
          typeof course.preferredSlots[0] === 'object') {
        const firstSlot = course.preferredSlots[0];
        return (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span className="truncate">
              Preferred: {firstSlot.day || 'N/A'} {firstSlot.startTime || 'N/A'}
            </span>
          </div>
        );
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
        const confirmMessage = courseCode ? 
          `Are you sure you want to delete ${courseCode}?` : 
          'Are you sure you want to delete this course?';
        
        if (window.confirm(confirmMessage)) {
          onDelete();
        }
      }
    } catch (error) {
      console.error('CourseCard: Error in onDelete callback:', error);
    }
  };

  try {
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
  } catch (error) {
    console.error('CourseCard: Critical rendering error:', error, { 
      course: {
        code: courseCode,
        name: courseName,
        lecturer: courseLecturer,
        department: courseDepartment
      }
    });
    
    return (
      <Card className="p-3 md:p-4">
        <div className="text-center text-muted-foreground">
          <p className="text-sm">Error displaying course</p>
          <p className="text-xs">Course: {courseCode || 'Unknown'}</p>
        </div>
      </Card>
    );
  }
};

export default CourseCard;
