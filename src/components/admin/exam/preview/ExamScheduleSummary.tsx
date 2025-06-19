
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExamScheduleItem } from "@/lib/types";
import { CalendarDays, BookOpen, Building, Users, Eye } from "lucide-react";

interface ExamScheduleSummaryProps {
  examSchedule: ExamScheduleItem[];
  isPublished: boolean;
}

const ExamScheduleSummary = ({ examSchedule, isPublished }: ExamScheduleSummaryProps) => {
  // Calculate summary statistics - with safety checks
  const totalExamDays = new Set(examSchedule.map(item => item.day).filter(Boolean)).size;
  const totalVenues = new Set(examSchedule.map(item => item.venueName).filter(Boolean)).size;
  const totalStudents = examSchedule.reduce((sum, item) => sum + (item.studentCount || 0), 0);

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Published Schedule Summary
            </CardTitle>
            <CardDescription>
              Complete exam schedule overview
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={isPublished ? "default" : "secondary"}>
              {isPublished ? "📅 Published" : "📝 Draft"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <CalendarDays className="h-6 w-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-600">{totalExamDays}</div>
            <div className="text-sm text-blue-700">📅 Total Exam Days</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <BookOpen className="h-6 w-6 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600">{examSchedule.length}</div>
            <div className="text-sm text-green-700">📘 Courses Scheduled</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Building className="h-6 w-6 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-purple-600">{totalVenues}</div>
            <div className="text-sm text-purple-700">🏛 Venues Used</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Users className="h-6 w-6 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-orange-600">{totalStudents.toLocaleString()}</div>
            <div className="text-sm text-orange-700">👨‍🎓 Total Students Writing</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExamScheduleSummary;
