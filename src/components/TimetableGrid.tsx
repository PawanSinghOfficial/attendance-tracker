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
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Helper function to check if a class falls within a time slot
function isClassInTimeSlot(classStartTime: string, classEndTime: string, slotTime: string): boolean {
  const slotHour = timeToHour(slotTime);
  const classStart = timeToHour(classStartTime);
  const classEnd = timeToHour(classEndTime);

  // Class is in this slot if it starts during this hour
  return classStart >= slotHour && classStart < slotHour + 1;
}

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
          <div className="min-w-[600px]">
            {/* Table Structure */}
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="p-3 text-left font-semibold text-sm border-r sticky left-0 bg-muted/30 z-10">
                    Day
                  </th>
                  {TIME_SLOTS.map((time) => (
                    <th
                      key={time}
                      className="p-3 text-center font-semibold text-sm border-r last:border-r-0"
                    >
                      <div className="flex flex-col items-center">
                        <span>{time.split(" ")[0]}</span>
                        <span className="text-xs text-muted-foreground">
                          {time.split(" ")[1]}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {weekDates.map((date, dayIndex) => {
                  const dayClasses = weeklySchedule[date.getDay()] || [];
                  const isToday = date.getDay() === today;

                  return (
                    <tr
                      key={dayIndex}
                      className={`border-b last:border-b-0 ${isToday ? "bg-primary/5" : ""}`}
                    >
                      {/* Day Column */}
                      <td
                        className={`p-3 border-r font-medium sticky left-0 ${
                          isToday ? "bg-primary/10" : "bg-background"
                        }`}
                      >
                        <div className="flex flex-col">
                          <span
                            className={`text-sm ${isToday ? "text-primary font-semibold" : ""}`}
                          >
                            {DAYS[date.getDay()]}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(date, "MMM d")}
                          </span>
                        </div>
                      </td>

                      {/* Time Slot Columns */}
                      {TIME_SLOTS.map((timeSlot) => {
                        // Find classes that start in this time slot
                        const slotClasses = dayClasses.filter((cls) =>
                          isClassInTimeSlot(cls.startTime, cls.endTime, timeSlot)
                        );

                        return (
                          <td
                            key={timeSlot}
                            className="p-2 border-r last:border-r-0 align-top min-h-[80px]"
                          >
                            {slotClasses.length > 0 ? (
                              <div className="space-y-1">
                                {slotClasses.map((cls, classIndex) => (
                                  <motion.div
                                    key={cls._id}
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{
                                      delay: dayIndex * 0.03 + classIndex * 0.02,
                                    }}
                                    whileHover={{ scale: 1.03, zIndex: 10 }}
                                    className="rounded-md shadow-sm cursor-pointer overflow-hidden p-2"
                                    style={{
                                      backgroundColor: cls.subject?.color || "#8b5cf6",
                                    }}
                                  >
                                    <div className="text-white">
                                      <div className="font-semibold text-xs line-clamp-1 mb-1">
                                        {cls.subject?.name || "Unknown"}
                                      </div>
                                      <div className="flex items-center justify-between gap-1">
                                        <Badge
                                          variant="secondary"
                                          className="text-[9px] h-4 px-1 bg-white/20 text-white border-none"
                                        >
                                          {cls.type}
                                        </Badge>
                                        <div className="flex items-center gap-0.5 text-[10px] opacity-90">
                                          <Clock size={10} />
                                          <span>{cls.startTime.split(" ")[0]}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </motion.div>
                                ))}
                              </div>
                            ) : (
                              <div className="h-[60px] flex items-center justify-center">
                                <span className="text-xs text-muted-foreground/30">—</span>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Legend */}
        <div className="border-t p-4 bg-muted/20">
          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-primary/10 border border-primary" />
              <span>Today's row</span>
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
