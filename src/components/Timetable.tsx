import React from "react";
import { ScheduleItem } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Users, MapPin, Clock, ChevronDown, ChevronUp, Grid3x3, List } from "lucide-react";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TimetableProps {
  schedule: ScheduleItem[];
  favorites?: Set<string>;
  onToggleFavorite?: (courseId: string) => void;
}

// More flexible validation function for timetable
const isValidScheduleItem = (item: any): item is ScheduleItem => {
  console.log('Timetable validating item:', item);
  
  if (!item || typeof item !== 'object') {
    console.log('Timetable: Invalid - not an object');
    return false;
  }

  // Only check for essential fields needed for rendering
  const hasEssentialFields = item.id && item.code && item.name && 
    item.timeSlot && item.timeSlot.day && item.timeSlot.startTime;

  if (!hasEssentialFields) {
    console.log('Timetable: Missing essential fields');
    return false;
  }

  console.log('Timetable: Item is valid');
  return true;
};

const Timetable = ({ schedule, favorites = new Set(), onToggleFavorite }: TimetableProps) => {
  const [expandedView, setExpandedView] = useState(false);
  const [viewType, setViewType] = useState<"grid" | "table">("grid");
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  // Filter out invalid schedule items to prevent rendering errors
  const validSchedule = React.useMemo(() => {
    console.log('Timetable: Processing schedule with', schedule?.length || 0, 'items');
    
    if (!Array.isArray(schedule)) {
      console.warn('Timetable: Schedule is not an array:', schedule);
      return [];
    }
    
    const filtered = schedule.filter((item, index) => {
      console.log(`Timetable: Checking item ${index}:`, item);
      return isValidScheduleItem(item);
    });
    
    const invalidCount = schedule.length - filtered.length;
    
    console.log(`Timetable: ${filtered.length} valid, ${invalidCount} invalid items`);
    
    if (invalidCount > 0) {
      console.warn(`Timetable: Filtered out ${invalidCount} invalid schedule items`);
    }
    
    return filtered;
  }, [schedule]);

  // Get all unique time slots with their full ranges from the schedule
  const getUniqueTimeSlots = () => {
    const timeSlots = new Set<string>();
    validSchedule.forEach(item => {
      try {
        const startHour = parseInt(item.timeSlot.startTime.split(':')[0]);
        const endHour = startHour + 2; // 2 hour duration
        const timeRange = `${item.timeSlot.startTime} - ${endHour}:00`;
        timeSlots.add(timeRange);
      } catch (error) {
        console.warn('Error processing time slot:', item.timeSlot, error);
      }
    });
    return Array.from(timeSlots).sort((a, b) => {
      const startA = parseInt(a.split(' - ')[0].split(':')[0]);
      const startB = parseInt(b.split(' - ')[0].split(':')[0]);
      return startA - startB;
    });
  };

  // Generate all possible time slots for expanded view (2-hour slots)
  const generateAllTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 16; hour += 2) { // 2-hour intervals
      slots.push(`${hour}:00 - ${hour + 2}:00`);
    }
    return slots;
  };

  const uniqueTimeSlots = getUniqueTimeSlots();
  const allTimeSlots = generateAllTimeSlots();
  const displayTimeSlots = expandedView ? allTimeSlots : uniqueTimeSlots;

  // Enhanced department colors with better contrast
  const getDepartmentColor = (department: string) => {
    const colorMap: Record<string, { bg: string; border: string; text: string; accent: string }> = {
      'Computer Science': { bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-900", accent: "bg-blue-600" },
      'Software Engineering': { bg: "bg-emerald-50", border: "border-emerald-300", text: "text-emerald-900", accent: "bg-emerald-600" },
      'Information Systems': { bg: "bg-purple-50", border: "border-purple-300", text: "text-purple-900", accent: "bg-purple-600" },
      'Cyber Security': { bg: "bg-orange-50", border: "border-orange-300", text: "text-orange-900", accent: "bg-orange-600" },
      'Biochemistry': { bg: "bg-pink-50", border: "border-pink-300", text: "text-pink-900", accent: "bg-pink-600" },
      'Microbiology and Industrial Biotechnology': { bg: "bg-indigo-50", border: "border-indigo-300", text: "text-indigo-900", accent: "bg-indigo-600" },
      'Peace Studies and Conflict Resolution': { bg: "bg-cyan-50", border: "border-cyan-300", text: "text-cyan-900", accent: "bg-cyan-600" },
      'Industrial Chemistry': { bg: "bg-teal-50", border: "border-teal-300", text: "text-teal-900", accent: "bg-teal-600" },
    };

    return colorMap[department] || { 
      bg: "bg-gray-50", 
      border: "border-gray-300", 
      text: "text-gray-900", 
      accent: "bg-gray-600" 
    };
  };

  const getScheduledItemsForSlot = (day: string, timeRange: string) => {
    const [startTime] = timeRange.split(' - ');
    return validSchedule.filter(
      (item) =>
        item.timeSlot.day === day &&
        item.timeSlot.startTime === startTime
    );
  };

  const getCourseLevel = (courseCode: string | undefined) => {
    if (!courseCode || typeof courseCode !== 'string') {
      return "N/A";
    }
    
    const match = courseCode.match(/\d/);
    return match ? `${match[0]}00` : "N/A";
  };

  // Get unique departments for legend
  const departments = Array.from(new Set(validSchedule.map(item => item.department).filter(Boolean)));

  const renderGridView = () => (
    <div className="space-y-4 md:space-y-6">
      {/* Enhanced Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-gradient-to-r from-primary/5 to-primary/10 p-3 md:p-4 rounded-lg border">
        <div>
          <h3 className="text-lg md:text-xl font-bold text-primary">Weekly Timetable</h3>
          <p className="text-xs md:text-sm text-muted-foreground">
            Showing <span className="font-semibold text-primary">{validSchedule.length}</span> courses across <span className="font-semibold text-primary">{departments.length}</span> departments
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex gap-2">
            <Button
              variant={viewType === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewType("grid")}
              className="gap-2 flex-1 sm:flex-none"
            >
              <Grid3x3 className="h-4 w-4" />
              <span className="hidden sm:inline">Grid View</span>
              <span className="sm:hidden">Grid</span>
            </Button>
            <Button
              variant={viewType === "table" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewType("table")}
              className="gap-2 flex-1 sm:flex-none"
            >
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">List View</span>
              <span className="sm:hidden">List</span>
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpandedView(!expandedView)}
            className="gap-2"
          >
            {expandedView ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            <span className="hidden sm:inline">{expandedView ? "Show Scheduled Only" : "Show All Time Slots"}</span>
            <span className="sm:hidden">{expandedView ? "Less" : "More"}</span>
          </Button>
        </div>
      </div>

      {/* Department Legend */}
      {departments.length > 1 && (
        <div className="bg-card rounded-lg p-3 md:p-4 border shadow-sm">
          <h4 className="text-sm font-semibold text-foreground mb-3">Department Color Guide</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-3">
            {departments.map((dept) => {
              const colors = getDepartmentColor(dept);
              return (
                <div key={dept} className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                  <div className={`w-3 h-3 md:w-4 md:h-4 rounded-full ${colors.accent} shadow-sm flex-shrink-0`} />
                  <span className="text-xs font-medium truncate" title={dept}>{dept}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Fixed Timetable Container with proper horizontal scrolling */}
      <div className="border rounded-lg shadow-lg bg-white">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]"> {/* Ensure minimum width for proper display */}
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-20">
                <tr className="bg-gradient-to-r from-primary to-primary/90 text-white">
                  <th className="p-2 md:p-4 text-left font-bold border-r border-primary-foreground/20 w-32 md:w-40 sticky left-0 bg-primary z-30">
                    <span className="text-xs md:text-sm">TIME SLOT</span>
                  </th>
                  {days.map((day) => {
                    const dayClasses = validSchedule.filter(item => item.timeSlot.day === day).length;
                    return (
                      <th
                        key={day}
                        className="p-2 md:p-4 text-center font-bold border-r border-primary-foreground/20 min-w-[180px] md:min-w-[220px]"
                      >
                        <div className="space-y-1">
                          <div className="text-xs md:text-sm font-bold">{day.slice(0, 3).toUpperCase()}</div>
                          <div className="text-xs opacity-80 hidden sm:block">
                            {dayClasses > 0 ? `${dayClasses} classes` : 'No classes'}
                          </div>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {displayTimeSlots.map((timeRange, timeIndex) => (
                  <tr key={timeRange} className={`${timeIndex % 2 === 0 ? "bg-muted/20" : "bg-white"} hover:bg-muted/40 transition-colors`}>
                    <td className="p-2 md:p-3 border-r border-border text-xs md:text-sm font-bold text-center bg-muted/50 sticky left-0 z-10 shadow-sm">
                      <div className="space-y-1">
                        <div className="text-primary font-bold text-xs leading-tight">
                          {timeRange.replace(' - ', '\n-\n').split('\n').map((line, i) => (
                            <div key={i} className={i === 1 ? 'text-muted-foreground' : ''}>{line}</div>
                          ))}
                        </div>
                      </div>
                    </td>
                    {days.map((day) => {
                      const scheduledItems = getScheduledItemsForSlot(day, timeRange);
                      return (
                        <td
                          key={`${day}-${timeRange}`}
                          className="p-1 sm:p-2 md:p-3 border-r border-border align-top min-h-[100px] sm:min-h-[120px] md:min-h-[140px] relative"
                        >
                          <div className="space-y-1 sm:space-y-2">
                            {scheduledItems.map((item) => {
                              const colors = getDepartmentColor(item.department || 'Default');
                              const startHour = parseInt(item.timeSlot.startTime.split(':')[0]);
                              const endTime = `${startHour + 2}:00`;
                              
                              return (
                                <Card
                                  key={item.id}
                                  className={`
                                    ${colors.bg} ${colors.border} border-l-2 sm:border-l-4 
                                    ${colors.accent.replace('bg-', 'border-l-')}
                                    hover:shadow-md md:hover:shadow-lg transition-all duration-300 
                                    p-1.5 sm:p-2 md:p-3 relative group cursor-pointer transform hover:scale-[1.02]
                                  `}
                                >
                                  <div className="space-y-1 sm:space-y-2">
                                    <div className="flex items-start justify-between gap-1 sm:gap-2">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 mb-1">
                                          <div className={`font-bold ${colors.text} text-xs sm:text-sm`}>
                                            {item.code || 'N/A'}
                                          </div>
                                          <div className="bg-white/80 px-1 py-0.5 rounded text-xs font-medium text-muted-foreground hidden sm:block">
                                            L{getCourseLevel(item.code)}
                                          </div>
                                        </div>
                                        
                                        <div className="text-xs text-muted-foreground font-medium mb-1 sm:mb-2 line-clamp-2">
                                          {item.name || 'Course Name'}
                                        </div>
                                      </div>
                                      
                                      {onToggleFavorite && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-5 w-5 sm:h-6 sm:w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onToggleFavorite(item.id);
                                          }}
                                        >
                                          <Star
                                            className={`h-3 w-3 ${
                                              favorites.has(item.id)
                                                ? "fill-yellow-400 text-yellow-400"
                                                : "text-muted-foreground"
                                            }`}
                                          />
                                        </Button>
                                      )}
                                    </div>

                                    <div className="space-y-1">
                                      <div className="flex items-center gap-1 text-muted-foreground">
                                        <Users className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                                        <span className="truncate text-xs font-medium">{item.lecturer || 'TBD'}</span>
                                      </div>
                                      
                                      <div className="flex items-center gap-1 text-muted-foreground">
                                        <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                                        <span className="truncate text-xs">{item.venue?.name || 'TBD'}</span>
                                      </div>

                                      <div className="flex items-center gap-1 text-muted-foreground">
                                        <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                                        <span className="text-xs">
                                          {item.timeSlot?.startTime || 'TBD'} - {endTime}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Department indicator */}
                                  <div className={`absolute top-1 right-1 sm:top-2 sm:right-2 w-2 h-2 sm:w-3 sm:h-3 rounded-full ${colors.accent} shadow-sm`} />
                                </Card>
                              );
                            })}
                            
                            {scheduledItems.length === 0 && (
                              <div className="h-12 sm:h-16 flex items-center justify-center text-muted-foreground/50 text-xs border border-dashed border-muted-foreground/20 rounded">
                                No classes
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTableView = () => (
    <div className="space-y-4">
      {/* View Toggle Header for Table View */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-gradient-to-r from-primary/5 to-primary/10 p-3 md:p-4 rounded-lg border">
        <div>
          <h3 className="text-lg md:text-xl font-bold text-primary">Schedule List</h3>
          <p className="text-xs md:text-sm text-muted-foreground">
            Showing <span className="font-semibold text-primary">{validSchedule.length}</span> courses
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewType === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewType("grid")}
            className="gap-2 flex-1 sm:flex-none"
          >
            <Grid3x3 className="h-4 w-4" />
            <span className="hidden sm:inline">Grid View</span>
            <span className="sm:hidden">Grid</span>
          </Button>
          <Button
            variant={viewType === "table" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewType("table")}
            className="gap-2 flex-1 sm:flex-none"
          >
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">List View</span>
            <span className="sm:hidden">List</span>
          </Button>
        </div>
      </div>

      <div className="border rounded-lg shadow-sm bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary hover:bg-primary">
                <TableHead className="text-white font-bold text-xs md:text-sm">Code</TableHead>
                <TableHead className="text-white font-bold text-xs md:text-sm">Course</TableHead>
                <TableHead className="text-white font-bold text-xs md:text-sm hidden sm:table-cell">Lecturer</TableHead>
                <TableHead className="text-white font-bold text-xs md:text-sm hidden md:table-cell">Department</TableHead>
                <TableHead className="text-white font-bold text-xs md:text-sm">Day</TableHead>
                <TableHead className="text-white font-bold text-xs md:text-sm">Time</TableHead>
                <TableHead className="text-white font-bold text-xs md:text-sm hidden sm:table-cell">Venue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {validSchedule.map((item, index) => {
                const colors = getDepartmentColor(item.department || 'Default');
                const startHour = parseInt(item.timeSlot.startTime.split(':')[0]);
                const endTime = `${startHour + 2}:00`;
                return (
                  <TableRow key={item.id} className={`${index % 2 === 0 ? 'bg-muted/20' : 'bg-white'} hover:bg-muted/40`}>
                    <TableCell className="font-bold text-primary text-xs md:text-sm">{item.code}</TableCell>
                    <TableCell className="font-medium text-xs md:text-sm">
                      <div className="sm:hidden text-xs text-muted-foreground mt-1">{item.lecturer}</div>
                      {item.name}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-xs md:text-sm">{item.lecturer}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${colors.accent}`} />
                        <span className="text-xs md:text-sm">{item.department}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-xs md:text-sm">{item.timeSlot.day.slice(0, 3)}</TableCell>
                    <TableCell className="text-xs md:text-sm">{item.timeSlot.startTime} - {endTime}</TableCell>
                    <TableCell className="hidden sm:table-cell text-xs md:text-sm">{item.venue?.name || 'TBD'}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full space-y-4 md:space-y-6 animate-fade-in">
      {viewType === "grid" ? renderGridView() : renderTableView()}

      {/* Enhanced Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 md:p-4 text-center border border-blue-200">
          <div className="text-lg md:text-2xl font-bold text-blue-700">{validSchedule.length}</div>
          <div className="text-xs text-blue-600 font-medium">Total Classes</div>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-3 md:p-4 text-center border border-emerald-200">
          <div className="text-lg md:text-2xl font-bold text-emerald-700">{departments.length}</div>
          <div className="text-xs text-emerald-600 font-medium">Departments</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 md:p-4 text-center border border-purple-200">
          <div className="text-lg md:text-2xl font-bold text-purple-700">
            {new Set(validSchedule.map(item => item.lecturer).filter(Boolean)).size}
          </div>
          <div className="text-xs text-purple-600 font-medium">Instructors</div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-3 md:p-4 text-center border border-orange-200">
          <div className="text-lg md:text-2xl font-bold text-orange-700">
            {uniqueTimeSlots.length}
          </div>
          <div className="text-xs text-orange-600 font-medium">Time Slots Used</div>
        </div>
        <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg p-3 md:p-4 text-center border border-pink-200">
          <div className="text-lg md:text-2xl font-bold text-pink-700">
            {Math.round((validSchedule.length / (days.length * allTimeSlots.length)) * 100)}%
          </div>
          <div className="text-xs text-pink-600 font-medium">Utilization</div>
        </div>
      </div>

      {/* All Courses Summary */}
      {validSchedule.length > 0 && (
        <div className="bg-card rounded-lg p-3 md:p-4 border shadow-sm">
          <h4 className="font-bold mb-3 text-primary">All Scheduled Courses ({validSchedule.length})</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 max-h-60 overflow-y-auto">
            {validSchedule.map((item) => {
              const colors = getDepartmentColor(item.department || 'Default');
              return (
                <div key={item.id} className="flex items-center gap-2 p-2 bg-muted/30 rounded-md border text-xs md:text-sm hover:bg-muted/50 transition-colors">
                  <div className={`w-3 h-3 rounded-full ${colors.accent} flex-shrink-0`} />
                  <span className="font-bold text-primary">{item.code}</span>
                  <span className="text-muted-foreground truncate text-xs">{item.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Timetable;
