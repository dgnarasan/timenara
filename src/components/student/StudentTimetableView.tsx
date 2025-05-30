import { useState, useEffect } from "react";
import { Course, ScheduleItem, collegeStructure } from "@/lib/types";
import CourseFilterBar, { FilterOptions } from "./CourseFilterBar";
import CollegeTimetableFilter from "./CollegeTimetableFilter";
import HybridLevelFilter from "./HybridLevelFilter";
import Timetable from "../Timetable";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Star, Grid, List as ListIcon, Filter, GraduationCap } from "lucide-react";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

interface StudentTimetableViewProps {
  schedule: ScheduleItem[];
  viewMode?: "timetable" | "list";
}

const StudentTimetableView = ({ schedule, viewMode = "timetable" }: StudentTimetableViewProps) => {
  const { toast } = useToast();
  const [filteredSchedule, setFilteredSchedule] = useState<ScheduleItem[]>(schedule);
  const [collegeFilteredSchedule, setCollegeFilteredSchedule] = useState<ScheduleItem[]>(schedule);
  const [levelFilteredSchedule, setLevelFilteredSchedule] = useState<ScheduleItem[]>(schedule);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [filterMode, setFilterMode] = useState<"advanced" | "college" | "hybrid">("college");
  const [filters, setFilters] = useState<FilterOptions>({
    search: "",
    academicLevel: "",
    lecturer: "",
    timeSlot: "",
    college: "",
    department: "",
  });

  useEffect(() => {
    const savedFavorites = localStorage.getItem('favoriteCourses');
    if (savedFavorites) {
      setFavorites(new Set(JSON.parse(savedFavorites)));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('favoriteCourses', JSON.stringify(Array.from(favorites)));
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

  const applyCurrentFilter = () => {
    switch (filterMode) {
      case "advanced":
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
            collegeStructure.find(c => c.college === filters.college)?.departments.includes(item.department);
            
          const matchesDepartment = 
            filters.department === "" || item.department === filters.department;

          return matchesSearch && matchesLevel && matchesLecturer && 
                 matchesTimeSlot && matchesCollege && matchesDepartment;
        });

        setFilteredSchedule(filtered);
        break;
      case "college":
        setFilteredSchedule(collegeFilteredSchedule);
        break;
      case "hybrid":
        setFilteredSchedule(levelFilteredSchedule);
        break;
      default:
        setFilteredSchedule(schedule);
    }
  };

  useEffect(() => {
    applyCurrentFilter();
  }, [schedule, filters, filterMode, collegeFilteredSchedule, levelFilteredSchedule]);

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

  const clearAllFilters = () => {
    switch (filterMode) {
      case "advanced":
        setFilters({
          search: "",
          academicLevel: "",
          lecturer: "",
          timeSlot: "",
          college: "",
          department: "",
        });
        break;
      case "college":
        setCollegeFilteredSchedule(schedule);
        break;
      case "hybrid":
        setLevelFilteredSchedule(schedule);
        break;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Enhanced College Timetable</h2>
          <p className="text-sm text-muted-foreground">
            {favorites.size} courses favorited • {filteredSchedule.length} courses shown
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterMode === "college" ? "default" : "outline"}
            onClick={() => setFilterMode("college")}
            size="sm"
            className="gap-2"
          >
            <Grid className="h-4 w-4" />
            College
          </Button>
          <Button
            variant={filterMode === "hybrid" ? "default" : "outline"}
            onClick={() => setFilterMode("hybrid")}
            size="sm"
            className="gap-2"
          >
            <GraduationCap className="h-4 w-4" />
            Hybrid Level
          </Button>
          <Button
            variant={filterMode === "advanced" ? "default" : "outline"}
            onClick={() => setFilterMode("advanced")}
            size="sm"
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Advanced
          </Button>
        </div>
      </div>

      <Tabs value={filterMode} onValueChange={(value) => setFilterMode(value as "advanced" | "college" | "hybrid")}>
        <TabsList>
          <TabsTrigger value="college">College Filter</TabsTrigger>
          <TabsTrigger value="hybrid">Hybrid Level Filter</TabsTrigger>
          <TabsTrigger value="advanced">Advanced Filter</TabsTrigger>
        </TabsList>
        
        <TabsContent value="college" className="space-y-4">
          <CollegeTimetableFilter
            schedule={schedule}
            onFilteredScheduleChange={setCollegeFilteredSchedule}
          />
        </TabsContent>
        
        <TabsContent value="hybrid" className="space-y-4">
          <HybridLevelFilter
            schedule={schedule}
            onFilteredScheduleChange={setLevelFilteredSchedule}
          />
        </TabsContent>
        
        <TabsContent value="advanced" className="space-y-4">
          <CourseFilterBar
            courses={schedule}
            onFilterChange={setFilters}
            onExport={handleExport}
          />
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={clearAllFilters}
          size="sm"
        >
          Clear All Filters
        </Button>
      </div>

      <Timetable 
        schedule={filteredSchedule} 
        favorites={favorites}
        onToggleFavorite={toggleFavorite}
      />
    </div>
  );
};

export default StudentTimetableView;
