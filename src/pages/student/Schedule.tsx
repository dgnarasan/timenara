
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ScheduleItem } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import StudentTimetableView from "@/components/student/StudentTimetableView";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchSchedule } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import { 
  LayoutDashboard, 
  LogOut, 
  Home, 
  Calendar, 
  List,
  Grid 
} from "lucide-react";

const Schedule = () => {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"timetable" | "list">("timetable");
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  // Use useCallback to memoize the fetchSchedule function
  const loadSchedule = useCallback(async () => {
    try {
      setIsLoading(true);
      const scheduleData = await fetchSchedule();
      setSchedule(scheduleData);
    } catch (error) {
      console.error('Failed to fetch schedule:', error);
      toast({
        title: "Error",
        description: "Failed to load schedule. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  return (
    <div className="container mx-auto py-8 px-4 fade-in">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Course Schedule</h1>
            <p className="text-muted-foreground mt-2">
              View and filter your course schedule
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-0">
            <div className="bg-muted/30 p-1 rounded-lg flex">
              <Button 
                variant={viewMode === "timetable" ? "default" : "ghost"} 
                size="sm" 
                className="gap-2"
                onClick={() => setViewMode("timetable")}
              >
                <Grid className="h-4 w-4" />
                Grid
              </Button>
              <Button 
                variant={viewMode === "list" ? "default" : "ghost"} 
                size="sm" 
                className="gap-2"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
                List
              </Button>
            </div>
            
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

        {isLoading ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-10 w-[100px]" />
              <Skeleton className="h-10 w-[150px]" />
            </div>
            <Skeleton className="h-[400px] w-full" />
          </div>
        ) : (
          <div className="bg-card rounded-lg p-4 shadow-sm transition-all hover:shadow-md border">
            <StudentTimetableView 
              schedule={schedule} 
              viewMode={viewMode}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Schedule;
