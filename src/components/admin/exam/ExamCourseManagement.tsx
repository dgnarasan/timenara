
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchExamCourses, addExamCourses, deleteAllExamCourses } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import { Download, Upload, Trash2, FileText, Users, Building } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ExamCourseUpload from "./ExamCourseUpload";

const ExamCourseManagement = () => {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch exam courses
  const { data: examCourses = [], isLoading } = useQuery({
    queryKey: ['exam-courses'],
    queryFn: fetchExamCourses,
  });

  // Delete all courses mutation
  const deleteAllMutation = useMutation({
    mutationFn: deleteAllExamCourses,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-courses'] });
      toast({
        title: "Success",
        description: "All exam courses have been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete exam courses. Please try again.",
        variant: "destructive",
      });
      console.error("Delete error:", error);
    },
  });

  const handleDownloadTemplate = () => {
    // Create CSV template
    const csvContent = `Course Code,Course Title,Department,College,Level,Student Count
CSC101,Introduction to Computer Science,Computer Science,COLLEGE OF PURE AND APPLIED SCIENCES (COPAS),100,45
MTH101,Calculus I,Computer Science,COLLEGE OF PURE AND APPLIED SCIENCES (COPAS),100,52
PHY101,General Physics,Computer Science,COLLEGE OF PURE AND APPLIED SCIENCES (COPAS),100,38`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'exam_courses_template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    toast({
      title: "Template Downloaded",
      description: "Exam courses template has been downloaded successfully.",
    });
  };

  const handleDeleteAll = () => {
    if (window.confirm("Are you sure you want to delete all exam courses? This action cannot be undone.")) {
      deleteAllMutation.mutate();
    }
  };

  const groupedCourses = examCourses.reduce((acc, course) => {
    const key = `${course.college}-${course.level}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(course);
    return acc;
  }, {} as Record<string, typeof examCourses>);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading exam courses...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Course Management
          </CardTitle>
          <CardDescription>
            Upload and manage exam courses for timetable generation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleDownloadTemplate} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
            <Button onClick={() => setIsUploadOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Courses
            </Button>
            {examCourses.length > 0 && (
              <Button 
                onClick={handleDeleteAll}
                variant="destructive"
                disabled={deleteAllMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete All
              </Button>
            )}
          </div>

          {examCourses.length === 0 && (
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                No exam courses found. Upload a CSV file or download the template to get started.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Course List */}
      {Object.entries(groupedCourses).map(([groupKey, courses]) => {
        const [college, level] = groupKey.split('-');
        const totalStudents = courses.reduce((sum, course) => sum + course.studentCount, 0);

        return (
          <Card key={groupKey}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {college.split('(')[0].trim()} - Level {level}
                  </CardTitle>
                  <CardDescription>
                    {courses.length} courses • {totalStudents} total students
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    <Building className="h-3 w-3 mr-1" />
                    {courses.length} courses
                  </Badge>
                  <Badge variant="outline">
                    <Users className="h-3 w-3 mr-1" />
                    {totalStudents} students
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course Code</TableHead>
                    <TableHead>Course Title</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-right">Students</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell className="font-medium">{course.courseCode}</TableCell>
                      <TableCell>{course.courseTitle}</TableCell>
                      <TableCell>{course.department}</TableCell>
                      <TableCell className="text-right">{course.studentCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );
      })}

      {/* Upload Dialog */}
      <ExamCourseUpload
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />
    </div>
  );
};

export default ExamCourseManagement;
