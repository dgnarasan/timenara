
import { FileText, Minimize2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ScheduleHeaderProps {
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onExportCSV: () => void;
  onExportPDF: () => void;
}

const ScheduleHeader = ({ 
  isExpanded, 
  onToggleExpanded, 
  onExportCSV, 
  onExportPDF 
}: ScheduleHeaderProps) => {
  return (
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
          onClick={onExportCSV}
          className="shadow-sm hover:bg-secondary/80 transition-all duration-200 font-medium"
        >
          <FileText className="h-4 w-4 mr-2" />
          CSV
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onExportPDF}
          className="shadow-sm hover:bg-secondary/80 transition-all duration-200 font-medium"
        >
          <FileText className="h-4 w-4 mr-2" />
          PDF
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleExpanded}
        >
          {isExpanded ? (
            <Minimize2 className="h-5 w-5" />
          ) : (
            <Maximize2 className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default ScheduleHeader;
