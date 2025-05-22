
import { useState, useEffect } from "react";
import { Course, ScheduleItem, collegeStructure } from "@/lib/types";
import CourseFilterBar, { FilterOptions } from "./CourseFilterBar";
import Timetable from "../Timetable";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Star, Calendar } from "lucide-react"; // Added Calendar import from lucide-react
import { Button } from "../ui/button";

interface StudentTimetableViewProps {
  schedule: ScheduleItem[];
  viewMode?: "timetable" | "list";
}

const StudentTimetableView = ({ schedule, viewMode = "timetable" }: StudentTimetableViewProps) => {
  const { toast } = useToast();
  const [filteredSchedule, setFilteredSchedule] = useState<ScheduleItem[]>(schedule);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<FilterOptions>({
    search: "",
    academicLevel: "",
    lecturer: "",
    timeSlot: "",
    college: "",
    department: "",
  });

  // Load favorites from localStorage
  useEffect(() => {
    try {
      const savedFavorites = localStorage.getItem('favoriteCourses');
      if (savedFavorites) {
        setFavorites(new Set(JSON.parse(savedFavorites)));
      }
    } catch (error) {
      console.error("Error loading favorites from localStorage:", error);
    }
  }, []);

  // Save favorites to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem('favoriteCourses', JSON.stringify(Array.from(favorites)));
    } catch (error) {
      console.error("Error saving favorites to localStorage:", error);
    }
  }, [favorites]);

  const toggleFavorite = (courseId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(courseId)) {
        newFavorites.delete(courseId);
        toast({
          title: "Course Removed",
          description: "Course removed from favorites",
        });
      } else {
        newFavorites.add(courseId);
        toast({
          title: "Course Added",
          description: "Course added to favorites",
        });
      }
      return newFavorites;
    });
  };

  // Update filtered schedule when schedule or filters change
  useEffect(() => {
    if (!schedule || schedule.length === 0) {
      setFilteredSchedule([]);
      return;
    }

    const filtered = schedule.filter((item) => {
      const matchesSearch =
        filters.search === "" ||
        item.code.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.name.toLowerCase().includes(filters.search.toLowerCase());

      const matchesLevel =
        filters.academicLevel === "" ||
        matchesAcademicLevel(item.code, filters.academicLevel);

      const matchesLecturer =
        filters.lecturer === "" || item.lecturer === filters.lecturer;

      const matchesTimeSlot = 
        filters.timeSlot === "" || matchesTimeRange(item, filters.timeSlot);
        
      const matchesCollege = 
        filters.college === "" || 
        (collegeStructure.find(c => c.college === filters.college)?.departments.includes(item.department) || false);
        
      const matchesDepartment = 
        filters.department === "" || item.department === filters.department;

      return matchesSearch && matchesLevel && matchesLecturer && 
             matchesTimeSlot && matchesCollege && matchesDepartment;
    });

    setFilteredSchedule(filtered);
  }, [schedule, filters]);

  const matchesAcademicLevel = (courseCode: string, levelFilter: string): boolean => {
    const match = courseCode.match(/\d/);
    if (!match) return false;
    
    const firstDigit = match[0];
    const courseLevel = `${firstDigit}00 Level`;
    
    return courseLevel === levelFilter;
  };

  const matchesTimeRange = (item: ScheduleItem, timeSlot: string) => {
    const startHour = parseInt(item.timeSlot.startTime.split(":")[0]);
    if (timeSlot === "Morning (9:00 - 12:00)") {
      return startHour >= 9 && startHour < 12;
    }
    if (timeSlot === "Afternoon (13:00 - 17:00)") {
      return startHour >= 13 && startHour < 17;
    }
    return true;
  };

  const handleExport = (format: "pdf" | "csv") => {
    if (filteredSchedule.length === 0) {
      toast({
        title: "No Data to Export",
        description: "Please adjust your filters to include some courses.",
        variant: "destructive",
      });
      return;
    }

    if (format === "csv") {
      exportToCSV();
    } else {
      exportToPDF();
    }
  };

  const exportToCSV = () => {
    const data = filteredSchedule.map((item) => ({
      "Course Code": item.code,
      "Course Name": item.name,
      "Lecturer": item.lecturer,
      "Department": item.department,
      "Day": item.timeSlot.day,
      "Time": `${item.timeSlot.startTime} - ${item.timeSlot.endTime}`,
      "Venue": item.venue.name,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Schedule");
    XLSX.writeFile(wb, "course-schedule.xlsx");

    toast({
      title: "Schedule Exported",
      description: "Your schedule has been exported to Excel format.",
    });
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    const tableData = filteredSchedule.map((item) => [
      item.code,
      item.name,
      item.lecturer,
      item.department,
      item.timeSlot.day,
      `${item.timeSlot.startTime} - ${item.timeSlot.endTime}`,
      item.venue.name,
    ]);

    doc.autoTable({
      head: [["Code", "Course", "Lecturer", "Department", "Day", "Time", "Venue"]],
      body: tableData,
      startY: 20,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 1 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    });

    doc.save("course-schedule.pdf");

    toast({
      title: "Schedule Exported",
      description: "Your schedule has been exported to PDF format.",
    });
  };

  // Fallback empty state
  if (!schedule || schedule.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
        <p className="text-base">No courses scheduled yet.</p>
        <p className="text-sm mt-2 text-muted-foreground/80">
          Contact your administrator if you believe this is an error.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Your Schedule</h2>
          <p className="text-sm text-muted-foreground">
            {favorites.size} courses favorited
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setFilters({
            search: "",
            academicLevel: "",
            lecturer: "",
            timeSlot: "",
            college: "",
            department: "",
          })}
          size="sm"
        >
          Clear Filters
        </Button>
      </div>

      <CourseFilterBar
        courses={schedule}
        onFilterChange={setFilters}
        onExport={handleExport}
      />

      <Timetable 
        schedule={filteredSchedule} 
        favorites={favorites}
        onToggleFavorite={toggleFavorite}
      />
    </div>
  );
};

export default StudentTimetableView;
