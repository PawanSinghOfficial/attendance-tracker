import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Clock, Utensils } from "lucide-react";
import { convertTo12Hour } from "@/lib/attendance-utils";

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

const START_HOUR = 8;
const END_HOUR = 17; // 5 PM
const SLOT_DURATION = 30; // minutes
const LUNCH_START = "12:00";
const LUNCH_END = "12:30";

// Generate time slots
const TIME_SLOTS: string[] = [];
for (let h = START_HOUR; h < END_HOUR; h++) {
  for (let m = 0; m < 60; m += SLOT_DURATION) {
    const hour = h;
    const minute = m;
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    const displayMinute = minute === 0 ? "00" : minute;
    TIME_SLOTS.push(`${displayHour}:${displayMinute} ${ampm}`);
  }
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Helper function to convert time string to hour (handles both 24-hour and 12-hour formats)
function timeToHour(timeStr: string): number {
  // Check if it's 12-hour format (has AM/PM)
  if (timeStr.includes(" ")) {
    const [time, period] = timeStr.split(" ");
    let [hours, minutes] = time.split(":").map(Number);

    if (period === "PM" && hours !== 12) {
      hours += 12;
    } else if (period === "AM" && hours === 12) {
      hours = 0;
    }

    return hours + minutes / 60;
  } else {
    // 24-hour format
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours + minutes / 60;
  }
}

// Get the time slot index where a class starts
function getStartSlotIndex(classStartTime: string): number {
  const startHour = timeToHour(classStartTime);
  return Math.round((startHour - START_HOUR) * (60 / SLOT_DURATION));
}

// Calculate how many slots a class spans
function getSlotSpan(classStartTime: string, classEndTime: string): number {
  const startHour = timeToHour(classStartTime);
  const endHour = timeToHour(classEndTime);
  const duration = endHour - startHour;

  // Calculate span in slots
  return Math.max(1, Math.round(duration * (60 / SLOT_DURATION)));
}

// Check if this slot should be rendered (not covered by a previous colspan)
interface SlotInfo {
  render: boolean;
  classData?: Class;
  colspan?: number;
  isLunch?: boolean;
}

function getSlotInfo(dayClasses: Class[], slotIndex: number, timeSlot: string): SlotInfo {
  // Check if it's lunch time (12:00 PM slot)
  const isLunchSlot = timeSlot.startsWith("12:00");

  // Find if any class starts at this slot
  const classAtSlot = dayClasses.find((cls) => {
    const startSlot = getStartSlotIndex(cls.startTime);
    return startSlot === slotIndex;
  });

  if (classAtSlot) {
    const colspan = getSlotSpan(classAtSlot.startTime, classAtSlot.endTime);
    return { render: true, classData: classAtSlot, colspan, isLunch: isLunchSlot };
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

  return { render: true, isLunch: isLunchSlot }; // Render empty cell (or lunch)
}

export function TimetableGrid({ weeklySchedule, weekDates }: TimetableGridProps) {
  const today = new Date().getDay();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden border-none shadow-md bg-background/50 backdrop-blur-sm">
        <div className="overflow-x-auto">
          <div className="min-w-[1000px]"> {/* Ensure minimum width for scrolling */}
            <table className="w-full border-collapse table-fixed">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="p-3 text-left font-semibold text-xs border-r sticky left-0 top-0 bg-background/95 backdrop-blur z-20 w-24 shadow-[1px_0_5px_rgba(0,0,0,0.05)]">
                    Day
                  </th>
                  {TIME_SLOTS.map((time, index) => {
                    const isHourStart = index % 2 === 0;
                    return (
                      <th
                        key={time}
                        className={`p-2 text-center font-semibold text-[10px] border-r last:border-r-0 sticky top-0 bg-muted/30 z-10 w-20 ${
                          time.startsWith("12:00") ? "bg-orange-50/50 dark:bg-orange-950/10" : ""
                        }`}
                      >
                        <div className="flex flex-col items-center">
                          <span className={`text-xs ${isHourStart ? "font-bold text-foreground" : "text-muted-foreground font-normal"}`}>
                            {time.split(" ")[0]}
                          </span>
                          {isHourStart && (
                            <span className="text-[9px] text-muted-foreground">
                              {time.split(" ")[1]}
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {weekDates.map((date, dayIndex) => {
                  const dayClasses = weeklySchedule[date.getDay()] || [];
                  const isToday = date.getDay() === today;

                  return (
                    <tr
                      key={dayIndex}
                      className={`border-b last:border-b-0 transition-colors hover:bg-muted/5 ${
                        isToday ? "bg-primary/5" : ""
                      }`}
                    >
                      {/* Day Column */}
                      <td
                        className={`p-3 border-r font-medium sticky left-0 z-10 shadow-[1px_0_5px_rgba(0,0,0,0.05)] ${
                          isToday ? "bg-background/95 backdrop-blur border-l-4 border-l-primary" : "bg-background/95 backdrop-blur"
                        }`}
                      >
                        <div className="flex flex-col">
                          <span
                            className={`text-sm ${isToday ? "text-primary font-bold" : ""}`}
                          >
                            {DAYS[date.getDay()]}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {format(date, "MMM d")}
                          </span>
                        </div>
                      </td>

                      {/* Time Slot Columns */}
                      {TIME_SLOTS.map((timeSlot, slotIndex) => {
                        const slotInfo = getSlotInfo(dayClasses, slotIndex, timeSlot);

                        // Skip rendering if covered by previous colspan
                        if (!slotInfo.render) {
                          return null;
                        }

                        // Render cell with class
                        if (slotInfo.classData && slotInfo.colspan) {
                          const cls = slotInfo.classData;
                          return (
                            <td
                              key={timeSlot}
                              colSpan={slotInfo.colspan}
                              className="p-1 border-r align-top relative group"
                            >
                              <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{
                                  delay: dayIndex * 0.05 + slotIndex * 0.01,
                                }}
                                whileHover={{ scale: 1.02, zIndex: 10 }}
                                className="rounded-lg shadow-sm cursor-pointer overflow-hidden p-2 h-full min-h-[80px] border border-white/10 relative"
                                style={{
                                  backgroundColor: cls.subject?.color || "#8b5cf6",
                                }}
                              >
                                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" />
                                <div className="text-white h-full flex flex-col justify-between relative z-10">
                                  <div>
                                    <div className="font-bold text-xs leading-tight mb-1 line-clamp-2">
                                      {cls.subject?.name || "Unknown"}
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                      <Badge
                                        variant="secondary"
                                        className="text-[9px] h-4 px-1 bg-white/20 text-white border-none backdrop-blur-sm"
                                      >
                                        {cls.type}
                                      </Badge>
                                      <Badge
                                        variant="secondary"
                                        className="text-[9px] h-4 px-1 bg-black/20 text-white border-none backdrop-blur-sm"
                                      >
                                        {cls.subject?.code}
                                      </Badge>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 text-[10px] opacity-90 mt-1 font-medium bg-black/10 w-fit px-1.5 py-0.5 rounded-full">
                                    <Clock size={10} />
                                    <span className="truncate">
                                      {convertTo12Hour(cls.startTime).replace(" ", "")} - {convertTo12Hour(cls.endTime).replace(" ", "")}
                                    </span>
                                  </div>
                                </div>
                              </motion.div>
                            </td>
                          );
                        }

                        // Render Lunch Break
                        if (slotInfo.isLunch) {
                          return (
                            <td
                              key={timeSlot}
                              className="p-0 border-r align-top bg-orange-50/30 dark:bg-orange-950/10 relative overflow-hidden"
                            >
                              <div className="h-full min-h-[80px] flex flex-col items-center justify-center gap-1 opacity-50 group hover:opacity-100 transition-opacity">
                                <motion.div
                                  animate={{ 
                                    rotate: [0, 10, -10, 0],
                                    y: [0, -2, 0]
                                  }}
                                  transition={{ 
                                    duration: 4,
                                    repeat: Infinity,
                                    repeatType: "reverse"
                                  }}
                                >
                                  <Utensils size={14} className="text-orange-400" />
                                </motion.div>
                                <span className="text-[9px] font-medium text-orange-400/80 uppercase tracking-wider rotate-0">Lunch</span>
                              </div>
                            </td>
                          );
                        }

                        // Render empty cell
                        return (
                          <td
                            key={timeSlot}
                            className="p-1 border-r last:border-r-0 align-top hover:bg-muted/10 transition-colors"
                          >
                            <div className="h-[80px] flex items-center justify-center">
                              {/* Optional: Add subtle pattern or lines */}
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
        <div className="border-t p-3 bg-muted/20 backdrop-blur-sm">
          <div className="flex items-center gap-4 text-[10px] text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded bg-primary/10 border border-primary" />
              <span>Today</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded bg-purple-500 shadow-sm" />
              <span>Class</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded bg-orange-100 border border-orange-200 dark:bg-orange-900/20 dark:border-orange-800" />
              <span>Lunch Break</span>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}