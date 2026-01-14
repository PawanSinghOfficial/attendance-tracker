import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getCurrentWeekDates, formatDate } from "@/lib/attendance-utils";
import { AnimatedCounter } from "./AnimatedCounter";

export function WeeklySummary() {
  const attendance = useQuery(api.attendance.list);
  const classes = useQuery(api.classes.list);

  if (!attendance || !classes) return null;

  const weekDates = getCurrentWeekDates();
  const weekDateStrings = weekDates.map(formatDate);

  // Count this week's classes
  const thisWeekClasses = classes.filter((cls) => {
    const dayIndex = cls.dayOfWeek;
    return weekDates.some((date) => date.getDay() === dayIndex);
  });

  // Count attended classes this week
  const attendedThisWeek = attendance.filter(
    (record) =>
      weekDateStrings.includes(record.date) && record.status === "present"
  ).length;

  // Total possible classes this week (only up to today)
  const today = new Date();
  const possibleClasses = thisWeekClasses.filter((cls) => {
    const classDay = weekDates.find((date) => date.getDay() === cls.dayOfWeek);
    return classDay && classDay <= today;
  }).length;

  const weekPercentage =
    possibleClasses > 0 ? (attendedThisWeek / possibleClasses) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <CalendarDays className="text-blue-600" size={20} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-muted-foreground">
                This Week
              </h3>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">
                  <AnimatedCounter value={attendedThisWeek} decimals={0} />
                  <span className="text-lg text-muted-foreground">
                    /{possibleClasses}
                  </span>
                </span>
                <span className="text-sm text-muted-foreground">classes</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                <AnimatedCounter value={weekPercentage} decimals={0} suffix="%" />
              </div>
              <div className="text-xs text-muted-foreground">attended</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
