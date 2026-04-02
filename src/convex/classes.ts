import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function buildScheduleForDate(ctx: any, date: string) {
  const holiday = await ctx.db
    .query("holidays")
    .withIndex("by_date", (q: any) => q.eq("date", date))
    .first();

  if (holiday) {
    return {
      isHoliday: true,
      holidayName: holiday.name,
      classes: [],
    };
  }

  const dateObj = new Date(date + "T00:00:00");
  const dayOfWeek = dateObj.getDay();
  const weekOfMonth = getWeekOfMonth(dateObj);

  const regularClasses = await ctx.db
    .query("classes")
    .withIndex("by_day", (q: any) => q.eq("dayOfWeek", dayOfWeek))
    .collect();

  const filteredClasses = regularClasses.filter((cls: any) => {
    if (!cls.weekPattern || cls.weekPattern.length === 0) {
      return true;
    }
    return cls.weekPattern.includes(weekOfMonth);
  });

  const exceptions = await ctx.db
    .query("classExceptions")
    .withIndex("by_date", (q: any) => q.eq("date", date))
    .collect();

  const subjects = await ctx.db.query("subjects").collect();
  const subjectMap = new Map(subjects.map((s: any) => [s._id, s]));

  const cancelledClassIds = new Set(
    exceptions
      .filter((e: any) => e.type === "cancelled" && e.classId)
      .map((e: any) => e.classId)
  );

  const activeRegularClasses = filteredClasses
    .filter((cls: any) => !cancelledClassIds.has(cls._id))
    .map((cls: any) => ({
      ...cls,
      subject: subjectMap.get(cls.subjectId),
      isException: false,
      exceptionId: undefined,
    }));

  const addedClasses = exceptions
    .filter((e: any) => e.type === "added")
    .map((e: any) => ({
      _id: e._id,
      subjectId: e.subjectId,
      dayOfWeek,
      startTime: e.startTime || "09:00",
      endTime: e.endTime || "10:00",
      type: e.classType || "LECTURE",
      subject: subjectMap.get(e.subjectId),
      isException: true,
      exceptionId: e._id,
      exceptionReason: e.reason,
    }));

  const allClasses = [...activeRegularClasses, ...addedClasses].sort((a, b) =>
    a.startTime.localeCompare(b.startTime)
  );

  return {
    isHoliday: false,
    classes: allClasses,
    weekOfMonth,
  };
}

// Get all classes
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("classes").collect();
  },
});

// Get classes by day of week
export const getByDay = query({
  args: { dayOfWeek: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("classes")
      .withIndex("by_day", (q) => q.eq("dayOfWeek", args.dayOfWeek))
      .collect();
  },
});

// Get classes by subject
export const getBySubject = query({
  args: { subjectId: v.id("subjects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("classes")
      .withIndex("by_subject", (q) => q.eq("subjectId", args.subjectId))
      .collect();
  },
});

// Create a new class
export const create = mutation({
  args: {
    subjectId: v.id("subjects"),
    dayOfWeek: v.number(),
    startTime: v.string(),
    endTime: v.string(),
    type: v.string(),
    room: v.optional(v.string()),
    weekPattern: v.optional(v.array(v.number())),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("classes", {
      subjectId: args.subjectId,
      dayOfWeek: args.dayOfWeek,
      startTime: args.startTime,
      endTime: args.endTime,
      type: args.type,
      room: args.room,
      weekPattern: args.weekPattern,
    });
  },
});

// Update a class
export const update = mutation({
  args: {
    id: v.id("classes"),
    subjectId: v.optional(v.id("subjects")),
    dayOfWeek: v.optional(v.number()),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    type: v.optional(v.string()),
    room: v.optional(v.string()),
    weekPattern: v.optional(v.array(v.number())),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

// Delete a class
export const remove = mutation({
  args: { id: v.id("classes") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Get weekly schedule with subject details
export const getWeeklySchedule = query({
  args: {},
  handler: async (ctx) => {
    const classes = await ctx.db.query("classes").collect();
    const subjects = await ctx.db.query("subjects").collect();

    const subjectMap = new Map(subjects.map((s) => [s._id, s]));

    const schedule = classes.map((cls) => ({
      ...cls,
      subject: subjectMap.get(cls.subjectId),
    }));

    // Group by day of week
    const weeklySchedule: Record<number, typeof schedule> = {};
    for (let i = 0; i <= 6; i++) {
      weeklySchedule[i] = schedule
        .filter((s) => s.dayOfWeek === i)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
    }

    return weeklySchedule;
  },
});

// Helper function to get week number of month (1-4)
function getWeekOfMonth(date: Date): number {
  const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const dayOfMonth = date.getDate();
  const firstDayWeekday = firstDayOfMonth.getDay();

  // Calculate which week of the month this date falls in
  const weekNumber = Math.ceil((dayOfMonth + firstDayWeekday) / 7);
  return Math.min(weekNumber, 4); // Cap at week 4
}

// Get schedule for a specific date, considering holidays, exceptions, and week patterns
export const getScheduleForDate = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    return buildScheduleForDate(ctx, args.date);
  },
});

export const getScheduleForDateRange = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const schedules: Record<string, Awaited<ReturnType<typeof buildScheduleForDate>>> = {};
    const currentDate = new Date(args.startDate + "T00:00:00");
    const endDate = new Date(args.endDate + "T00:00:00");

    while (currentDate <= endDate) {
      const dateString = formatLocalDate(currentDate);
      schedules[dateString] = await buildScheduleForDate(ctx, dateString);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return schedules;
  },
});
