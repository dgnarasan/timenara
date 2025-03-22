
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Course, collegeStructure } from "@/lib/types";
import { Download, FileSpreadsheet, Upload } from "lucide-react";
import { useState } from "react";
import * as XLSX from "xlsx";

interface CourseTemplateUploadProps {
  courses: Course[];
  onCoursesExtracted: (courses: Omit<Course, "id">[]) => void;
}

const CourseTemplateUpload = ({ courses, onCoursesExtracted }: CourseTemplateUploadProps) => {
  const { toast } = useToast();
  const [showTemplateUpload, setShowTemplateUpload] = useState(false);

  // Get all departments from collegeStructure
  const allDepartments = collegeStructure.flatMap(college => college.departments);

  const downloadTemplate = () => {
    const template = [
      ["Course Code*", "Course Name*", "Lecturer Name*", "Class Size*", "Department*"],
      ["CS101", "Introduction to Computer Science", "Dr. John Doe", "30", "Computer Science"],
    ];

    const ws = XLSX.utils.aoa_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Course Template");
    ws["!cols"] = [{ width: 15 }, { width: 40 }, { width: 25 }, { width: 15 }, { width: 25 }];
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

      const headers = rows[0];
      const expectedHeaders = ["Course Code*", "Course Name*", "Lecturer Name*", "Class Size*", "Department*"];
      if (!expectedHeaders.every((header, index) => headers[index] === header)) {
        throw new Error("Invalid template format. Please use the provided template.");
      }

      const newCourses = validateAndProcessCourses(rows);
      
      const duplicates = newCourses.filter(newCourse => 
        courses.some(existingCourse => 
          existingCourse.code === newCourse.code && 
          existingCourse.lecturer === newCourse.lecturer
        )
      );

      if (duplicates.length > 0) {
        const duplicateInfo = duplicates.map(d => `${d.code} (${d.lecturer})`).join(", ");
        toast({
          title: "Duplicate Courses Found",
          description: `The following courses already exist: ${duplicateInfo}`,
          variant: "destructive",
        });
        return;
      }

      await onCoursesExtracted(newCourses);
      setShowTemplateUpload(false);
      toast({
        title: "Success",
        description: `${newCourses.length} courses added successfully`,
      });
    } catch (error) {
      toast({
        title: "Error Processing Template",
        description: error instanceof Error ? error.message : "Failed to process template",
        variant: "destructive",
      });
    }
    event.target.value = "";
  };

  const validateAndProcessCourses = (rows: string[][]): Omit<Course, "id">[] => {
    const validationErrors: string[] = [];
    const processedCourses = rows.slice(1).map((row, index) => {
      if (row.length < 5) {
        validationErrors.push(`Row ${index + 2}: Missing required fields`);
        return null;
      }

      const code = row[0]?.toString().trim();
      const name = row[1]?.toString().trim();
      const lecturer = row[2]?.toString().trim();
      const classSize = parseInt(row[3]) || 0;
      const department = row[4]?.toString().trim() as Course["department"];

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

      if (!allDepartments.includes(department)) {
        validationErrors.push(`Row ${index + 2}: Invalid department`);
        return null;
      }

      return { code, name, lecturer, classSize, department };
    }).filter((course): course is Omit<Course, "id"> => course !== null);

    if (validationErrors.length > 0) {
      throw new Error("Validation errors found:\n" + validationErrors.join("\n"));
    }

    return processedCourses;
  };

  return (
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
  );
};

export default CourseTemplateUpload;
