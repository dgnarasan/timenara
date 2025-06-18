
import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addExamCourses } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, AlertCircle, CheckCircle, X, File } from "lucide-react";
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
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: addExamCourses,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-courses'] });
      setUploadStatus('success');
      toast({
        title: "Success",
        description: `${courses.length} exam courses uploaded successfully.`,
      });
      setTimeout(() => {
        handleClose();
      }, 2000);
    },
    onError: (error) => {
      setUploadStatus('error');
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
    setUploadStatus('idle');
    onClose();
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
    setErrors([]);
    setCourses([]);
    setUploadStatus('idle');
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result as ArrayBuffer;
      parseExcel(data);
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  const clearFile = () => {
    setFile(null);
    setCourses([]);
    setErrors([]);
    setUploadStatus('idle');
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">Upload Exam Courses</DialogTitle>
          <DialogDescription className="text-gray-600">
            Upload an Excel file containing exam course information. Only .xlsx and .xls files are supported.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Upload Area */}
          <div className="space-y-4">
            <Card
              className={`border-2 border-dashed transition-all duration-200 cursor-pointer ${
                dragActive 
                  ? 'border-blue-400 bg-blue-50 shadow-lg scale-105' 
                  : file 
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-300 hover:border-blue-300 hover:bg-blue-50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => !file && fileInputRef.current?.click()}
            >
              <CardContent className="flex flex-col items-center justify-center py-12">
                {file ? (
                  <div className="text-center space-y-3">
                    <div className="flex items-center justify-center gap-3">
                      <File className="h-12 w-12 text-green-600" />
                      <div className="text-left">
                        <p className="text-lg font-semibold text-green-800">{file.name}</p>
                        <p className="text-sm text-green-600">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearFile();
                        }}
                        className="ml-2 hover:bg-red-100 hover:text-red-600 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600">Click to select a different file</p>
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    <Upload className={`h-16 w-16 mx-auto transition-colors ${
                      dragActive ? 'text-blue-500' : 'text-gray-400'
                    }`} />
                    <div>
                      <p className="text-xl font-medium text-gray-700">
                        Drop your Excel file here, or click to browse
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Supports .xlsx and .xls files only • Maximum file size: 10MB
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleInputChange}
              className="hidden"
            />
          </div>

          {/* Validation Results */}
          {errors.length > 0 && (
            <Alert variant="destructive" className="border-red-200 bg-red-50">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold text-red-800">Found {errors.length} error(s):</p>
                  <div className="max-h-32 overflow-y-auto">
                    <ul className="list-disc list-inside space-y-1">
                      {errors.map((error, index) => (
                        <li key={index} className="text-sm text-red-700">{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Success Preview */}
          {courses.length > 0 && errors.length === 0 && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <AlertDescription className="text-green-800">
                <div className="space-y-2">
                  <p className="font-semibold">
                    ✅ Successfully parsed {courses.length} exam courses!
                  </p>
                  <p className="text-sm">
                    Total students: {courses.reduce((sum, course) => sum + course.studentCount, 0).toLocaleString()}
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Upload Status */}
          {uploadStatus !== 'idle' && (
            <Alert className={uploadStatus === 'success' ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              {uploadStatus === 'success' ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <AlertDescription className={uploadStatus === 'success' ? "text-green-800" : "text-red-800"}>
                {uploadStatus === 'success' 
                  ? "Upload completed successfully! The dialog will close automatically."
                  : "Upload failed. Please try again or contact support if the problem persists."
                }
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={handleClose} disabled={uploadMutation.isPending}>
              Cancel
            </Button>
            <Button
              onClick={() => uploadMutation.mutate(courses)}
              disabled={courses.length === 0 || errors.length > 0 || uploadMutation.isPending || uploadStatus === 'success'}
              className="bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
            >
              {uploadMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading...
                </>
              ) : (
                `Upload ${courses.length} Course${courses.length !== 1 ? 's' : ''}`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExamCourseUpload;
