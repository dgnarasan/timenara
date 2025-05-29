
import { Course } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

interface ScheduleOverviewProps {
  filteredCourses: Course[];
}

const ScheduleOverview = ({ filteredCourses }: ScheduleOverviewProps) => {
  const getDepartmentCounts = () => {
    const counts: Record<string, number> = {};
    filteredCourses.forEach(course => {
      counts[course.department] = (counts[course.department] || 0) + 1;
    });
    return counts;
  };

  const departmentCounts = getDepartmentCounts();

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium">Overview</h4>
      <div className="bg-muted/30 p-3 rounded-lg space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total Courses:</span>
          <Badge variant="secondary" className="text-xs">{filteredCourses.length}</Badge>
        </div>
        
        {Object.keys(departmentCounts).length > 1 && (
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Department Distribution:</span>
            <div className="grid grid-cols-1 gap-1 max-h-20 overflow-y-auto">
              {Object.entries(departmentCounts).map(([dept, count]) => (
                <div key={dept} className="flex items-center justify-between text-xs">
                  <span className="truncate text-xs">{dept}</span>
                  <Badge variant="outline" className="text-xs h-4">{count}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleOverview;
