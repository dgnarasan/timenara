
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ExamScheduleItem } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { fetchExamSchedule } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import { 
  LayoutDashboard, 
  LogOut, 
  Home, 
  Calendar,
  List,
  Grid3x3,
  GraduationCap
} from "lucide-react";
import ExamTimetableView from "@/components/student/ExamTimetableView";

const ExamSchedule = () => {
  const [schedule, setSchedule] = useState<ExamScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"timetable" | "list">("timetable");
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const loadSchedule = useCallback(async () => {
    try {
      setIsLoading(true);
      const scheduleData = await fetchExamSchedule();
      setSchedule(scheduleData);
      
      if (scheduleData.length === 0) {
        toast({
          title: "No Published Exam Schedule",
          description: "No exam schedule has been published yet. Please check back later.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Failed to fetch exam schedule:', error);
      toast({
        title: "Error",
        description: "Failed to load exam schedule. Please try again.",
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
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <GraduationCap className="h-8 w-8 text-primary" />
              Exam Timetable
            </h1>
            <p className="text-muted-foreground mt-2">
              View your examination schedule and important details
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
                <Grid3x3 className="h-4 w-4" />
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
              onClick={() => navigate("/schedule")}
            >
              <Calendar className="h-4 w-4" />
              Course Schedule
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
          <Card className="p-6 shadow-sm transition-all hover:shadow-md border">
            <ExamTimetableView 
              schedule={schedule} 
              viewMode={viewMode}
            />
          </Card>
        )}
      </div>
    </div>
  );
};

export default ExamSchedule;
