import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all holidays
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("holidays").collect();
  },
});

// Check if a date is a holiday
export const isHoliday = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    const holiday = await ctx.db
      .query("holidays")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .first();
    return holiday !== null;
  },
});

// Create a new holiday
export const create = mutation({
  args: {
    name: v.string(),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("holidays", {
      name: args.name,
      date: args.date,
    });
  },
});

// Delete a holiday
export const remove = mutation({
  args: { id: v.id("holidays") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
