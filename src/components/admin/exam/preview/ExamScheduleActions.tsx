
import { Button } from "@/components/ui/button";
import { Download, Trash2, Play, Square, Calendar } from "lucide-react";
import { ExamScheduleItem } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

interface ExamScheduleActionsProps {
  examSchedule: ExamScheduleItem[];
  isPublished: boolean;
  viewMode: string;
  onViewModeChange: (mode: "simple" | "detailed") => void;
  onPublish: () => void;
  onUnpublish: () => void;
  onClear: () => void;
  isPublishPending: boolean;
  isClearPending: boolean;
}

const ExamScheduleActions = ({
  examSchedule,
  isPublished,
  viewMode,
  onViewModeChange,
  onPublish,
  onUnpublish,
  onClear,
  isPublishPending,
  isClearPending
}: ExamScheduleActionsProps) => {
  const { toast } = useToast();

  const handleExportCSV = () => {
    const scheduleData = examSchedule.map(item => ({
      'Course Code': item.courseCode || '',
      'Course Title': item.courseTitle || '',
      'Date': item.day ? new Date(item.day).toLocaleDateString() : '',
      'Time': `${item.startTime || ''} - ${item.endTime || ''}`,
      'Session': item.sessionName || '',
      'Venue': item.venueName || 'TBD',
      'Department': item.department || '',
      'Students': item.studentCount || 0,
    }));

    const csvContent = "data:text/csv;charset=utf-8," + 
      Object.keys(scheduleData[0] || {}).join(",") + "\n" +
      scheduleData.map(row => Object.values(row).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `exam_schedule_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Successful",
      description: "Exam schedule has been exported to CSV.",
    });
  };

  return (
    <div className="flex flex-wrap gap-3">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onViewModeChange(viewMode === "simple" ? "detailed" : "simple")}
      >
        <Calendar className="h-4 w-4 mr-2" />
        {viewMode === "simple" ? "Detailed View" : "Simple View"}
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportCSV}
      >
        <Download className="h-4 w-4 mr-2" />
        Export CSV
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={isPublished ? onUnpublish : onPublish}
        disabled={isPublishPending}
      >
        {isPublished ? (
          <>
            <Square className="h-4 w-4 mr-2" />
            Unpublish
          </>
        ) : (
          <>
            <Play className="h-4 w-4 mr-2" />
            Publish
          </>
        )}
      </Button>
      
      <Button
        variant="destructive"
        size="sm"
        onClick={onClear}
        disabled={isClearPending}
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Clear Schedule
      </Button>
    </div>
  );
};

export default ExamScheduleActions;
