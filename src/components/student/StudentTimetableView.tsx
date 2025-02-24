
import { useState, useEffect } from "react";
import { Course, ScheduleItem } from "@/lib/types";
import CourseFilterBar, { FilterOptions } from "./CourseFilterBar";
import Timetable from "../Timetable";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

interface StudentTimetableViewProps {
  schedule: ScheduleItem[];
}

const StudentTimetableView = ({ schedule }: StudentTimetableViewProps) => {
  const { toast } = useToast();
  const [filteredSchedule, setFilteredSchedule] = useState<ScheduleItem[]>(schedule);
  const [filters, setFilters] = useState<FilterOptions>({
    search: "",
    academicLevel: "",
    lecturer: "",
    timeSlot: "",
  });

  useEffect(() => {
    const filtered = schedule.filter((item) => {
      const matchesSearch =
        filters.search === "" ||
        item.code.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.name.toLowerCase().includes(filters.search.toLowerCase());

      const matchesLevel =
        filters.academicLevel === "" ||
        item.academicLevel === filters.academicLevel;

      const matchesLecturer =
        filters.lecturer === "" || item.lecturer === filters.lecturer;

      const matchesTimeSlot = filters.timeSlot === "" || matchesTimeRange(item, filters.timeSlot);

      return matchesSearch && matchesLevel && matchesLecturer && matchesTimeSlot;
    });

    setFilteredSchedule(filtered);
  }, [schedule, filters]);

  const matchesTimeRange = (item: ScheduleItem, timeSlot: string) => {
    const startHour = parseInt(item.timeSlot.startTime.split(":")[0]);
    if (timeSlot === "Morning (9:00 - 12:00)") {
      return startHour >= 9 && startHour < 12;
    }
    if (timeSlot === "Afternoon (13:00 - 17:00)") {
      return startHour >= 13 && startHour < 17;
    }
    return true;
  };

  const handleExport = (format: "pdf" | "csv") => {
    if (filteredSchedule.length === 0) {
      toast({
        title: "No Data to Export",
        description: "Please adjust your filters to include some courses.",
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
    const data = filteredSchedule.map((item) => ({
      "Course Code": item.code,
      "Course Name": item.name,
      "Lecturer": item.lecturer,
      "Day": item.timeSlot.day,
      "Time": `${item.timeSlot.startTime} - ${item.timeSlot.endTime}`,
      "Venue": item.venue.name,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Schedule");
    XLSX.writeFile(wb, "course-schedule.xlsx");

    toast({
      title: "Schedule Exported",
      description: "Your schedule has been exported to Excel format.",
    });
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    const tableData = filteredSchedule.map((item) => [
      item.code,
      item.name,
      item.lecturer,
      item.timeSlot.day,
      `${item.timeSlot.startTime} - ${item.timeSlot.endTime}`,
      item.venue.name,
    ]);

    doc.autoTable({
      head: [["Code", "Course", "Lecturer", "Day", "Time", "Venue"]],
      body: tableData,
      startY: 20,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 1 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    });

    doc.save("course-schedule.pdf");

    toast({
      title: "Schedule Exported",
      description: "Your schedule has been exported to PDF format.",
    });
  };

  return (
    <div className="space-y-6">
      <CourseFilterBar
        courses={schedule}
        onFilterChange={setFilters}
        onExport={handleExport}
      />
      <Timetable schedule={filteredSchedule} />
    </div>
  );
};

export default StudentTimetableView;
