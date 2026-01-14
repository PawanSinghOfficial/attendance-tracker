import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all attendance records
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("attendance").collect();
  },
});

// Get attendance by subject
export const getBySubject = query({
  args: { subjectId: v.id("subjects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("attendance")
      .withIndex("by_subject", (q) => q.eq("subjectId", args.subjectId))
      .collect();
  },
});

// Get attendance by date
export const getByDate = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("attendance")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .collect();
  },
});

// Check if attendance exists for subject on a specific date
export const checkExists = query({
  args: {
    subjectId: v.id("subjects"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query("attendance")
      .withIndex("by_subject_and_date", (q) =>
        q.eq("subjectId", args.subjectId).eq("date", args.date)
      )
      .first();
    return record;
  },
});

// Mark attendance
export const mark = mutation({
  args: {
    subjectId: v.id("subjects"),
    classId: v.optional(v.id("classes")),
    date: v.string(),
    status: v.union(v.literal("present"), v.literal("absent")),
  },
  handler: async (ctx, args) => {
    // Check if attendance already exists for this subject on this date
    const existing = await ctx.db
      .query("attendance")
      .withIndex("by_subject_and_date", (q) =>
        q.eq("subjectId", args.subjectId).eq("date", args.date)
      )
      .first();

    if (existing) {
      // Update existing record
      await ctx.db.patch(existing._id, {
        status: args.status,
        timestamp: Date.now(),
        classId: args.classId,
      });
      return existing._id;
    } else {
      // Create new record
      return await ctx.db.insert("attendance", {
        subjectId: args.subjectId,
        classId: args.classId,
        date: args.date,
        status: args.status,
        timestamp: Date.now(),
      });
    }
  },
});

// Delete attendance record
export const remove = mutation({
  args: { id: v.id("attendance") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Get overall attendance statistics
export const getOverallStats = query({
  args: {},
  handler: async (ctx) => {
    const allAttendance = await ctx.db.query("attendance").collect();
    const present = allAttendance.filter((r) => r.status === "present").length;
    const absent = allAttendance.filter((r) => r.status === "absent").length;
    const total = present + absent;
    const percentage = total > 0 ? (present / total) * 100 : 0;

    return {
      present,
      absent,
      total,
      percentage,
    };
  },
});

// Get attendance for a date range
export const getByDateRange = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const allAttendance = await ctx.db.query("attendance").collect();

    return allAttendance.filter(
      (record) => record.date >= args.startDate && record.date <= args.endDate
    );
  },
});
