import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { validateSession } from "./auth";

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

    let enrollmentNo: string | undefined = undefined;
    if (profile.role === "student") {
      const students = await ctx.db.query("students").collect();
      const student = students.find((s) => s.profileId === profile._id || s.email === profile.email);
      if (student) {
        enrollmentNo = student.enrollmentNo;
      }
    }

    return {
      success: true as const,
      profileId: profile._id,
      email: profile.email,
      fullName: profile.fullName || "",
      role: profile.role,
      enrollmentNo,
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
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const profile = await validateSession(ctx, args.sessionToken);
    
    const tableName = args.table as any;
    let rows = (await ctx.db.query(tableName).take(10000)) as Array<Record<string, unknown>>;

    for (const filter of args.filters ?? []) {
      rows = rows.filter((row) => matchesFilter(row, filter));
    }

    let studentId: any = null;
    if (profile.role === "student") {
      const students = await ctx.db.query("students").collect();
      const student = students.find((s) => s.profileId === profile._id);
      if (student) studentId = student._id;
    }

    if (profile.role === "student") {
      const allowedTables = ["profiles", "students", "courses", "exams", "questions", "examAssignments", "examAttempts", "examAnswers", "certificates"];
      if (!allowedTables.includes(args.table)) {
        throw new Error(`Unauthorized access to table ${args.table}`);
      }

      if (args.table === "questions") {
        rows = rows.map(row => {
          const { correctOption, ...rest } = row;
          return rest;
        });
      }
      if (args.table === "students") {
        rows = rows.filter(row => row.profileId === profile._id);
      }
      if (args.table === "examAttempts") {
        rows = rows.filter(row => row.studentId === studentId);
      }
      if (args.table === "examAssignments") {
        rows = rows.filter(row => row.studentId === studentId);
      }
      if (args.table === "examAnswers") {
        const attempts = await ctx.db.query("examAttempts").collect();
        const myAttemptIds = attempts.filter(a => a.studentId === studentId).map(a => a._id.toString());
        rows = rows.filter(row => myAttemptIds.includes(row.attemptId?.toString()));
      }
      if (args.table === "certificates") {
        rows = rows.filter(row => row.studentId === studentId);
      }
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
        
        let photoUrl = row.photoUrl as string | undefined;
        if (photoUrl) {
          const match = photoUrl.match(/\/api\/storage\/([a-zA-Z0-9-]+)/);
          const storageId = match ? match[1] : photoUrl;
          try {
            const resolvedUrl = await ctx.storage.getUrl(storageId);
            if (resolvedUrl) photoUrl = resolvedUrl;
          } catch (e) {
            // fallback
          }
        }

        let certificateUrl = row.certificateUrl as string | undefined;
        if (certificateUrl) {
          const match = certificateUrl.match(/\/api\/storage\/([a-zA-Z0-9-]+)/);
          const storageId = match ? match[1] : certificateUrl;
          try {
            const resolvedUrl = await ctx.storage.getUrl(storageId);
            if (resolvedUrl) certificateUrl = resolvedUrl;
          } catch (e) {
            // fallback
          }
        }

        enriched.push({ ...row, profiles: profile, photoUrl, certificateUrl });
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

    const siteUrl = process.env.CONVEX_SITE_URL || "https://oceanic-puma-27.eu-west-1.convex.site";
    for (const row of rows) {
      if (row.photoUrl && typeof row.photoUrl === "string" && !row.photoUrl.startsWith("http")) {
        row.photoUrl = `${siteUrl}/api/storage/${row.photoUrl}`;
      }
      if (row.certificateUrl && typeof row.certificateUrl === "string" && !row.certificateUrl.startsWith("http")) {
        row.certificateUrl = `${siteUrl}/api/storage/${row.certificateUrl}`;
      }
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
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const profile = await validateSession(ctx, args.sessionToken);
    const tableName = args.table as any;
    const now = Date.now();

    let studentId: any = null;
    if (profile.role === "student") {
      const students = await ctx.db.query("students").collect();
      const student = students.find((s) => s.profileId === profile._id);
      if (student) studentId = student._id;
    }

    if (profile.role === "student") {
      const allowedTables = ["examAttempts", "examAnswers", "uploads", "auditLogs", "students"];
      if (!allowedTables.includes(args.table)) {
        throw new Error(`Unauthorized mutation to table ${args.table}`);
      }

      if (args.table === "examAttempts") {
        if (args.action === "update") {
          const updateValues = (args.values ?? {}) as Record<string, unknown>;
          const source = (await ctx.db.query("examAttempts").take(10000)) as Array<Record<string, unknown>>;
          let matches = source.filter(row => row.studentId === studentId);
          for (const filter of args.filters ?? []) {
            matches = matches.filter((row) => matchesFilter(row, filter));
          }

          if (matches.length > 0) {
            const attemptToUpdate = matches[0];
            const answers = await ctx.db
              .query("examAnswers")
              .withIndex("by_attempt", (q: any) => q.eq("attemptId", attemptToUpdate._id as any))
              .collect();

            const exam = (await ctx.db.get(attemptToUpdate.examId as any)) as any;
            let courseId = exam?.courseId;
            if (!courseId && answers.length > 0) {
              const q = (await ctx.db.get(answers[0].questionId)) as any;
              courseId = q?.courseId;
            }

            let calculatedScore = 0;
            let totalMarks = 0;

            if (courseId) {
              const questions = await ctx.db
                .query("questions")
                .withIndex("by_course", (q: any) => q.eq("courseId", courseId))
                .collect();

              const questionsMap = new Map(questions.map(q => [q._id.toString(), q]));
              totalMarks = questions.reduce((sum, q) => sum + (q.marks || 1), 0);

              for (const ans of answers) {
                const q = questionsMap.get(ans.questionId.toString());
                if (q) {
                  if (ans.selectedOption === q.correctOption) {
                    calculatedScore += (q.marks || 1);
                  }
                }
              }
            }

            const calculatedPercentage = totalMarks > 0 ? (calculatedScore * 100) / totalMarks : 0;
            const calculatedIsPassed = calculatedPercentage >= 45;

            updateValues.score = calculatedScore;
            updateValues.percentage = calculatedPercentage;
            updateValues.isPassed = calculatedIsPassed;
            updateValues.submittedAt = new Date().toISOString();
            updateValues.status = updateValues.status || 'submitted';
          }
        }
      }

      if (args.table === "examAnswers") {
        const values = Array.isArray(args.values) ? args.values : [args.values ?? {}];
        for (const val of values) {
          if (val.questionId) {
            const q = (await ctx.db.get(val.questionId)) as any;
            if (q) {
              val.isCorrect = val.selectedOption === q.correctOption;
            }
          }
        }
      }
    }

    const applyTimestamps = (input: Record<string, unknown>) => {
      const copy = { ...input };
      
      if (tableName !== "examAssignments") {
        if (copy.createdAt === undefined) copy.createdAt = now;
        copy.updatedAt = now;
      }

      if (tableName === "exams" && copy.durationMinutes === undefined) {
        const startStr = (copy.startTime as string) || "00:00";
        const endStr = (copy.endTime as string) || "00:00";
        const [startH, startM] = startStr.split(':').map(Number);
        const [endH, endM] = endStr.split(':').map(Number);
        const startTotal = startH * 60 + startM;
        const endTotal = endH * 60 + endM;
        copy.durationMinutes = endTotal >= startTotal ? endTotal - startTotal : (24 * 60 - startTotal) + endTotal;
      }

      if (tableName === "examAssignments" && copy.assignedAt === undefined) {
        copy.assignedAt = now;
      }

      return copy;
    };

    if (args.action === "insert") {
      const inputs = Array.isArray(args.values) ? args.values : [args.values ?? {}];
      const ids: string[] = [];
      for (const value of inputs) {
        let payload = applyTimestamps((value ?? {}) as Record<string, unknown>);
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
        let payload = { ...update };
        
        if (tableName === "exams" && payload.durationMinutes === undefined && payload.startTime && payload.endTime) {
          const startStr = (payload.startTime as string);
          const endStr = (payload.endTime as string);
          const [startH, startM] = startStr.split(':').map(Number);
          const [endH, endM] = endStr.split(':').map(Number);
          const startTotal = startH * 60 + startM;
          const endTotal = endH * 60 + endM;
          payload.durationMinutes = endTotal >= startTotal ? endTotal - startTotal : (24 * 60 - startTotal) + endTotal;
        }

        const patchPayload = { ...payload };
        if (tableName !== "examAssignments") {
          patchPayload.updatedAt = now;
        }

        await ctx.db.patch(row._id as any, patchPayload as any);
      }
      return { ids: matches.map((r) => r._id as string) };
    }

    const value = (args.values ?? {}) as Record<string, unknown>;
    
    if (tableName === "exams" && value.durationMinutes === undefined) {
      const startStr = (value.startTime as string) || "00:00";
      const endStr = (value.endTime as string) || "00:00";
      const [startH, startM] = startStr.split(':').map(Number);
      const [endH, endM] = endStr.split(':').map(Number);
      const startTotal = startH * 60 + startM;
      const endTotal = endH * 60 + endM;
      value.durationMinutes = endTotal >= startTotal ? endTotal - startTotal : (24 * 60 - startTotal) + endTotal;
    }

    if (tableName === "examAssignments" && value.assignedAt === undefined) {
      value.assignedAt = now;
    }

    const conflictFields = args.onConflict ?? [];

    if (value._id) {
      const existing = await ctx.db.get(value._id as any);
      if (existing) {
        const updatePayload = { ...value } as Record<string, unknown>;
        delete updatePayload._id;
        const patchPayload = { ...updatePayload };
        if (tableName !== "examAssignments") {
          patchPayload.updatedAt = now;
        }
        await ctx.db.patch(value._id as any, patchPayload as any);
        return { ids: [value._id as string] };
      }
    }

    if (conflictFields.length > 0) {
      const existing = source.find((row) =>
        conflictFields.every((field) => getValue(row, field) === (value as any)[field])
      );

      if (existing) {
        const patchPayload = { ...value };
        if (tableName !== "examAssignments") {
          patchPayload.updatedAt = now;
        }
        await ctx.db.patch(existing._id as any, patchPayload as any);
        return { ids: [existing._id as string] };
      }
    }

    const insertedId = await ctx.db.insert(tableName, applyTimestamps(value) as any);
    return { ids: [insertedId as unknown as string] };
  },
});
