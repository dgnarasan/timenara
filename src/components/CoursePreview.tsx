
import { Course, collegeStructure } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, X, Edit2, AlertTriangle } from "lucide-react";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CoursePreviewProps {
  courses: (Omit<Course, "id"> & { needsReview?: boolean })[];
  onConfirm: (courses: Omit<Course, "id">[]) => void;
  onEdit: (index: number) => void;
  onRemove: (index: number) => void;
  onCancel: () => void;
}

const CoursePreview = ({ courses: initialCourses, onConfirm, onEdit, onRemove, onCancel }: CoursePreviewProps) => {
  const [courses, setCourses] = useState(initialCourses);
  const academicLevels = ["100", "200", "300", "400", "500", "Graduate"];

  const updateCourseLevel = (index: number, level: string) => {
    setCourses(prevCourses => {
      const newCourses = [...prevCourses];
      newCourses[index] = { ...newCourses[index], academicLevel: level };
      return newCourses;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Preview Courses</h3>
          <p className="text-sm text-muted-foreground">
            Review extracted courses and assign academic levels
          </p>
        </div>
        <div className="space-x-2">
          <Button 
            onClick={() => onConfirm(courses)} 
            variant="default"
            disabled={courses.some(c => !c.academicLevel)}
          >
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
          <Card key={index} className={`p-4 ${course.needsReview ? 'border-yellow-400' : ''}`}>
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{course.code}</span>
                  <span className="text-muted-foreground">•</span>
                  <span>{course.name}</span>
                  {course.needsReview && (
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Lecturer: {course.lecturer || 'Not specified'}</p>
                  <p>Class Size: {course.classSize}</p>
                  <p>Department: {course.department}</p>
                </div>
                <div className="mt-2">
                  <Select onValueChange={(value) => updateCourseLevel(index, value)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select Level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {academicLevels.map((level) => (
                          <SelectItem key={level} value={level}>
                            {level} Level
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
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
