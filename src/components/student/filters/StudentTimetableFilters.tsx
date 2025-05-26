
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScheduleItem, Course } from "@/lib/types";
import { FilterOptions } from "../CourseFilterBar";
import CourseFilterBar from "../CourseFilterBar";
import CollegeTimetableFilter from "../CollegeTimetableFilter";

interface StudentTimetableFiltersProps {
  filterMode: "advanced" | "college";
  schedule: ScheduleItem[];
  scheduleCourses: Course[];
  onFilterModeChange: (mode: "advanced" | "college") => void;
  onFilterChange: (filters: FilterOptions) => void;
  onCollegeFilteredScheduleChange: (schedule: ScheduleItem[]) => void;
  onExport: (format: "pdf" | "csv") => void;
}

const StudentTimetableFilters = ({
  filterMode,
  schedule,
  scheduleCourses,
  onFilterModeChange,
  onFilterChange,
  onCollegeFilteredScheduleChange,
  onExport
}: StudentTimetableFiltersProps) => {
  return (
    <Tabs value={filterMode} onValueChange={(value) => onFilterModeChange(value as "advanced" | "college")}>
      <TabsList>
        <TabsTrigger value="college">College Filter</TabsTrigger>
        <TabsTrigger value="advanced">Advanced Filter</TabsTrigger>
      </TabsList>
      
      <TabsContent value="college" className="space-y-4">
        <CollegeTimetableFilter
          schedule={schedule}
          onFilteredScheduleChange={onCollegeFilteredScheduleChange}
        />
      </TabsContent>
      
      <TabsContent value="advanced" className="space-y-4">
        <CourseFilterBar
          courses={scheduleCourses}
          onFilterChange={onFilterChange}
          onExport={onExport}
        />
      </TabsContent>
    </Tabs>
  );
};

export default StudentTimetableFilters;
