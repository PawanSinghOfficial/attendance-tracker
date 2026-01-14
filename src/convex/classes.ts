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
