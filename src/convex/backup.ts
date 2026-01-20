import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Export all user data as JSON
export const exportUserData = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    // Get user info if authenticated
    let userInfo = null;
    if (identity) {
      const user = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", identity.email))
        .unique();

      if (user) {
        userInfo = {
          name: user.name,
          email: user.email,
          emoji: user.emoji,
          branch: user.branch,
          year: user.year,
          role: user.role,
        };
      }
    }

    // Get all subjects
    const subjects = await ctx.db.query("subjects").collect();

    // Get all classes
    const classes = await ctx.db.query("classes").collect();

    // Get all attendance records
    const attendance = await ctx.db.query("attendance").collect();

    // Get holidays
    const holidays = await ctx.db.query("holidays").collect();

    // Get class exceptions
    const classExceptions = await ctx.db.query("classExceptions").collect();

    // Get settings
    const settings = await ctx.db.query("settings").first();

    return {
      exportDate: new Date().toISOString(),
      user: userInfo,
      subjects,
      classes,
      attendance,
      holidays,
      classExceptions,
      settings,
    };
  },
});

// Import user data from backup
export const importUserData = mutation({
  args: {
    data: v.string(), // JSON string of backup data
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Parse backup data
    const backup = JSON.parse(args.data);

    // Get current user
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Update user profile if backup has data
    if (backup.user) {
      await ctx.db.patch(user._id, {
        name: backup.user.name,
        emoji: backup.user.emoji,
        branch: backup.user.branch,
        year: backup.user.year,
      });
    }

    // Import subjects
    const subjectIdMap = new Map<string, Id<"subjects">>();
    if (backup.subjects && Array.isArray(backup.subjects)) {
      for (const subject of backup.subjects) {
        const newSubjectId = await ctx.db.insert("subjects", {
          name: subject.name,
          code: subject.code,
          targetAttendance: subject.targetAttendance,
          color: subject.color,
        });
        subjectIdMap.set(subject._id, newSubjectId);
      }
    }

    // Import classes (with updated subject IDs)
    const classIdMap = new Map<string, Id<"classes">>();
    if (backup.classes && Array.isArray(backup.classes)) {
      for (const classItem of backup.classes) {
        const newSubjectId = subjectIdMap.get(classItem.subjectId);
        if (newSubjectId) {
          const newClassId = await ctx.db.insert("classes", {
            subjectId: newSubjectId,
            dayOfWeek: classItem.dayOfWeek,
            startTime: classItem.startTime,
            endTime: classItem.endTime,
            type: classItem.type,
            room: classItem.room,
            weekPattern: classItem.weekPattern,
          });
          classIdMap.set(classItem._id, newClassId);
        }
      }
    }

    // Import attendance records (with updated subject IDs)
    if (backup.attendance && Array.isArray(backup.attendance)) {
      for (const record of backup.attendance) {
        const newSubjectId = subjectIdMap.get(record.subjectId);
        const newClassId = record.classId ? classIdMap.get(record.classId) : undefined;

        if (newSubjectId) {
          await ctx.db.insert("attendance", {
            subjectId: newSubjectId,
            classId: newClassId,
            date: record.date,
            status: record.status,
            timestamp: record.timestamp,
            note: record.note,
          });
        }
      }
    }

    // Import holidays
    if (backup.holidays && Array.isArray(backup.holidays)) {
      for (const holiday of backup.holidays) {
        await ctx.db.insert("holidays", {
          name: holiday.name,
          date: holiday.date,
        });
      }
    }

    // Import class exceptions (with updated subject and class IDs)
    if (backup.classExceptions && Array.isArray(backup.classExceptions)) {
      for (const exception of backup.classExceptions) {
        const newSubjectId = subjectIdMap.get(exception.subjectId);
        const newClassId = exception.classId ? classIdMap.get(exception.classId) : undefined;

        if (newSubjectId) {
          await ctx.db.insert("classExceptions", {
            date: exception.date,
            type: exception.type,
            subjectId: newSubjectId,
            classId: newClassId || undefined,
            startTime: exception.startTime,
            endTime: exception.endTime,
            classType: exception.classType,
            reason: exception.reason,
          });
        }
      }
    }

    // Import settings
    if (backup.settings) {
      // Check if settings already exist
      const existingSettings = await ctx.db.query("settings").first();

      if (existingSettings) {
        await ctx.db.patch(existingSettings._id, {
          semesterStartDate: backup.settings.semesterStartDate,
          semesterEndDate: backup.settings.semesterEndDate,
          defaultTargetAttendance: backup.settings.defaultTargetAttendance,
          preClassPrompts: backup.settings.preClassPrompts,
          promptOffsetMinutes: backup.settings.promptOffsetMinutes,
          browserNotifications: backup.settings.browserNotifications,
          notificationSound: backup.settings.notificationSound,
        });
      } else {
        await ctx.db.insert("settings", {
          semesterStartDate: backup.settings.semesterStartDate,
          semesterEndDate: backup.settings.semesterEndDate,
          defaultTargetAttendance: backup.settings.defaultTargetAttendance,
          preClassPrompts: backup.settings.preClassPrompts,
          promptOffsetMinutes: backup.settings.promptOffsetMinutes,
          browserNotifications: backup.settings.browserNotifications,
          notificationSound: backup.settings.notificationSound,
        });
      }
    }

    return { success: true, message: "Data imported successfully" };
  },
});

// Delete all user data (for testing or fresh start)
export const deleteAllUserData = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Delete all subjects (this will cascade conceptually)
    const subjects = await ctx.db.query("subjects").collect();
    for (const subject of subjects) {
      await ctx.db.delete(subject._id);
    }

    // Delete all classes
    const classes = await ctx.db.query("classes").collect();
    for (const classItem of classes) {
      await ctx.db.delete(classItem._id);
    }

    // Delete all attendance
    const attendance = await ctx.db.query("attendance").collect();
    for (const record of attendance) {
      await ctx.db.delete(record._id);
    }

    // Delete all holidays
    const holidays = await ctx.db.query("holidays").collect();
    for (const holiday of holidays) {
      await ctx.db.delete(holiday._id);
    }

    // Delete all class exceptions
    const classExceptions = await ctx.db.query("classExceptions").collect();
    for (const exception of classExceptions) {
      await ctx.db.delete(exception._id);
    }

    return { success: true, message: "All data deleted successfully" };
  },
});
