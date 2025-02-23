
import { Card } from "@/components/ui/card";
import { Course } from "@/lib/types";

interface CourseCardProps {
  course: Course;
  onEdit: (course: Course) => void;
}

const CourseCard = ({ course, onEdit }: CourseCardProps) => {
  return (
    <Card className="p-6 hover:shadow-lg transition-shadow duration-300 animate-fade-in">
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="inline-block px-2 py-1 text-xs font-medium bg-secondary rounded">
            {course.code}
          </div>
          <h3 className="text-xl font-semibold tracking-tight">{course.name}</h3>
        </div>
        <div className="space-y-1 text-sm text-muted-foreground">
          <p>Lecturer: {course.lecturer}</p>
          <p>Class Size: {course.classSize} students</p>
        </div>
        <button
          onClick={() => onEdit(course)}
          className="text-sm text-primary hover:underline transition-all duration-200"
        >
          Edit Course
        </button>
      </div>
    </Card>
  );
};

export default CourseCard;
