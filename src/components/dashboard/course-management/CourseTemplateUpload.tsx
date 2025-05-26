
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
    // Create template with headers and sample data
    const template = [
      ["Course Code*", "Course Name*", "Lecturer Name*", "Class Size*", "Department*"],
      ["CS101", "Introduction to Computer Science", "Dr. John Doe", "30", "Computer Science"],
      ["MATH201", "Calculus II", "Dr. Jane Smith", "25", "Computer Science"],
      ["ENG103", "Technical Writing", "Prof. Alice Brown", "40", "Computer Science"],
    ];

    // Add a separate sheet with valid departments
    const departmentsList = [
      ["Valid Departments"],
      ...allDepartments.map(dept => [dept])
    ];

    const ws = XLSX.utils.aoa_to_sheet(template);
    const deptWs = XLSX.utils.aoa_to_sheet(departmentsList);
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Course Template");
    XLSX.utils.book_append_sheet(wb, deptWs, "Valid Departments");
    
    // Set column widths for better readability
    ws["!cols"] = [
      { width: 15 }, // Course Code
      { width: 40 }, // Course Name
      { width: 25 }, // Lecturer Name
      { width: 15 }, // Class Size
      { width: 30 }  // Department
    ];
    
    deptWs["!cols"] = [{ width: 40 }];
    
    XLSX.writeFile(wb, "course_template.xlsx");
    toast({
      title: "Template Downloaded",
      description: "Template includes a 'Valid Departments' sheet for reference. Fill in the template and upload it back to add courses.",
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

      if (rows.length === 0) {
        throw new Error("The uploaded file appears to be empty.");
      }

      const headers = rows[0];
      const expectedHeaders = ["Course Code*", "Course Name*", "Lecturer Name*", "Class Size*", "Department*"];
      
      // Check if headers match (case-insensitive and flexible)
      const headerMatches = expectedHeaders.every((expectedHeader, index) => {
        const actualHeader = headers[index]?.toString().toLowerCase().trim();
        const expectedLower = expectedHeader.toLowerCase();
        return actualHeader === expectedLower || actualHeader === expectedLower.replace('*', '');
      });

      if (!headerMatches) {
        throw new Error("Invalid template format. Please download and use the provided template. Expected headers: " + expectedHeaders.join(", "));
      }

      const newCourses = validateAndProcessCourses(rows);
      
      if (newCourses.length === 0) {
        throw new Error("No valid courses found in the template. Please check your data and try again.");
      }
      
      const duplicates = newCourses.filter(newCourse => 
        courses.some(existingCourse => 
          existingCourse.code.toLowerCase() === newCourse.code.toLowerCase() && 
          existingCourse.lecturer.toLowerCase() === newCourse.lecturer.toLowerCase()
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
      console.error("Template processing error:", error);
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
    const processedCourses = rows.slice(1)
      .filter(row => row.some(cell => cell?.toString().trim())) // Skip empty rows
      .map((row, index) => {
        const rowNumber = index + 2; // +2 because we skipped header and arrays are 0-indexed
        
        if (row.length < 5) {
          validationErrors.push(`Row ${rowNumber}: Missing required fields`);
          return null;
        }

        const code = row[0]?.toString().trim().toUpperCase();
        const name = row[1]?.toString().trim();
        const lecturer = row[2]?.toString().trim();
        const classSize = parseInt(row[3]?.toString()) || 0;
        const departmentInput = row[4]?.toString().trim();

        // Validate course code
        if (!code || !/^[A-Z]{2,4}\d{3,4}$/.test(code)) {
          validationErrors.push(`Row ${rowNumber}: Invalid course code format. Expected format: 2-4 letters followed by 3-4 digits (e.g., CS101, MATH2001)`);
          return null;
        }

        // Validate course name
        if (!name || name.length < 3) {
          validationErrors.push(`Row ${rowNumber}: Course name must be at least 3 characters long`);
          return null;
        }

        // Validate lecturer
        if (!lecturer || lecturer.length < 2) {
          validationErrors.push(`Row ${rowNumber}: Lecturer name must be at least 2 characters long`);
          return null;
        }

        // Validate class size
        if (classSize <= 0 || classSize > 1000) {
          validationErrors.push(`Row ${rowNumber}: Class size must be between 1 and 1000`);
          return null;
        }

        // Flexible department validation
        let matchedDepartment = allDepartments.find(dept => 
          dept.toLowerCase() === departmentInput.toLowerCase()
        );

        // If no exact match, try partial matching for common abbreviations
        if (!matchedDepartment) {
          matchedDepartment = allDepartments.find(dept => {
            const deptLower = dept.toLowerCase();
            const inputLower = departmentInput.toLowerCase();
            
            // Check if input is contained in department name or vice versa
            return deptLower.includes(inputLower) || inputLower.includes(deptLower);
          });
        }

        if (!matchedDepartment) {
          validationErrors.push(`Row ${rowNumber}: Invalid department "${departmentInput}". Please check the "Valid Departments" sheet in the template for accepted values.`);
          return null;
        }

        return { 
          code, 
          name, 
          lecturer, 
          classSize, 
          department: matchedDepartment as Course["department"]
        };
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
            Download the template, fill it with your courses, and upload it back. The template includes a list of valid departments.
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
          <div className="mt-3 text-xs text-muted-foreground text-center">
            <p>Make sure to use the exact department names from the "Valid Departments" sheet</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseTemplateUpload;
