
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExamScheduleItem } from "@/lib/types";

interface ExamScheduleDetailedProps {
  examSchedule: ExamScheduleItem[];
}

const ExamScheduleDetailed = ({ examSchedule }: ExamScheduleDetailedProps) => {
  // Group by date for display - with safety checks
  const scheduleByDate = examSchedule.reduce((acc, item) => {
    const date = item.day;
    if (date) {
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(item);
    }
    return acc;
  }, {} as Record<string, ExamScheduleItem[]>);

  return (
    <div className="space-y-6">
      {Object.entries(scheduleByDate)
        .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
        .map(([date, items]) => (
        <Card key={date} className="border-l-4 border-l-primary">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              {new Date(date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </CardTitle>
            <CardDescription>
              {items.length} exams scheduled • {items.reduce((sum, item) => sum + (item.studentCount || 0), 0).toLocaleString()} students
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {items
                .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
                .map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="text-sm font-medium">
                      {item.startTime || 'N/A'} - {item.endTime || 'N/A'}
                    </div>
                    <div className="font-mono font-semibold text-primary">
                      {item.courseCode || 'N/A'}
                    </div>
                    <div className="text-muted-foreground">
                      {item.department || 'N/A'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{item.venueName || 'TBD'}</Badge>
                    <Badge variant="secondary">
                      {(item.studentCount || 0)} students
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ExamScheduleDetailed;
