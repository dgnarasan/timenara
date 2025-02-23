
import { useState, useEffect } from "react";
import { ScheduleItem } from "@/lib/types";
import { fetchCourses } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import Timetable from "@/components/Timetable";

const StudentSchedule = () => {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSchedule = async () => {
      try {
        const courses = await fetchCourses();
        // For now, we'll just show all courses in the schedule
        // In a real app, you'd filter based on student enrollment
        setSchedule(courses.map(course => ({
          ...course,
          venue: { id: "temp", name: "TBD", capacity: 0, availability: [] },
          timeSlot: {
            day: "Monday",
            startTime: "9:00",
            endTime: "10:00"
          }
        })));
      } catch (error) {
        toast({
          title: "Error Loading Schedule",
          description: error instanceof Error ? error.message : "Failed to load schedule",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSchedule();
  }, [toast]);

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Schedule</h1>
            <p className="text-muted-foreground">
              View your course timetable
            </p>
          </div>
          <div className="space-x-2">
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Export Schedule
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <Timetable schedule={schedule} />
      </div>
    </div>
  );
};

export default StudentSchedule;
