
import { useState } from "react";
import Timetable from "@/components/Timetable";
import { Card } from "@/components/ui/card";
import { ScheduleItem } from "@/lib/types";
import ScheduleHeader from "./schedule/ScheduleHeader";
import ScheduleEmptyState from "./schedule/ScheduleEmptyState";
import { exportScheduleToCSVRaw, exportScheduleToPDF } from "./schedule/ScheduleExportUtils";

interface CourseScheduleSectionProps {
  schedule: ScheduleItem[];
}

const CourseScheduleSection = ({ schedule }: CourseScheduleSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleExportCSV = () => {
    exportScheduleToCSVRaw(schedule);
  };

  const handleExportPDF = () => {
    exportScheduleToPDF(schedule);
  };

  return (
    <div
      className={`space-y-6 animate-fade-in transition-all duration-300 ease-in-out ${
        isExpanded ? "fixed inset-4 z-50 bg-background/95 backdrop-blur-sm p-6 rounded-lg" : ""
      }`}
    >
      <ScheduleHeader
        isExpanded={isExpanded}
        onToggleExpanded={() => setIsExpanded(!isExpanded)}
        onExportCSV={handleExportCSV}
        onExportPDF={handleExportPDF}
      />
      
      <Card
        className={`overflow-hidden border shadow-lg transition-all duration-300 ${
          isExpanded ? "h-[calc(100vh-12rem)]" : ""
        }`}
      >
        <div className={`p-4 ${isExpanded ? "h-full" : ""}`}>
          <Timetable schedule={schedule} />
        </div>
      </Card>
      
      {schedule.length === 0 && <ScheduleEmptyState />}
    </div>
  );
};

export default CourseScheduleSection;
