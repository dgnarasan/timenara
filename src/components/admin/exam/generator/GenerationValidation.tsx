
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";
import { ExamCourse } from "@/lib/types";

interface GenerationValidationProps {
  examCourses: ExamCourse[];
  isConfigValid: boolean;
  uniqueCoursesCount: number;
}

const GenerationValidation = ({ examCourses, isConfigValid, uniqueCoursesCount }: GenerationValidationProps) => {
  if (examCourses.length === 0) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No exam courses available. Please upload courses first.
        </AlertDescription>
      </Alert>
    );
  }

  if (!isConfigValid && examCourses.length > 0) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please ensure start date is before end date and both dates are selected.
        </AlertDescription>
      </Alert>
    );
  }

  if (isConfigValid && examCourses.length > 0) {
    return (
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          Ready to generate schedule for {uniqueCoursesCount} unique courses ({examCourses.length} total entries).
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};

export default GenerationValidation;
