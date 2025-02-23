
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Course } from "@/lib/types";
import { Loader2, Upload, RefreshCw } from "lucide-react";
import CoursePreview from "./CoursePreview";

interface PDFUploaderProps {
  onCoursesExtracted: (courses: Omit<Course, "id">[]) => void;
}

const PDFUploader = ({ onCoursesExtracted }: PDFUploaderProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedCourses, setExtractedCourses] = useState<Omit<Course, "id">[]>([]);
  const [lastFile, setLastFile] = useState<File | null>(null);
  const { toast } = useToast();

  const processPDF = async (file: File) => {
    if (!file) return;

    setIsProcessing(true);
    const formData = new FormData();
    formData.append("pdf", file);

    try {
      const response = await fetch("/api/extract-courses", {
        method: "POST",
        body: formData,
      });

      const contentType = response.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        throw new Error("Server returned invalid content type. Expected JSON.");
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process PDF");
      }

      const data = await response.json();
      
      if (!data.courses || !Array.isArray(data.courses)) {
        throw new Error("Invalid response format from server");
      }

      setExtractedCourses(data.courses);
      setLastFile(file);
      
      toast({
        title: "PDF Processed Successfully",
        description: `Found ${data.courses.length} courses. ${data.requiresReview ? `${data.requiresReview} courses need review.` : ""}`,
      });
    } catch (error) {
      console.error("PDF processing error:", error);
      
      let errorMessage = "Failed to process PDF. ";
      if (error instanceof Error) {
        errorMessage += error.message;
      } else {
        errorMessage += "Unknown error occurred";
      }
      
      toast({
        title: "Error Processing PDF",
        description: errorMessage,
        variant: "destructive",
        action: lastFile ? (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => processPDF(lastFile)}
            className="mt-2"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        ) : undefined,
      });
      setExtractedCourses([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      await processPDF(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    multiple: false,
  });

  const handleConfirm = (courses: Omit<Course, "id">[]) => {
    onCoursesExtracted(courses);
    setExtractedCourses([]);
    setLastFile(null);
    toast({
      title: "Success",
      description: `${courses.length} courses have been added to your schedule.`,
    });
  };

  const handleEdit = (index: number) => {
    const newCourses = [...extractedCourses];
    newCourses.splice(index, 1);
    setExtractedCourses(newCourses);
  };

  const handleRemove = (index: number) => {
    const newCourses = [...extractedCourses];
    newCourses.splice(index, 1);
    setExtractedCourses(newCourses);
    toast({
      title: "Course Removed",
      description: "The course has been removed from the preview.",
    });
  };

  const handleCancel = () => {
    setExtractedCourses([]);
    setLastFile(null);
    toast({
      title: "Preview Cancelled",
      description: "All extracted courses have been discarded.",
    });
  };

  if (extractedCourses.length > 0) {
    return (
      <CoursePreview
        courses={extractedCourses}
        onConfirm={handleConfirm}
        onEdit={handleEdit}
        onRemove={handleRemove}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <Card
      {...getRootProps()}
      className={`p-6 border-2 border-dashed ${
        isDragActive ? "border-primary" : "border-muted"
      } hover:border-primary transition-colors cursor-pointer`}
    >
      <input {...getInputProps()} />
      <div className="text-center space-y-4">
        {isProcessing ? (
          <div className="flex flex-col items-center space-y-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Processing PDF...</p>
          </div>
        ) : (
          <>
            <div className="p-4">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm font-medium">
                {isDragActive
                  ? "Drop the PDF here"
                  : "Drag and drop a PDF, or click to select"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Only PDF files are supported
              </p>
            </div>
            <Button type="button" variant="outline">
              Select PDF
            </Button>
          </>
        )}
      </div>
    </Card>
  );
};

export default PDFUploader;
