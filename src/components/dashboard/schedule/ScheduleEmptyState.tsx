
import { Calendar } from "lucide-react";

const ScheduleEmptyState = () => {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
      <p className="text-base">No courses scheduled yet.</p>
      <p className="text-sm mt-2 text-muted-foreground/80">
        Generate a schedule or add courses manually to get started.
      </p>
    </div>
  );
};

export default ScheduleEmptyState;
