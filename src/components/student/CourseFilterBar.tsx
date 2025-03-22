
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Course, collegeStructure, College } from "@/lib/types";
import { Button } from "../ui/button";
import { Download, FileText } from "lucide-react";
import { getStandardAcademicLevels } from "@/utils/scheduling/courseUtils";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface CourseFilterBarProps {
  courses: Course[];
  onFilterChange: (filters: FilterOptions) => void;
  onExport: (format: "pdf" | "csv") => void;
}

export interface FilterOptions {
  search: string;
  academicLevel: string;
  lecturer: string;
  timeSlot: string;
  college: string;
  department: string;
}

const CourseFilterBar = ({ courses, onFilterChange, onExport }: CourseFilterBarProps) => {
  const { userRole, userCollege } = useAuth();
  const [selectedCollege, setSelectedCollege] = useState<string>("");
  const [availableDepartments, setAvailableDepartments] = useState<string[]>([]);
  const [availableColleges, setAvailableColleges] = useState<typeof collegeStructure>([]);
  const [filters, setFilters] = useState<FilterOptions>({
    search: "",
    academicLevel: "",
    lecturer: "",
    timeSlot: "",
    college: "",
    department: "",
  });
  
  const uniqueLecturers = Array.from(new Set(courses.map((c) => c.lecturer))).sort();
  const standardLevels = getStandardAcademicLevels();

  const timeSlots = [
    "Morning (9:00 - 12:00)",
    "Afternoon (13:00 - 17:00)",
  ];

  // Set up available colleges based on user role
  useEffect(() => {
    if (userRole === 'admin' && userCollege) {
      // Admin can only see their assigned college
      const adminCollege = collegeStructure.filter(college => college.college === userCollege);
      setAvailableColleges(adminCollege);
      
      // Pre-select the admin's college and set departments
      setSelectedCollege(userCollege);
      handleFilterChange("college", userCollege);
      
      const college = collegeStructure.find(c => c.college === userCollege);
      setAvailableDepartments(college ? college.departments : []);
    } else {
      // Students can see all colleges
      setAvailableColleges(collegeStructure);
    }
  }, [userRole, userCollege]);

  // Update available departments when college selection changes
  useEffect(() => {
    if (selectedCollege === "" || selectedCollege === "all") {
      // If no college is selected or "All Colleges" is selected, show all departments
      setAvailableDepartments(collegeStructure.flatMap(college => college.departments));
    } else {
      // Find the college in the structure and get its departments
      const college = collegeStructure.find(c => c.college === selectedCollege);
      setAvailableDepartments(college ? college.departments : []);
    }
    
    // Reset department filter if college changes
    if (filters.college !== selectedCollege) {
      handleFilterChange("department", "");
    }
  }, [selectedCollege]);

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    // If changing college, update the selected college state
    if (key === "college") {
      setSelectedCollege(value === "all" ? "" : value);
    }
    
    const newFilters = {
      ...filters,
      [key]: value === "all" ? "" : value,
    };
    
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          placeholder="Search courses..."
          className="w-full"
          onChange={(e) => handleFilterChange("search", e.target.value)}
          value={filters.search}
        />
        
        <Select
          value={filters.academicLevel || "all"}
          onValueChange={(value) => handleFilterChange("academicLevel", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Academic Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            {standardLevels.map((level) => (
              <SelectItem key={level} value={level}>
                {level}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.lecturer || "all"}
          onValueChange={(value) => handleFilterChange("lecturer", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Lecturer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Lecturers</SelectItem>
            {uniqueLecturers.map((lecturer) => (
              <SelectItem key={lecturer} value={lecturer}>
                {lecturer}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Select
          value={filters.timeSlot || "all"}
          onValueChange={(value) => handleFilterChange("timeSlot", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Time Slot" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Times</SelectItem>
            {timeSlots.map((slot) => (
              <SelectItem key={slot} value={slot}>
                {slot}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.college || "all"}
          onValueChange={(value) => handleFilterChange("college", value)}
          disabled={userRole === 'admin'} // Disable for admin users
        >
          <SelectTrigger>
            <SelectValue placeholder="College" />
          </SelectTrigger>
          <SelectContent>
            {userRole !== 'admin' && (
              <SelectItem value="all">All Colleges</SelectItem>
            )}
            {availableColleges.map((college) => (
              <SelectItem key={college.college} value={college.college}>
                {college.college.replace(/\s*\([^)]*\)/g, '')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.department || "all"}
          onValueChange={(value) => handleFilterChange("department", value)}
          disabled={availableDepartments.length === 0}
        >
          <SelectTrigger>
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {selectedCollege && selectedCollege !== "all" ? (
              // Show only departments from selected college
              availableDepartments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))
            ) : (
              // Show all departments grouped by college when no specific college is selected
              collegeStructure.map((collegeItem) => (
                <SelectGroup key={collegeItem.college}>
                  <SelectLabel>{collegeItem.college.replace(/\s*\([^)]*\)/g, '')}</SelectLabel>
                  {collegeItem.departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onExport("csv")}
        >
          <FileText className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onExport("pdf")}
        >
          <Download className="h-4 w-4 mr-2" />
          Export PDF
        </Button>
      </div>
    </div>
  );
};

export default CourseFilterBar;
