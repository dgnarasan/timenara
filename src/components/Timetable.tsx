import React from "react";
import { ScheduleItem } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Users, MapPin, Clock, ChevronDown, ChevronUp, LayoutGrid, List } from "lucide-react";
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

const Timetable = ({ schedule, favorites = new Set(), onToggleFavorite }: TimetableProps) => {
  const [expandedView, setExpandedView] = useState(false);
  const [viewType, setViewType] = useState<"grid" | "table">("grid");
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const timeSlots = Array.from({ length: 12 }, (_, i) => `${i + 8}:00`); // 8:00 to 19:00

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

  const getScheduledItemsForSlot = (day: string, startTime: string) => {
    return schedule.filter(
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
  const departments = Array.from(new Set(schedule.map(item => item.department).filter(Boolean)));

  // Get all scheduled time slots to show only relevant rows
  const scheduledTimeSlots = Array.from(new Set(schedule.map(item => item.timeSlot.startTime))).sort();
  const displayTimeSlots = expandedView ? timeSlots : scheduledTimeSlots;

  const renderGridView = () => (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-primary/5 to-primary/10 p-4 rounded-lg border">
        <div>
          <h3 className="text-xl font-bold text-primary">Weekly Timetable</h3>
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-semibold text-primary">{schedule.length}</span> courses across <span className="font-semibold text-primary">{departments.length}</span> departments
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewType === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewType("grid")}
            className="gap-2"
          >
            <LayoutGrid className="h-4 w-4" />
            Grid View
          </Button>
          <Button
            variant={viewType === "table" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewType("table")}
            className="gap-2"
          >
            <List className="h-4 w-4" />
            List View
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpandedView(!expandedView)}
            className="gap-2"
          >
            {expandedView ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {expandedView ? "Show Scheduled Only" : "Show All Time Slots"}
          </Button>
        </div>
      </div>

      {/* Department Legend */}
      {departments.length > 1 && (
        <div className="bg-card rounded-lg p-4 border shadow-sm">
          <h4 className="text-sm font-semibold text-foreground mb-3">Department Color Guide</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {departments.map((dept) => {
              const colors = getDepartmentColor(dept);
              return (
                <div key={dept} className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                  <div className={`w-4 h-4 rounded-full ${colors.accent} shadow-sm`} />
                  <span className="text-xs font-medium truncate" title={dept}>{dept}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Scrollable Timetable Container */}
      <div className="border rounded-lg shadow-lg bg-white overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[800px]">
          <div className="min-w-[1200px]">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-20">
                <tr className="bg-gradient-to-r from-primary to-primary/90 text-white">
                  <th className="p-4 text-left font-bold border-r border-primary-foreground/20 w-32 sticky left-0 bg-primary z-30">
                    TIME SLOT
                  </th>
                  {days.map((day) => {
                    const dayClasses = schedule.filter(item => item.timeSlot.day === day).length;
                    return (
                      <th
                        key={day}
                        className="p-4 text-center font-bold border-r border-primary-foreground/20 min-w-[220px]"
                      >
                        <div className="space-y-1">
                          <div className="text-sm font-bold">{day.toUpperCase()}</div>
                          <div className="text-xs opacity-80">
                            {dayClasses > 0 ? `${dayClasses} classes` : 'No classes'}
                          </div>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {displayTimeSlots.map((time, timeIndex) => (
                  <tr key={time} className={`${timeIndex % 2 === 0 ? "bg-muted/20" : "bg-white"} hover:bg-muted/40 transition-colors`}>
                    <td className="p-4 border-r border-border text-sm font-bold text-center bg-muted/50 sticky left-0 z-10 shadow-sm">
                      <div className="space-y-1">
                        <div className="text-primary font-bold">{time}</div>
                        <div className="text-xs text-muted-foreground">
                          {`${parseInt(time.split(':')[0]) + 1}:00`}
                        </div>
                      </div>
                    </td>
                    {days.map((day) => {
                      const scheduledItems = getScheduledItemsForSlot(day, time);
                      return (
                        <td
                          key={`${day}-${time}`}
                          className="p-3 border-r border-border align-top min-h-[120px] relative"
                        >
                          <div className="space-y-2">
                            {scheduledItems.map((item) => {
                              const colors = getDepartmentColor(item.department || 'Default');
                              
                              return (
                                <Card
                                  key={item.id}
                                  className={`
                                    ${colors.bg} ${colors.border} border-l-4 
                                    ${colors.accent.replace('bg-', 'border-l-')}
                                    hover:shadow-lg transition-all duration-300 
                                    p-3 relative group cursor-pointer transform hover:scale-[1.02]
                                  `}
                                >
                                  <div className="space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                          <div className={`font-bold ${colors.text} text-sm`}>
                                            {item.code || 'N/A'}
                                          </div>
                                          <div className="bg-white/80 px-1.5 py-0.5 rounded text-xs font-medium text-muted-foreground">
                                            L{getCourseLevel(item.code)}
                                          </div>
                                        </div>
                                        
                                        <div className="text-xs text-muted-foreground font-medium mb-2 line-clamp-2">
                                          {item.name || 'Course Name'}
                                        </div>
                                      </div>
                                      
                                      {onToggleFavorite && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
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

                                    <div className="space-y-1.5">
                                      <div className="flex items-center gap-1 text-muted-foreground">
                                        <Users className="h-3 w-3 flex-shrink-0" />
                                        <span className="truncate text-xs font-medium">{item.lecturer || 'TBD'}</span>
                                      </div>
                                      
                                      <div className="flex items-center gap-1 text-muted-foreground">
                                        <MapPin className="h-3 w-3 flex-shrink-0" />
                                        <span className="truncate text-xs">{item.venue?.name || 'TBD'}</span>
                                      </div>

                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1 text-muted-foreground">
                                          <Clock className="h-3 w-3 flex-shrink-0" />
                                          <span className="text-xs">
                                            {item.timeSlot?.startTime || 'TBD'} - {item.timeSlot?.endTime || 'TBD'}
                                          </span>
                                        </div>
                                        
                                        {item.classSize && (
                                          <div className="bg-white/90 px-1.5 py-0.5 rounded text-xs font-medium text-muted-foreground">
                                            {item.classSize}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Department indicator */}
                                  <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${colors.accent} shadow-sm`} />
                                </Card>
                              );
                            })}
                            
                            {scheduledItems.length === 0 && (
                              <div className="h-16 flex items-center justify-center text-muted-foreground/50 text-xs border border-dashed border-muted-foreground/20 rounded">
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
      <div className="border rounded-lg shadow-sm bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary hover:bg-primary">
                <TableHead className="text-white font-bold">Course Code</TableHead>
                <TableHead className="text-white font-bold">Course Name</TableHead>
                <TableHead className="text-white font-bold">Lecturer</TableHead>
                <TableHead className="text-white font-bold">Department</TableHead>
                <TableHead className="text-white font-bold">Day</TableHead>
                <TableHead className="text-white font-bold">Time</TableHead>
                <TableHead className="text-white font-bold">Venue</TableHead>
                <TableHead className="text-white font-bold">Students</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedule.map((item, index) => {
                const colors = getDepartmentColor(item.department || 'Default');
                return (
                  <TableRow key={item.id} className={`${index % 2 === 0 ? 'bg-muted/20' : 'bg-white'} hover:bg-muted/40`}>
                    <TableCell className="font-bold text-primary">{item.code}</TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.lecturer}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${colors.accent}`} />
                        <span className="text-sm">{item.department}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{item.timeSlot.day}</TableCell>
                    <TableCell>{item.timeSlot.startTime} - {item.timeSlot.endTime}</TableCell>
                    <TableCell>{item.venue?.name || 'TBD'}</TableCell>
                    <TableCell className="text-center font-medium">{item.classSize}</TableCell>
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
    <div className="w-full space-y-6 animate-fade-in">
      {viewType === "grid" ? renderGridView() : renderTableView()}

      {/* Enhanced Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center border border-blue-200">
          <div className="text-2xl font-bold text-blue-700">{schedule.length}</div>
          <div className="text-xs text-blue-600 font-medium">Total Classes</div>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-4 text-center border border-emerald-200">
          <div className="text-2xl font-bold text-emerald-700">{departments.length}</div>
          <div className="text-xs text-emerald-600 font-medium">Departments</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 text-center border border-purple-200">
          <div className="text-2xl font-bold text-purple-700">
            {new Set(schedule.map(item => item.lecturer).filter(Boolean)).size}
          </div>
          <div className="text-xs text-purple-600 font-medium">Instructors</div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 text-center border border-orange-200">
          <div className="text-2xl font-bold text-orange-700">
            {scheduledTimeSlots.length}
          </div>
          <div className="text-xs text-orange-600 font-medium">Time Slots Used</div>
        </div>
        <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg p-4 text-center border border-pink-200">
          <div className="text-2xl font-bold text-pink-700">
            {Math.round((schedule.length / (days.length * timeSlots.length)) * 100)}%
          </div>
          <div className="text-xs text-pink-600 font-medium">Utilization</div>
        </div>
      </div>

      {/* All Courses Summary */}
      {schedule.length > 0 && (
        <div className="bg-card rounded-lg p-4 border shadow-sm">
          <h4 className="font-bold mb-3 text-primary">All Scheduled Courses ({schedule.length})</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 max-h-60 overflow-y-auto">
            {schedule.map((item) => {
              const colors = getDepartmentColor(item.department || 'Default');
              return (
                <div key={item.id} className="flex items-center gap-2 p-2 bg-muted/30 rounded-md border text-sm hover:bg-muted/50 transition-colors">
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
