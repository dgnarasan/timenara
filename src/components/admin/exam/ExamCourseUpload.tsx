
import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addExamCourses } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { ExamCourse } from "@/lib/types";

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

  const validateCourse = (course: any, rowIndex: number): string[] => {
    const errors: string[] = [];
    
    if (!course.courseCode?.trim()) {
      errors.push(`Row ${rowIndex + 2}: Course Code is required`);
    }
    
    if (!course.courseTitle?.trim()) {
      errors.push(`Row ${rowIndex + 2}: Course Title is required`);
    }
    
    if (!course.department?.trim()) {
      errors.push(`Row ${rowIndex + 2}: Department is required`);
    }
    
    if (!course.college?.trim()) {
      errors.push(`Row ${rowIndex + 2}: College is required`);
    }
    
    if (!course.level?.trim()) {
      errors.push(`Row ${rowIndex + 2}: Level is required`);
    }
    
    const studentCount = parseInt(course.studentCount);
    if (isNaN(studentCount) || studentCount <= 0) {
      errors.push(`Row ${rowIndex + 2}: Student Count must be a positive number`);
    }
    
    return errors;
  };

  const parseCSV = (text: string) => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    const requiredHeaders = ['Course Code', 'Course Title', 'Department', 'College', 'Level', 'Student Count'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      setErrors([`Missing required columns: ${missingHeaders.join(', ')}`]);
      return;
    }
    
    const parsedCourses: Omit<ExamCourse, "id" | "createdAt" | "updatedAt">[] = [];
    const allErrors: string[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      
      if (values.length !== headers.length) {
        allErrors.push(`Row ${i + 1}: Incorrect number of columns`);
        continue;
      }
      
      const courseData = {
        courseCode: values[headers.indexOf('Course Code')],
        courseTitle: values[headers.indexOf('Course Title')],
        department: values[headers.indexOf('Department')],
        college: values[headers.indexOf('College')],
        level: values[headers.indexOf('Level')],
        studentCount: parseInt(values[headers.indexOf('Student Count')]),
      };
      
      const courseErrors = validateCourse(courseData, i - 1);
      allErrors.push(...courseErrors);
      
      if (courseErrors.length === 0) {
        parsedCourses.push(courseData);
      }
    }
    
    setErrors(allErrors);
    setCourses(parsedCourses);
  };

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
      setErrors(['Please select a CSV file']);
      return;
    }
    
    setFile(selectedFile);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      parseCSV(text);
    };
    reader.readAsText(selectedFile);
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
            Upload a CSV file containing exam course information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
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
                  {file ? file.name : 'Drop your CSV file here, or click to browse'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Supports CSV files only
                </p>
              </div>
            </CardContent>
          </Card>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
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
