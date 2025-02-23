
import { Card } from "@/components/ui/card";
import { BookOpen, GraduationCap, Users } from "lucide-react";

interface StatsCardsProps {
  totalCourses: number;
  academicLevels: number;
  activeInstructors: number;
}

const StatsCards = ({ totalCourses, academicLevels, activeInstructors }: StatsCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="p-6 space-y-2">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Courses</p>
            <h3 className="text-2xl font-bold">{totalCourses}</h3>
            <p className="text-sm text-muted-foreground">Courses in current schedule</p>
          </div>
          <BookOpen className="h-4 w-4 text-muted-foreground" />
        </div>
      </Card>

      <Card className="p-6 space-y-2">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Academic Levels</p>
            <h3 className="text-2xl font-bold">{academicLevels}</h3>
            <p className="text-sm text-muted-foreground">Different course levels</p>
          </div>
          <GraduationCap className="h-4 w-4 text-muted-foreground" />
        </div>
      </Card>

      <Card className="p-6 space-y-2">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Instructors</p>
            <h3 className="text-2xl font-bold">{activeInstructors}</h3>
            <p className="text-sm text-muted-foreground">Active instructors</p>
          </div>
          <Users className="h-4 w-4 text-muted-foreground" />
        </div>
      </Card>
    </div>
  );
};

export default StatsCards;
