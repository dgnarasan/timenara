
import { FileText, Calendar, Minimize2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Timetable from "@/components/Timetable";
import { Card } from "@/components/ui/card";
import { ScheduleItem } from "@/lib/types";
import { useState } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

interface CourseScheduleSectionProps {
  schedule: ScheduleItem[];
}

const CourseScheduleSection = ({ schedule }: CourseScheduleSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getVenueName = (venue: ScheduleItem['venue']) => {
    if (typeof venue === 'string') return venue;
    return venue?.name || 'TBD';
  };

  const exportToCSV = () => {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const timeSlots = Array.from({ length: 9 }, (_, i) => `${i + 9}:00`);

    const data = [["Time", ...days]];

    timeSlots.forEach(time => {
      const row = [time];
      days.forEach(day => {
        const items = schedule.filter(
          item => item.timeSlot.day === day && item.timeSlot.startTime === time
        );
        row.push(items.map(item => 
          `${item.code}\n${item.name}\n${item.lecturer}\n${getVenueName(item.venue)}`
        ).join(" | ") || "");
      });
      data.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Timetable");

    const columnWidths = data[0].map((_, i) => ({
      wch: Math.max(...data.map(row => 
        row[i] ? row[i].toString().length : 0
      ))
    }));
    ws["!cols"] = columnWidths;

    XLSX.writeFile(wb, "timetable.xlsx");
  };

  const exportToCSVRaw = () => {
    const data = schedule.map(item => ({
      Day: item.timeSlot.day,
      Time: item.timeSlot.startTime,
      "Course Code": item.code,
      "Course Name": item.name,
      Lecturer: item.lecturer,
      Venue: getVenueName(item.venue),
      "Class Size": item.classSize,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Schedule Data");
    XLSX.writeFile(wb, "schedule_data.csv");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const timeSlots = Array.from({ length: 9 }, (_, i) => `${i + 9}:00`);

    doc.setFontSize(16);
    doc.text("Course Timetable", 14, 15);
    doc.setFontSize(10);

    const tableData = timeSlots.map(time => {
      const row = [time];
      days.forEach(day => {
        const items = schedule.filter(
          item => item.timeSlot.day === day && item.timeSlot.startTime === time
        );
        row.push(items.map(item => 
          `${item.code}\n${item.name}\n${getVenueName(item.venue)}`
        ).join("\n\n") || "");
      });
      return row;
    });

    (doc as any).autoTable({
      head: [["Time", ...days]],
      body: tableData,
      startY: 20,
      styles: { fontSize: 8, cellPadding: 1 },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 32 },
        2: { cellWidth: 32 },
        3: { cellWidth: 32 },
        4: { cellWidth: 32 },
        5: { cellWidth: 32 },
      },
      theme: "grid",
    });

    doc.save("timetable.pdf");
  };

  return (
    <div
      className={`space-y-6 animate-fade-in transition-all duration-300 ease-in-out ${
        isExpanded ? "fixed inset-4 z-50 bg-background/95 backdrop-blur-sm p-6 rounded-lg" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <h2 className="text-2xl font-bold tracking-tight">
            Course Schedule
          </h2>
          <p className="text-muted-foreground text-sm">
            View and manage your department's timetable
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={exportToCSVRaw}
            className="shadow-sm hover:bg-secondary/80 transition-all duration-200 font-medium"
          >
            <FileText className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={exportToPDF}
            className="shadow-sm hover:bg-secondary/80 transition-all duration-200 font-medium"
          >
            <FileText className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <Minimize2 className="h-5 w-5" />
            ) : (
              <Maximize2 className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
      <Card
        className={`overflow-hidden border shadow-lg transition-all duration-300 ${
          isExpanded ? "h-[calc(100vh-12rem)]" : ""
        }`}
      >
        <div className={`p-4 ${isExpanded ? "h-full" : ""}`}>
          <Timetable schedule={schedule} />
        </div>
      </Card>
      {schedule.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="text-base">No courses scheduled yet.</p>
          <p className="text-sm mt-2 text-muted-foreground/80">
            Generate a schedule or add courses manually to get started.
          </p>
        </div>
      )}
    </div>
  );
};

export default CourseScheduleSection;

