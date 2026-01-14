import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all attendance records (filtered by semester dates if set)
export const list = query({
  args: {},
  handler: async (ctx) => {
    const allAttendance = await ctx.db.query("attendance").collect();

    // Get semester settings
    const settings = await ctx.db.query("settings").first();

    // If semester dates are not set, return all attendance
    if (!settings?.semesterStartDate || !settings?.semesterEndDate) {
      return allAttendance;
    }

    // Filter by semester dates
    return allAttendance.filter(
      (record) =>
        record.date >= settings.semesterStartDate! &&
        record.date <= settings.semesterEndDate!
    );
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
    note: v.optional(v.string()),
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
        note: args.note,
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
        note: args.note,
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

// Reset all attendance records
export const resetAll = mutation({
  args: {},
  handler: async (ctx) => {
    const allAttendance = await ctx.db.query("attendance").collect();
    for (const record of allAttendance) {
      await ctx.db.delete(record._id);
    }
  },
});

// Get overall attendance statistics (filtered by semester dates if set)
export const getOverallStats = query({
  args: {},
  handler: async (ctx) => {
    const allAttendance = await ctx.db.query("attendance").collect();

    // Get semester settings
    const settings = await ctx.db.query("settings").first();

    // Filter by semester dates if set
    let filteredAttendance = allAttendance;
    if (settings?.semesterStartDate && settings?.semesterEndDate) {
      filteredAttendance = allAttendance.filter(
        (record) =>
          record.date >= settings.semesterStartDate! &&
          record.date <= settings.semesterEndDate!
      );
    }

    const present = filteredAttendance.filter((r) => r.status === "present").length;
    const absent = filteredAttendance.filter((r) => r.status === "absent").length;
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
