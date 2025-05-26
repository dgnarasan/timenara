
import React from "react";
import { ScheduleItem } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Users, MapPin, Clock } from "lucide-react";

interface TimetableProps {
  schedule: ScheduleItem[];
  favorites?: Set<string>;
  onToggleFavorite?: (courseId: string) => void;
}

const Timetable = ({ schedule, favorites = new Set(), onToggleFavorite }: TimetableProps) => {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const timeSlots = Array.from({ length: 8 }, (_, i) => `${i + 8}:00`);

  // Group shared courses to avoid duplicates with safe field access
  const groupedSchedule = React.useMemo(() => {
    const grouped = new Map<string, ScheduleItem>();
    
    schedule.forEach(item => {
      // Ensure all fields have safe defaults
      const safeItem = {
        ...item,
        lecturer: item.lecturer || 'TBD',
        venue: item.venue || { name: "TBD", capacity: 0 },
        group: item.group || '',
        sharedDepartments: item.sharedDepartments || [item.department],
        preferredDays: item.preferredDays || [],
        preferredTimeSlot: item.preferredTimeSlot || ''
      };
      
      const baseKey = `${safeItem.code}-${safeItem.lecturer}-${safeItem.timeSlot.day}-${safeItem.timeSlot.startTime}`;
      const key = safeItem.group ? `${baseKey}-${safeItem.group}` : baseKey;
      
      if (!grouped.has(key)) {
        grouped.set(key, {
          ...safeItem,
          // For shared departments, show primary department but mark as shared
          department: safeItem.sharedDepartments && safeItem.sharedDepartments.length > 1 
            ? `${safeItem.department} (+${safeItem.sharedDepartments.length - 1} more)` as any
            : safeItem.department
        });
      }
    });
    
    return Array.from(grouped.values());
  }, [schedule]);

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
    return groupedSchedule.filter(
      (item) =>
        item.timeSlot?.day === day &&
        item.timeSlot?.startTime === startTime
    );
  };

  const getCourseLevel = (courseCode: string) => {
    if (!courseCode) return "N/A";
    const match = courseCode.match(/\d/);
    return match ? `${match[0]}00L` : "N/A";
  };

  const formatCourseCode = (item: ScheduleItem) => {
    const code = item.code || 'Unknown';
    const group = item.group || '';
    return group ? `${code} (${group})` : code;
  };

  const getVenueName = (venue: any) => {
    if (typeof venue === 'string') return venue || 'TBD';
    if (venue && typeof venue === 'object') return venue.name || 'TBD';
    return 'TBD';
  };

  // Get unique departments for legend
  const departments = Array.from(new Set(groupedSchedule.map(item => 
    (item.department || 'Unknown').split(' (+')[0] // Remove the shared indicator for legend
  )));

  return (
    <div className="w-full space-y-4 animate-fade-in">
      {/* Department Legend */}
      {departments.length > 1 && (
        <div className="bg-muted/30 rounded-lg p-4">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Department Color Guide</h4>
          <div className="flex flex-wrap gap-3">
            {departments.map((dept) => {
              const colors = getDepartmentColor(dept);
              return (
                <div key={dept} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${colors.accent}`} />
                  <span className="text-sm font-medium">{dept}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <div className="min-w-[1000px]">
          <table className="w-full border-collapse bg-white rounded-lg shadow-sm overflow-hidden">
            <thead>
              <tr className="bg-muted/50">
                <th className="p-3 text-left font-semibold text-muted-foreground border-b-2 border-border w-20">
                  TIME
                </th>
                {days.map((day) => (
                  <th
                    key={day}
                    className="p-3 text-center font-semibold text-muted-foreground border-b-2 border-border"
                  >
                    <div className="space-y-1">
                      <div className="text-sm font-bold">{day.toUpperCase()}</div>
                      <div className="text-xs opacity-60">
                        {groupedSchedule.filter(item => item.timeSlot?.day === day).length} classes
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((time, timeIndex) => (
                <tr key={time} className={timeIndex % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                  <td className="p-2 border-r border-border/40 text-sm font-medium text-muted-foreground bg-muted/30">
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
                        className="p-1 border-r border-border/20 align-top min-h-[100px]"
                      >
                        <div className={`space-y-1 ${hasMultipleCourses ? 'grid gap-1' : ''}`}>
                          {scheduledItems.map((item, index) => {
                            const colors = getDepartmentColor((item.department || 'Unknown').split(' (+')[0]);
                            const isCompact = hasMultipleCourses;
                            
                            return (
                              <Card
                                key={`${item.id}-${index}`}
                                className={`
                                  ${colors.bg} ${colors.border} border-l-4 
                                  ${colors.accent.replace('bg-', 'border-l-')}
                                  hover:shadow-md transition-all duration-200 
                                  p-2 relative group
                                `}
                              >
                                <div className="flex items-start justify-between gap-1">
                                  <div className="flex-1 min-w-0">
                                    {/* Course Code with Group */}
                                    <div className="flex items-center gap-1 mb-1">
                                      <div className={`text-xs font-bold ${colors.text} truncate`}>
                                        {formatCourseCode(item)}
                                      </div>
                                      <div className="text-xs bg-white/60 px-1 py-0.5 rounded text-muted-foreground">
                                        {getCourseLevel(item.code)}
                                      </div>
                                    </div>
                                    
                                    {/* Course Name */}
                                    {!isCompact && (
                                      <div className="text-xs text-muted-foreground mb-2 line-clamp-2">
                                        {item.name || 'Course Title TBD'}
                                      </div>
                                    )}

                                    {/* Lecturer Name - Always visible */}
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                                      <Users className="h-3 w-3 flex-shrink-0" />
                                      <span className="truncate font-medium">
                                        {item.lecturer || 'TBD'}
                                      </span>
                                    </div>
                                    
                                    {/* Venue - Always visible */}
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                                      <MapPin className="h-3 w-3 flex-shrink-0" />
                                      <span className="truncate font-medium">
                                        {getVenueName(item.venue)}
                                      </span>
                                    </div>

                                    {/* Time and Class Size */}
                                    <div className="flex items-center justify-between text-xs">
                                      <div className="flex items-center gap-1 text-muted-foreground">
                                        <Clock className="h-3 w-3" />
                                        <span>
                                          {item.timeSlot?.startTime || 'TBD'} - {item.timeSlot?.endTime || 'TBD'}
                                        </span>
                                      </div>
                                      
                                      {item.classSize && (
                                        <div className="text-xs bg-white/80 px-1.5 py-0.5 rounded text-muted-foreground">
                                          {item.classSize}
                                        </div>
                                      )}
                                    </div>

                                    {/* Shared Department Indicator */}
                                    {item.sharedDepartments && item.sharedDepartments.length > 1 && (
                                      <div className="text-xs text-blue-600 font-medium mt-1">
                                        Shared Course
                                      </div>
                                    )}
                                  </div>
                                  
                                  {onToggleFavorite && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                      onClick={() => onToggleFavorite(item.id)}
                                    >
                                      <Star
                                        className={`h-3 w-3 ${
                                          favorites.has(item.id)
                                            ? "fill-yellow-400 text-yellow-400"
                                            : "text-muted-foreground"
                                        }`}
                                      />
                                      <span className="sr-only">
                                        {favorites.has(item.id)
                                          ? "Remove from favorites"
                                          : "Add to favorites"}
                                      </span>
                                    </Button>
                                  )}
                                </div>

                                {/* Department indicator for multi-department view */}
                                {departments.length > 1 && (
                                  <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${colors.accent}`} />
                                )}
                              </Card>
                            );
                          })}
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
        <div className="bg-card rounded-lg p-3 text-center border">
          <div className="text-2xl font-bold text-primary">{groupedSchedule.length}</div>
          <div className="text-xs text-muted-foreground">Total Classes</div>
        </div>
        <div className="bg-card rounded-lg p-3 text-center border">
          <div className="text-2xl font-bold text-primary">{departments.length}</div>
          <div className="text-xs text-muted-foreground">Departments</div>
        </div>
        <div className="bg-card rounded-lg p-3 text-center border">
          <div className="text-2xl font-bold text-primary">
            {new Set(groupedSchedule.map(item => item.lecturer || 'TBD')).size}
          </div>
          <div className="text-xs text-muted-foreground">Instructors</div>
        </div>
        <div className="bg-card rounded-lg p-3 text-center border">
          <div className="text-2xl font-bold text-primary">
            {groupedSchedule.filter(item => item.sharedDepartments && item.sharedDepartments.length > 1).length}
          </div>
          <div className="text-xs text-muted-foreground">Shared Courses</div>
        </div>
        <div className="bg-card rounded-lg p-3 text-center border">
          <div className="text-2xl font-bold text-primary">
            {Math.round((groupedSchedule.length / (days.length * timeSlots.length)) * 100)}%
          </div>
          <div className="text-xs text-muted-foreground">Utilization</div>
        </div>
      </div>
    </div>
  );
};

export default Timetable;
