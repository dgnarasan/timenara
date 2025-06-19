
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchExamCourses, deleteAllExamCourses } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import { Upload, Trash2, FileText, Users, Building, AlertCircle, Share2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ExamCourseUpload from "./ExamCourseUpload";
import TemplateDownloadDropdown from "./TemplateDownloadDropdown";

// Updated College to department mapping based on user requirements
const COLLEGE_DEPARTMENTS = {
  "COLLEGE OF ARTS, SOCIAL AND MANAGEMENT SCIENCES (CASMAS)": [
    "Accounting", "Banking and Finance", "Bus. Administration", "Business Administration", 
    "Criminology", "Economics", "International Relations", "Mass Communication", 
    "Political Science", "Psychology"
  ],
  "COLLEGE OF PURE AND APPLIED SCIENCES (COPAS)": [
    "Biochemistry", "Computer Science", "Cyber Security", "Industrial Chemistry", "Microbiology"
  ]
};

const getCollegeFromDepartment = (department: string): string => {
  for (const [college, departments] of Object.entries(COLLEGE_DEPARTMENTS)) {
    if (departments.some(dept => 
      dept.toLowerCase().includes(department.toLowerCase()) || 
      department.toLowerCase().includes(dept.toLowerCase())
    )) {
      return college;
    }
  }
  return "General";
};

const getCollegeAbbreviation = (college: string): string => {
  const abbreviations: Record<string, string> = {
    "COLLEGE OF ARTS, SOCIAL AND MANAGEMENT SCIENCES (CASMAS)": "CASMAS",
    "COLLEGE OF PURE AND APPLIED SCIENCES (COPAS)": "COPAS"
  };
  return abbreviations[college] || "GENERAL";
};

const extractLevel = (courseCode: string): string => {
  const match = courseCode.match(/(\d)/);
  return match ? `${match[1]}00` : "000";
};

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

  // Group courses by college and level, also identify shared courses
  const groupedCourses = examCourses.reduce((acc, course) => {
    const college = getCollegeFromDepartment(course.department);
    const level = extractLevel(course.courseCode);
    const collegeAbbrev = getCollegeAbbreviation(college);
    const key = `${collegeAbbrev} Level ${level}`;
    
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(course);
    return acc;
  }, {} as Record<string, typeof examCourses>);

  // Identify potentially shared courses (same course code in different departments)
  const sharedCourseMap = examCourses.reduce((acc, course) => {
    const normalizedCode = course.courseCode.replace(/\s+/g, '').toUpperCase();
    if (!acc[normalizedCode]) {
      acc[normalizedCode] = [];
    }
    // Add if not already in the array
    if (!acc[normalizedCode].some(c => c.id === course.id)) {
      acc[normalizedCode].push(course);
    }
    return acc;
  }, {} as Record<string, typeof examCourses>);

  // Filter to only courses that appear in multiple departments
  const sharedCourses = Object.values(sharedCourseMap).filter(courses => courses.length > 1);

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
      {/* Template Download Section - Moved outside upload modal */}
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

          {/* Shared Courses Summary */}
          {sharedCourses.length > 0 && (
            <Alert className="border-blue-200 bg-blue-50">
              <Share2 className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <div className="space-y-1">
                  <p className="font-medium">
                    Found {sharedCourses.length} shared course{sharedCourses.length !== 1 ? 's' : ''} across departments
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {sharedCourses.slice(0, 5).map((courses, idx) => (
                      <Badge key={idx} variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                        {courses[0].courseCode} ({courses.length} depts)
                      </Badge>
                    ))}
                    {sharedCourses.length > 5 && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                        +{sharedCourses.length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Course List */}
      {Object.entries(groupedCourses).map(([groupKey, courses]) => {
        const totalStudents = courses.reduce((sum, course) => sum + course.studentCount, 0);

        return (
          <Card key={groupKey} className="border shadow-sm">
            <CardHeader className="bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg text-gray-900">
                    {groupKey}
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
                      <TableHead className="font-semibold text-gray-700">Shared</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courses.map((course, index) => {
                      const normalizedCode = course.courseCode.replace(/\s+/g, '').toUpperCase();
                      const isShared = sharedCourseMap[normalizedCode]?.length > 1;
                      const sharedDepartments = isShared 
                        ? sharedCourseMap[normalizedCode]
                          .filter(c => c.id !== course.id)
                          .map(c => c.department) 
                        : [];

                      return (
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
                          <TableCell>
                            {isShared ? (
                              <div className="flex items-center gap-1">
                                <Share2 className="h-3 w-3 text-blue-600" />
                                <span className="text-xs text-blue-600 font-medium">
                                  Shared with {sharedDepartments.length} dept{sharedDepartments.length !== 1 ? 's' : ''}
                                </span>
                              </div>
                            ) : "—"}
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

      {/* Upload Dialog */}
      <ExamCourseUpload
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />
    </div>
  );
};

export default ExamCourseManagement;
