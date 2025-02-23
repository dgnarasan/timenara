
import { Course } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, X, Edit2 } from "lucide-react";

interface CoursePreviewProps {
  courses: Omit<Course, "id">[];
  onConfirm: (courses: Omit<Course, "id">[]) => void;
  onEdit: (index: number) => void;
  onRemove: (index: number) => void;
  onCancel: () => void;
}

const CoursePreview = ({ courses, onConfirm, onEdit, onRemove, onCancel }: CoursePreviewProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Preview Courses</h3>
        <div className="space-x-2">
          <Button onClick={() => onConfirm(courses)} variant="default">
            <Check className="mr-2 h-4 w-4" />
            Confirm All
          </Button>
          <Button onClick={onCancel} variant="outline">
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </div>
      </div>
      <div className="grid gap-4">
        {courses.map((course, index) => (
          <Card key={index} className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{course.code}</span>
                  <span className="text-muted-foreground">•</span>
                  <span>{course.name}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Lecturer: {course.lecturer}</p>
                  <p>Class Size: {course.classSize}</p>
                </div>
              </div>
              <div className="space-x-2">
                <Button onClick={() => onEdit(index)} variant="ghost" size="sm">
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button onClick={() => onRemove(index)} variant="ghost" size="sm">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CoursePreview;
