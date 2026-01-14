import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// List all class exceptions
export const list = query({
  args: {},
  handler: async (ctx) => {
    const exceptions = await ctx.db.query("classExceptions").collect();
    return exceptions.sort((a, b) => a.date.localeCompare(b.date));
  },
});

// Get exceptions for a specific date
export const getByDate = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    const exceptions = await ctx.db
      .query("classExceptions")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .collect();

    // Fetch subject details for each exception
    const exceptionsWithSubjects = await Promise.all(
      exceptions.map(async (exception) => {
        const subject = await ctx.db.get(exception.subjectId);
        return { ...exception, subject };
      })
    );

    return exceptionsWithSubjects;
  },
});

// Add a class on a specific date (extra class)
export const addClass = mutation({
  args: {
    date: v.string(),
    subjectId: v.id("subjects"),
    startTime: v.string(),
    endTime: v.string(),
    classType: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const exceptionId = await ctx.db.insert("classExceptions", {
      date: args.date,
      type: "added",
      subjectId: args.subjectId,
      startTime: args.startTime,
      endTime: args.endTime,
      classType: args.classType,
      reason: args.reason,
    });

    return exceptionId;
  },
});

// Cancel a regular class on a specific date
export const cancelClass = mutation({
  args: {
    date: v.string(),
    subjectId: v.id("subjects"),
    classId: v.id("classes"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if this class is already cancelled
    const existing = await ctx.db
      .query("classExceptions")
      .withIndex("by_subject_and_date", (q) =>
        q.eq("subjectId", args.subjectId).eq("date", args.date)
      )
      .filter((q) =>
        q.and(
          q.eq(q.field("classId"), args.classId),
          q.eq(q.field("type"), "cancelled")
        )
      )
      .first();

    if (existing) {
      throw new Error("This class is already cancelled for this date");
    }

    const exceptionId = await ctx.db.insert("classExceptions", {
      date: args.date,
      type: "cancelled",
      subjectId: args.subjectId,
      classId: args.classId,
      reason: args.reason,
    });

    return exceptionId;
  },
});

// Remove an exception (undo cancellation or remove added class)
export const remove = mutation({
  args: { id: v.id("classExceptions") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Get exceptions for a date range
export const getByDateRange = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const allExceptions = await ctx.db.query("classExceptions").collect();
    const filtered = allExceptions.filter(
      (e) => e.date >= args.startDate && e.date <= args.endDate
    );

    // Fetch subject details for each exception
    const exceptionsWithSubjects = await Promise.all(
      filtered.map(async (exception) => {
        const subject = await ctx.db.get(exception.subjectId);
        return { ...exception, subject };
      })
    );

    return exceptionsWithSubjects;
  },
});
