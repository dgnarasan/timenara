
import { useState } from "react";
import { Course } from "@/lib/types";
import AddCourseForm from "@/components/AddCourseForm";
import PDFUploader from "@/components/PDFUploader";
import CourseCard from "@/components/CourseCard";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Download, Upload, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";

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
  const { toast } = useToast();
  const [showTemplateUpload, setShowTemplateUpload] = useState(false);

  const downloadTemplate = () => {
    const template = [
      ["Course Code*", "Course Name*", "Lecturer Name*", "Class Size*"],
      ["CS101", "Introduction to Computer Science", "Dr. John Doe", "30"],
    ];

    const ws = XLSX.utils.aoa_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Course Template");

    // Add column widths for better readability
    ws["!cols"] = [
      { width: 15 }, // Course Code
      { width: 40 }, // Course Name
      { width: 25 }, // Lecturer Name
      { width: 15 }, // Class Size
    ];

    XLSX.writeFile(wb, "course_template.xlsx");
    
    toast({
      title: "Template Downloaded",
      description: "Fill in the template and upload it back to add courses.",
    });
  };

  const handleTemplateUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];

      // Validate headers
      const headers = rows[0];
      const expectedHeaders = ["Course Code*", "Course Name*", "Lecturer Name*", "Class Size*"];
      const isValidHeader = expectedHeaders.every((header, index) => headers[index] === header);
      
      if (!isValidHeader) {
        throw new Error("Invalid template format. Please use the provided template.");
      }

      // Skip header row and process data rows
      const validationErrors: string[] = [];
      const newCourses = rows.slice(1).map((row, index) => {
        if (row.length < 4) {
          validationErrors.push(`Row ${index + 2}: Missing required fields`);
          return null;
        }

        const code = row[0]?.toString().trim();
        const name = row[1]?.toString().trim();
        const lecturer = row[2]?.toString().trim();
        const classSize = parseInt(row[3]) || 0;

        // Validate individual fields
        if (!code || !/^[A-Z]{2,4}\d{3,4}$/.test(code)) {
          validationErrors.push(`Row ${index + 2}: Invalid course code format (e.g., CS101)`);
          return null;
        }

        if (!name || name.length < 3) {
          validationErrors.push(`Row ${index + 2}: Course name is too short`);
          return null;
        }

        if (!lecturer) {
          validationErrors.push(`Row ${index + 2}: Lecturer name is required`);
          return null;
        }

        if (classSize <= 0 || classSize > 1000) {
          validationErrors.push(`Row ${index + 2}: Invalid class size (must be between 1-1000)`);
          return null;
        }

        // Check for duplicates in existing courses
        if (courses.some(c => c.code === code)) {
          validationErrors.push(`Row ${index + 2}: Course code ${code} already exists`);
          return null;
        }

        return {
          code,
          name,
          lecturer,
          classSize,
        };
      }).filter((course): course is Omit<Course, "id"> => course !== null);

      if (validationErrors.length > 0) {
        throw new Error(
          "Validation errors found:\n" + validationErrors.join("\n")
        );
      }

      if (newCourses.length === 0) {
        throw new Error("No valid courses found in template");
      }

      onCoursesExtracted(newCourses);
      setShowTemplateUpload(false);
      
      toast({
        title: "Success",
        description: `${newCourses.length} courses imported from template`,
      });
    } catch (error) {
      toast({
        title: "Error Processing Template",
        description: error instanceof Error ? error.message : "Failed to process template",
        variant: "destructive",
      });
    }
    
    // Reset input
    event.target.value = "";
  };

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
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="text-sm font-medium">Course Template</h4>
                  <p className="text-xs text-muted-foreground">
                    Download the template, fill it with your courses, and upload it back
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadTemplate}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Template
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTemplateUpload(true)}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                </div>
              </div>
              
              {showTemplateUpload && (
                <div className="mt-4 p-4 border border-dashed rounded-md">
                  <div className="flex items-center justify-center">
                    <label className="flex flex-col items-center gap-2 cursor-pointer">
                      <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm font-medium">Choose Template File</span>
                      <span className="text-xs text-muted-foreground">
                        XLSX or CSV format
                      </span>
                      <input
                        type="file"
                        accept=".xlsx,.csv"
                        className="hidden"
                        onChange={handleTemplateUpload}
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">PDF Upload</h3>
          <div className="bg-card/50 rounded-lg p-4 border shadow-sm">
            <PDFUploader onCoursesExtracted={onCoursesExtracted} />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Manual Input</h3>
          <div className="bg-card/50 rounded-lg border shadow-sm">
            <AddCourseForm onSubmit={onAddCourse} />
          </div>
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
