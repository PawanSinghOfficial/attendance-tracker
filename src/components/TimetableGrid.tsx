import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Clock } from "lucide-react";

interface Class {
  _id: string;
  subjectId: string;
  subject?: {
    _id: string;
    name: string;
    code: string;
    color: string;
  };
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  type: string;
}

interface TimetableGridProps {
  weeklySchedule: Record<number, Class[]>;
  weekDates: Date[];
}

const TIME_SLOTS = [
  "08:00 AM",
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "01:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM",
  "06:00 PM",
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Helper function to convert time string to hour
function timeToHour(timeStr: string): number {
  const [time, period] = timeStr.split(" ");
  let [hours, minutes] = time.split(":").map(Number);

  if (period === "PM" && hours !== 12) {
    hours += 12;
  } else if (period === "AM" && hours === 12) {
    hours = 0;
  }

  return hours + minutes / 60;
}

// Calculate position and height for a class block
function getClassPosition(startTime: string, endTime: string) {
  const startHour = timeToHour(startTime);
  const endHour = timeToHour(endTime);
  const baseHour = 8; // 8 AM start

  const topPosition = ((startHour - baseHour) * 80); // 80px per hour
  const height = ((endHour - startHour) * 80) - 4; // 4px gap

  return { top: topPosition, height };
}

export function TimetableGrid({ weeklySchedule, weekDates }: TimetableGridProps) {
  const today = new Date().getDay();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header - Days of week */}
            <div className="grid grid-cols-8 border-b bg-muted/30">
              <div className="p-3 text-center font-semibold text-sm border-r">Time</div>
              {weekDates.map((date, index) => (
                <div
                  key={index}
                  className={`p-3 text-center border-r last:border-r-0 ${
                    date.getDay() === today ? "bg-primary/10" : ""
                  }`}
                >
                  <div className={`font-semibold text-sm ${date.getDay() === today ? "text-primary" : ""}`}>
                    {DAYS[date.getDay()]}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {format(date, "MMM d")}
                  </div>
                </div>
              ))}
            </div>

            {/* Grid - Time slots and classes */}
            <div className="grid grid-cols-8 relative">
              {/* Time labels column */}
              <div className="border-r">
                {TIME_SLOTS.map((time, index) => (
                  <div
                    key={time}
                    className="h-20 border-b flex items-center justify-center text-xs text-muted-foreground font-medium"
                  >
                    {time}
                  </div>
                ))}
              </div>

              {/* Days columns with classes */}
              {weekDates.map((date, dayIndex) => {
                const dayClasses = weeklySchedule[date.getDay()] || [];
                const isToday = date.getDay() === today;

                return (
                  <div
                    key={dayIndex}
                    className={`border-r last:border-r-0 relative ${
                      isToday ? "bg-primary/5" : ""
                    }`}
                  >
                    {/* Time slot grid lines */}
                    {TIME_SLOTS.map((time, slotIndex) => (
                      <div
                        key={time}
                        className="h-20 border-b"
                      />
                    ))}

                    {/* Class blocks positioned absolutely */}
                    <div className="absolute inset-0 p-1">
                      {dayClasses.map((cls, classIndex) => {
                        const { top, height } = getClassPosition(cls.startTime, cls.endTime);

                        return (
                          <motion.div
                            key={cls._id}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: dayIndex * 0.05 + classIndex * 0.02 }}
                            whileHover={{ scale: 1.02, zIndex: 10 }}
                            className="absolute left-1 right-1 rounded-lg shadow-sm cursor-pointer overflow-hidden"
                            style={{
                              top: `${top}px`,
                              height: `${height}px`,
                              backgroundColor: cls.subject?.color || "#8b5cf6",
                            }}
                          >
                            <div className="h-full p-2 text-white flex flex-col justify-between">
                              <div>
                                <div className="font-semibold text-xs line-clamp-2 mb-1">
                                  {cls.subject?.name || "Unknown"}
                                </div>
                                <Badge
                                  variant="secondary"
                                  className="text-[9px] h-4 px-1 bg-white/20 text-white border-none"
                                >
                                  {cls.type}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-1 text-[10px] opacity-90">
                                <Clock size={10} />
                                <span>{cls.startTime}</span>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="border-t p-4 bg-muted/20">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-primary/10 border border-primary" />
              <span>Today's column</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-purple-500" />
              <span>Class blocks are color-coded by subject</span>
            </div>
            <div className="ml-auto text-muted-foreground">
              Hover over classes for details
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
