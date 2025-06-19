
import { useState, useEffect } from "react";
import { ExamCourse, ExamScheduleItem } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Calendar, FileText, Download, GraduationCap } from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import CollegeLevelExamFilter from "./CollegeLevelExamFilter";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "../ui/dropdown-menu";

interface ExamTimetableViewProps {
  examCourses?: ExamCourse[];
  examSchedule?: ExamScheduleItem[];
  schedule?: ExamScheduleItem[];
  viewMode?: "timetable" | "list";
}

const ExamTimetableView = ({ examCourses = [], examSchedule = [], schedule, viewMode = "timetable" }: ExamTimetableViewProps) => {
  const { toast } = useToast();

  // Use schedule prop if provided, otherwise use examCourses - ensure we always have an array
  const displayData: (ExamCourse | ExamScheduleItem)[] = schedule || examCourses || [];

  const handleExport = (format: "pdf" | "csv") => {
    if (!displayData || displayData.length === 0) {
      toast({
        title: "No Data to Export",
        description: "No exam courses available to export.",
        variant: "destructive",
      });
      return;
    }

    if (format === "csv") {
      exportToCSV();
    } else {
      exportToPDF();
    }
  };

  const exportToCSV = () => {
    if (!displayData || displayData.length === 0) {
      return;
    }

    const data = displayData.map((course) => {
      // Type guard to check if it's an ExamCourse or ExamScheduleItem
      const courseCode = course.courseCode;
      const courseTitle = course.courseTitle;
      
      return {
        "Course Code": courseCode,
        "Course Title": courseTitle,
        "Department": course.department,
        "College": course.college || '',
        "Level": course.level || '',
        "Student Count": (course.studentCount || 0),
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Exam Courses");
    XLSX.writeFile(wb, "exam-courses.xlsx");

    toast({
      title: "Data Exported",
      description: "Exam courses have been exported to Excel format.",
    });
  };

  const exportToPDF = () => {
    if (!displayData || displayData.length === 0) {
      return;
    }

    const doc = new jsPDF();
    
    const tableData = displayData.map((course) => {
      // Type guard to check if it's an ExamCourse or ExamScheduleItem
      const courseCode = course.courseCode;
      const courseTitle = course.courseTitle;
      
      return [
        courseCode,
        courseTitle,
        course.department,
        course.college || '',
        course.level || '',
        (course.studentCount || 0).toString(),
      ];
    });

    doc.autoTable({
      head: [["Code", "Title", "Department", "College", "Level", "Students"]],
      body: tableData,
      startY: 20,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 1 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    });

    doc.save("exam-courses.pdf");

    toast({
      title: "Data Exported",
      description: "Exam courses have been exported to PDF format.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            Exam Courses
          </h2>
          <p className="text-sm text-muted-foreground">
            View exam courses organized by college and academic level
          </p>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Mobile export dropdown */}
          <div className="sm:hidden flex-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                <DropdownMenuItem onClick={() => handleExport("csv")}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("pdf")}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Desktop export buttons */}
          <div className="hidden sm:flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleExport("csv")}
              className="shadow-sm hover:bg-secondary/80 transition-all duration-200 font-medium"
            >
              <FileText className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleExport("pdf")}
              className="shadow-sm hover:bg-secondary/80 transition-all duration-200 font-medium"
            >
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>
      </div>

      <CollegeLevelExamFilter examCourses={examCourses} />

      {(!displayData || displayData.length === 0) && (
        <Card className="p-8 text-center">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="text-muted-foreground">No exam courses uploaded yet.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Upload an Excel file with exam courses to get started.
          </p>
        </Card>
      )}
    </div>
  );
};

export default ExamTimetableView;
