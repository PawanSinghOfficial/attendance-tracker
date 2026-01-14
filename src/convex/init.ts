import { mutation } from "./_generated/server";
import { format, subDays, addDays } from "date-fns";

// Initialize app with test data
export const initializeTestData = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if data already exists
    const existingSubjects = await ctx.db.query("subjects").take(1);
    if (existingSubjects.length > 0) {
      return { message: "Data already exists" };
    }

    // Initialize settings
    const settingsId = await ctx.db.insert("settings", {
      semesterStartDate: format(subDays(new Date(), 30), "yyyy-MM-dd"),
      semesterEndDate: format(addDays(new Date(), 60), "yyyy-MM-dd"),
      defaultTargetAttendance: 75,
      preClassPrompts: true,
      promptOffsetMinutes: 10,
      browserNotifications: true,
      notificationSound: true,
    });

    // Create sample subjects
    const mathId = await ctx.db.insert("subjects", {
      name: "Mathematics",
      code: "MATH101",
      targetAttendance: 75,
      color: "#8b5cf6",
    });

    const physicsId = await ctx.db.insert("subjects", {
      name: "Physics",
      code: "PHY102",
      targetAttendance: 80,
      color: "#3b82f6",
    });

    const chemistryId = await ctx.db.insert("subjects", {
      name: "Chemistry",
      code: "CHEM103",
      targetAttendance: 75,
      color: "#10b981",
    });

    const csId = await ctx.db.insert("subjects", {
      name: "Computer Science",
      code: "CS104",
      targetAttendance: 85,
      color: "#f59e0b",
    });

    // Create sample classes
    // Monday classes
    const mathMonId = await ctx.db.insert("classes", {
      subjectId: mathId,
      dayOfWeek: 1,
      startTime: "09:00",
      endTime: "10:00",
      type: "LECTURE",
    });

    const physMonId = await ctx.db.insert("classes", {
      subjectId: physicsId,
      dayOfWeek: 1,
      startTime: "11:00",
      endTime: "12:00",
      type: "LECTURE",
    });

    // Tuesday classes
    const chemTueId = await ctx.db.insert("classes", {
      subjectId: chemistryId,
      dayOfWeek: 2,
      startTime: "10:00",
      endTime: "11:00",
      type: "LECTURE",
    });

    const csTueId = await ctx.db.insert("classes", {
      subjectId: csId,
      dayOfWeek: 2,
      startTime: "14:00",
      endTime: "15:00",
      type: "LAB",
    });

    // Wednesday classes
    const mathWedId = await ctx.db.insert("classes", {
      subjectId: mathId,
      dayOfWeek: 3,
      startTime: "09:00",
      endTime: "10:00",
      type: "LECTURE",
    });

    const physWedId = await ctx.db.insert("classes", {
      subjectId: physicsId,
      dayOfWeek: 3,
      startTime: "11:00",
      endTime: "12:00",
      type: "LAB",
    });

    // Thursday classes
    const chemThuId = await ctx.db.insert("classes", {
      subjectId: chemistryId,
      dayOfWeek: 4,
      startTime: "10:00",
      endTime: "11:00",
      type: "LECTURE",
    });

    const csThuId = await ctx.db.insert("classes", {
      subjectId: csId,
      dayOfWeek: 4,
      startTime: "14:00",
      endTime: "15:00",
      type: "LECTURE",
    });

    // Friday classes
    const mathFriId = await ctx.db.insert("classes", {
      subjectId: mathId,
      dayOfWeek: 5,
      startTime: "09:00",
      endTime: "10:00",
      type: "TUTORIAL",
    });

    // Create sample attendance records (past 2 weeks)
    const today = new Date();

    // Math attendance - good attendance (80%)
    for (let i = 14; i > 0; i--) {
      const date = format(subDays(today, i), "yyyy-MM-dd");
      const dayOfWeek = subDays(today, i).getDay();

      if (dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5) {
        const status = Math.random() > 0.2 ? "present" : "absent";
        await ctx.db.insert("attendance", {
          subjectId: mathId,
          date,
          status: status as "present" | "absent",
          timestamp: Date.now(),
        });
      }
    }

    // Physics attendance - perfect attendance (100%)
    for (let i = 14; i > 0; i--) {
      const date = format(subDays(today, i), "yyyy-MM-dd");
      const dayOfWeek = subDays(today, i).getDay();

      if (dayOfWeek === 1 || dayOfWeek === 3) {
        await ctx.db.insert("attendance", {
          subjectId: physicsId,
          date,
          status: "present",
          timestamp: Date.now(),
        });
      }
    }

    // Chemistry attendance - below target (60%)
    for (let i = 14; i > 0; i--) {
      const date = format(subDays(today, i), "yyyy-MM-dd");
      const dayOfWeek = subDays(today, i).getDay();

      if (dayOfWeek === 2 || dayOfWeek === 4) {
        const status = Math.random() > 0.4 ? "present" : "absent";
        await ctx.db.insert("attendance", {
          subjectId: chemistryId,
          date,
          status: status as "present" | "absent",
          timestamp: Date.now(),
        });
      }
    }

    // CS attendance - good attendance (85%)
    for (let i = 14; i > 0; i--) {
      const date = format(subDays(today, i), "yyyy-MM-dd");
      const dayOfWeek = subDays(today, i).getDay();

      if (dayOfWeek === 2 || dayOfWeek === 4) {
        const status = Math.random() > 0.15 ? "present" : "absent";
        await ctx.db.insert("attendance", {
          subjectId: csId,
          date,
          status: status as "present" | "absent",
          timestamp: Date.now(),
        });
      }
    }

    // Add sample holidays
    await ctx.db.insert("holidays", {
      name: "Christmas",
      date: "2026-12-25",
    });

    await ctx.db.insert("holidays", {
      name: "New Year",
      date: "2027-01-01",
    });

    return {
      message: "Test data initialized successfully",
      subjects: 4,
      classes: 9,
      settings: 1,
      holidays: 2,
    };
  },
});
