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

// Configuration for the grid columns
// Before lunch: 1 hour intervals
// Lunch: 12:00 - 12:30
// After lunch: 30 min intervals
const GRID_CONFIG = [
  { label: "08:00", start: 8, duration: 60 },
  { label: "09:00", start: 9, duration: 60 },
  { label: "10:00", start: 10, duration: 60 },
  { label: "11:00", start: 11, duration: 60 },
  { label: "12:00", start: 12, duration: 30, isLunch: true },
  { label: "12:30", start: 12.5, duration: 30 },
  { label: "01:00", start: 13, duration: 30 },
  { label: "01:30", start: 13.5, duration: 30 },
  { label: "02:00", start: 14, duration: 30 },
  { label: "02:30", start: 14.5, duration: 30 },
  { label: "03:00", start: 15, duration: 30 },
  { label: "03:30", start: 15.5, duration: 30 },
  { label: "04:00", start: 16, duration: 30 },
  { label: "04:30", start: 16.5, duration: 30 },
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Helper function to convert time string to hour
function timeToHour(timeStr: string): number {
  if (timeStr.includes(" ")) {
    const [time, period] = timeStr.split(" ");
    let [hours, minutes] = time.split(":").map(Number);
    if (period === "PM" && hours !== 12) hours += 12;
    else if (period === "AM" && hours === 12) hours = 0;
    return hours + minutes / 60;
  } else {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours + minutes / 60;
  }
}

// Get the column index for a given time
function getSlotIndex(timeStr: string): number {
  const hour = timeToHour(timeStr);
  
  // Find the slot that contains this time
  const index = GRID_CONFIG.findIndex(slot => {
    const slotEnd = slot.start + (slot.duration / 60);
    return hour >= slot.start && hour < slotEnd;
  });

  // If exact match not found (e.g. starts before 8am), clamp to 0
  if (index === -1) {
    if (hour < GRID_CONFIG[0].start) return 0;
    return GRID_CONFIG.length - 1;
  }
  
  return index;
}

// Calculate colspan based on duration and grid config
function getColSpan(startTime: string, endTime: string): number {
  const startIdx = getSlotIndex(startTime);
  const endHour = timeToHour(endTime);
  
  let colspan = 0;
  let currentIdx = startIdx;
  
  while (currentIdx < GRID_CONFIG.length) {
    const slot = GRID_CONFIG[currentIdx];
    if (slot.start >= endHour) break;
    colspan++;
    currentIdx++;
  }
  
  return Math.max(1, colspan);
}

interface SlotInfo {
  render: boolean;
  classData?: Class;
  colspan?: number;
  isLunch?: boolean;
}

function getSlotInfo(dayClasses: Class[], slotIndex: number): SlotInfo {
  const slotConfig = GRID_CONFIG[slotIndex];
  
  if (slotConfig.isLunch) {
    return { render: true, isLunch: true };
  }

  // Find if any class starts at this slot
  // We need to handle classes that might start in the middle of a 1h slot by mapping them to the slot start
  const classAtSlot = dayClasses.find((cls) => {
    const clsStartIdx = getSlotIndex(cls.startTime);
    return clsStartIdx === slotIndex;
  });

  if (classAtSlot) {
    const colspan = getColSpan(classAtSlot.startTime, classAtSlot.endTime);
    return { render: true, classData: classAtSlot, colspan };
  }

  // Check if this slot is covered by a previous class
  const coveringClass = dayClasses.find((cls) => {
    const startIdx = getSlotIndex(cls.startTime);
    const span = getColSpan(cls.startTime, cls.endTime);
    return slotIndex > startIdx && slotIndex < startIdx + span;
  });

  if (coveringClass) {
    return { render: false };
  }

  return { render: true };
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
        <div className="w-full">
          <table className="w-full border-collapse table-fixed">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="p-3 text-left font-semibold text-xs border-r w-20 bg-background/95 backdrop-blur">
                  Day
                </th>
                {GRID_CONFIG.map((slot, index) => (
                  <th
                    key={index}
                    className={`p-2 text-center font-semibold text-[10px] border-r last:border-r-0 ${
                      slot.isLunch ? "bg-orange-50/50 dark:bg-orange-950/10 w-16" : "w-auto"
                    }`}
                  >
                    {slot.isLunch ? (
                      <div className="flex flex-col items-center justify-center h-full text-orange-500">
                        <Utensils size={14} className="mb-1" />
                        <span className="text-[9px] uppercase tracking-wider font-bold">Lunch</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-medium text-foreground">
                          {slot.label.split(" ")[0]}
                        </span>
                        <span className="text-[9px] text-muted-foreground">
                          {slot.label.split(" ")[1]}
                        </span>
                      </div>
                    )}
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
                    className={`border-b last:border-b-0 transition-colors hover:bg-muted/5 ${
                      isToday ? "bg-primary/5" : ""
                    }`}
                  >
                    {/* Day Column */}
                    <td
                      className={`p-3 border-r font-medium ${
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
                    {GRID_CONFIG.map((slot, slotIndex) => {
                      const slotInfo = getSlotInfo(dayClasses, slotIndex);

                      if (!slotInfo.render) return null;

                      if (slotInfo.isLunch) {
                        return (
                          <td
                            key={slotIndex}
                            className="p-0 border-r align-top bg-orange-50/30 dark:bg-orange-950/10 border-b-0"
                          >
                            {/* Continuous visual strip for lunch */}
                            <div className="h-full min-h-[80px] w-full opacity-20 bg-orange-100/50 dark:bg-orange-900/20"></div>
                          </td>
                        );
                      }

                      if (slotInfo.classData && slotInfo.colspan) {
                        const cls = slotInfo.classData;
                        return (
                          <td
                            key={slotIndex}
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
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 text-[10px] opacity-90 mt-1 font-medium bg-black/10 w-fit px-1.5 py-0.5 rounded-full">
                                  <Clock size={10} />
                                  <span className="truncate">
                                    {convertTo12Hour(cls.startTime).replace(" ", "")}
                                  </span>
                                </div>
                              </div>
                            </motion.div>
                          </td>
                        );
                      }

                      return (
                        <td
                          key={slotIndex}
                          className="p-1 border-r last:border-r-0 align-top hover:bg-muted/10 transition-colors"
                        >
                          <div className="h-[80px]"></div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
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