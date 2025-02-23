
import { useState } from "react";
import { Course } from "@/lib/types";
import AddCourseForm from "@/components/AddCourseForm";
import PDFUploader from "@/components/PDFUploader";
import CourseCard from "@/components/CourseCard";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Download, Upload, FileSpreadsheet, Trash2 } from "lucide-react";
import * as XLSX from "xlsx";

interface CourseManagementSectionProps {
  courses: Course[];
  onAddCourse: (course: Omit<Course, "id">) => void;
  onCoursesExtracted: (courses: Omit<Course, "id">[]) => void;
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
  const { toast } = useToast();
  const [showTemplateUpload, setShowTemplateUpload] = useState(false);
  const [uploadMode, setUploadMode] = useState<'add' | 'replace'>('add');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [pendingCourses, setPendingCourses] = useState<Omit<Course, "id">[]>([]);

  const downloadTemplate = () => {
    const template = [
      ["Course Code*", "Course Name*", "Lecturer Name*", "Class Size*"],
      ["CS101", "Introduction to Computer Science", "Dr. John Doe", "30"],
    ];

    const ws = XLSX.utils.aoa_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Course Template");
    ws["!cols"] = [{ width: 15 }, { width: 40 }, { width: 25 }, { width: 15 }];
    XLSX.writeFile(wb, "course_template.xlsx");
    toast({
      title: "Template Downloaded",
      description: "Fill in the template and upload it back to add courses.",
    });
  };

  const validateAndProcessCourses = (rows: string[][]): Omit<Course, "id">[] => {
    const validationErrors: string[] = [];
    const processedCourses = rows.slice(1).map((row, index) => {
      if (row.length < 4) {
        validationErrors.push(`Row ${index + 2}: Missing required fields`);
        return null;
      }

      const code = row[0]?.toString().trim();
      const name = row[1]?.toString().trim();
      const lecturer = row[2]?.toString().trim();
      const classSize = parseInt(row[3]) || 0;

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

      return { code, name, lecturer, classSize };
    }).filter((course): course is Omit<Course, "id"> => course !== null);

    if (validationErrors.length > 0) {
      throw new Error("Validation errors found:\n" + validationErrors.join("\n"));
    }

    return processedCourses;
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
      if (!expectedHeaders.every((header, index) => headers[index] === header)) {
        throw new Error("Invalid template format. Please use the provided template.");
      }

      const newCourses = validateAndProcessCourses(rows);
      
      if (newCourses.length === 0) {
        throw new Error("No valid courses found in template");
      }

      // Check for duplicates if in 'add' mode
      if (uploadMode === 'add') {
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
      }

      setPendingCourses(newCourses);
      setShowUploadDialog(true);
    } catch (error) {
      toast({
        title: "Error Processing Template",
        description: error instanceof Error ? error.message : "Failed to process template",
        variant: "destructive",
      });
    }
    event.target.value = "";
  };

  const handleConfirmUpload = async () => {
    try {
      if (uploadMode === 'replace' && onClearAllCourses) {
        await onClearAllCourses();
      }
      
      onCoursesExtracted(pendingCourses);
      setShowUploadDialog(false);
      setPendingCourses([]);
      setShowTemplateUpload(false);
      
      toast({
        title: "Success",
        description: `${pendingCourses.length} courses ${uploadMode === 'replace' ? 'replaced' : 'added'} successfully`,
      });
    } catch (error) {
      toast({
        title: "Error Uploading Courses",
        description: error instanceof Error ? error.message : "Failed to upload courses",
        variant: "destructive",
      });
    }
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
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Current Courses</h3>
              {onClearAllCourses && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (window.confirm("Are you sure you want to remove all courses?")) {
                      onClearAllCourses();
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              )}
            </div>
            <div className="grid gap-4">
              {courses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onEdit={onEditCourse}
                  onDelete={onDeleteCourse ? () => onDeleteCourse(course.id) : undefined}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Courses</DialogTitle>
            <DialogDescription>
              {uploadMode === 'add' 
                ? "Add new courses to your existing list"
                : "Replace all existing courses with the new ones"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-sm">Found {pendingCourses.length} valid courses</p>
              <div className="flex gap-2">
                <Button
                  variant={uploadMode === 'add' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setUploadMode('add')}
                >
                  Add New Only
                </Button>
                <Button
                  variant={uploadMode === 'replace' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setUploadMode('replace')}
                >
                  Clear & Replace
                </Button>
              </div>
            </div>
            
            {uploadMode === 'replace' && (
              <p className="text-sm text-destructive">
                Warning: This will remove all existing courses!
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmUpload}>
              {uploadMode === 'add' ? 'Add Courses' : 'Replace All'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CourseManagementSection;

