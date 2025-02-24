
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Course } from "@/lib/types";
import { Button } from "../ui/button";
import { Download, FileText } from "lucide-react";

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
}

const CourseFilterBar = ({ courses, onFilterChange, onExport }: CourseFilterBarProps) => {
  const uniqueLecturers = Array.from(new Set(courses.map((c) => c.lecturer))).sort();
  const uniqueLevels = Array.from(
    new Set(courses.filter((c) => c.academicLevel).map((c) => c.academicLevel!))
  ).sort();

  const timeSlots = [
    "Morning (9:00 - 12:00)",
    "Afternoon (13:00 - 17:00)",
  ];

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    onFilterChange({
      ...{
        search: "",
        academicLevel: "",
        lecturer: "",
        timeSlot: "",
      },
      [key]: value === "all" ? "" : value,
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Input
          placeholder="Search courses..."
          className="w-full"
          onChange={(e) => handleFilterChange("search", e.target.value)}
        />
        
        <Select
          onValueChange={(value) => handleFilterChange("academicLevel", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Academic Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            {uniqueLevels.map((level) => (
              <SelectItem key={level} value={level}>
                {level}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
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

        <Select
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
