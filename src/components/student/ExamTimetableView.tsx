
import { useState } from "react";
import { ExamScheduleItem, collegeStructure } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Users, Building, GraduationCap } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface ExamTimetableViewProps {
  schedule: ExamScheduleItem[];
  viewMode: "timetable" | "list";
}

const ExamTimetableView = ({ schedule, viewMode }: ExamTimetableViewProps) => {
  const [selectedCollege, setSelectedCollege] = useState<string>("all");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Get unique levels from schedule
  const uniqueLevels = Array.from(new Set(schedule.map(item => item.level))).sort();

  // Get departments based on selected college
  const availableDepartments = selectedCollege === "all" 
    ? Array.from(new Set(schedule.map(item => item.department))).sort()
    : collegeStructure.find(c => c.college === selectedCollege)?.departments || [];

  // Filter schedule based on filters
  const filteredSchedule = schedule.filter(item => {
    const collegeMatch = selectedCollege === "all" || item.college === selectedCollege;
    const departmentMatch = selectedDepartment === "all" || item.department === selectedDepartment;
    const levelMatch = selectedLevel === "all" || item.level === selectedLevel;
    const searchMatch = searchTerm === "" || 
      item.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.courseTitle.toLowerCase().includes(searchTerm.toLowerCase());
    
    return collegeMatch && departmentMatch && levelMatch && searchMatch;
  });

  // Group by day for timetable view
  const groupedByDay = filteredSchedule.reduce((acc, item) => {
    const day = new Date(item.day).toLocaleDateString('en-US', { weekday: 'long' });
    if (!acc[day]) acc[day] = [];
    acc[day].push(item);
    return acc;
  }, {} as Record<string, ExamScheduleItem[]>);

  const getSessionColor = (session: string) => {
    switch (session) {
      case 'Morning': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Midday': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Afternoon': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (schedule.length === 0) {
    return (
      <div className="text-center py-12">
        <GraduationCap className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Exam Schedule Published</h3>
        <p className="text-muted-foreground">Check back later for exam schedule updates.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Input
          placeholder="Search courses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="lg:col-span-1"
        />
        
        <Select value={selectedCollege} onValueChange={(value) => {
          setSelectedCollege(value);
          setSelectedDepartment("all");
        }}>
          <SelectTrigger>
            <SelectValue placeholder="All Colleges" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Colleges</SelectItem>
            {collegeStructure.map((college) => (
              <SelectItem key={college.college} value={college.college}>
                {college.college.split('(')[0].trim()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
          <SelectTrigger>
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {availableDepartments.map((dept) => (
              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedLevel} onValueChange={setSelectedLevel}>
          <SelectTrigger>
            <SelectValue placeholder="All Levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            {uniqueLevels.map((level) => (
              <SelectItem key={level} value={level}>{level}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="text-sm text-muted-foreground flex items-center">
          {filteredSchedule.length} exam{filteredSchedule.length !== 1 ? 's' : ''} found
        </div>
      </div>

      {viewMode === "timetable" ? (
        <div className="space-y-6">
          {Object.entries(groupedByDay).map(([day, exams]) => (
            <Card key={day} className="p-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                {day} - {formatDate(exams[0].day)}
              </h3>
              <div className="grid gap-3">
                {exams.map((exam, index) => (
                  <Card key={index} className="p-4 border-l-4 border-l-primary">
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div>
                          <h4 className="font-semibold text-base">{exam.courseCode}</h4>
                          <p className="text-sm text-muted-foreground">{exam.courseTitle}</p>
                        </div>
                        <Badge className={getSessionColor(exam.sessionName)}>
                          {exam.sessionName}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{exam.startTime} - {exam.endTime}</span>
                        </div>
                        
                        {exam.venueName && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{exam.venueName}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{exam.studentCount} students</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <span>{exam.department}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary/5">
                <TableHead className="font-bold">Course</TableHead>
                <TableHead className="font-bold">Date</TableHead>
                <TableHead className="font-bold">Time</TableHead>
                <TableHead className="font-bold">Session</TableHead>
                <TableHead className="font-bold hidden sm:table-cell">Venue</TableHead>
                <TableHead className="font-bold hidden lg:table-cell">Students</TableHead>
                <TableHead className="font-bold hidden lg:table-cell">Department</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSchedule.map((exam, index) => (
                <TableRow key={index} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-semibold">{exam.courseCode}</div>
                      <div className="text-sm text-muted-foreground">{exam.courseTitle}</div>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(exam.day)}</TableCell>
                  <TableCell>{exam.startTime} - {exam.endTime}</TableCell>
                  <TableCell>
                    <Badge className={getSessionColor(exam.sessionName)}>
                      {exam.sessionName}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{exam.venueName || 'TBD'}</TableCell>
                  <TableCell className="hidden lg:table-cell text-center">{exam.studentCount}</TableCell>
                  <TableCell className="hidden lg:table-cell">{exam.department}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
};

export default ExamTimetableView;
