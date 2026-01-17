import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, X, Bell } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { formatDate } from "@/lib/attendance-utils";
import { format, parseISO, differenceInMinutes } from "date-fns";

export function ClassReminders() {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const weeklySchedule = useQuery(api.classes.getWeeklySchedule);
  const settings = useQuery(api.settings.get);

  const today = new Date();
  const todayStr = formatDate(today);

  // Get today's classes
  const todayClasses =
    weeklySchedule && weeklySchedule[today.getDay()]
      ? weeklySchedule[today.getDay()]
      : [];

  // Find upcoming classes within the next 30 minutes
  const upcomingClasses = todayClasses
    .filter((cls) => {
      if (dismissed.has(cls._id)) return false;

      // Parse class time
      const [hours, minutes] = cls.startTime.split(":").map(Number);
      const classTime = new Date();
      classTime.setHours(hours, minutes, 0, 0);

      const minutesUntilClass = differenceInMinutes(classTime, today);

      // Show reminder if class is within 30 minutes and hasn't started yet
      return minutesUntilClass > 0 && minutesUntilClass <= 30;
    })
    .map((cls) => {
      const [hours, minutes] = cls.startTime.split(":").map(Number);
      const classTime = new Date();
      classTime.setHours(hours, minutes, 0, 0);
      const minutesUntil = differenceInMinutes(classTime, today);

      return {
        ...cls,
        minutesUntil,
      };
    })
    .sort((a, b) => a.minutesUntil - b.minutesUntil);

  const handleDismiss = (classId: string) => {
    setDismissed((prev) => new Set([...prev, classId]));
  };

  // Request notification permission on mount
  useEffect(() => {
    if (settings?.browserNotifications && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, [settings]);

  // Show browser notification for upcoming classes
  useEffect(() => {
    if (!settings?.browserNotifications || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    upcomingClasses.forEach((cls) => {
      const notificationKey = `${cls._id}-${todayStr}`;

      // Check if we've already shown notification for this class today
      const shownNotifications = JSON.parse(
        localStorage.getItem("shownNotifications") || "{}"
      );

      if (shownNotifications[notificationKey]) return;

      // Show notification for classes within 10 minutes
      if (cls.minutesUntil <= 10 && cls.minutesUntil > 0) {
        try {
          // Check if we can use the Notification constructor
          if (typeof Notification === "function") {
            new Notification(`Class Starting Soon!`, {
              body: `${cls.subject?.name} starts in ${cls.minutesUntil} minutes`,
              icon: "/logo.png",
              tag: notificationKey,
            });

            // Mark as shown
            shownNotifications[notificationKey] = true;
            localStorage.setItem("shownNotifications", JSON.stringify(shownNotifications));
          }
        } catch (error) {
          // Silently fail if Notification constructor is not available
          console.warn("Browser notifications not available:", error);
        }
      }
    });
  }, [upcomingClasses, settings, todayStr]);

  if (!settings?.preClassPrompts || upcomingClasses.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-40 space-y-2 max-w-sm">
      <AnimatePresence>
        {upcomingClasses.map((cls) => (
          <motion.div
            key={cls._id}
            initial={{ opacity: 0, x: 100, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <Card className={`p-4 shadow-lg border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50 ${cls.minutesUntil <= 10 ? "pulse-attention" : ""}`}>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Bell className="text-blue-600" size={20} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-semibold text-sm">{cls.subject?.name}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => handleDismiss(cls._id)}
                    >
                      <X size={14} />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock size={14} />
                    <span>
                      {cls.minutesUntil === 1
                        ? "Starts in 1 minute"
                        : `Starts in ${cls.minutesUntil} minutes`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {cls.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {cls.startTime} - {cls.endTime}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
