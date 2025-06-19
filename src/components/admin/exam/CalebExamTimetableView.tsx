
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Calendar, Clock, MapPin } from "lucide-react";
import { ExamScheduleItem } from "@/lib/types";

interface CalebExamTimetableViewProps {
  schedule: ExamScheduleItem[];
}

const CalebExamTimetableView = ({ schedule }: CalebExamTimetableViewProps) => {
  const [exportFormat, setExportFormat] = useState<"pdf" | "csv">("pdf");

  // Group schedule by date
  const groupedSchedule = schedule.reduce((groups, item) => {
    const date = item.day;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(item);
    return groups;
  }, {} as Record<string, ExamScheduleItem[]>);

  // Sort dates
  const sortedDates = Object.keys(groupedSchedule).sort();

  const handleExport = () => {
    if (exportFormat === "csv") {
      const csvData = schedule.map(item => ({
        'DATE': new Date(item.day).toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        'TIME': `${item.startTime} - ${item.endTime}`,
        'COURSE CODE': item.courseCode,
        'COURSE TITLE': item.courseTitle,
        'DEPARTMENT': item.department,
        'COLLEGE': item.college || '',
        'LEVEL': item.level || '',
        'VENUE': item.venueName || 'TBD',
        'SESSION': item.sessionName,
        'STUDENTS': (item.studentCount || 0).toString()
      }));

      const csvContent = "data:text/csv;charset=utf-8," + 
        Object.keys(csvData[0] || {}).join(",") + "\n" +
        csvData.map(row => Object.values(row).map(val => `"${val}"`).join(",")).join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Caleb_University_Exam_Timetable_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // For PDF export, we'll create a printable version
      window.print();
    }
  };

  if (schedule.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">No exam schedule available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-xl">
                Caleb University - Second Semester Examination Timetable
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                2023/24 Academic Session (Draft)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExportFormat(exportFormat === "pdf" ? "csv" : "pdf")}
              >
                Export as {exportFormat.toUpperCase()}
              </Button>
              <Button
                size="sm"
                onClick={handleExport}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Timetable */}
      <div className="bg-white border rounded-lg overflow-hidden print:shadow-none">
        {sortedDates.map((date, dateIndex) => {
          const daySchedule = groupedSchedule[date];
          const formattedDate = new Date(date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });

          // Group by time slots
          const timeSlots = daySchedule.reduce((slots, item) => {
            const timeKey = `${item.startTime} - ${item.endTime}`;
            if (!slots[timeKey]) {
              slots[timeKey] = [];
            }
            slots[timeKey].push(item);
            return slots;
          }, {} as Record<string, ExamScheduleItem[]>);

          return (
            <div key={date} className={`${dateIndex > 0 ? 'border-t-2' : ''}`}>
              {/* Date Header */}
              <div className="bg-gray-100 px-4 py-3 border-b">
                <h3 className="font-bold text-lg text-gray-900 uppercase">
                  {formattedDate}
                </h3>
              </div>

              {/* Time Slots */}
              {Object.entries(timeSlots).map(([timeSlot, exams]) => (
                <div key={timeSlot} className="border-b last:border-b-0">
                  {/* Time Header */}
                  <div className="bg-blue-50 px-4 py-2 border-b">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="font-semibold text-blue-900">
                        {timeSlot}
                      </span>
                      <Badge variant="secondary" className="ml-auto">
                        {exams.length} exam{exams.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </div>

                  {/* Exams */}
                  <div className="p-4">
                    <div className="grid gap-4">
                      {exams.map((exam, examIndex) => (
                        <div 
                          key={examIndex}
                          className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="grid md:grid-cols-4 gap-3">
                            {/* Course Info */}
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-lg text-gray-900">
                                  {exam.courseCode}
                                </span>
                                {exam.level && (
                                  <Badge variant="outline" className="text-xs">
                                    {exam.level}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 font-medium">
                                {exam.courseTitle}
                              </p>
                            </div>

                            {/* Department */}
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wide">
                                Department
                              </p>
                              <p className="text-sm font-medium text-gray-800">
                                {exam.department}
                              </p>
                              {exam.college && (
                                <p className="text-xs text-gray-500">
                                  {exam.college}
                                </p>
                              )}
                            </div>

                            {/* Venue */}
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wide">
                                Venue
                              </p>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-gray-400" />
                                <p className="text-sm font-medium text-gray-800">
                                  {exam.venueName || 'TBD'}
                                </p>
                              </div>
                            </div>

                            {/* Students */}
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wide">
                                Students
                              </p>
                              <p className="text-sm font-medium text-gray-800">
                                {(exam.studentCount || 0).toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-500">
                                registered
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {schedule.length}
              </div>
              <p className="text-sm text-gray-600">Total Exams</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {sortedDates.length}
              </div>
              <p className="text-sm text-gray-600">Exam Days</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {new Set(schedule.map(s => s.venueName)).size}
              </div>
              <p className="text-sm text-gray-600">Venues Used</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {schedule.reduce((sum, s) => sum + (s.studentCount || 0), 0).toLocaleString()}
              </div>
              <p className="text-sm text-gray-600">Course Registrations</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CalebExamTimetableView;
