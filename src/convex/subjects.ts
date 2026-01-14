import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all subjects
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("subjects").collect();
  },
});

// Get a single subject by ID
export const get = query({
  args: { id: v.id("subjects") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Create a new subject
export const create = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    targetAttendance: v.number(),
    color: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("subjects", {
      name: args.name,
      code: args.code,
      targetAttendance: args.targetAttendance,
      color: args.color,
    });
  },
});

// Update a subject
export const update = mutation({
  args: {
    id: v.id("subjects"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    targetAttendance: v.optional(v.number()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

// Delete a subject
export const remove = mutation({
  args: { id: v.id("subjects") },
  handler: async (ctx, args) => {
    // Delete all related classes
    const classes = await ctx.db
      .query("classes")
      .withIndex("by_subject", (q) => q.eq("subjectId", args.id))
      .collect();
    for (const cls of classes) {
      await ctx.db.delete(cls._id);
    }

    // Delete all related attendance records
    const attendance = await ctx.db
      .query("attendance")
      .withIndex("by_subject", (q) => q.eq("subjectId", args.id))
      .collect();
    for (const record of attendance) {
      await ctx.db.delete(record._id);
    }

    // Delete the subject
    await ctx.db.delete(args.id);
  },
});

// Get subject statistics
export const getStats = query({
  args: { id: v.id("subjects") },
  handler: async (ctx, args) => {
    const subject = await ctx.db.get(args.id);
    if (!subject) return null;

    const attendanceRecords = await ctx.db
      .query("attendance")
      .withIndex("by_subject", (q) => q.eq("subjectId", args.id))
      .collect();

    const present = attendanceRecords.filter((r) => r.status === "present").length;
    const absent = attendanceRecords.filter((r) => r.status === "absent").length;
    const total = present + absent;
    const percentage = total > 0 ? (present / total) * 100 : 0;

    return {
      subject,
      present,
      absent,
      total,
      percentage,
      targetAttendance: subject.targetAttendance,
    };
  },
});
