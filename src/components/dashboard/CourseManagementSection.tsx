
import { Course } from "@/lib/types";
import AddCourseForm from "@/components/AddCourseForm";
import PDFUploader from "@/components/PDFUploader";
import CourseCard from "@/components/CourseCard";

interface CourseManagementSectionProps {
  courses: Course[];
  onAddCourse: (course: Omit<Course, "id">) => void;
  onCoursesExtracted: (courses: Omit<Course, "id">[]) => void;
  onEditCourse: (course: Course) => void;
}

const CourseManagementSection = ({
  courses,
  onAddCourse,
  onCoursesExtracted,
  onEditCourse,
}: CourseManagementSectionProps) => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Add Courses</h2>
      <p className="text-sm text-muted-foreground">
        Upload course lists to generate an AI-optimized timetable
      </p>
      
      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Course Input Assistant</h3>
          <PDFUploader onCoursesExtracted={onCoursesExtracted} />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Manual Input</h3>
          <AddCourseForm onSubmit={onAddCourse} />
        </div>

        {courses.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Current Courses</h3>
            <div className="grid gap-4">
              {courses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onEdit={onEditCourse}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseManagementSection;
