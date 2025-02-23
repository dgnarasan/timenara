
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

      // Skip header row and process data rows
      const courses = rows.slice(1).map((row) => {
        if (row.length < 4) return null;
        
        return {
          code: row[0],
          name: row[1],
          lecturer: row[2],
          classSize: parseInt(row[3]) || 0,
        };
      }).filter((course): course is Omit<Course, "id"> => 
        course !== null && 
        typeof course.code === 'string' && 
        typeof course.name === 'string' && 
        typeof course.lecturer === 'string' && 
        course.classSize > 0
      );

      if (courses.length === 0) {
        throw new Error("No valid courses found in template");
      }

      onCoursesExtracted(courses);
      setShowTemplateUpload(false);
      
      toast({
        title: "Success",
        description: `${courses.length} courses imported from template`,
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
