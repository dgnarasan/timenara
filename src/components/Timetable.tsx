
import React from "react";
import { ScheduleItem } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";

interface TimetableProps {
  schedule: ScheduleItem[];
  favorites?: Set<string>;
  onToggleFavorite?: (courseId: string) => void;
}

const Timetable = ({ schedule, favorites = new Set(), onToggleFavorite }: TimetableProps) => {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const timeSlots = Array.from({ length: 8 }, (_, i) => `${i + 9}:00`);

  const getScheduledItemsForSlot = (day: string, startTime: string) => {
    return schedule.filter(
      (item) =>
        item.timeSlot.day === day &&
        item.timeSlot.startTime === startTime
    );
  };

  return (
    <div className="w-full overflow-x-auto animate-fade-in">
      <div className="min-w-[800px]">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-4 text-left font-medium text-muted-foreground border-b">
                TIME
              </th>
              {days.map((day) => (
                <th
                  key={day}
                  className="p-4 text-left font-medium text-muted-foreground border-b"
                >
                  {day.toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((time) => (
              <tr key={time}>
                <td className="p-4 border-b border-border/40 text-sm text-muted-foreground">
                  {time}
                </td>
                {days.map((day) => {
                  const scheduledItems = getScheduledItemsForSlot(day, time);

                  return (
                    <td
                      key={`${day}-${time}`}
                      className="p-2 border-b border-border/40"
                    >
                      {scheduledItems.map((item) => (
                        <Card
                          key={item.id}
                          className="p-3 hover:shadow-md transition-shadow duration-200"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="text-sm font-medium">{item.code}</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {item.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {item.lecturer}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {item.timeSlot.startTime} - {item.timeSlot.endTime}
                              </div>
                            </div>
                            {onToggleFavorite && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => onToggleFavorite(item.id)}
                              >
                                <Star
                                  className={`h-4 w-4 ${
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
                        </Card>
                      ))}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Timetable;
