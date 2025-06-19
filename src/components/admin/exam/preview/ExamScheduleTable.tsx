
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ExamScheduleItem } from "@/lib/types";

interface ExamScheduleTableProps {
  examSchedule: ExamScheduleItem[];
}

const ExamScheduleTable = ({ examSchedule }: ExamScheduleTableProps) => {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Course Code</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Venue</TableHead>
            <TableHead className="text-right">Students</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {examSchedule
            .filter(item => item.day && item.startTime) // Filter out invalid entries
            .sort((a, b) => {
              // Safe sorting with fallbacks
              const dateA = new Date(a.day || '');
              const dateB = new Date(b.day || '');
              const dateDiff = dateA.getTime() - dateB.getTime();
              if (dateDiff !== 0) return dateDiff;
              
              const timeA = a.startTime || '';
              const timeB = b.startTime || '';
              return timeA.localeCompare(timeB);
            })
            .map((item, index) => (
            <TableRow key={item.id || index} className={index % 2 === 0 ? "bg-background" : "bg-muted/20"}>
              <TableCell className="font-medium">
                {item.day ? new Date(item.day).toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric' 
                }) : 'N/A'}
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <div className="font-medium">{item.startTime || 'N/A'} - {item.endTime || 'N/A'}</div>
                  <div className="text-muted-foreground">{item.sessionName || 'N/A'}</div>
                </div>
              </TableCell>
              <TableCell className="font-mono font-semibold text-primary">
                {item.courseCode || 'N/A'}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {item.department || 'N/A'}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{item.venueName || 'TBD'}</Badge>
              </TableCell>
              <TableCell className="text-right font-medium">
                {(item.studentCount || 0).toLocaleString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ExamScheduleTable;
