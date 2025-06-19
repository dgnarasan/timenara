
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { fetchAdminExamSchedule } from "@/lib/db";
import { Calendar, FileText, Download, Eye, Users, Building2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { format, parseISO } from "date-fns";
import OfficialExamScheduleDisplay from "./OfficialExamScheduleDisplay";

const ExamSchedulePreview = () => {
  const [viewMode, setViewMode] = useState<"table" | "official">("official");
  const { toast } = useToast();

  // Fetch exam schedule
  const { data: examSchedule = [], isLoading, error } = useQuery({
    queryKey: ['admin-exam-schedule'],
    queryFn: fetchAdminExamSchedule,
  });

  const handleExport = (format: "csv" | "pdf") => {
    if (examSchedule.length === 0) {
      toast({
        title: "No Data to Export",
        description: "No exam schedule available to export.",
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
    const data = examSchedule.map((item) => ({
      "Date": format(parseISO(item.day), 'EEEE, MMMM dd, yyyy'),
      "Time": `${item.startTime} - ${item.endTime}`,
      "Session": item.sessionName,
      "Course Code": item.courseCode,
      "Course Title": item.courseTitle,
      "Department": item.department,
      "College": item.college,
      "Level": item.level,
      "Venue": item.venueName,
      "Students": item.studentCount || 0,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Exam Schedule");
    XLSX.writeFile(wb, "caleb-exam-schedule.xlsx");

    toast({
      title: "Schedule Exported",
      description: "Exam schedule has been exported to Excel format.",
    });
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text("CALEB UNIVERSITY - EXAM SCHEDULE", 14, 20);
    doc.setFontSize(12);
    doc.text("2024/2025 Academic Session", 14, 30);

    const tableData = examSchedule.map((item) => [
      format(parseISO(item.day), 'MMM dd'),
      `${item.startTime}-${item.endTime}`,
      item.courseCode,
      item.courseTitle?.substring(0, 30) + (item.courseTitle?.length > 30 ? '...' : ''),
      item.venueName,
      (item.studentCount || 0).toString(),
    ]);

    doc.autoTable({
      head: [["Date", "Time", "Code", "Course", "Venue", "Students"]],
      body: tableData,
      startY: 40,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      columnStyles: {
        3: { cellWidth: 'auto' }, // Course title column
      },
    });

    doc.save("caleb-exam-schedule.pdf");

    toast({
      title: "Schedule Exported",
      description: "Exam schedule has been exported to PDF format.",
    });
  };

  const getScheduleStats = () => {
    if (examSchedule.length === 0) return null;

    const uniqueDays = new Set(examSchedule.map(item => item.day)).size;
    const uniqueVenues = new Set(examSchedule.map(item => item.venueName)).size;
    const totalStudents = examSchedule.reduce((sum, item) => sum + (item.studentCount || 0), 0);
    const uniqueColleges = new Set(examSchedule.map(item => item.college)).size;

    return {
      totalExams: examSchedule.length,
      examDays: uniqueDays,
      venuesUsed: uniqueVenues,
      totalStudents,
      colleges: uniqueColleges,
    };
  };

  const stats = getScheduleStats();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading exam schedule...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-destructive mb-2">Error loading exam schedule</p>
          <p className="text-sm text-muted-foreground">Please try refreshing the page.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with stats and controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Official Exam Schedule Preview
              </CardTitle>
              <CardDescription>
                {examSchedule.length > 0 
                  ? `Generated schedule with ${examSchedule.length} exam sessions`
                  : "No exam schedule generated yet"
                }
              </CardDescription>
            </div>
            
            {examSchedule.length > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "official" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("official")}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Official Format
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleExport("csv")}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Excel
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleExport("pdf")}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  PDF
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        
        {stats && (
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.totalExams}</div>
                <p className="text-xs text-gray-600">Total Exams</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.examDays}</div>
                <p className="text-xs text-gray-600">Exam Days</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.venuesUsed}</div>
                <p className="text-xs text-gray-600">Venues Used</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.totalStudents.toLocaleString()}</div>
                <p className="text-xs text-gray-600">Total Students</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.colleges}</div>
                <p className="text-xs text-gray-600">Colleges</p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Schedule Display */}
      {examSchedule.length > 0 ? (
        <OfficialExamScheduleDisplay schedule={examSchedule} />
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Exam Schedule Generated</h3>
            <p className="text-gray-500 mb-4">
              Generate an exam schedule to preview the official Caleb University timetable format.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
              <Clock className="h-4 w-4" />
              <span>Ready to schedule exams in official format</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ExamSchedulePreview;
