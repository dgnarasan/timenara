
import { useState, useEffect } from "react";
import { ExamCourse, ExamScheduleItem } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Calendar, FileText, Download, GraduationCap, Clock, MapPin } from "lucide-react";
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
  schedule?: any[];
  viewMode?: "timetable" | "list";
}

const ExamTimetableView = ({ 
  examCourses = [], 
  examSchedule = [], 
  schedule = [],
  viewMode = "timetable" 
}: ExamTimetableViewProps) => {
  const { toast } = useToast();

  // Determine which data to use - prioritize examCourses if available
  const displayData = examCourses.length > 0 ? examCourses : 
                     examSchedule.length > 0 ? examSchedule : 
                     schedule;

  const handleExport = (format: "pdf" | "csv") => {
    if (displayData.length === 0) {
      toast({
        title: "No Data to Export",
        description: "No exam data available to export.",
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
    const data = displayData.map((item: any) => ({
      "Course Code": item.courseCode || item.course_code || 'N/A',
      "Course Title": item.courseTitle || item.course_title || 'N/A',
      "Department": item.department || 'N/A',
      "College": item.college || 'N/A',
      "Level": item.level || 'N/A',
      "Student Count": item.studentCount || item.student_count || 0,
      ...(item.day && {
        "Date": item.day,
        "Time": `${item.startTime || item.start_time} - ${item.endTime || item.end_time}`,
        "Session": item.sessionName || item.session_name,
        "Venue": item.venueName || item.venue_name || 'TBD'
      })
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Exam Data");
    XLSX.writeFile(wb, "exam-data.xlsx");

    toast({
      title: "Data Exported",
      description: "Exam data has been exported to Excel format.",
    });
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    const tableData = displayData.map((item: any) => [
      item.courseCode || item.course_code || 'N/A',
      item.courseTitle || item.course_title || 'N/A',
      item.department || 'N/A',
      item.college || 'N/A',
      item.level || 'N/A',
      (item.studentCount || item.student_count || 0).toString(),
    ]);

    doc.autoTable({
      head: [["Code", "Title", "Department", "College", "Level", "Students"]],
      body: tableData,
      startY: 20,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 1 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    });

    doc.save("exam-data.pdf");

    toast({
      title: "Data Exported",
      description: "Exam data has been exported to PDF format.",
    });
  };

  // Render exam schedule as timetable view
  const renderTimetableView = () => {
    if (examSchedule.length === 0 && schedule.length === 0) {
      return (
        <Card className="p-8 text-center">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="text-muted-foreground">No exam schedule available yet.</p>
        </Card>
      );
    }

    const scheduleData = examSchedule.length > 0 ? examSchedule : schedule;

    return (
      <div className="space-y-4">
        {scheduleData.map((item: any, index: number) => (
          <Card key={index} className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-primary">
                    {item.courseCode || item.course_code}
                  </h3>
                  <span className="text-sm text-muted-foreground">
                    {item.courseTitle || item.course_title}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{item.day}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{item.startTime || item.start_time} - {item.endTime || item.end_time}</span>
                  </div>
                  {(item.venueName || item.venue_name) && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{item.venueName || item.venue_name}</span>
                    </div>
                  )}
                </div>
              </div>
              {item.sessionName && (
                <div className="text-sm font-medium text-primary">
                  {item.sessionName}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            {examSchedule.length > 0 || schedule.length > 0 ? "Exam Schedule" : "Exam Courses"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {examSchedule.length > 0 || schedule.length > 0 
              ? "View your examination schedule and details"
              : "View exam courses organized by college and academic level"
            }
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

      {/* Show appropriate view based on data type */}
      {examCourses.length > 0 ? (
        <CollegeLevelExamFilter examCourses={examCourses} />
      ) : (examSchedule.length > 0 || schedule.length > 0) && viewMode === "timetable" ? (
        renderTimetableView()
      ) : (
        <Card className="p-8 text-center">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="text-muted-foreground">No exam data available yet.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Upload exam courses or generate a schedule to get started.
          </p>
        </Card>
      )}
    </div>
  );
};

export default ExamTimetableView;
