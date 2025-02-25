
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ScheduleItem } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import StudentTimetableView from "@/components/student/StudentTimetableView";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, LogOut, Home } from "lucide-react";

const Schedule = () => {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Course Schedule</h1>
            <p className="text-muted-foreground mt-2">
              View and filter your course schedule
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-0">
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={() => navigate("/")}
            >
              <Home className="h-4 w-4" />
              Home
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={() => navigate("/admin")}
            >
              <LayoutDashboard className="h-4 w-4" />
              Admin Dashboard
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={() => signOut()}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>

        <StudentTimetableView schedule={schedule} />
      </div>
    </div>
  );
};

export default Schedule;
