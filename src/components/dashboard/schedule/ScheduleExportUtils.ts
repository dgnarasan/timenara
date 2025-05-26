
import { ScheduleItem } from "@/lib/types";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

export const getVenueName = (venue: ScheduleItem['venue']): string => {
  if (typeof venue === 'string') return venue || 'TBD';
  if (venue && typeof venue === 'object') return venue.name || 'TBD';
  return 'TBD';
};

export const exportScheduleToCSV = (schedule: ScheduleItem[]) => {
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

export const exportScheduleToCSVRaw = (schedule: ScheduleItem[]) => {
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

export const exportScheduleToPDF = (schedule: ScheduleItem[]) => {
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
