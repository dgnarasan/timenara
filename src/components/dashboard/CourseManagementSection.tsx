
import { Course } from "@/lib/types";
import AddCourseForm from "@/components/AddCourseForm";
import CourseTemplateUpload from "./course-management/CourseTemplateUpload";
import CurrentCoursesList from "./course-management/CurrentCoursesList";

interface CourseManagementSectionProps {
  courses: Course[];
  onAddCourse: (course: Omit<Course, "id">) => void;
  onCoursesExtracted: (courses: Omit<Course, "id">[]) => Promise<boolean>;
  onEditCourse: (course: Course) => void;
  onDeleteCourse?: (courseId: string) => void;
  onClearAllCourses?: () => void;
}

const CourseManagementSection = ({
  courses,
  onAddCourse,
  onCoursesExtracted,
  onEditCourse,
  onDeleteCourse,
  onClearAllCourses,
}: CourseManagementSectionProps) => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold tracking-tight">Course Management</h2>
      <p className="text-sm text-muted-foreground">
        Add and manage courses to generate an AI-optimized timetable
      </p>
      
      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Course Input Assistant</h3>
          <div className="bg-card/50 rounded-lg p-4 border shadow-sm">
            <CourseTemplateUpload 
              courses={courses}
              onCoursesExtracted={onCoursesExtracted}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Manual Input</h3>
          <div className="bg-card/50 rounded-lg border shadow-sm">
            <AddCourseForm onSubmit={onAddCourse} />
          </div>
        </div>

        <CurrentCoursesList
          courses={courses}
          onEditCourse={onEditCourse}
          onDeleteCourse={onDeleteCourse}
          onClearAllCourses={onClearAllCourses}
        />
      </div>
    </div>
  );
};

export default CourseManagementSection;
