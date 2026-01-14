import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove
    }).index("email", ["email"]), // index for the email. do not remove or modify

    // add other tables here

    // Subjects table
    subjects: defineTable({
      name: v.string(), // Subject name (e.g., "Mathematics")
      code: v.string(), // Subject code (e.g., "MATH101")
      targetAttendance: v.number(), // Target attendance percentage (e.g., 75)
      color: v.string(), // Color for UI (hex code)
    }),

    // Classes/Schedule table
    classes: defineTable({
      subjectId: v.id("subjects"),
      dayOfWeek: v.number(), // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      startTime: v.string(), // Format: "HH:mm" (e.g., "09:00")
      endTime: v.string(), // Format: "HH:mm" (e.g., "10:00")
      type: v.string(), // "LECTURE", "LAB", "TUTORIAL"
    }).index("by_subject", ["subjectId"])
      .index("by_day", ["dayOfWeek"]),

    // Attendance records table
    attendance: defineTable({
      subjectId: v.id("subjects"),
      classId: v.optional(v.id("classes")), // Optional link to scheduled class
      date: v.string(), // Format: "YYYY-MM-DD"
      status: v.union(v.literal("present"), v.literal("absent")),
      timestamp: v.number(), // Unix timestamp when marked
    }).index("by_subject", ["subjectId"])
      .index("by_date", ["date"])
      .index("by_subject_and_date", ["subjectId", "date"]),

    // Holidays table
    holidays: defineTable({
      name: v.string(), // Holiday name (e.g., "Christmas")
      date: v.string(), // Format: "YYYY-MM-DD"
    }).index("by_date", ["date"]),

    // Settings table (single row for app-wide settings)
    settings: defineTable({
      semesterStartDate: v.optional(v.string()), // Format: "YYYY-MM-DD"
      semesterEndDate: v.optional(v.string()), // Format: "YYYY-MM-DD"
      defaultTargetAttendance: v.number(), // Default target percentage
      preClassPrompts: v.boolean(), // Enable/disable pre-class prompts
      promptOffsetMinutes: v.number(), // Minutes before class to prompt
      browserNotifications: v.boolean(), // Enable/disable browser notifications
      notificationSound: v.boolean(), // Enable/disable notification sound
    }),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
