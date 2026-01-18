import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ProgressRing } from "@/components/ProgressRing";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import {
  getCurrentWeekDates,
  formatDate,
  isToday,
  getShortDayName,
  calculateClassesNeeded,
  calculateRemainingClasses,
  willReachTarget,
  calculateStreak,
  convertTo12Hour,
} from "@/lib/attendance-utils";
import { Check, X, Clock, AlertTriangle, TrendingUp, Flame, Plus, Calendar as CalendarIcon, LayoutGrid, Grid3x3, RotateCcw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { CalendarView } from "@/components/CalendarView";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { DashboardSkeleton } from "@/components/LoadingSkeleton";
import { QuickActionsButton } from "@/components/QuickActionsButton";
import { ClassReminders } from "@/components/ClassReminders";
import { WeeklySummary } from "@/components/WeeklySummary";
import { PageTransition } from "@/components/PageTransition";
import { TimetableGrid } from "@/components/TimetableGrid";

// Weekly Summary Badge Component
function WeeklySummaryBadge() {
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
    <Badge
      variant={weekPercentage >= 75 ? "default" : "destructive"}
      className="text-lg px-4 py-2"
    >
      WEEKLY <AnimatedCounter value={weekPercentage} decimals={0} suffix="%" />
    </Badge>
  );
}

// Overall Summary Component
function OverallSummary({ percentage, present, total }: { percentage: number; present: number; total: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-full">
              <TrendingUp className="text-purple-600" size={20} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-muted-foreground">
                Overall Attendance
              </h3>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">
                  <AnimatedCounter value={present} decimals={0} />
                  <span className="text-lg text-muted-foreground">
                    /{total}
                  </span>
                </span>
                <span className="text-sm text-muted-foreground">classes</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-purple-600">
                <AnimatedCounter value={percentage} decimals={0} suffix="%" />
              </div>
              <div className="text-xs text-muted-foreground">attended</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Dashboard() {
  const subjects = useQuery(api.subjects.list);
  const weeklySchedule = useQuery(api.classes.getWeeklySchedule);
  const allAttendance = useQuery(api.attendance.list);
  const overallStats = useQuery(api.attendance.getOverallStats);
  const settings = useQuery(api.settings.get);
  const markAttendance = useMutation(api.attendance.mark);
  const resetAllAttendance = useMutation(api.attendance.resetAll);

  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [showCalendar, setShowCalendar] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "timetable">("timetable");
  const [showUpcomingDays, setShowUpcomingDays] = useState(false);

  const today = new Date();
  const todayStr = formatDate(today);
  const weekDates = getCurrentWeekDates();

  const handleMarkAttendance = async (
    subjectId: Id<"subjects">,
    classId: Id<"classes"> | undefined,
    date: string,
    status: "present" | "absent"
  ) => {
    try {
      await markAttendance({
        subjectId,
        classId,
        date,
        status,
      });
      toast.success(
        <div className="flex items-center gap-2">
          {status === "present" ? (
            <Check className="text-green-600" size={18} />
          ) : (
            <X className="text-red-600" size={18} />
          )}
          <span>Marked as {status}</span>
        </div>
      );
    } catch (error) {
      toast.error(
        <div className="flex items-center gap-2">
          <AlertTriangle className="text-red-600" size={18} />
          <span>Failed to mark attendance</span>
        </div>
      );
    }
  };

  const toggleSubjectExpansion = (subjectId: string) => {
    const newExpanded = new Set(expandedSubjects);
    if (newExpanded.has(subjectId)) {
      newExpanded.delete(subjectId);
    } else {
      newExpanded.add(subjectId);
    }
    setExpandedSubjects(newExpanded);
  };

  const handleResetAllAttendance = async () => {
    if (!confirm("Are you sure you want to reset ALL attendance records? This will bring your attendance to 0%. This action cannot be undone!")) {
      return;
    }

    try {
      await resetAllAttendance({});
      toast.success(
        <div className="flex items-center gap-2">
          <Check className="text-green-600" size={18} />
          <span>All attendance reset to 0%</span>
        </div>
      );
    } catch (error) {
      toast.error(
        <div className="flex items-center gap-2">
          <X className="text-red-600" size={18} />
          <span>Failed to reset attendance</span>
        </div>
      );
    }
  };

  // Get today's classes
  const todayClasses =
    weeklySchedule && weeklySchedule[today.getDay()]
      ? weeklySchedule[today.getDay()].sort((a, b) => a.startTime.localeCompare(b.startTime))
      : [];

  // Get attendance for each subject with separate lecture/lab tracking
  const subjectStats =
    subjects?.map((subject) => {
      const subjectAttendance =
        allAttendance?.filter((a) => a.subjectId === subject._id) || [];

      // Get all classes for this subject to determine type
      const subjectClasses = weeklySchedule
        ? Object.values(weeklySchedule)
            .flat()
            .filter((c) => c.subjectId === subject._id)
        : [];

      // Separate attendance by class type (LECTURE vs LAB)
      const lectureAttendance = subjectAttendance.filter((a) => {
        const cls = subjectClasses.find((c) => c._id === a.classId);
        return cls?.type === "LECTURE";
      });

      const labAttendance = subjectAttendance.filter((a) => {
        const cls = subjectClasses.find((c) => c._id === a.classId);
        return cls?.type === "LAB";
      });

      // Calculate stats for lectures
      const lecturePresent = lectureAttendance.filter((a) => a.status === "present").length;
      const lectureTotal = lectureAttendance.length;
      const lecturePercentage = lectureTotal > 0 ? (lecturePresent / lectureTotal) * 100 : 0;

      // Calculate stats for labs
      const labPresent = labAttendance.filter((a) => a.status === "present").length;
      const labTotal = labAttendance.length;
      const labPercentage = labTotal > 0 ? (labPresent / labTotal) * 100 : 0;

      // Overall stats
      const present = subjectAttendance.filter((a) => a.status === "present").length;
      const absent = subjectAttendance.filter((a) => a.status === "absent").length;
      const total = present + absent;
      const percentage = total > 0 ? (present / total) * 100 : 0;

      const classesPerWeek =
        weeklySchedule
          ? Object.values(weeklySchedule)
              .flat()
              .filter((c) => c.subjectId === subject._id).length
          : 2;

      const remainingClasses = calculateRemainingClasses(
        settings?.semesterEndDate,
        classesPerWeek
      );

      const prediction = willReachTarget(present, total, subject.targetAttendance, remainingClasses);

      const classesNeeded = calculateClassesNeeded(present, total, subject.targetAttendance);

      const streak = percentage === 100 ? calculateStreak(subjectAttendance) : 0;

      return {
        subject,
        present,
        absent,
        total,
        percentage,
        prediction,
        classesNeeded,
        streak,
        // Separate tracking by class type
        lecture: {
          present: lecturePresent,
          total: lectureTotal,
          percentage: lecturePercentage,
        },
        lab: {
          present: labPresent,
          total: labTotal,
          percentage: labPercentage,
        },
      };
    }) || [];

  // Identify subjects needing attention
  const subjectsNeedingAttention = subjectStats.filter(
    (s) => s.percentage < s.subject.targetAttendance && s.percentage >= s.subject.targetAttendance - 15
  );

  const subjectsMayNotReach = subjectStats.filter((s) => !s.prediction.willReach && s.total > 0);

  if (!subjects || !weeklySchedule || !allAttendance || !overallStats) {
    return (
      <PageTransition>
        <AppLayout>
          <DashboardSkeleton />
        </AppLayout>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <AppLayout>
        <div className="max-w-7xl mx-auto space-y-8 fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[oklch(var(--gradient-2))] to-[oklch(var(--gradient-3))] bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">{format(today, "EEEE, MMMM do")}</p>
          </div>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-3"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCalendar(!showCalendar)}
            >
              <CalendarIcon size={16} className="mr-2" />
              {showCalendar ? "Hide" : "Show"} Calendar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetAllAttendance}
            >
              <RotateCcw size={16} className="mr-2" />
              Reset All
            </Button>
            <WeeklySummaryBadge />
          </motion.div>
        </div>

        {/* Calendar View */}
        {showCalendar && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Calendar View</CardTitle>
              </CardHeader>
              <CardContent>
                <CalendarView
                  attendance={allAttendance || []}
                  subjects={subjects || []}
                />
              </CardContent>
            </Card>
          </motion.section>
        )}

        {/* Overall Attendance Widget */}
        <OverallSummary percentage={overallStats.percentage} present={overallStats.present} total={overallStats.total} />

        {/* Today's Schedule */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Today's Schedule</h2>
          {todayClasses.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No classes scheduled for today</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {todayClasses.map((cls, index) => {
                const attendance = allAttendance?.find(
                  (a) => a.classId === cls._id && a.date === todayStr
                );

                return (
                  <motion.div
                    key={cls._id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="hover-lift">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-lg">
                              {cls.subject?.name || "Unknown"}
                            </h3>
                            <Badge variant="secondary" className="mt-1">
                              {cls.type}
                            </Badge>
                          </div>
                          <div className="text-right text-sm">
                            <div className="font-medium">{convertTo12Hour(cls.startTime)}</div>
                            <div className="text-muted-foreground">{convertTo12Hour(cls.endTime)}</div>
                          </div>
                        </div>

                        {attendance ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-center gap-2 p-3 bg-muted rounded-lg">
                              {attendance.status === "present" ? (
                                <>
                                  <Check className="text-green-600" />
                                  <span className="font-medium">Marked Present</span>
                                </>
                              ) : (
                                <>
                                  <X className="text-red-600" />
                                  <span className="font-medium">Marked Absent</span>
                                </>
                              )}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() =>
                                handleMarkAttendance(
                                  cls.subjectId,
                                  cls._id,
                                  todayStr,
                                  attendance.status === "present" ? "absent" : "present"
                                )
                              }
                            >
                              Change to {attendance.status === "present" ? "Absent" : "Present"}
                            </Button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              onClick={() =>
                                handleMarkAttendance(
                                  cls.subjectId,
                                  cls._id,
                                  todayStr,
                                  "present"
                                )
                              }
                              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                            >
                              <Check size={16} className="mr-1" />
                              Present
                            </Button>
                            <Button
                              onClick={() =>
                                handleMarkAttendance(cls.subjectId, cls._id, todayStr, "absent")
                              }
                              variant="destructive"
                            >
                              <X size={16} className="mr-1" />
                              Absent
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>

        {/* Upcoming Days - Next 6 Days */}
        <section>
          <Collapsible open={showUpcomingDays} onOpenChange={setShowUpcomingDays}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between p-0 h-auto hover:bg-transparent mb-4"
              >
                <h2 className="text-2xl font-semibold">Upcoming Days</h2>
                <motion.div
                  animate={{ rotate: showUpcomingDays ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown size={24} />
                </motion.div>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-6">
            {[1, 2, 3, 4, 5, 6].map((dayOffset) => {
              const upcomingDate = new Date(today);
              upcomingDate.setDate(upcomingDate.getDate() + dayOffset);
              const upcomingDateStr = formatDate(upcomingDate);
              const upcomingDayOfWeek = upcomingDate.getDay();
              const upcomingClasses = weeklySchedule?.[upcomingDayOfWeek] || [];

              if (upcomingClasses.length === 0) return null;

              return (
                <Card key={upcomingDateStr}>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {format(upcomingDate, "EEEE, MMM d")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {upcomingClasses.map((cls) => {
                        const attendance = allAttendance?.find(
                          (a) => a.classId === cls._id && a.date === upcomingDateStr
                        );

                        return (
                          <div
                            key={cls._id}
                            className="p-4 bg-muted rounded-lg"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="font-medium">
                                  {cls.subject?.name || "Unknown"}
                                </h4>
                                <Badge variant="secondary" className="mt-1 text-xs">
                                  {cls.type}
                                </Badge>
                              </div>
                              <div className="text-right text-sm">
                                <div className="font-medium">{convertTo12Hour(cls.startTime)}</div>
                                <div className="text-muted-foreground text-xs">{convertTo12Hour(cls.endTime)}</div>
                              </div>
                            </div>

                            {attendance ? (
                              <div className="space-y-2">
                                <div className="flex items-center justify-center gap-2 p-2 bg-background rounded text-sm">
                                  {attendance.status === "present" ? (
                                    <>
                                      <Check className="text-green-600" size={16} />
                                      <span>Present</span>
                                    </>
                                  ) : (
                                    <>
                                      <X className="text-red-600" size={16} />
                                      <span>Absent</span>
                                    </>
                                  )}
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full text-xs"
                                  onClick={() =>
                                    handleMarkAttendance(
                                      cls.subjectId,
                                      cls._id,
                                      upcomingDateStr,
                                      attendance.status === "present" ? "absent" : "present"
                                    )
                                  }
                                >
                                  Change to {attendance.status === "present" ? "Absent" : "Present"}
                                </Button>
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 gap-2">
                                <Button
                                  onClick={() =>
                                    handleMarkAttendance(
                                      cls.subjectId,
                                      cls._id,
                                      upcomingDateStr,
                                      "present"
                                    )
                                  }
                                  size="sm"
                                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-xs"
                                >
                                  <Check size={14} className="mr-1" />
                                  Present
                                </Button>
                                <Button
                                  onClick={() =>
                                    handleMarkAttendance(cls.subjectId, cls._id, upcomingDateStr, "absent")
                                  }
                                  variant="destructive"
                                  size="sm"
                                  className="text-xs"
                                >
                                  <X size={14} className="mr-1" />
                                  Absent
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </section>

        {/* This Week's Schedule */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">This Week's Schedule</h2>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-sm">
                {weekDates[0] && format(weekDates[0], "MMM d")} - {weekDates[5] && format(weekDates[5], "MMM d")}
              </Badge>
              <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
                <Button
                  variant={viewMode === "cards" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("cards")}
                  className="h-8"
                >
                  <LayoutGrid size={16} className="mr-1" />
                  Cards
                </Button>
                <Button
                  variant={viewMode === "timetable" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("timetable")}
                  className="h-8"
                >
                  <Grid3x3 size={16} className="mr-1" />
                  Timetable
                </Button>
              </div>
            </div>
          </div>

          {viewMode === "timetable" ? (
            <TimetableGrid weeklySchedule={weeklySchedule} weekDates={weekDates} />
          ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {weekDates.map((date, index) => {
              const dateStr = formatDate(date);
              const dayClasses = weeklySchedule[date.getDay()] || [];
              const isTodayDate = isToday(date);

              // Calculate attendance stats for this day
              const attendedClasses = dayClasses.filter((cls) => {
                const attendance = allAttendance?.find(
                  (a) => a.classId === cls._id && a.date === dateStr
                );
                return attendance?.status === "present";
              }).length;

              const totalMarked = dayClasses.filter((cls) => {
                return allAttendance?.find(
                  (a) => a.classId === cls._id && a.date === dateStr
                );
              }).length;

              return (
                <motion.div
                  key={dateStr}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative"
                >
                  <Card
                    className={`hover-lift transition-all ${
                      isTodayDate
                        ? "ring-2 ring-primary bg-gradient-to-br from-blue-50 to-purple-50"
                        : "bg-white"
                    }`}
                  >
                    {/* Day header with colored accent */}
                    <CardHeader className="p-4 pb-3 relative overflow-hidden">
                      <div
                        className="absolute top-0 left-0 right-0 h-1"
                        style={{
                          background: isTodayDate
                            ? "linear-gradient(90deg, #8b5cf6, #3b82f6)"
                            : dayClasses.length > 0 ? "#e0e7ff" : "#f3f4f6"
                        }}
                      />
                      <CardTitle className="text-center">
                        <div className={`text-lg font-bold ${isTodayDate ? "text-primary" : ""}`}>
                          {getShortDayName(date)}
                        </div>
                        <div className="text-xs text-muted-foreground font-normal mt-1">
                          {format(date, "MMM d")}
                        </div>
                        {isTodayDate && (
                          <Badge variant="default" className="text-[10px] mt-2 h-5">
                            Today
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="p-4 pt-2 space-y-2">
                      {/* Classes count badge */}
                      {dayClasses.length > 0 && (
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <Badge
                            variant="secondary"
                            className="text-xs h-6"
                          >
                            {dayClasses.length} {dayClasses.length === 1 ? "class" : "classes"}
                          </Badge>
                          {totalMarked > 0 && (
                            <Badge
                              variant={attendedClasses === totalMarked ? "default" : "outline"}
                              className="text-xs h-6"
                            >
                              {attendedClasses}/{totalMarked}
                            </Badge>
                          )}
                        </div>
                      )}

                      {dayClasses.length === 0 ? (
                        <div className="text-center py-6">
                          <div className="text-4xl mb-2 opacity-30">☀️</div>
                          <p className="text-xs text-muted-foreground">Free day</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {dayClasses.slice(0, 3).map((cls) => {
                            const attendance = allAttendance?.find(
                              (a) => a.classId === cls._id && a.date === dateStr
                            );
                            const subject = subjects?.find(s => s._id === cls.subjectId);

                            return (
                              <motion.div
                                key={cls._id}
                                whileHover={{ scale: 1.02 }}
                                className="relative"
                              >
                                <div
                                  className="p-2.5 rounded-lg border-l-3 shadow-sm transition-shadow hover:shadow-md"
                                  style={{
                                    borderLeftWidth: "3px",
                                    borderLeftColor: subject?.color || "#8b5cf6",
                                    backgroundColor: attendance?.status === "present"
                                      ? "rgba(34, 197, 94, 0.05)"
                                      : attendance?.status === "absent"
                                      ? "rgba(239, 68, 68, 0.05)"
                                      : "#fafafa"
                                  }}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <div className="font-semibold text-xs truncate mb-1">
                                        {cls.subject?.name || "Unknown"}
                                      </div>
                                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                        <Clock size={10} />
                                        <span>{convertTo12Hour(cls.startTime)}</span>
                                      </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                      <Badge
                                        variant="outline"
                                        className="text-[9px] h-4 px-1.5 border-none"
                                        style={{
                                          backgroundColor: subject?.color + "20",
                                          color: subject?.color
                                        }}
                                      >
                                        {cls.type}
                                      </Badge>
                                      {attendance && (
                                        <div className="flex items-center">
                                          {attendance.status === "present" ? (
                                            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                                              <Check size={12} className="text-green-600" />
                                            </div>
                                          ) : (
                                            <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                                              <X size={12} className="text-red-600" />
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                          {dayClasses.length > 3 && (
                            <div className="text-center">
                              <Badge variant="secondary" className="text-[10px] h-5">
                                +{dayClasses.length - 3} more
                              </Badge>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
          )}
        </section>

        {/* Smart Suggestions */}
        {(subjectsNeedingAttention.length > 0 || subjectsMayNotReach.length > 0) && (
          <section>
            <h2 className="text-2xl font-semibold mb-4">Smart Suggestions</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {subjectsNeedingAttention.length > 0 && (
                <Card className="border-l-4 border-l-yellow-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-yellow-700">
                      <AlertTriangle size={20} />
                      Subjects Needing Attention
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {subjectsNeedingAttention.map((stat) => (
                      <div
                        key={stat.subject._id}
                        className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg"
                      >
                        <span className="font-medium">{stat.subject.name}</span>
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-700">
                          {Math.round(stat.percentage)}%
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {subjectsMayNotReach.length > 0 && (
                <Card className="border-l-4 border-l-red-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-700">
                      <TrendingUp size={20} />
                      May Not Reach Target
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {subjectsMayNotReach.map((stat) => (
                      <div key={stat.subject._id} className="p-3 bg-red-50 rounded-lg space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{stat.subject.name}</span>
                          <Badge variant="destructive">
                            {Math.round(stat.prediction.predicted)}%
                          </Badge>
                        </div>
                        <p className="text-sm text-red-600">
                          Predicted: {Math.round(stat.prediction.predicted)}% (Target:{" "}
                          {stat.subject.targetAttendance}%)
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </section>
        )}

        {/* Your Subjects */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Your Subjects</h2>
            <Button
              size="sm"
              className="bg-gradient-to-r from-[oklch(var(--gradient-2))] to-[oklch(var(--gradient-3))]"
            >
              <Plus size={16} className="mr-1" />
              Add Subject
            </Button>
          </div>

          {subjectStats.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground mb-4">No subjects added yet</p>
                <Button>Add Your First Subject</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {subjectStats.map((stat, index) => (
                <motion.div
                  key={stat.subject._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className={`hover-lift border-l-4 transition-all ${stat.percentage < stat.subject.targetAttendance ? "shake-warning" : ""}`}
                    style={{ borderLeftColor: stat.subject.color }}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{stat.subject.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{stat.subject.code}</p>
                        </div>
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: stat.subject.color }}
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Progress Ring */}
                      <div className="flex justify-center">
                        <ProgressRing
                          percentage={stat.percentage}
                          targetPercentage={stat.subject.targetAttendance}
                          size={100}
                          strokeWidth={8}
                          color={stat.percentage >= stat.subject.targetAttendance ? stat.subject.color : undefined}
                        />
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {stat.present} / {stat.total} classes
                          </span>
                          <span className="font-medium">
                            Target: {stat.subject.targetAttendance}%
                          </span>
                        </div>
                        <Progress
                          value={stat.percentage}
                          className="h-2"
                        />
                      </div>

                      {/* Prediction */}
                      <div className="text-sm text-center p-2 bg-muted rounded-lg">
                        <p className="text-muted-foreground">If you maintain pace:</p>
                        <p
                          className={`font-medium text-xl ${stat.prediction.willReach ? "text-green-600" : "text-red-600"}`}
                        >
                          <AnimatedCounter value={stat.prediction.predicted} decimals={0} suffix="%" />
                        </p>
                      </div>

                      {/* Alert */}
                      {stat.classesNeeded > 0 && (
                        <div className="text-sm p-2 bg-red-50 text-red-700 rounded-lg text-center">
                          Attend {stat.classesNeeded} more{" "}
                          {stat.classesNeeded === 1 ? "class" : "classes"}
                        </div>
                      )}

                      {/* Streak */}
                      {stat.streak > 0 && (
                        <div className="flex items-center justify-center gap-2 text-sm p-2 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg">
                          <Flame className="text-orange-500" size={16} />
                          <span className="font-medium text-orange-700">
                            {stat.streak} day streak!
                          </span>
                        </div>
                      )}

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-red-600">
                            <AnimatedCounter value={stat.absent} decimals={0} />
                          </p>
                          <p className="text-xs text-muted-foreground">Absent</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold">
                            <AnimatedCounter value={stat.total} decimals={0} />
                          </p>
                          <p className="text-xs text-muted-foreground">Total</p>
                        </div>
                      </div>

                      {/* Separate Lecture/Lab Stats */}
                      {(stat.lecture.total > 0 || stat.lab.total > 0) && (
                        <div className="space-y-2 pt-2 border-t">
                          <p className="text-xs font-medium text-muted-foreground">By Class Type:</p>
                          {stat.lecture.total > 0 && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Lectures</span>
                              <Badge variant={stat.lecture.percentage >= stat.subject.targetAttendance ? "default" : "destructive"}>
                                {stat.lecture.present}/{stat.lecture.total} ({Math.round(stat.lecture.percentage)}%)
                              </Badge>
                            </div>
                          )}
                          {stat.lab.total > 0 && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Labs</span>
                              <Badge variant={stat.lab.percentage >= stat.subject.targetAttendance ? "default" : "destructive"}>
                                {stat.lab.present}/{stat.lab.total} ({Math.round(stat.lab.percentage)}%)
                              </Badge>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Recent Attendance */}
                      <Collapsible
                        open={expandedSubjects.has(stat.subject._id)}
                        onOpenChange={() => toggleSubjectExpansion(stat.subject._id)}
                      >
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="w-full">
                            Recent Attendance
                            <ChevronDown
                              size={16}
                              className={`ml-2 transition-transform ${expandedSubjects.has(stat.subject._id) ? "rotate-180" : ""}`}
                            />
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2 space-y-1">
                          {allAttendance
                            ?.filter((a) => a.subjectId === stat.subject._id)
                            .sort((a, b) => b.date.localeCompare(a.date))
                            .slice(0, 5)
                            .map((record) => (
                              <div
                                key={record._id}
                                className="flex items-center justify-between text-xs p-2 bg-muted rounded"
                              >
                                <span>{format(parseISO(record.date), "MMM d, yyyy")}</span>
                                {record.status === "present" ? (
                                  <Check size={14} className="text-green-600" />
                                ) : (
                                  <X size={14} className="text-red-600" />
                                )}
                              </div>
                            ))}
                        </CollapsibleContent>
                      </Collapsible>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </div>
      <QuickActionsButton />
      <ClassReminders />
      </AppLayout>
    </PageTransition>
  );
}
