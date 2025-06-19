
import { ExamScheduleItem } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { Calendar, MapPin, Users, Clock } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface OfficialExamScheduleDisplayProps {
  schedule: ExamScheduleItem[];
}

const OfficialExamScheduleDisplay = ({ schedule }: OfficialExamScheduleDisplayProps) => {
  // Group schedule by day
  const scheduleByDay = schedule.reduce((acc, item) => {
    const day = item.day;
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(item);
    return acc;
  }, {} as Record<string, ExamScheduleItem[]>);

  // Sort days chronologically
  const sortedDays = Object.keys(scheduleByDay).sort();

  const formatTime = (startTime: string, endTime: string) => {
    return `${startTime} - ${endTime}`;
  };

  const getSessionLabel = (sessionName: string) => {
    switch (sessionName) {
      case 'Morning': return '8:00 a.m - 11 Noon';
      case 'Midday': return '12pm - 3:00pm';
      case 'Evening': return '3:30pm - 6:30pm';
      default: return sessionName;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            CALEB UNIVERSITY - SECOND SEMESTER EXAMINATION TIMETABLE
          </CardTitle>
          <p className="text-sm text-muted-foreground">2024/2025 Academic Session</p>
        </CardHeader>
      </Card>

      {sortedDays.map((day) => {
        const daySchedule = scheduleByDay[day];
        const formattedDate = format(parseISO(day), 'EEEE');
        const dateLabel = format(parseISO(day), 'dd/MM/yyyy');

        // Group by session
        const sessionGroups = daySchedule.reduce((acc, item) => {
          const session = item.sessionName || 'Morning';
          if (!acc[session]) {
            acc[session] = [];
          }
          acc[session].push(item);
          return acc;
        }, {} as Record<string, ExamScheduleItem[]>);

        return (
          <Card key={day} className="border-2">
            <CardHeader className="bg-blue-50">
              <CardTitle className="text-lg font-bold text-blue-900">
                {formattedDate.toUpperCase()}
              </CardTitle>
              <p className="text-sm text-blue-700">{dateLabel}</p>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-bold">TIME</TableHead>
                    <TableHead className="font-bold">COURSE</TableHead>
                    <TableHead className="font-bold">VENUE</TableHead>
                    <TableHead className="font-bold">STUDENTS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {['Morning', 'Midday', 'Evening'].map((sessionName) => {
                    const sessionItems = sessionGroups[sessionName] || [];
                    
                    if (sessionItems.length === 0) {
                      return (
                        <TableRow key={sessionName}>
                          <TableCell className="font-medium text-blue-700">
                            {getSessionLabel(sessionName)}
                          </TableCell>
                          <TableCell className="text-gray-400 italic">No exams scheduled</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>-</TableCell>
                        </TableRow>
                      );
                    }

                    return sessionItems.map((item, index) => (
                      <TableRow key={`${sessionName}-${index}`} className="hover:bg-blue-50/50">
                        {index === 0 && (
                          <TableCell 
                            rowSpan={sessionItems.length} 
                            className="font-medium text-blue-700 align-top border-r"
                          >
                            {getSessionLabel(sessionName)}
                          </TableCell>
                        )}
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-semibold text-gray-900">
                              {item.courseCode}
                            </div>
                            <div className="text-sm text-gray-600">
                              {item.courseTitle}
                            </div>
                            <div className="flex gap-2">
                              <Badge variant="outline" className="text-xs">
                                {item.college?.replace(/\s*\([^)]*\)/g, '') || 'N/A'}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {item.level}L
                              </Badge>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">{item.venueName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-gray-500" />
                            <span>{item.studentCount || 0}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ));
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );
      })}

      {sortedDays.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground">No exam schedule available.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Generate a schedule to view the official timetable format.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OfficialExamScheduleDisplay;
