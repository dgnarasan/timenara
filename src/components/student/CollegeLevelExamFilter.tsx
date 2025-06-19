
import { useState, useEffect } from "react";
import { ExamCourse } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, GraduationCap, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CollegeLevelExamFilterProps {
  examCourses: ExamCourse[];
}

// Updated College to department mapping based on user's provided list
const COLLEGE_DEPARTMENTS: Record<string, string[]> = {
  "COLLEGE OF ARTS, SOCIAL AND MANAGEMENT SCIENCES (CASMAS)": [
    "Accounting", 
    "Banking and Finance", 
    "Business Administration", 
    "Bus. Administration",
    "Bus. Admin",
    "Criminology", 
    "Economics", 
    "International Relations", 
    "Mass Communication",
    "Political Science", 
    "Psychology"
  ],
  "COLLEGE OF PURE AND APPLIED SCIENCES (COPAS)": [
    "Biochemistry", 
    "Computer Science", 
    "Cyber Security", 
    "Industrial Chemistry", 
    "Microbiology"
  ]
};

const getCollegeFromDepartment = (department: string): string => {
  console.log("Checking department:", department);
  
  // Clean and normalize the department name
  const cleanDepartment = department.toLowerCase().trim();
  
  for (const [college, departments] of Object.entries(COLLEGE_DEPARTMENTS)) {
    const match = departments.some(dept => {
      const cleanDept = dept.toLowerCase().trim();
      
      // Exact match first
      if (cleanDept === cleanDepartment) {
        return true;
      }
      
      // Check if department contains key words
      const deptWords = cleanDepartment.split(/\s+/);
      const mappedWords = cleanDept.split(/\s+/);
      
      // Check for partial matches
      return deptWords.some(word => mappedWords.some(mapped => 
        word.includes(mapped) || mapped.includes(word)
      ));
    });
    
    if (match) {
      console.log(`Found match: ${department} → ${college}`);
      return college;
    }
  }
  
  console.log(`No match found for department: ${department}, assigning to Other Departments`);
  return "Other Departments";
};

const extractLevel = (courseCode: string): string => {
  const match = courseCode.match(/(\d)/);
  const level = match ? `${match[1]}00` : "000";
  console.log(`Course code ${courseCode} → Level ${level}`);
  return level;
};

interface GroupedCourse {
  courses: ExamCourse[];
  college: string;
  level: string;
  totalStudents: number;
}

const CollegeLevelExamFilter = ({ examCourses }: CollegeLevelExamFilterProps) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    console.log("Exam courses received:", examCourses);
    console.log("Number of courses:", examCourses.length);
  }, [examCourses]);

  // Group courses by college and level
  const groupedCourses = examCourses.reduce((groups, course) => {
    const college = getCollegeFromDepartment(course.department);
    const level = extractLevel(course.courseCode);
    const groupKey = `${college} – Level ${level}`;
    
    console.log(`Grouping course ${course.courseCode} (${course.department}) into: ${groupKey}`);
    
    if (!groups[groupKey]) {
      groups[groupKey] = {
        courses: [],
        college: college,
        level: level,
        totalStudents: 0
      };
    }
    
    groups[groupKey].courses.push(course);
    groups[groupKey].totalStudents += course.studentCount;
    return groups;
  }, {} as Record<string, GroupedCourse>);

  console.log("Final grouped courses:", groupedCourses);
  console.log("Group keys:", Object.keys(groupedCourses));

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  };

  // Sort groups by college name and level
  const sortedGroupKeys = Object.keys(groupedCourses).sort((a, b) => {
    const [collegeA, levelPartA] = a.split(' – Level ');
    const [collegeB, levelPartB] = b.split(' – Level ');
    
    if (collegeA !== collegeB) {
      return collegeA.localeCompare(collegeB);
    }
    return parseInt(levelPartA) - parseInt(levelPartB);
  });

  // Calculate shared courses
  const courseCodeCounts: Record<string, number> = {};
  examCourses.forEach(course => {
    courseCodeCounts[course.courseCode] = (courseCodeCounts[course.courseCode] || 0) + 1;
  });
  const sharedCoursesCount = Object.values(courseCodeCounts).filter(count => count > 1).length;

  if (examCourses.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-20" />
        <p>No exam courses available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Parsed Stats Header */}
      <Card className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-green-800">✅ Courses Successfully Parsed</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{examCourses.length}</div>
              <div className="text-sm text-green-700">📘 Courses Parsed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {examCourses.reduce((sum, course) => sum + course.studentCount, 0).toLocaleString()}
              </div>
              <div className="text-sm text-blue-700">👨‍🎓 Students Detected</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{sharedCoursesCount}</div>
              <div className="text-sm text-purple-700">🔗 Shared Courses Detected</div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Ready to proceed to generation parameters →
          </p>
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Courses Grouped by College & Level</h3>
        <Badge variant="secondary" className="gap-2">
          <GraduationCap className="h-4 w-4" />
          {sortedGroupKeys.length} Groups
        </Badge>
      </div>

      {sortedGroupKeys.map((groupKey) => {
        const group = groupedCourses[groupKey];
        const isExpanded = expandedGroups.has(groupKey);
        
        return (
          <Card key={groupKey} className="overflow-hidden">
            <Collapsible open={isExpanded} onOpenChange={() => toggleGroup(groupKey)}>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                      <GraduationCap className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-semibold text-primary">{groupKey}</h4>
                      <p className="text-sm text-muted-foreground">
                        {group.courses.length} courses • {group.totalStudents.toLocaleString()} students
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="gap-1">
                      <Users className="h-3 w-3" />
                      {group.totalStudents.toLocaleString()}
                    </Badge>
                    <Badge variant="secondary">
                      {group.courses.length} courses
                    </Badge>
                  </div>
                </div>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <div className="border-t">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/30">
                        <tr>
                          <th className="text-left p-3 font-medium text-sm">Course Code</th>
                          <th className="text-left p-3 font-medium text-sm">Course Title</th>
                          <th className="text-left p-3 font-medium text-sm">Department</th>
                          <th className="text-right p-3 font-medium text-sm">Students</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.courses
                          .sort((a, b) => a.courseCode.localeCompare(b.courseCode))
                          .map((course, index) => (
                            <tr 
                              key={course.id} 
                              className={`border-t ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}
                            >
                              <td className="p-3 font-mono text-sm font-semibold text-primary">
                                {course.courseCode}
                              </td>
                              <td className="p-3 text-sm">
                                {course.courseTitle}
                              </td>
                              <td className="p-3 text-sm text-muted-foreground">
                                {course.department}
                              </td>
                              <td className="p-3 text-sm text-right font-medium">
                                {course.studentCount.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        );
      })}
    </div>
  );
};

export default CollegeLevelExamFilter;
