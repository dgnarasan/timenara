
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
  // Ensure we have valid course data to prevent crashes
  if (!course || !course.code || !course.name) {
    console.warn('Invalid course data:', course);
    return null;
  }

  return (
    <Card className="p-3 md:p-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <h3 className="font-semibold text-sm md:text-base">{course.code}</h3>
            <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>{course.classSize || 0} students</span>
            </div>
          </div>
          
          <p className="text-sm md:text-base font-medium truncate">{course.name}</p>
          
          <div className="space-y-1">
            <p className="text-xs md:text-sm text-muted-foreground truncate">{course.lecturer || 'No lecturer assigned'}</p>
            <p className="text-xs md:text-sm text-muted-foreground truncate">{course.department || 'No department'}</p>
          </div>
          
          {course.preferredSlots && course.preferredSlots.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span className="truncate">
                Preferred: {course.preferredSlots[0]?.day} {course.preferredSlots[0]?.startTime}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex gap-2 sm:flex-col sm:gap-1">
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(course)}
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
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete ${course.code}?`)) {
                  onDelete();
                }
              }}
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
