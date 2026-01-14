import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("classes", {
      subjectId: args.subjectId,
      dayOfWeek: args.dayOfWeek,
      startTime: args.startTime,
      endTime: args.endTime,
      type: args.type,
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

// Get schedule for a specific date, considering holidays and exceptions
export const getScheduleForDate = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    // Check if it's a holiday
    const holiday = await ctx.db
      .query("holidays")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .first();

    if (holiday) {
      return {
        isHoliday: true,
        holidayName: holiday.name,
        classes: [],
      };
    }

    // Get day of week from date
    const dateObj = new Date(args.date + "T00:00:00");
    const dayOfWeek = dateObj.getDay();

    // Get regular classes for this day
    const regularClasses = await ctx.db
      .query("classes")
      .withIndex("by_day", (q) => q.eq("dayOfWeek", dayOfWeek))
      .collect();

    // Get exceptions for this date
    const exceptions = await ctx.db
      .query("classExceptions")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .collect();

    // Get subjects
    const subjects = await ctx.db.query("subjects").collect();
    const subjectMap = new Map(subjects.map((s) => [s._id, s]));

    // Filter out cancelled classes
    const cancelledClassIds = new Set(
      exceptions
        .filter((e) => e.type === "cancelled" && e.classId)
        .map((e) => e.classId)
    );

    const activeRegularClasses = regularClasses
      .filter((cls) => !cancelledClassIds.has(cls._id))
      .map((cls) => ({
        ...cls,
        subject: subjectMap.get(cls.subjectId),
        isException: false,
      }));

    // Add extra classes
    const addedClasses = exceptions
      .filter((e) => e.type === "added")
      .map((e) => ({
        _id: e._id,
        subjectId: e.subjectId,
        dayOfWeek,
        startTime: e.startTime || "09:00",
        endTime: e.endTime || "10:00",
        type: e.classType || "LECTURE",
        subject: subjectMap.get(e.subjectId),
        isException: true,
        exceptionReason: e.reason,
      }));

    const allClasses = [...activeRegularClasses, ...addedClasses].sort(
      (a, b) => a.startTime.localeCompare(b.startTime)
    );

    return {
      isHoliday: false,
      classes: allClasses,
    };
  },
});
