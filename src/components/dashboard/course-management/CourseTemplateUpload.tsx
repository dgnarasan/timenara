
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Course, collegeStructure, CALEB_VENUES } from "@/lib/types";
import { Download, FileSpreadsheet, Upload } from "lucide-react";
import { useState } from "react";
import * as XLSX from "xlsx";

interface CourseTemplateUploadProps {
  courses: Course[];
  onCoursesExtracted: (courses: Omit<Course, "id">[]) => Promise<boolean>;
}

const CourseTemplateUpload = ({ courses, onCoursesExtracted }: CourseTemplateUploadProps) => {
  const { toast } = useToast();
  const [showTemplateUpload, setShowTemplateUpload] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

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
    
    ws["!cols"] = [
      { width: 15 }, { width: 40 }, { width: 25 }, { width: 10 }, { width: 8 },
      { width: 30 }, { width: 15 }, { width: 15 }, { width: 20 }, { width: 20 }, { width: 30 }
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

    setIsProcessing(true);
    console.log("=== STARTING TEMPLATE UPLOAD ===");
    console.log("File:", file.name, "Size:", file.size, "Type:", file.type);

    try {
      console.log("Reading file data...");
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];

      console.log("Raw Excel data:", rows);
      console.log("Total rows found:", rows.length);

      if (rows.length === 0) {
        throw new Error("The uploaded file appears to be empty.");
      }

      const headers = rows[0];
      console.log("Headers:", headers);
      
      // More flexible header validation
      const requiredFieldsFound = {
        courseCode: headers.some(h => h?.toString().toLowerCase().includes('course') && h?.toString().toLowerCase().includes('code')),
        courseName: headers.some(h => h?.toString().toLowerCase().includes('course') && h?.toString().toLowerCase().includes('name')),
        level: headers.some(h => h?.toString().toLowerCase().includes('level')),
        classSize: headers.some(h => h?.toString().toLowerCase().includes('class') && h?.toString().toLowerCase().includes('size')),
        department: headers.some(h => h?.toString().toLowerCase().includes('department'))
      };

      console.log("Required fields validation:", requiredFieldsFound);

      const missingFields = Object.entries(requiredFieldsFound)
        .filter(([_, found]) => !found)
        .map(([field, _]) => field);

      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}. Please ensure your template has all required columns.`);
      }

      console.log("Processing course data...");
      const newCourses = validateAndProcessCourses(rows);
      console.log("Validation complete. Processed courses:", newCourses.length);
      
      if (newCourses.length === 0) {
        throw new Error("No valid courses found in the template. Please check your data and try again.");
      }
      
      // Check for duplicates
      console.log("Checking for duplicates against existing courses:", courses.length);
      const duplicates = newCourses.filter(newCourse => {
        const isDuplicate = courses.some(existingCourse => {
          const codeMatch = existingCourse.code.toLowerCase() === newCourse.code.toLowerCase();
          const lecturerMatch = (existingCourse.lecturer || 'TBD').toLowerCase() === (newCourse.lecturer || 'TBD').toLowerCase();
          const groupMatch = (existingCourse.group || '') === (newCourse.group || '');
          return codeMatch && lecturerMatch && groupMatch;
        });
        return isDuplicate;
      });

      if (duplicates.length > 0) {
        const duplicateInfo = duplicates.map(d => 
          `${d.code}${d.group ? ` (${d.group})` : ''} (${d.lecturer || 'TBD'})`
        ).join(", ");
        console.log("Duplicates found:", duplicateInfo);
        throw new Error(`The following courses already exist: ${duplicateInfo}`);
      }

      console.log("No duplicates found. Attempting to add courses to database...");

      // Call the extraction handler and wait for result
      const success = await onCoursesExtracted(newCourses);
      console.log("Database operation result:", success);
      
      if (success) {
        setShowTemplateUpload(false);
        console.log("=== TEMPLATE UPLOAD SUCCESSFUL ===");
      } else {
        throw new Error("Failed to add courses to the database - unknown error");
      }
      
    } catch (error) {
      console.error("=== TEMPLATE UPLOAD FAILED ===");
      console.error("Error details:", error);
      
      let errorMessage = "Failed to process template.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Template Upload Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      // Clear the input
      event.target.value = "";
    }
  };

  const validateAndProcessCourses = (rows: string[][]): Omit<Course, "id">[] => {
    console.log("=== VALIDATING COURSES ===");
    const validationErrors: string[] = [];
    const processedCourses: Omit<Course, "id">[] = [];

    // Skip header row and filter out empty rows
    const dataRows = rows.slice(1).filter(row => 
      row && row.length > 0 && row.some(cell => cell?.toString().trim())
    );

    console.log(`Processing ${dataRows.length} data rows (excluding header)`);

    dataRows.forEach((row, index) => {
      const rowNumber = index + 2; // +2 because we skipped header and arrays are 0-indexed
      
      try {
        console.log(`\n--- Processing Row ${rowNumber} ---`);
        console.log("Raw row data:", row);
        
        // Safely access row elements with better error handling
        const code = (row[0] || '').toString().trim().toUpperCase();
        const name = (row[1] || '').toString().trim();
        const lecturer = (row[2] || '').toString().trim() || 'TBD';
        const level = (row[3] || '').toString().trim();
        const group = (row[4] || '').toString().trim() || undefined;
        const sharedDepartments = (row[5] || '').toString().trim() ? 
          row[5].toString().split(',').map(d => d.trim()).filter(d => d) : undefined;
        const venue = (row[6] || '').toString().trim() || undefined;
        const classSizeStr = (row[7] || '0').toString().trim();
        const classSize = parseInt(classSizeStr) || 0;
        const preferredDays = (row[8] || '').toString().trim() ? 
          row[8].toString().split(',').map(d => d.trim()).filter(d => d) : undefined;
        const preferredTimeSlot = (row[9] || '').toString().trim() || undefined;
        const departmentInput = (row[10] || '').toString().trim();

        console.log(`Row ${rowNumber} parsed:`, {
          code, name, lecturer, level, group, classSize, departmentInput
        });

        // Enhanced validation with detailed error messages
        if (!code) {
          validationErrors.push(`Row ${rowNumber}: Course code is required`);
          return;
        }

        if (!/^[A-Z]{2,4}\d{3,4}$/.test(code)) {
          validationErrors.push(`Row ${rowNumber}: Invalid course code format "${code}". Expected format: 2-4 letters followed by 3-4 digits (e.g., GST101, CSC202)`);
          return;
        }

        if (!name || name.length < 3) {
          validationErrors.push(`Row ${rowNumber}: Course name "${name}" must be at least 3 characters long`);
          return;
        }

        if (!level) {
          validationErrors.push(`Row ${rowNumber}: Academic level is required`);
          return;
        }

        const normalizedLevel = level.toUpperCase();
        const validLevels = ['100L', '200L', '300L', '400L', '100', '200', '300', '400'];
        if (!validLevels.includes(normalizedLevel)) {
          validationErrors.push(`Row ${rowNumber}: Level "${level}" must be one of: 100L, 200L, 300L, 400L`);
          return;
        }

        const finalLevel = normalizedLevel.endsWith('L') ? normalizedLevel : normalizedLevel + 'L';

        if (classSize <= 0 || classSize > 1000) {
          validationErrors.push(`Row ${rowNumber}: Class size "${classSizeStr}" must be a number between 1 and 1000`);
          return;
        }

        if (!departmentInput) {
          validationErrors.push(`Row ${rowNumber}: Department is required`);
          return;
        }

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
          validationErrors.push(`Row ${rowNumber}: Invalid department "${departmentInput}". Available departments include: ${allDepartments.slice(0, 5).join(', ')}...`);
          return;
        }

        const course: Omit<Course, "id"> = { 
          code, 
          name, 
          lecturer, 
          classSize, 
          department: matchedDepartment as Course["department"],
          academicLevel: finalLevel,
          group,
          sharedDepartments,
          venue,
          preferredDays,
          preferredTimeSlot
        };

        console.log(`Row ${rowNumber} validation successful:`, {
          code: course.code,
          name: course.name,
          lecturer: course.lecturer,
          classSize: course.classSize,
          department: course.department,
          academicLevel: course.academicLevel
        });

        processedCourses.push(course);
        
      } catch (error) {
        console.error(`Error processing row ${rowNumber}:`, error);
        validationErrors.push(`Row ${rowNumber}: Unexpected error - ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    if (validationErrors.length > 0) {
      console.error("=== VALIDATION ERRORS ===");
      validationErrors.forEach(error => console.error(error));
      throw new Error("Validation errors found:\n" + validationErrors.slice(0, 10).join("\n") + (validationErrors.length > 10 ? "\n... and more errors" : ""));
    }

    console.log(`=== VALIDATION COMPLETE ===`);
    console.log(`Successfully validated ${processedCourses.length} courses`);
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
            disabled={isProcessing}
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
              <span className="text-sm font-medium">
                {isProcessing ? "Processing Template..." : "Choose Template File"}
              </span>
              <span className="text-xs text-muted-foreground">
                XLSX format with sample data included
              </span>
              <input
                type="file"
                accept=".xlsx,.csv"
                className="hidden"
                onChange={handleTemplateUpload}
                disabled={isProcessing}
              />
            </label>
          </div>
          <div className="mt-3 text-xs text-muted-foreground text-center">
            <p>Upload the template file to add multiple courses at once</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseTemplateUpload;
