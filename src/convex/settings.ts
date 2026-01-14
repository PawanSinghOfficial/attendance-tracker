import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get settings (returns first settings record or null if not initialized)
export const get = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("settings").first();

    // If no settings exist, return a default object so the UI can still render
    if (!settings) {
      return {
        _id: "" as any,
        _creationTime: Date.now(),
        semesterStartDate: undefined,
        semesterEndDate: undefined,
        defaultTargetAttendance: 75,
        preClassPrompts: true,
        promptOffsetMinutes: 10,
        browserNotifications: true,
        notificationSound: true,
      };
    }

    return settings;
  },
});

// Initialize default settings
export const initialize = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("settings").first();
    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("settings", {
      defaultTargetAttendance: 75,
      preClassPrompts: true,
      promptOffsetMinutes: 10,
      browserNotifications: true,
      notificationSound: true,
    });
  },
});

// Update settings
export const update = mutation({
  args: {
    semesterStartDate: v.optional(v.string()),
    semesterEndDate: v.optional(v.string()),
    defaultTargetAttendance: v.optional(v.number()),
    preClassPrompts: v.optional(v.boolean()),
    promptOffsetMinutes: v.optional(v.number()),
    browserNotifications: v.optional(v.boolean()),
    notificationSound: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const settings = await ctx.db.query("settings").first();

    if (!settings) {
      // Create new settings if none exist
      return await ctx.db.insert("settings", {
        semesterStartDate: args.semesterStartDate,
        semesterEndDate: args.semesterEndDate,
        defaultTargetAttendance: args.defaultTargetAttendance ?? 75,
        preClassPrompts: args.preClassPrompts ?? true,
        promptOffsetMinutes: args.promptOffsetMinutes ?? 10,
        browserNotifications: args.browserNotifications ?? true,
        notificationSound: args.notificationSound ?? true,
      });
    }

    // Update existing settings
    const updates: Record<string, string | number | boolean | undefined> = {};
    Object.entries(args).forEach(([key, value]) => {
      if (value !== undefined) {
        updates[key] = value;
      }
    });

    await ctx.db.patch(settings._id, updates);
    return settings._id;
  },
});
