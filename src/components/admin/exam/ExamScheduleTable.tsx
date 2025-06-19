
import { ExamScheduleItem } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, Users, Clock } from "lucide-react";

interface ExamScheduleTableProps {
  schedule: ExamScheduleItem[];
}

const ExamScheduleTable = ({ schedule }: ExamScheduleTableProps) => {
  if (!schedule || schedule.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">No exam schedule available</p>
        </CardContent>
      </Card>
    );
  }

  // Group schedule by date for better organization
  const groupedByDate = schedule.reduce((groups, item) => {
    const date = item.day;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(item);
    return groups;
  }, {} as Record<string, ExamScheduleItem[]>);

  const sortedDates = Object.keys(groupedByDate).sort();

  return (
    <div className="space-y-6">
      {sortedDates.map((date) => {
        const daySchedule = groupedByDate[date];
        const formattedDate = new Date(date).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        return (
          <Card key={date}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5" />
                {formattedDate}
                <Badge variant="secondary" className="ml-auto">
                  {daySchedule.length} exam{daySchedule.length !== 1 ? 's' : ''}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Venue</TableHead>
                    <TableHead className="text-right">Students</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {daySchedule.map((exam, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <div className="text-sm">
                            <div className="font-medium">{exam.startTime} - {exam.endTime}</div>
                            <div className="text-gray-500">{exam.sessionName}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{exam.courseCode}</div>
                          <div className="text-sm text-gray-600">{exam.courseTitle}</div>
                          {exam.level && (
                            <Badge variant="outline" className="text-xs mt-1">
                              {exam.level}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{exam.department}</div>
                          {exam.college && (
                            <div className="text-sm text-gray-500">{exam.college}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{exam.venueName || 'TBD'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">
                            {(exam.studentCount || 0).toLocaleString()}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ExamScheduleTable;
