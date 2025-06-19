
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExamCourse } from "@/lib/types";
import { BookOpen, Users, Share2, Building2 } from "lucide-react";

interface ExamCourseGroupDisplayProps {
  courses: ExamCourse[];
}

const ExamCourseGroupDisplay = ({ courses }: ExamCourseGroupDisplayProps) => {
  // Group courses by college + level
  const groupedCourses = courses.reduce((acc, course) => {
    const key = `${course.college} - ${course.level}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(course);
    return acc;
  }, {} as Record<string, ExamCourse[]>);

  // Calculate shared courses within each group
  const getSharedCoursesCount = (groupCourses: ExamCourse[]) => {
    const courseCodeCounts: Record<string, number> = {};
    groupCourses.forEach(course => {
      courseCodeCounts[course.courseCode] = (courseCodeCounts[course.courseCode] || 0) + 1;
    });
    return Object.values(courseCodeCounts).filter(count => count > 1).length;
  };

  const getTotalStudents = (groupCourses: ExamCourse[]) => {
    return groupCourses.reduce((sum, course) => sum + course.studentCount, 0);
  };

  // Clean college name for display
  const cleanCollegeName = (college: string) => {
    return college.replace(/\s*\([^)]*\)/g, '');
  };

  if (courses.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No courses uploaded yet. Please upload exam courses to see the grouping.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <BookOpen className="h-6 w-6 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold text-blue-600">{courses.length}</div>
            <div className="text-sm text-blue-700">Total Courses</div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold text-green-600">
              {courses.reduce((sum, c) => sum + c.studentCount, 0).toLocaleString()}
            </div>
            <div className="text-sm text-green-700">Total Students</div>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4 text-center">
            <Share2 className="h-6 w-6 mx-auto mb-2 text-purple-600" />
            <div className="text-2xl font-bold text-purple-600">
              {Object.values(groupedCourses).reduce((sum, group) => sum + getSharedCoursesCount(group), 0)}
            </div>
            <div className="text-sm text-purple-700">Shared Courses</div>
          </CardContent>
        </Card>
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4 text-center">
            <Building2 className="h-6 w-6 mx-auto mb-2 text-orange-600" />
            <div className="text-2xl font-bold text-orange-600">{Object.keys(groupedCourses).length}</div>
            <div className="text-sm text-orange-700">College-Level Groups</div>
          </CardContent>
        </Card>
      </div>

      {/* Course Groups by College + Level */}
      <div className="space-y-6">
        {Object.entries(groupedCourses)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([groupKey, groupCourses]) => {
            const sharedCount = getSharedCoursesCount(groupCourses);
            const totalStudents = getTotalStudents(groupCourses);
            
            return (
              <Card key={groupKey} className="border-l-4 border-l-primary">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {cleanCollegeName(groupKey.split(' - ')[0])} – {groupKey.split(' - ')[1]}
                      </CardTitle>
                      <CardDescription>
                        {groupCourses.length} courses • {totalStudents.toLocaleString()} students
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        <BookOpen className="h-3 w-3 mr-1" />
                        {groupCourses.length} courses
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        <Users className="h-3 w-3 mr-1" />
                        {totalStudents.toLocaleString()} students
                      </Badge>
                      {sharedCount > 0 && (
                        <Badge variant="outline" className="text-xs">
                          <Share2 className="h-3 w-3 mr-1" />
                          {sharedCount} shared
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Course Code</TableHead>
                          <TableHead>Course Title</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead className="text-right">Students</TableHead>
                          <TableHead className="text-center">Shared</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {groupCourses
                          .sort((a, b) => a.courseCode.localeCompare(b.courseCode))
                          .map((course, index) => {
                            const isShared = groupCourses.filter(c => c.courseCode === course.courseCode).length > 1;
                            const sharedWithCount = groupCourses.filter(c => c.courseCode === course.courseCode).length - 1;
                            
                            return (
                              <TableRow key={`${course.id}-${index}`} className={index % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                                <TableCell className="font-mono font-semibold text-primary">
                                  {course.courseCode}
                                </TableCell>
                                <TableCell className="max-w-xs truncate">
                                  {course.courseTitle}
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                  {course.department}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {course.studentCount.toLocaleString()}
                                </TableCell>
                                <TableCell className="text-center">
                                  {isShared ? (
                                    <Badge variant="outline" className="text-xs">
                                      <Share2 className="h-3 w-3 mr-1" />
                                      Shared with {sharedWithCount} dept{sharedWithCount > 1 ? 's' : ''}
                                    </Badge>
                                  ) : (
                                    <span className="text-muted-foreground text-xs">—</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            );
          })}
      </div>
    </div>
  );
};

export default ExamCourseGroupDisplay;
