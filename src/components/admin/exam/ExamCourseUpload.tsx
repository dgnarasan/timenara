
import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addExamCourses } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, AlertCircle, CheckCircle, Download } from "lucide-react";
import { ExamCourse } from "@/lib/types";
import * as XLSX from "xlsx";

interface ExamCourseUploadProps {
  isOpen: boolean;
  onClose: () => void;
}

const ExamCourseUpload = ({ isOpen, onClose }: ExamCourseUploadProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [courses, setCourses] = useState<Omit<ExamCourse, "id" | "createdAt" | "updatedAt">[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: addExamCourses,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-courses'] });
      toast({
        title: "Success",
        description: `${courses.length} exam courses uploaded successfully.`,
      });
      handleClose();
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: "Failed to upload exam courses. Please try again.",
        variant: "destructive",
      });
      console.error("Upload error:", error);
    },
  });

  const handleClose = () => {
    setFile(null);
    setCourses([]);
    setErrors([]);
    onClose();
  };

  const downloadTemplate = () => {
    // Create template with exact structure from the image
    const template = [
      ["Course", "No of Students", "Departments Offering The Course"],
      ["SMS 301 (Acct.)", "165", "Accounting"],
      ["BCH 401", "60", "Biochemistry"],
      ["BCH 403", "60", "Biochemistry"],
      ["CSC 413", "370", "Computer Science"],
      ["CSC 433", "370", "Computer Science"],
    ];

    const ws = XLSX.utils.aoa_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Exam Courses");
    
    // Set column widths for better readability
    ws["!cols"] = [
      { width: 20 }, // Course
      { width: 15 }, // No of Students
      { width: 30 }  // Departments Offering The Course
    ];
    
    XLSX.writeFile(wb, "exam_courses_template.xlsx");
    toast({
      title: "Template Downloaded",
      description: "Excel template downloaded. Fill in your exam courses and upload it back.",
    });
  };

  const validateCourse = (course: any, rowIndex: number): string[] => {
    const errors: string[] = [];
    
    if (!course.courseCode?.trim()) {
      errors.push(`Row ${rowIndex + 2}: Course is required`);
    }
    
    const studentCount = parseInt(course.studentCount);
    if (isNaN(studentCount) || studentCount <= 0) {
      errors.push(`Row ${rowIndex + 2}: No of Students must be a positive number`);
    }
    
    if (!course.department?.trim()) {
      errors.push(`Row ${rowIndex + 2}: Department is required`);
    }
    
    return errors;
  };

  const parseExcel = (data: ArrayBuffer) => {
    try {
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
      
      if (rows.length === 0) {
        setErrors(['The uploaded file appears to be empty.']);
        return;
      }
      
      const headers = rows[0].map(h => h?.toString().trim());
      const expectedHeaders = ['Course', 'No of Students', 'Departments Offering The Course'];
      
      // Check if headers match
      const headerMatches = expectedHeaders.every((expectedHeader, index) => {
        const actualHeader = headers[index]?.toLowerCase();
        const expectedLower = expectedHeader.toLowerCase();
        return actualHeader === expectedLower || 
               actualHeader === 'no of students' ||
               actualHeader === 'departments offering the course';
      });

      if (!headerMatches) {
        setErrors([`Invalid template format. Expected headers: ${expectedHeaders.join(", ")}`]);
        return;
      }

      const parsedCourses: Omit<ExamCourse, "id" | "createdAt" | "updatedAt">[] = [];
      const allErrors: string[] = [];
      
      for (let i = 1; i < rows.length; i++) {
        const values = rows[i];
        
        if (!values || values.length < 3 || !values.some(cell => cell?.toString().trim())) {
          continue; // Skip empty rows
        }
        
        const courseCode = values[0]?.toString().trim();
        const studentCount = parseInt(values[1]?.toString()) || 0;
        const department = values[2]?.toString().trim();
        
        const courseData = {
          courseCode,
          courseTitle: courseCode, // Use course code as title for now
          department,
          college: "Default College", // Default value
          level: "Undergraduate", // Default value
          studentCount,
        };
        
        const courseErrors = validateCourse({
          courseCode,
          studentCount,
          department
        }, i - 1);
        
        allErrors.push(...courseErrors);
        
        if (courseErrors.length === 0) {
          parsedCourses.push(courseData);
        }
      }
      
      setErrors(allErrors);
      setCourses(parsedCourses);
    } catch (error) {
      setErrors(['Failed to parse Excel file. Please ensure it\'s a valid Excel file.']);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls'].includes(fileExtension || '')) {
      setErrors(['Please select an Excel file (.xlsx or .xls)']);
      return;
    }
    
    setFile(selectedFile);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result as ArrayBuffer;
      parseExcel(data);
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Exam Courses</DialogTitle>
          <DialogDescription>
            Upload an Excel file containing exam course information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template Download */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <h4 className="font-medium">Download Template</h4>
              <p className="text-sm text-muted-foreground">
                Get the Excel template with the correct format
              </p>
            </div>
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
          </div>

          {/* File Upload Area */}
          <Card
            className={`border-2 border-dashed transition-colors cursor-pointer ${
              dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Upload className="h-12 w-12 text-muted-foreground mb-4" />
              <div className="text-center">
                <p className="text-lg font-medium">
                  {file ? file.name : 'Drop your Excel file here, or click to browse'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Supports .xlsx and .xls files only
                </p>
              </div>
            </CardContent>
          </Card>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleInputChange}
            className="hidden"
          />

          {/* Errors */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">Found {errors.length} error(s):</p>
                  <ul className="list-disc list-inside space-y-1">
                    {errors.slice(0, 5).map((error, index) => (
                      <li key={index} className="text-sm">{error}</li>
                    ))}
                    {errors.length > 5 && (
                      <li className="text-sm">... and {errors.length - 5} more errors</li>
                    )}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Success Preview */}
          {courses.length > 0 && errors.length === 0 && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Successfully parsed {courses.length} exam courses. Ready to upload!
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={() => uploadMutation.mutate(courses)}
              disabled={courses.length === 0 || errors.length > 0 || uploadMutation.isPending}
            >
              {uploadMutation.isPending ? "Uploading..." : `Upload ${courses.length} Courses`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExamCourseUpload;
