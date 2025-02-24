
import { useState, useEffect } from "react";
import { ScheduleItem } from "@/lib/types";
import StudentTimetableView from "@/components/student/StudentTimetableView";

const Schedule = () => {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        // TODO: Replace with actual API call
        const response = await fetch('/api/schedule');
        const data = await response.json();
        setSchedule(data.schedule);
      } catch (error) {
        console.error('Failed to fetch schedule:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchedule();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground">Loading schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Course Schedule</h1>
          <p className="text-muted-foreground mt-2">
            View and filter your course schedule
          </p>
        </div>

        <StudentTimetableView schedule={schedule} />
      </div>
    </div>
  );
};

export default Schedule;
