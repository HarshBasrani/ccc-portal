import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const seedAdminProfile = mutation({
  args: {
    email: v.string(),
    fullName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const normalizedEmail = args.email.trim().toLowerCase();

    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .unique();

    if (existing) {
      if (existing.role !== "admin") {
        await ctx.db.patch(existing._id, {
          role: "admin",
          updatedAt: now,
        });
      }

      return {
        profileId: existing._id,
        created: false,
        role: "admin" as const,
      };
    }

    const profileId = await ctx.db.insert("profiles", {
      email: normalizedEmail,
      fullName: args.fullName,
      role: "admin",
      createdAt: now,
      updatedAt: now,
    });

    return {
      profileId,
      created: true,
      role: "admin" as const,
    };
  },
});

export const getProfileByEmail = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedEmail = args.email.trim().toLowerCase();

    return await ctx.db
      .query("profiles")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .unique();
  },
});

export const authenticateAdmin = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedEmail = args.email.trim().toLowerCase();
    const configuredPassword = process.env.ADMIN_PASSWORD || "Admin@123";

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .unique();

    if (!profile || profile.role !== "admin") {
      return { success: false as const, error: "Admin profile not found." };
    }

    if (args.password !== configuredPassword) {
      return { success: false as const, error: "Invalid email or password." };
    }

    return {
      success: true as const,
      profileId: profile._id,
      email: profile.email,
      fullName: profile.fullName || "Admin",
      role: profile.role,
    };
  },
});

export const dashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const students = (await ctx.db.query("students").take(10000)).length;
    const exams = (await ctx.db.query("exams").take(10000)).length;
    const questions = (await ctx.db.query("questions").take(10000)).length;
    const attempts = (await ctx.db.query("examAttempts").take(10000)).length;

    return { students, exams, questions, attempts };
  },
});
