
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Course } from "@/lib/types";
import { Loader2 } from "lucide-react";

interface PDFUploaderProps {
  onCoursesExtracted: (courses: Omit<Course, "id">[]) => void;
}

const PDFUploader = ({ onCoursesExtracted }: PDFUploaderProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsProcessing(true);
    const formData = new FormData();
    formData.append("pdf", file);

    try {
      const response = await fetch("/api/extract-courses", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to process PDF");
      }

      const { courses } = await response.json();
      
      toast({
        title: "PDF Processed Successfully",
        description: `Extracted ${courses.length} courses from the document.`,
      });

      onCoursesExtracted(courses);
    } catch (error) {
      toast({
        title: "Error Processing PDF",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [onCoursesExtracted, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    multiple: false,
  });

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
