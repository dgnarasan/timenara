
import { ScheduleItem } from "@/lib/types";
import { Card } from "@/components/ui/card";

interface TimetableProps {
  schedule: ScheduleItem[];
}

const Timetable = ({ schedule }: TimetableProps) => {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const timeSlots = Array.from({ length: 9 }, (_, i) => `${i + 9}:00`);

  return (
    <div className="overflow-x-auto animate-fade-in">
      <div className="min-w-[800px]">
        <div className="grid grid-cols-6 gap-2">
          <div className="h-20" /> {/* Empty corner cell */}
          {days.map((day) => (
            <div
              key={day}
              className="h-20 flex items-center justify-center font-semibold bg-secondary rounded-lg"
            >
              {day}
            </div>
          ))}
          {timeSlots.map((time) => (
            <React.Fragment key={time}>
              <div
                className="h-20 flex items-center justify-center font-medium text-muted-foreground"
              >
                {time}
              </div>
              {days.map((day) => (
                <Card
                  key={`${day}-${time}`}
                  className="h-20 p-2 flex items-center justify-center text-sm hover:shadow-md transition-shadow duration-200"
                >
                  {schedule
                    .filter(
                      (item) =>
                        item.timeSlot.day === day &&
                        item.timeSlot.startTime === time
                    )
                    .map((item) => (
                      <div key={item.id} className="text-center">
                        <div className="font-medium">{item.code}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.venue.name}
                        </div>
                      </div>
                    ))}
                </Card>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Timetable;
