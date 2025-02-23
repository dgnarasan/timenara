
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import Timetable from "@/components/Timetable";
import { ScheduleItem } from "@/lib/types";

interface CourseScheduleSectionProps {
  schedule: ScheduleItem[];
}

const CourseScheduleSection = ({ schedule }: CourseScheduleSectionProps) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight">Course Schedule</h2>
        <div className="space-x-2">
          <Button variant="outline" size="sm" className="shadow-sm">
            <FileText className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Button variant="outline" size="sm" className="shadow-sm">
            <FileText className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>
      <div className="bg-card rounded-lg border shadow-sm">
        <Timetable schedule={schedule} />
      </div>
    </div>
  );
};

export default CourseScheduleSection;
