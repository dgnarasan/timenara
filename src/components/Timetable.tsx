
import React from "react";
import { ScheduleItem } from "@/lib/types";
import { Card } from "@/components/ui/card";

interface TimetableProps {
  schedule: ScheduleItem[];
}

const Timetable = ({ schedule }: TimetableProps) => {
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
