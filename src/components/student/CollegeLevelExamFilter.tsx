
import { useState, useEffect } from "react";
import { ExamCourse } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, GraduationCap, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CollegeLevelExamFilterProps {
  examCourses: ExamCourse[];
}

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

const CollegeLevelExamFilter = ({ examCourses }: CollegeLevelExamFilterProps) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Group courses by college and level
  const groupedCourses = examCourses.reduce((groups, course) => {
    const college = getCollegeFromDepartment(course.department);
    const level = extractLevel(course.courseCode);
    const collegeAbbrev = getCollegeAbbreviation(college);
    const groupKey = `${collegeAbbrev} Level ${level}`;
    
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
  }, {} as Record<string, { courses: ExamCourse[], college: string, level: string, totalStudents: number }>);

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

  // Sort groups by college abbreviation and level
  const sortedGroupKeys = Object.keys(groupedCourses).sort((a, b) => {
    const [collegeA, levelA] = a.split(' Level ');
    const [collegeB, levelB] = b.split(' Level ');
    
    if (collegeA !== collegeB) {
      return collegeA.localeCompare(collegeB);
    }
    return parseInt(levelA) - parseInt(levelB);
  });

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
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Exam Courses by College & Level</h3>
        <Badge variant="secondary" className="gap-2">
          <GraduationCap className="h-4 w-4" />
          {examCourses.length} Total Courses
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

      {/* Summary Statistics */}
      <Card className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-primary">{sortedGroupKeys.length}</div>
            <div className="text-xs text-muted-foreground">College-Level Groups</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">{examCourses.length}</div>
            <div className="text-xs text-muted-foreground">Total Courses</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">
              {Object.values(groupedCourses).reduce((sum, group) => sum + group.totalStudents, 0).toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">Total Students</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">
              {new Set(examCourses.map(course => getCollegeFromDepartment(course.department))).size}
            </div>
            <div className="text-xs text-muted-foreground">Colleges</div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CollegeLevelExamFilter;
