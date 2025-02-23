
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
      <Card className="p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Courses</p>
            <h3 className="text-2xl font-bold mt-2">{totalCourses}</h3>
            <p className="text-sm text-muted-foreground mt-1">Courses in current schedule</p>
          </div>
          <BookOpen className="h-5 w-5 text-primary" />
        </div>
      </Card>

      <Card className="p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Academic Levels</p>
            <h3 className="text-2xl font-bold mt-2">{academicLevels}</h3>
            <p className="text-sm text-muted-foreground mt-1">Different course levels</p>
          </div>
          <GraduationCap className="h-5 w-5 text-primary" />
        </div>
      </Card>

      <Card className="p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Instructors</p>
            <h3 className="text-2xl font-bold mt-2">{activeInstructors}</h3>
            <p className="text-sm text-muted-foreground mt-1">Active instructors</p>
          </div>
          <Users className="h-5 w-5 text-primary" />
        </div>
      </Card>
    </div>
  );
};

export default StatsCards;
