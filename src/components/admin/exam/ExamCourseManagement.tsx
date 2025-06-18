
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchExamCourses, deleteAllExamCourses } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import { Upload, Trash2, FileText, Users, Building, AlertCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ExamCourseUpload from "./ExamCourseUpload";
import TemplateDownloadDropdown from "./TemplateDownloadDropdown";

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
      <Card className="border shadow-sm">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading exam courses...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Template Download Section */}
      <TemplateDownloadDropdown />

      {/* Upload and Actions */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Upload Exam Courses
          </CardTitle>
          <CardDescription>
            Upload Excel files containing exam course information for timetable generation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={() => setIsUploadOpen(true)}
              className="transition-all duration-200"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Courses
            </Button>
            {examCourses.length > 0 && (
              <Button 
                onClick={handleDeleteAll}
                variant="destructive"
                disabled={deleteAllMutation.isPending}
                className="transition-all duration-200"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleteAllMutation.isPending ? "Deleting..." : "Delete All"}
              </Button>
            )}
          </div>

          {examCourses.length === 0 && (
            <Alert className="border-gray-200 bg-gray-50">
              <AlertCircle className="h-4 w-4 text-gray-600" />
              <AlertDescription className="text-gray-700">
                No exam courses found. Download the template above and upload your course data to get started.
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
          <Card key={groupKey} className="border shadow-sm">
            <CardHeader className="bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg text-gray-900">
                    {college.split('(')[0].trim()} - Level {level}
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    {courses.length} courses • {totalStudents.toLocaleString()} total students
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-200">
                    <Building className="h-3 w-3 mr-1" />
                    {courses.length} courses
                  </Badge>
                  <Badge variant="outline" className="bg-white text-gray-700 border-gray-200">
                    <Users className="h-3 w-3 mr-1" />
                    {totalStudents.toLocaleString()} students
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold text-gray-700">Course Code</TableHead>
                      <TableHead className="font-semibold text-gray-700">Course Title</TableHead>
                      <TableHead className="font-semibold text-gray-700">Department</TableHead>
                      <TableHead className="text-right font-semibold text-gray-700">Students</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courses.map((course, index) => (
                      <TableRow 
                        key={course.id} 
                        className={`hover:bg-gray-50 transition-colors duration-150 ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                        }`}
                      >
                        <TableCell className="font-medium text-gray-900">{course.courseCode}</TableCell>
                        <TableCell className="text-gray-700">{course.courseTitle}</TableCell>
                        <TableCell className="text-gray-600">{course.department}</TableCell>
                        <TableCell className="text-right font-semibold text-gray-900">
                          {course.studentCount.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
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
