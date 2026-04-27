import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Returns a short-lived upload URL that the client can POST a file to.
 * The response JSON from that POST contains `{ storageId }`.
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Creates a new student (and its backing profile row).
 *
 * The frontend sends every form field here; the mutation
 * inserts a `profiles` row first, then a `students` row
 * referencing it via `profileId`.
 */
export const createStudent = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    fatherName: v.optional(v.string()),
    motherName: v.optional(v.string()),
    gender: v.optional(v.string()),
    dob: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    country: v.optional(v.string()),
    pincode: v.optional(v.string()),
    category: v.optional(v.string()),
    email: v.string(),
    lastQualification: v.optional(v.string()),
    username: v.optional(v.string()),
    password: v.string(),
    enrollmentNo: v.string(),
    fees: v.optional(v.number()),
    paymentMode: v.optional(v.string()),
    photoStorageId: v.optional(v.union(v.string(), v.null())),
    certStorageId: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const email = args.email.trim().toLowerCase();

    // ── Upsert profile ────────────────────────────────────────────
    let profileId;
    const existingProfile = await ctx.db
      .query("profiles")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();

    if (existingProfile) {
      profileId = existingProfile._id;
    } else {
      profileId = await ctx.db.insert("profiles", {
        email,
        fullName: `${args.firstName} ${args.lastName}`.trim(),
        role: "student",
        createdAt: now,
        updatedAt: now,
      });
    }

    // ── Insert student row ────────────────────────────────────────
    const studentId = await ctx.db.insert("students", {
      profileId,
      enrollmentNo: args.enrollmentNo,
      status: "approved",
      firstName: args.firstName,
      lastName: args.lastName,
      fatherName: args.fatherName,
      motherName: args.motherName,
      gender: args.gender,
      dob: args.dob,
      phone: args.phone,
      email,
      address: args.address,
      city: args.city,
      state: args.state,
      country: args.country,
      pincode: args.pincode,
      category: args.category,
      lastQualification: args.lastQualification,
      username: args.username,
      fees: args.fees ?? 500,
      paymentMode: args.paymentMode,
      photoUrl: args.photoStorageId ?? undefined,
      certificateUrl: args.certStorageId ?? undefined,
      createdAt: now,
      updatedAt: now,
    });

    return { studentId, profileId };
  },
});
