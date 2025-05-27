
import React from "react";
import { ScheduleItem } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Users, MapPin, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface TimetableProps {
  schedule: ScheduleItem[];
  favorites?: Set<string>;
  onToggleFavorite?: (courseId: string) => void;
}

const Timetable = ({ schedule, favorites = new Set(), onToggleFavorite }: TimetableProps) => {
  const [expandedView, setExpandedView] = useState(false);
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const timeSlots = Array.from({ length: 9 }, (_, i) => `${i + 9}:00`);

  // Generate consistent colors for departments
  const getDepartmentColor = (department: string) => {
    const colors = [
      { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-800", accent: "bg-blue-500" },
      { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800", accent: "bg-emerald-500" },
      { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-800", accent: "bg-purple-500" },
      { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-800", accent: "bg-orange-500" },
      { bg: "bg-pink-50", border: "border-pink-200", text: "text-pink-800", accent: "bg-pink-500" },
      { bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-800", accent: "bg-indigo-500" },
      { bg: "bg-cyan-50", border: "border-cyan-200", text: "text-cyan-800", accent: "bg-cyan-500" },
      { bg: "bg-teal-50", border: "border-teal-200", text: "text-teal-800", accent: "bg-teal-500" },
    ];
    
    const hash = department.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
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

  return (
    <div className="w-full space-y-4 animate-fade-in">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Weekly Timetable</h3>
          <p className="text-sm text-muted-foreground">
            Showing {schedule.length} courses across {departments.length} departments
          </p>
        </div>
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

      {/* Department Legend */}
      {departments.length > 1 && (
        <div className="bg-muted/30 rounded-lg p-4">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Department Color Guide</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {departments.map((dept) => {
              const colors = getDepartmentColor(dept);
              return (
                <div key={dept} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${colors.accent}`} />
                  <span className="text-xs font-medium truncate">{dept}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Timetable */}
      <div className="overflow-x-auto border rounded-lg">
        <div className="min-w-[1000px]">
          <table className="w-full border-collapse bg-white">
            <thead>
              <tr className="bg-muted/50">
                <th className="p-4 text-left font-semibold text-muted-foreground border-b-2 border-border w-24 sticky left-0 bg-muted/50 z-10">
                  TIME
                </th>
                {days.map((day) => {
                  const dayClasses = schedule.filter(item => item.timeSlot.day === day).length;
                  return (
                    <th
                      key={day}
                      className="p-4 text-center font-semibold text-muted-foreground border-b-2 border-border min-w-[180px]"
                    >
                      <div className="space-y-1">
                        <div className="text-sm font-bold">{day.toUpperCase()}</div>
                        <div className="text-xs opacity-60">
                          {dayClasses > 0 && `${dayClasses} classes`}
                        </div>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {displayTimeSlots.map((time, timeIndex) => (
                <tr key={time} className={timeIndex % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                  <td className="p-4 border-r border-border/40 text-sm font-medium text-muted-foreground bg-muted/30 sticky left-0 z-10">
                    <div className="text-center">
                      <div className="font-bold">{time}</div>
                      <div className="text-xs opacity-60">
                        {`${parseInt(time.split(':')[0]) + 1}:00`}
                      </div>
                    </div>
                  </td>
                  {days.map((day) => {
                    const scheduledItems = getScheduledItemsForSlot(day, time);
                    const hasMultipleCourses = scheduledItems.length > 1;

                    return (
                      <td
                        key={`${day}-${time}`}
                        className="p-2 border-r border-border/20 align-top min-h-[100px] relative"
                      >
                        <div className={`space-y-2 ${hasMultipleCourses ? 'space-y-1' : ''}`}>
                          {scheduledItems.map((item, index) => {
                            const colors = getDepartmentColor(item.department || 'Default');
                            
                            return (
                              <Card
                                key={item.id}
                                className={`
                                  ${colors.bg} ${colors.border} border-l-4 
                                  ${colors.accent.replace('bg-', 'border-l-')}
                                  hover:shadow-md transition-all duration-200 
                                  p-3 relative group cursor-pointer
                                  ${hasMultipleCourses ? 'text-xs' : 'text-sm'}
                                `}
                              >
                                <div className="space-y-2">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <div className={`font-bold ${colors.text} truncate`}>
                                          {item.code || 'N/A'}
                                        </div>
                                        <div className="bg-white/60 px-1.5 py-0.5 rounded text-muted-foreground text-xs">
                                          L{getCourseLevel(item.code)}
                                        </div>
                                      </div>
                                      
                                      <div className="text-muted-foreground mb-2 line-clamp-2 font-medium">
                                        {item.name || 'Course Name'}
                                      </div>
                                    </div>
                                    
                                    {onToggleFavorite && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => onToggleFavorite(item.id)}
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
                                      <Users className="h-3 w-3 flex-shrink-0" />
                                      <span className="truncate text-xs">{item.lecturer || 'TBD'}</span>
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
                                        <div className="bg-white/80 px-1.5 py-0.5 rounded text-muted-foreground text-xs">
                                          {item.classSize} students
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Department indicator */}
                                {departments.length > 1 && (
                                  <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${colors.accent}`} />
                                )}
                              </Card>
                            );
                          })}
                          
                          {scheduledItems.length === 0 && (
                            <div className="h-16 flex items-center justify-center text-muted-foreground/40 text-xs">
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

      {/* Enhanced Schedule Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-card rounded-lg p-4 text-center border">
          <div className="text-2xl font-bold text-primary">{schedule.length}</div>
          <div className="text-xs text-muted-foreground">Total Classes</div>
        </div>
        <div className="bg-card rounded-lg p-4 text-center border">
          <div className="text-2xl font-bold text-primary">{departments.length}</div>
          <div className="text-xs text-muted-foreground">Departments</div>
        </div>
        <div className="bg-card rounded-lg p-4 text-center border">
          <div className="text-2xl font-bold text-primary">
            {new Set(schedule.map(item => item.lecturer).filter(Boolean)).size}
          </div>
          <div className="text-xs text-muted-foreground">Instructors</div>
        </div>
        <div className="bg-card rounded-lg p-4 text-center border">
          <div className="text-2xl font-bold text-primary">
            {scheduledTimeSlots.length}
          </div>
          <div className="text-xs text-muted-foreground">Time Slots Used</div>
        </div>
        <div className="bg-card rounded-lg p-4 text-center border">
          <div className="text-2xl font-bold text-primary">
            {Math.round((schedule.length / (days.length * timeSlots.length)) * 100)}%
          </div>
          <div className="text-xs text-muted-foreground">Utilization</div>
        </div>
      </div>

      {/* Course Summary List */}
      {schedule.length > 0 && (
        <div className="bg-card rounded-lg p-4 border">
          <h4 className="font-semibold mb-3">All Scheduled Courses ({schedule.length})</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
            {schedule.map((item) => (
              <div key={item.id} className="flex items-center gap-2 p-2 bg-muted/30 rounded text-sm">
                <div className={`w-3 h-3 rounded-full ${getDepartmentColor(item.department || 'Default').accent}`} />
                <span className="font-medium">{item.code}</span>
                <span className="text-muted-foreground truncate">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Timetable;
