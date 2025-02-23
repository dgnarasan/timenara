
import { FileText, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import Timetable from "@/components/Timetable";
import { Card } from "@/components/ui/card";
import { ScheduleItem } from "@/lib/types";

interface CourseScheduleSectionProps {
  schedule: ScheduleItem[];
}

const CourseScheduleSection = ({ schedule }: CourseScheduleSectionProps) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold tracking-tight">Course Schedule</h2>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="shadow-sm hover:bg-secondary/80 transition-colors"
          >
            <FileText className="h-4 w-4 mr-2 text-primary" />
            CSV
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="shadow-sm hover:bg-secondary/80 transition-colors"
          >
            <FileText className="h-4 w-4 mr-2 text-primary" />
            PDF
          </Button>
        </div>
      </div>
      <Card className="overflow-hidden border-t-4 border-t-primary shadow-md">
        <div className="p-1">
          <Timetable schedule={schedule} />
        </div>
      </Card>
      {schedule.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="text-sm">No courses scheduled yet.</p>
          <p className="text-xs mt-1">Generate a schedule or add courses manually to get started.</p>
        </div>
      )}
    </div>
  );
};

export default CourseScheduleSection;
