import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, startOfWeek, endOfWeek, addMonths, subMonths } from "date-fns";
import { Id } from "@/convex/_generated/dataModel";

interface AttendanceRecord {
  _id: Id<"attendance">;
  subjectId: Id<"subjects">;
  date: string;
  status: "present" | "absent";
  timestamp: number;
}

interface Subject {
  _id: Id<"subjects">;
  name: string;
  code: string;
  color: string;
  targetAttendance: number;
}

interface CalendarViewProps {
  attendance: AttendanceRecord[];
  subjects: Subject[];
  onDateClick?: (date: Date) => void;
}

export function CalendarView({ attendance, subjects, onDateClick }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const previousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const getAttendanceForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return attendance.filter((a) => a.date === dateStr);
  };

  const getDayStats = (date: Date) => {
    const dayAttendance = getAttendanceForDate(date);
    const present = dayAttendance.filter((a) => a.status === "present").length;
    const total = dayAttendance.length;
    return { present, total, percentage: total > 0 ? (present / total) * 100 : 0 };
  };

  const getDayColor = (date: Date) => {
    const stats = getDayStats(date);
    if (stats.total === 0) return null;
    if (stats.percentage === 100) return "bg-green-500";
    if (stats.percentage >= 75) return "bg-green-400";
    if (stats.percentage >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold">
          {format(currentMonth, "MMMM yyyy")}
        </h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={previousMonth}>
            <ChevronLeft size={16} />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={nextMonth}>
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Day Headers */}
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
            {day}
          </div>
        ))}

        {/* Calendar Days */}
        {calendarDays.map((day, index) => {
          const dayAttendance = getAttendanceForDate(day);
          const stats = getDayStats(day);
          const dayColor = getDayColor(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isTodayDate = isToday(day);

          return (
            <motion.button
              key={day.toISOString()}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.01 }}
              onClick={() => onDateClick?.(day)}
              className={`
                aspect-square p-2 rounded-lg border transition-all hover:shadow-md
                ${isCurrentMonth ? "bg-card" : "bg-muted/50"}
                ${isTodayDate ? "ring-2 ring-primary" : ""}
                ${!isCurrentMonth ? "opacity-50" : ""}
              `}
            >
              <div className="flex flex-col items-center justify-center h-full">
                <span className={`text-sm font-medium ${isTodayDate ? "text-primary" : ""}`}>
                  {format(day, "d")}
                </span>

                {/* Attendance Dots */}
                {dayAttendance.length > 0 && (
                  <div className="flex gap-0.5 mt-1 flex-wrap justify-center max-w-full">
                    {dayAttendance.slice(0, 4).map((record) => {
                      const subject = subjects.find((s) => s._id === record.subjectId);
                      return (
                        <div
                          key={record._id}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{
                            backgroundColor:
                              record.status === "present"
                                ? subject?.color || "#10b981"
                                : "#ef4444",
                          }}
                          title={`${subject?.name}: ${record.status}`}
                        />
                      );
                    })}
                    {dayAttendance.length > 4 && (
                      <span className="text-[8px] text-muted-foreground">
                        +{dayAttendance.length - 4}
                      </span>
                    )}
                  </div>
                )}

                {/* Overall Day Status */}
                {dayColor && (
                  <div className="flex items-center gap-1 mt-1">
                    <div className={`w-2 h-2 rounded-full ${dayColor}`} />
                    <span className="text-[10px] text-muted-foreground">
                      {Math.round(stats.percentage)}%
                    </span>
                  </div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground pt-4 border-t">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>100%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-400" />
          <span>75-99%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span>50-74%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>&lt;50%</span>
        </div>
      </div>
    </div>
  );
}
