import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Helper to shuffle array
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export const startExam = mutation({
  args: { examId: v.id("exams") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized: Please login.");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .unique();
    
    if (!profile || profile.role !== "student") {
      throw new Error("Unauthorized: Only students can start exams.");
    }

    const student = await ctx.db
      .query("students")
      .withIndex("by_profile", (q) => q.eq("profileId", profile._id))
      .first();

    if (!student) throw new Error("Student profile not found.");

    const exam = await ctx.db.get(args.examId);
    if (!exam) throw new Error("Exam not found.");

    // Check existing in_progress attempt
    const existingAttempts = await ctx.db
      .query("examAttempts")
      .withIndex("by_exam_student", (q) => q.eq("examId", args.examId).eq("studentId", student._id))
      .collect();

    const inProgressAttempt = existingAttempts.find(a => a.status === "in_progress");
    if (inProgressAttempt) {
      return { attemptId: inProgressAttempt._id };
    }

    // Get questions for this exam's course
    const allQuestions = await ctx.db
      .query("questions")
      .withIndex("by_course", (q) => q.eq("courseId", exam.courseId))
      .collect();

    // Randomize questions, taking up to 100
    const shuffledQuestions = shuffleArray(allQuestions).slice(0, 100);
    const questionIds = shuffledQuestions.map(q => q._id);

    const optionOrderMap: Record<Id<"questions">, number[]> = {};
    for (const qId of questionIds) {
      optionOrderMap[qId] = shuffleArray([0, 1, 2, 3]);
    }

    const attemptId = await ctx.db.insert("examAttempts", {
      examId: args.examId,
      studentId: student._id,
      startedAt: new Date().toISOString(),
      status: "in_progress",
      questionIds,
      optionOrderMap,
      selectedAnswersMap: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { attemptId };
  }
});

export const getAttemptQuestions = query({
  args: { attemptId: v.id("examAttempts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const attempt = await ctx.db.get(args.attemptId);
    if (!attempt) throw new Error("Attempt not found");

    const student = await ctx.db.get(attempt.studentId);
    const profile = student ? await ctx.db.get(student.profileId) : null;
    
    if (!profile || profile.email !== identity.email) {
      throw new Error("Unauthorized: You do not own this attempt.");
    }

    const questionsList = [];
    if (attempt.questionIds && attempt.optionOrderMap) {
      for (const qId of attempt.questionIds) {
        const q = await ctx.db.get(qId);
        if (!q) continue;

        const order = attempt.optionOrderMap[qId] || [0, 1, 2, 3];
        
        // Original options arrays
        const origOptionsEn = [q.optionA_en || q.optionA, q.optionB_en || q.optionB, q.optionC_en || q.optionC, q.optionD_en || q.optionD];
        const origOptionsGu = [q.optionA_gu || q.optionA, q.optionB_gu || q.optionB, q.optionC_gu || q.optionC, q.optionD_gu || q.optionD];
        
        // Mapped options
        const mappedEn = order.map(idx => origOptionsEn[idx]);
        const mappedGu = order.map(idx => origOptionsGu[idx]);

        questionsList.push({
          id: q._id,
          question_en: q.question_en || q.questionText,
          question_gu: q.question_gu || q.questionText,
          options_en: mappedEn,
          options_gu: mappedGu,
          marks: q.marks,
        });
      }
    }

    return {
      attemptId: attempt._id,
      status: attempt.status,
      startedAt: attempt.startedAt,
      questions: questionsList,
      selectedAnswersMap: attempt.selectedAnswersMap || {},
    };
  }
});

export const saveAnswer = mutation({
  args: { 
    attemptId: v.id("examAttempts"), 
    questionId: v.id("questions"), 
    chosenIndex: v.number() 
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const attempt = await ctx.db.get(args.attemptId);
    if (!attempt) throw new Error("Attempt not found");
    if (attempt.status !== "in_progress") {
      throw new Error("Attempt is no longer in progress");
    }

    const student = await ctx.db.get(attempt.studentId);
    const profile = student ? await ctx.db.get(student.profileId) : null;
    
    if (!profile || profile.email !== identity.email) {
      throw new Error("Unauthorized: You do not own this attempt.");
    }

    const selectedAnswersMap = attempt.selectedAnswersMap || {};
    selectedAnswersMap[args.questionId] = args.chosenIndex;

    await ctx.db.patch(args.attemptId, {
      selectedAnswersMap,
      updatedAt: Date.now()
    });
    
    return { success: true };
  }
});

export const submitAttempt = mutation({
  args: { attemptId: v.id("examAttempts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const attempt = await ctx.db.get(args.attemptId);
    if (!attempt) throw new Error("Attempt not found");

    const student = await ctx.db.get(attempt.studentId);
    const profile = student ? await ctx.db.get(student.profileId) : null;
    
    if (!profile || profile.email !== identity.email) {
      throw new Error("Unauthorized: You do not own this attempt.");
    }

    if (attempt.status === "submitted") {
      return {
        score: attempt.score,
        percentage: attempt.percentage,
        isPassed: attempt.isPassed,
      };
    }

    const exam = await ctx.db.get(attempt.examId);
    if (!exam) throw new Error("Exam not found");

    // Time window enforcement
    const now = Date.now();
    const startedAtMs = new Date(attempt.startedAt).getTime();
    const durationMs = (exam.durationMinutes || 60) * 60 * 1000;
    const gracePeriodMs = 300000; // 5 minutes grace period
    
    // We allow submission but just note if it's late
    const isLate = now > (startedAtMs + durationMs + gracePeriodMs);

    // Option map: A=0, B=1, C=2, D=3
    const correctIndexMap: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };

    let totalScore = 0;
    let maxScore = 0;

    const selectedAnswersMap = attempt.selectedAnswersMap || {};
    const optionOrderMap = attempt.optionOrderMap || {};

    if (attempt.questionIds) {
      for (const qId of attempt.questionIds) {
        const q = await ctx.db.get(qId);
        if (!q) continue;

        maxScore += q.marks;

        const chosenClientIndex = selectedAnswersMap[qId];
        if (chosenClientIndex !== undefined) {
          const order = optionOrderMap[qId] || [0, 1, 2, 3];
          const originalIndex = order[chosenClientIndex];
          
          const correctLetter = q.correctOption; // 'A', 'B', 'C', 'D'
          const expectedIndex = correctIndexMap[correctLetter];

          if (originalIndex === expectedIndex) {
            totalScore += q.marks;
          }
        }
      }
    }

    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    // Passing percentage defaults to 50%
    const isPassed = percentage >= 50;

    await ctx.db.patch(args.attemptId, {
      status: "submitted",
      submittedAt: new Date().toISOString(),
      score: totalScore,
      percentage,
      isPassed,
      updatedAt: Date.now()
    });

    return {
      score: totalScore,
      percentage,
      isPassed,
      isLate
    };
  }
});
