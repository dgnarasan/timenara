
import { useQuery } from "@tanstack/react-query";
import { fetchExamSchedule, fetchExamCourses } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Calendar, Clock, MapPin, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import CollegeLevelExamFilter from "./CollegeLevelExamFilter";

interface ExamTimetableViewProps {
  schedule?: any[];
  viewMode?: "timetable" | "list";
}

const ExamTimetableView = ({ schedule: propSchedule, viewMode }: ExamTimetableViewProps) => {
  // Fetch exam courses for classification
  const { data: examCourses = [], isLoading: isLoadingCourses } = useQuery({
    queryKey: ['exam-courses'],
    queryFn: fetchExamCourses,
  });

  // Fetch published exam schedule only if not provided as prop
  const { data: fetchedExamSchedule = [], isLoading: isLoadingSchedule } = useQuery({
    queryKey: ['exam-schedule'],
    queryFn: fetchExamSchedule,
    enabled: !propSchedule, // Only fetch if schedule not provided as prop
  });

  // Use prop schedule if provided, otherwise use fetched schedule
  const examSchedule = propSchedule || fetchedExamSchedule;
  const isLoading = isLoadingCourses || (!propSchedule && isLoadingSchedule);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading exam information...</p>
          </div>
        </div>
      </div>
    );
  }

  // Group schedule by date for better organization
  const scheduleByDate = examSchedule.reduce((acc, item) => {
    const date = item.day;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(item);
    return acc;
  }, {} as Record<string, typeof examSchedule>);

  const sortedDates = Object.keys(scheduleByDate).sort();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-primary">Examination Timetable</h2>
        <p className="text-muted-foreground">
          View your examination schedule and course classifications
        </p>
      </div>

      {/* College Level Classification */}
      <CollegeLevelExamFilter examCourses={examCourses} />

      {/* Exam Schedule Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Published Exam Schedule
          </CardTitle>
          <CardDescription>
            {examSchedule.length > 0 
              ? `${examSchedule.length} examinations scheduled`
              : "No examinations scheduled yet"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {examSchedule.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No examination schedule has been published yet. Please check back later.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-6">
              {sortedDates.map(date => (
                <div key={date} className="space-y-3">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-lg">
                      {new Date(date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </h3>
                    <Badge variant="secondary">
                      {scheduleByDate[date].length} exam{scheduleByDate[date].length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  
                  <div className="grid gap-3">
                    {scheduleByDate[date]
                      .sort((a, b) => a.start_time.localeCompare(b.start_time))
                      .map((exam, index) => (
                        <Card key={index} className="border-l-4 border-l-primary">
                          <CardContent className="p-4">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <BookOpen className="h-4 w-4 text-primary" />
                                  <span className="font-semibold text-primary">
                                    {exam.course_code || 'N/A'}
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {exam.session_name}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {exam.course_title || 'Course Title Not Available'}
                                </p>
                              </div>
                              
                              <div className="flex flex-col sm:flex-row gap-2 text-sm">
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  <span>{exam.start_time} - {exam.end_time}</span>
                                </div>
                                {exam.venue_name && (
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <MapPin className="h-3 w-3" />
                                    <span>{exam.venue_name}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExamTimetableView;
