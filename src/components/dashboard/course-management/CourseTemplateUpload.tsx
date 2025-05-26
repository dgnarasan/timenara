
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Course, collegeStructure, CALEB_VENUES } from "@/lib/types";
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
    // Create template with enhanced headers and sample data
    const template = [
      [
        "Course Code*", "Course Name*", "Lecturer Name", "Level*", 
        "Group", "SharedDepartments", "Venue", "Expected Class Size*",
        "Preferred Days", "Preferred Time Slot", "Department*"
      ],
      [
        "GST101", "Use of English", "Dr. John Doe", "100L", 
        "", "Computer Science, Cyber Security", "L101", "120",
        "Monday, Wednesday", "9:00-11:00", "Computer Science"
      ],
      [
        "CSC202", "Computer Programming II", "Dr. Jane Smith", "200L", 
        "A", "", "LAB PG", "40",
        "", "", "Computer Science"
      ],
      [
        "CSC202", "Computer Programming II", "Dr. Jane Smith", "200L", 
        "B", "", "LAB PG", "40",
        "", "", "Computer Science"
      ],
    ];

    // Add separate sheets for reference data
    const departmentsList = [
      ["Valid Departments"],
      ...allDepartments.map(dept => [dept])
    ];

    const venuesList = [
      ["Caleb University Venue Codes"],
      ...CALEB_VENUES.map(venue => [venue])
    ];

    const levelsList = [
      ["Academic Levels"],
      ["100L"], ["200L"], ["300L"], ["400L"]
    ];

    const groupsList = [
      ["Group Options"],
      ["A"], ["B"], ["C"], ["D"]
    ];

    const ws = XLSX.utils.aoa_to_sheet(template);
    const deptWs = XLSX.utils.aoa_to_sheet(departmentsList);
    const venueWs = XLSX.utils.aoa_to_sheet(venuesList);
    const levelWs = XLSX.utils.aoa_to_sheet(levelsList);
    const groupWs = XLSX.utils.aoa_to_sheet(groupsList);
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Course Template");
    XLSX.utils.book_append_sheet(wb, deptWs, "Valid Departments");
    XLSX.utils.book_append_sheet(wb, venueWs, "Venue Codes");
    XLSX.utils.book_append_sheet(wb, levelWs, "Academic Levels");
    XLSX.utils.book_append_sheet(wb, groupWs, "Group Options");
    
    // Set column widths for better readability
    ws["!cols"] = [
      { width: 15 }, // Course Code
      { width: 40 }, // Course Name
      { width: 25 }, // Lecturer Name
      { width: 10 }, // Level
      { width: 8 },  // Group
      { width: 30 }, // SharedDepartments
      { width: 15 }, // Venue
      { width: 15 }, // Expected Class Size
      { width: 20 }, // Preferred Days
      { width: 20 }, // Preferred Time Slot
      { width: 30 }  // Department
    ];
    
    deptWs["!cols"] = [{ width: 40 }];
    venueWs["!cols"] = [{ width: 30 }];
    levelWs["!cols"] = [{ width: 20 }];
    groupWs["!cols"] = [{ width: 15 }];
    
    XLSX.writeFile(wb, "caleb_course_template.xlsx");
    toast({
      title: "Enhanced Template Downloaded",
      description: "Template includes new fields for groups, shared departments, and Caleb venue codes. Fill in the template and upload it back.",
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
      const expectedHeaders = [
        "Course Code*", "Course Name*", "Lecturer Name", "Level*", 
        "Group", "SharedDepartments", "Venue", "Expected Class Size*",
        "Preferred Days", "Preferred Time Slot", "Department*"
      ];
      
      // Flexible header matching - only require essential fields
      const hasRequiredFields = ['Course Code', 'Course Name', 'Level', 'Expected Class Size', 'Department']
        .every(required => headers.some(header => 
          header?.toString().toLowerCase().includes(required.toLowerCase())
        ));

      if (!hasRequiredFields) {
        throw new Error("Missing required fields. Please ensure Course Code, Course Name, Level, Expected Class Size, and Department are present.");
      }

      const newCourses = validateAndProcessCourses(rows);
      
      if (newCourses.length === 0) {
        throw new Error("No valid courses found in the template. Please check your data and try again.");
      }
      
      // Check for duplicates considering group field
      const duplicates = newCourses.filter(newCourse => 
        courses.some(existingCourse => 
          existingCourse.code.toLowerCase() === newCourse.code.toLowerCase() && 
          (existingCourse.lecturer || 'TBD').toLowerCase() === (newCourse.lecturer || 'TBD').toLowerCase() &&
          (existingCourse.group || '') === (newCourse.group || '')
        )
      );

      if (duplicates.length > 0) {
        const duplicateInfo = duplicates.map(d => 
          `${d.code}${d.group ? ` (${d.group})` : ''} (${d.lecturer || 'TBD'})`
        ).join(", ");
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
        description: `${newCourses.length} courses added successfully with enhanced fields`,
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
        
        // Safely access row elements with fallback defaults
        const code = (row[0] || '').toString().trim().toUpperCase();
        const name = (row[1] || '').toString().trim();
        const lecturer = (row[2] || '').toString().trim() || 'TBD';
        const level = (row[3] || '').toString().trim();
        const group = (row[4] || '').toString().trim() || undefined;
        const sharedDepartments = (row[5] || '').toString().trim() ? 
          row[5].toString().split(',').map(d => d.trim()).filter(d => d) : undefined;
        const venue = (row[6] || '').toString().trim() || undefined;
        const classSize = parseInt((row[7] || '0').toString()) || 0;
        const preferredDays = (row[8] || '').toString().trim() ? 
          row[8].toString().split(',').map(d => d.trim()).filter(d => d) : undefined;
        const preferredTimeSlot = (row[9] || '').toString().trim() || undefined;
        const departmentInput = (row[10] || '').toString().trim();

        // Validate course code
        if (!code || !/^[A-Z]{2,4}\d{3,4}$/.test(code)) {
          validationErrors.push(`Row ${rowNumber}: Invalid course code format. Expected format: 2-4 letters followed by 3-4 digits (e.g., GST101, CSC202)`);
          return null;
        }

        // Validate course name
        if (!name || name.length < 3) {
          validationErrors.push(`Row ${rowNumber}: Course name must be at least 3 characters long`);
          return null;
        }

        // Validate level
        if (!level || !['100L', '200L', '300L', '400L'].includes(level.toUpperCase())) {
          validationErrors.push(`Row ${rowNumber}: Level must be one of: 100L, 200L, 300L, 400L`);
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

        if (!matchedDepartment) {
          matchedDepartment = allDepartments.find(dept => {
            const deptLower = dept.toLowerCase();
            const inputLower = departmentInput.toLowerCase();
            return deptLower.includes(inputLower) || inputLower.includes(deptLower);
          });
        }

        if (!matchedDepartment) {
          validationErrors.push(`Row ${rowNumber}: Invalid department "${departmentInput}". Please check the "Valid Departments" sheet.`);
          return null;
        }

        const course: Omit<Course, "id"> = { 
          code, 
          name, 
          lecturer, 
          classSize, 
          department: matchedDepartment as Course["department"],
          academicLevel: level.toUpperCase(),
          group,
          sharedDepartments,
          venue,
          preferredDays,
          preferredTimeSlot
        };

        return course;
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
          <h4 className="text-sm font-medium">Enhanced Course Template</h4>
          <p className="text-xs text-muted-foreground">
            Download the enhanced template with new fields for groups, shared departments, and Caleb venue codes. Optional fields can be left empty.
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
              <span className="text-sm font-medium">Choose Enhanced Template File</span>
              <span className="text-xs text-muted-foreground">
                XLSX format with optional new fields
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
            <p>Enhanced template supports optional groups, shared departments, and Caleb venue codes</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseTemplateUpload;
