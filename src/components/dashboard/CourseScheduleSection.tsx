import { FileText, Calendar, Minimize2, Maximize2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import Timetable from "@/components/Timetable";
import { Card } from "@/components/ui/card";
import { ScheduleItem } from "@/lib/types";
import { useState } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface CourseScheduleSectionProps {
  schedule: ScheduleItem[];
  isPublished?: boolean;
}

const CourseScheduleSection = ({ schedule, isPublished = false }: CourseScheduleSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Validate schedule items before processing
  const validateAndFilterSchedule = (items: ScheduleItem[]): ScheduleItem[] => {
    try {
      if (!Array.isArray(items)) {
        console.warn('Schedule is not an array in CourseScheduleSection:', items);
        return [];
      }

      return items.filter((item): item is ScheduleItem => {
        if (!item || typeof item !== 'object') {
          console.warn('Filtering out invalid item in CourseScheduleSection:', item);
          return false;
        }

        const hasRequiredFields = Boolean(
          item.code &&
          item.name &&
          item.lecturer &&
          item.venue?.name &&
          item.timeSlot?.day &&
          item.timeSlot?.startTime
        );

        if (!hasRequiredFields) {
          console.warn('Filtering out item with missing required fields:', item);
        }

        return hasRequiredFields;
      });
    } catch (error) {
      console.error('Error validating schedule in CourseScheduleSection:', error);
      return [];
    }
  };

  // Get validated schedule
  const validSchedule = validateAndFilterSchedule(schedule);

  // Get all unique time ranges from the schedule for dynamic export
  const getUniqueTimeRanges = () => {
    const timeRanges = new Set<string>();
    validSchedule.forEach(item => {
      const timeRange = `${item.timeSlot.startTime} - ${item.timeSlot.endTime}`;
      timeRanges.add(timeRange);
    });
    return Array.from(timeRanges).sort((a, b) => {
      const startA = parseInt(a.split(' - ')[0].split(':')[0]);
      const startB = parseInt(b.split(' - ')[0].split(':')[0]);
      return startA - startB;
    });
  };

  const exportToExcel = () => {
    if (validSchedule.length === 0) {
      console.warn('No valid schedule items to export');
      return;
    }

    try {
      const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
      const timeRanges = getUniqueTimeRanges();

      const data = [["Time", ...days]];

      timeRanges.forEach(timeRange => {
        const row = [timeRange];
        days.forEach(day => {
          const items = validSchedule.filter(
            item => {
              const itemTimeRange = `${item.timeSlot.startTime} - ${item.timeSlot.endTime}`;
              return item.timeSlot?.day === day && itemTimeRange === timeRange;
            }
          );
          row.push(items.map(item => 
            `${item.code || 'N/A'}\n${item.name || 'N/A'}\n${item.lecturer || 'N/A'}\n${item.venue?.name || 'N/A'}`
          ).join(" | ") || "");
        });
        data.push(row);
      });

      const ws = XLSX.utils.aoa_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Flexible Timetable");

      const columnWidths = data[0].map((_, i) => ({
        wch: Math.max(...data.map(row => 
          row[i] ? row[i].toString().length : 0
        ))
      }));
      ws["!cols"] = columnWidths;

      XLSX.writeFile(wb, "flexible_timetable.xlsx");
    } catch (error) {
      console.error('Error exporting to Excel:', error);
    }
  };

  const exportToCSV = () => {
    if (validSchedule.length === 0) {
      console.warn('No valid schedule items to export');
      return;
    }

    try {
      const data = validSchedule.map(item => {
        return {
          Day: item.timeSlot?.day || 'N/A',
          Time: `${item.timeSlot?.startTime || 'N/A'} - ${item.timeSlot?.endTime || 'N/A'}`,
          Duration: `${getDurationFromTimeRange(`${item.timeSlot?.startTime} - ${item.timeSlot?.endTime}`)}h`,
          "Course Code": item.code || 'N/A',
          "Course Name": item.name || 'N/A',
          Lecturer: item.lecturer || 'N/A',
          Venue: item.venue?.name || 'N/A',
          "Class Size": item.classSize || 0,
        };
      });

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Flexible Schedule Data");
      XLSX.writeFile(wb, "flexible_schedule_data.csv");
    } catch (error) {
      console.error('Error exporting to CSV:', error);
    }
  };

  const exportToPDF = () => {
    if (validSchedule.length === 0) {
      console.warn('No valid schedule items to export');
      return;
    }

    try {
      const doc = new jsPDF();
      const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
      const timeRanges = getUniqueTimeRanges();

      doc.setFontSize(16);
      doc.text("Flexible Course Timetable", 14, 15);
      doc.setFontSize(10);

      const tableData = timeRanges.map(timeRange => {
        const row = [timeRange];
        days.forEach(day => {
          const items = validSchedule.filter(
            item => {
              const itemTimeRange = `${item.timeSlot.startTime} - ${item.timeSlot.endTime}`;
              return item.timeSlot?.day === day && itemTimeRange === timeRange;
            }
          );
          row.push(items.map(item => 
            `${item.code || 'N/A'}\n${item.name || 'N/A'}\n${item.venue?.name || 'N/A'}`
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

      doc.save("flexible_timetable.pdf");
    } catch (error) {
      console.error('Error exporting to PDF:', error);
    }
  };

  const getDurationFromTimeRange = (timeRange: string): number => {
    const [start, end] = timeRange.split(' - ');
    const startHour = parseInt(start.split(':')[0]);
    const endHour = parseInt(end.split(':')[0]);
    return endHour - startHour;
  };

  return (
    <div
      className={`space-y-4 md:space-y-6 animate-fade-in transition-all duration-300 ease-in-out ${
        isExpanded ? "fixed inset-2 md:inset-4 z-50 bg-background/95 backdrop-blur-sm p-4 md:p-6 rounded-lg overflow-y-auto" : ""
      }`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">
            Flexible Course Schedule
            {isPublished && (
              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                Published
              </span>
            )}
          </h2>
          <p className="text-muted-foreground text-xs md:text-sm">
            View and manage your department's flexible timetable (1-3 hour lectures, 8 AM - 5 PM)
          </p>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Mobile export dropdown */}
          <div className="sm:hidden flex-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="w-full" disabled={validSchedule.length === 0}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                <DropdownMenuItem onClick={exportToCSV}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToExcel}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export as Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToPDF}>
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
              onClick={exportToCSV}
              disabled={validSchedule.length === 0}
              className="shadow-sm hover:bg-secondary/80 transition-all duration-200 font-medium"
            >
              <FileText className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={exportToExcel}
              disabled={validSchedule.length === 0}
              className="shadow-sm hover:bg-secondary/80 transition-all duration-200 font-medium"
            >
              <FileText className="h-4 w-4 mr-2" />
              Excel
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={exportToPDF}
              disabled={validSchedule.length === 0}
              className="shadow-sm hover:bg-secondary/80 transition-all duration-200 font-medium"
            >
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <Minimize2 className="h-4 w-4 md:h-5 md:w-5" />
            ) : (
              <Maximize2 className="h-4 w-4 md:h-5 md:w-5" />
            )}
          </Button>
        </div>
      </div>
      
      <Card
        className={`overflow-hidden border shadow-lg transition-all duration-300 ${
          isExpanded ? "h-[calc(100vh-12rem)]" : ""
        }`}
      >
        <div className={`p-2 md:p-4 ${isExpanded ? "h-full overflow-auto" : ""}`}>
          <Timetable schedule={validSchedule} />
        </div>
      </Card>
      
      {validSchedule.length === 0 && (
        <div className="text-center py-8 md:py-12 text-muted-foreground">
          <Calendar className="h-8 w-8 md:h-12 md:w-12 mx-auto mb-4 opacity-20" />
          <p className="text-sm md:text-base">No courses scheduled yet.</p>
          <p className="text-xs md:text-sm mt-2 text-muted-foreground/80">
            Generate a flexible schedule or add courses manually to get started.
          </p>
        </div>
      )}
    </div>
  );
};

export default CourseScheduleSection;
