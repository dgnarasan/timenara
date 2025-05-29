
import { Button } from "@/components/ui/button";
import { LogOut, Calendar, Home } from "lucide-react";

interface DashboardHeaderProps {
  userCollege: string | null;
  onNavigateHome: () => void;
  onNavigateStudentView: () => void;
  onSignOut: () => void;
}

const DashboardHeader = ({
  userCollege,
  onNavigateHome,
  onNavigateStudentView,
  onSignOut,
}: DashboardHeaderProps) => {
  return (
    <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between mb-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          {userCollege 
            ? `Manage timetables for ${userCollege.replace(/\s*\([^)]*\)/g, '')}` 
            : 'Manage and generate your department\'s course schedule'
          }
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          onClick={onNavigateHome}
        >
          <Home className="h-4 w-4" />
          Home
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          onClick={onNavigateStudentView}
        >
          <Calendar className="h-4 w-4" />
          Student View
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          onClick={onSignOut}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default DashboardHeader;
