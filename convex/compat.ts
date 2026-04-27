import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const tableNameValidator = v.union(
  v.literal("profiles"),
  v.literal("students"),
  v.literal("courses"),
  v.literal("exams"),
  v.literal("questions"),
  v.literal("examAssignments"),
  v.literal("examAttempts"),
  v.literal("examAnswers"),
  v.literal("certificates"),
  v.literal("auditLogs"),
  v.literal("uploads")
);

const filterValidator = v.object({
  field: v.string(),
  op: v.union(v.literal("eq"), v.literal("in")),
  value: v.any(),
});

const getValue = (row: Record<string, unknown>, field: string): unknown => {
  if (field === "id") return row._id;
  return row[field];
};

const matchesFilter = (
  row: Record<string, unknown>,
  filter: { field: string; op: "eq" | "in"; value: unknown }
) => {
  const value = getValue(row, filter.field);
  if (filter.op === "eq") {
    return value === filter.value;
  }
  if (!Array.isArray(filter.value)) {
    return false;
  }
  return filter.value.includes(value);
};

export const signInWithPassword = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();

    if (!profile) {
      return {
        success: false as const,
        error: "Invalid login credentials",
      };
    }

    if (profile.role === "admin") {
      const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123";
      if (args.password !== adminPassword) {
        return {
          success: false as const,
          error: "Invalid login credentials",
        };
      }
    }

    return {
      success: true as const,
      profileId: profile._id,
      email: profile.email,
      fullName: profile.fullName || "",
      role: profile.role,
    };
  },
});

export const getProfileById = query({
  args: {
    profileId: v.id("profiles"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.profileId);
  },
});

export const getFirstAdmin = query({
  args: {},
  handler: async (ctx) => {
    const admins = await ctx.db
      .query("profiles")
      .withIndex("by_role", (q) => q.eq("role", "admin"))
      .take(1);
    return admins[0] ?? null;
  },
});

export const createAuthUser = mutation({
  args: {
    email: v.string(),
    fullName: v.optional(v.string()),
    role: v.optional(v.union(v.literal("admin"), v.literal("student"))),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const email = args.email.trim().toLowerCase();
    const role = args.role ?? "student";

    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();

    if (existing) {
      return {
        user: {
          id: existing._id,
          email: existing.email,
        },
      };
    }

    const profileId = await ctx.db.insert("profiles", {
      email,
      fullName: args.fullName,
      role,
      createdAt: now,
      updatedAt: now,
    });

    return {
      user: {
        id: profileId,
        email,
      },
    };
  },
});

export const listRows = query({
  args: {
    table: tableNameValidator,
    filters: v.optional(v.array(filterValidator)),
    orderField: v.optional(v.string()),
    orderAsc: v.optional(v.boolean()),
    rangeFrom: v.optional(v.number()),
    rangeTo: v.optional(v.number()),
    limit: v.optional(v.number()),
    singleMode: v.optional(v.union(v.literal("none"), v.literal("single"), v.literal("maybeSingle"))),
  },
  handler: async (ctx, args) => {
    const tableName = args.table as any;
    let rows = (await ctx.db.query(tableName).take(10000)) as Array<Record<string, unknown>>;

    for (const filter of args.filters ?? []) {
      rows = rows.filter((row) => matchesFilter(row, filter));
    }

    const total = rows.length;

    if (args.orderField) {
      const direction = args.orderAsc === false ? -1 : 1;
      rows = rows.sort((a, b) => {
        const av = getValue(a, args.orderField!);
        const bv = getValue(b, args.orderField!);
        if (av === bv) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        return av > bv ? direction : -direction;
      });
    }

    if (typeof args.rangeFrom === "number" && typeof args.rangeTo === "number") {
      rows = rows.slice(args.rangeFrom, args.rangeTo + 1);
    }

    if (typeof args.limit === "number") {
      rows = rows.slice(0, args.limit);
    }

    if (args.table === "examAssignments") {
      const enriched: Array<Record<string, unknown>> = [];
      for (const row of rows) {
        const exam = row.examId ? await ctx.db.get(row.examId as any) : null;
        enriched.push({ ...row, exams: exam });
      }
      rows = enriched;
    }

    if (args.table === "examAttempts") {
      const enriched: Array<Record<string, unknown>> = [];
      for (const row of rows) {
        const exam = row.examId ? await ctx.db.get(row.examId as any) : null;
        enriched.push({ ...row, exams: exam });
      }
      rows = enriched;
    }

    if (args.table === "students") {
      const enriched: Array<Record<string, unknown>> = [];
      for (const row of rows) {
        const profile = row.profileId ? await ctx.db.get(row.profileId as any) : null;
        enriched.push({ ...row, profiles: profile });
      }
      rows = enriched;
    }

    if (args.table === "auditLogs") {
      const enriched: Array<Record<string, unknown>> = [];
      for (const row of rows) {
        const profile = row.userProfileId ? await ctx.db.get(row.userProfileId as any) : null;
        enriched.push({ ...row, profiles: profile });
      }
      rows = enriched;
    }

    if (args.singleMode === "single") {
      return {
        rows: rows.length > 0 ? [rows[0]] : [],
        total,
      };
    }

    if (args.singleMode === "maybeSingle") {
      return {
        rows: rows.length > 0 ? [rows[0]] : [],
        total,
      };
    }

    return {
      rows,
      total,
    };
  },
});

export const mutateRows = mutation({
  args: {
    table: tableNameValidator,
    action: v.union(v.literal("insert"), v.literal("update"), v.literal("upsert"), v.literal("delete")),
    values: v.optional(v.any()),
    filters: v.optional(v.array(filterValidator)),
    onConflict: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const tableName = args.table as any;
    const now = Date.now();

    const applyTimestamps = (input: Record<string, unknown>) => {
      const copy = { ...input };
      if (copy.createdAt === undefined) copy.createdAt = now;
      copy.updatedAt = now;
      return copy;
    };

    if (args.action === "insert") {
      const inputs = Array.isArray(args.values) ? args.values : [args.values ?? {}];
      const ids: string[] = [];
      for (const value of inputs) {
        const payload = applyTimestamps((value ?? {}) as Record<string, unknown>);
        const id = await ctx.db.insert(tableName, payload as any);
        ids.push(id as unknown as string);
      }
      return { ids };
    }

    const source = (await ctx.db.query(tableName).take(10000)) as Array<Record<string, unknown>>;
    let matches = source;
    for (const filter of args.filters ?? []) {
      matches = matches.filter((row) => matchesFilter(row, filter));
    }

    if (args.action === "delete") {
      for (const row of matches) {
        await ctx.db.delete(row._id as any);
      }
      return { ids: matches.map((r) => r._id as string) };
    }

    if (args.action === "update") {
      const update = (args.values ?? {}) as Record<string, unknown>;
      for (const row of matches) {
        await ctx.db.patch(row._id as any, { ...update, updatedAt: now } as any);
      }
      return { ids: matches.map((r) => r._id as string) };
    }

    const value = (args.values ?? {}) as Record<string, unknown>;
    const conflictFields = args.onConflict ?? [];

    if (value._id) {
      const existing = await ctx.db.get(value._id as any);
      if (existing) {
        const updatePayload = { ...value } as Record<string, unknown>;
        delete updatePayload._id;
        await ctx.db.patch(value._id as any, { ...updatePayload, updatedAt: now } as any);
        return { ids: [value._id as string] };
      }
    }

    if (conflictFields.length > 0) {
      const existing = source.find((row) =>
        conflictFields.every((field) => getValue(row, field) === (value as any)[field])
      );

      if (existing) {
        await ctx.db.patch(existing._id as any, { ...value, updatedAt: now } as any);
        return { ids: [existing._id as string] };
      }
    }

    const insertedId = await ctx.db.insert(tableName, applyTimestamps(value) as any);
    return { ids: [insertedId as unknown as string] };
  },
});
