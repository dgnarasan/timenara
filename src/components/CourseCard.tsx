
import { Course } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2 } from "lucide-react";

interface CourseCardProps {
  course: Course;
  onEdit?: (course: Course) => void;
  onDelete?: () => void;
}

const CourseCard = ({ course, onEdit, onDelete }: CourseCardProps) => {
  return (
    <Card className="p-4">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{course.code}</h3>
            <span className="text-sm text-muted-foreground">
              ({course.classSize} students)
            </span>
          </div>
          <p>{course.name}</p>
          <p className="text-sm text-muted-foreground">{course.lecturer}</p>
          <p className="text-sm text-muted-foreground">{course.department}</p>
        </div>
        <div className="flex gap-2">
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(course)}
              className="h-8 w-8"
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
              className="h-8 w-8 text-destructive hover:text-destructive/90"
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
