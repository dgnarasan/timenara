
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ScheduleItem } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import StudentTimetableView from "@/components/student/StudentTimetableView";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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

  // Load mock schedule data for demonstration
  useEffect(() => {
    const loadScheduleData = async () => {
      try {
        // Simulate API call with a short timeout
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mock data for demonstration
        const mockSchedule: ScheduleItem[] = [
          {
            id: "c1",
            code: "CS101",
            name: "Introduction to Computer Science",
            lecturer: "Dr. Smith",
            classSize: 45,
            department: "Computer Science",
            academicLevel: "100",
            venue: { id: "v1", name: "Room 101", capacity: 50, availability: [] },
            timeSlot: { day: "Monday", startTime: "9:00", endTime: "10:00" }
          },
          {
            id: "c2",
            code: "MTH201",
            name: "Linear Algebra",
            lecturer: "Prof. Johnson",
            classSize: 40,
            department: "Information Systems", // Changed from "Mathematics" to a valid Department type
            academicLevel: "200",
            venue: { id: "v2", name: "Room 102", capacity: 50, availability: [] },
            timeSlot: { day: "Tuesday", startTime: "11:00", endTime: "12:00" }
          },
          {
            id: "c3",
            code: "ENG112",
            name: "Technical Writing",
            lecturer: "Dr. Williams",
            classSize: 30,
            department: "Education/Christian Religious Studies", // Changed from "English" to a valid Department type
            academicLevel: "100",
            venue: { id: "v3", name: "Lecture Hall 1", capacity: 100, availability: [] },
            timeSlot: { day: "Wednesday", startTime: "14:00", endTime: "15:00" }
          }
        ];
        
        setSchedule(mockSchedule);
      } catch (error) {
        console.error('Failed to fetch schedule:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadScheduleData();
  }, []);

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
