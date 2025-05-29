
import { Button } from "@/components/ui/button";
import { Trash2, Eye, EyeOff } from "lucide-react";
import GenerateScheduleDialog from "./GenerateScheduleDialog";
import { Course, ScheduleItem } from "@/lib/types";

interface DashboardActionButtonsProps {
  courses: Course[];
  schedule: ScheduleItem[];
  isSchedulePublished: boolean;
  isPublishing: boolean;
  isClearingSchedule: boolean;
  onScheduleGenerated: (schedule: ScheduleItem[]) => void;
  onTogglePublish: () => void;
  onClearSchedule: () => void;
}

const DashboardActionButtons = ({
  courses,
  schedule,
  isSchedulePublished,
  isPublishing,
  isClearingSchedule,
  onScheduleGenerated,
  onTogglePublish,
  onClearSchedule,
}: DashboardActionButtonsProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {schedule.length > 0 && !isClearingSchedule && (
        <>
          <Button 
            variant={isSchedulePublished ? "default" : "outline"}
            size="sm" 
            className="gap-2"
            onClick={onTogglePublish}
            disabled={isPublishing}
          >
            {isSchedulePublished ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            {isPublishing ? "Processing..." : (isSchedulePublished ? "Published" : "Publish")}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={onClearSchedule}
            disabled={isClearingSchedule}
          >
            <Trash2 className="h-4 w-4" />
            {isClearingSchedule ? "Clearing..." : "Clear Schedule"}
          </Button>
        </>
      )}
      <GenerateScheduleDialog 
        courses={courses}
        onScheduleGenerated={onScheduleGenerated}
      />
    </div>
  );
};

export default DashboardActionButtons;
