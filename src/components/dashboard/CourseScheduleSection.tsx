
import { FileText, Calendar, Minimize2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Timetable from "@/components/Timetable";
import { Card } from "@/components/ui/card";
import { ScheduleItem } from "@/lib/types";
import { useState } from "react";

interface CourseScheduleSectionProps {
  schedule: ScheduleItem[];
}

const CourseScheduleSection = ({ schedule }: CourseScheduleSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`space-y-6 animate-fade-in transition-all duration-300 ease-in-out ${
      isExpanded ? 'fixed inset-4 z-50 bg-background/95 backdrop-blur-sm p-6 rounded-lg' : ''
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Calendar className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Course Schedule
          </h2>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="shadow-sm hover:bg-secondary/80 transition-all duration-200 font-medium"
          >
            <FileText className="h-4 w-4 mr-2 text-primary" />
            CSV
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="shadow-sm hover:bg-secondary/80 transition-all duration-200 font-medium"
          >
            <FileText className="h-4 w-4 mr-2 text-primary" />
            PDF
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-2"
          >
            {isExpanded ? (
              <Minimize2 className="h-5 w-5 text-primary hover:scale-105 transition-transform" />
            ) : (
              <Maximize2 className="h-5 w-5 text-primary hover:scale-105 transition-transform" />
            )}
          </Button>
        </div>
      </div>
      <Card className={`overflow-hidden border-t-4 border-t-primary shadow-lg transition-all duration-300 ${
        isExpanded ? 'h-[calc(100vh-12rem)]' : ''
      }`}>
        <div className={`p-2 ${isExpanded ? 'h-full' : ''}`}>
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
