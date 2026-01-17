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

// Get the time slot index where a class starts
function getStartSlotIndex(classStartTime: string): number {
  const startHour = Math.floor(timeToHour(classStartTime));
  const baseHour = 8; // 8 AM start
  return Math.max(0, startHour - baseHour);
}

// Calculate how many slots a class spans
function getSlotSpan(classStartTime: string, classEndTime: string): number {
  const startHour = timeToHour(classStartTime);
  const endHour = timeToHour(classEndTime);
  const duration = endHour - startHour;

  // Calculate span in hours, minimum 1
  return Math.max(1, Math.ceil(duration));
}

// Check if this slot should be rendered (not covered by a previous colspan)
interface SlotInfo {
  render: boolean;
  classData?: Class;
  colspan?: number;
}

function getSlotInfo(dayClasses: Class[], slotIndex: number): SlotInfo {
  // Find if any class starts at this slot
  const classAtSlot = dayClasses.find((cls) => {
    const startSlot = getStartSlotIndex(cls.startTime);
    return startSlot === slotIndex;
  });

  if (classAtSlot) {
    const colspan = getSlotSpan(classAtSlot.startTime, classAtSlot.endTime);
    return { render: true, classData: classAtSlot, colspan };
  }

  // Check if this slot is covered by a previous class
  const coveringClass = dayClasses.find((cls) => {
    const startSlot = getStartSlotIndex(cls.startTime);
    const span = getSlotSpan(cls.startTime, cls.endTime);
    return slotIndex > startSlot && slotIndex < startSlot + span;
  });

  if (coveringClass) {
    return { render: false }; // Don't render, it's covered by colspan
  }

  return { render: true }; // Render empty cell
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
                  <th className="p-3 text-left font-semibold text-sm border-r sticky left-0 bg-muted/30 z-10 min-w-[100px]">
                    Day
                  </th>
                  {TIME_SLOTS.map((time) => (
                    <th
                      key={time}
                      className="p-3 text-center font-semibold text-sm border-r last:border-r-0 min-w-[120px]"
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
                        className={`p-3 border-r font-medium sticky left-0 z-10 ${
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
                      {TIME_SLOTS.map((timeSlot, slotIndex) => {
                        const slotInfo = getSlotInfo(dayClasses, slotIndex);

                        // Skip rendering if covered by previous colspan
                        if (!slotInfo.render) {
                          return null;
                        }

                        // Render cell with class or empty
                        if (slotInfo.classData && slotInfo.colspan) {
                          const cls = slotInfo.classData;
                          return (
                            <td
                              key={timeSlot}
                              colSpan={slotInfo.colspan}
                              className="p-2 border-r align-top"
                            >
                              <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{
                                  delay: dayIndex * 0.03,
                                }}
                                whileHover={{ scale: 1.02, zIndex: 10 }}
                                className="rounded-md shadow-sm cursor-pointer overflow-hidden p-3 h-full"
                                style={{
                                  backgroundColor: cls.subject?.color || "#8b5cf6",
                                }}
                              >
                                <div className="text-white h-full flex flex-col justify-between">
                                  <div>
                                    <div className="font-semibold text-sm mb-1">
                                      {cls.subject?.name || "Unknown"}
                                    </div>
                                    <Badge
                                      variant="secondary"
                                      className="text-[10px] h-5 px-1.5 bg-white/20 text-white border-none"
                                    >
                                      {cls.type}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-1 text-xs opacity-90 mt-2">
                                    <Clock size={12} />
                                    <span>
                                      {cls.startTime} - {cls.endTime}
                                    </span>
                                  </div>
                                </div>
                              </motion.div>
                            </td>
                          );
                        }

                        // Render empty cell
                        return (
                          <td
                            key={timeSlot}
                            className="p-2 border-r last:border-r-0 align-top"
                          >
                            <div className="h-[80px] flex items-center justify-center">
                              <span className="text-xs text-muted-foreground/30">—</span>
                            </div>
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
            <div className="flex items-center gap-2">
              <Clock size={12} />
              <span>Classes span across their full duration</span>
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
