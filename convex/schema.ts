import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  profiles: defineTable({
    fullName: v.optional(v.string()),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("student")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_role", ["role"]),

  students: defineTable({
    profileId: v.id("profiles"),
    enrollmentNo: v.string(),
    status: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    fatherName: v.optional(v.string()),
    motherName: v.optional(v.string()),
    gender: v.optional(v.string()),
    dob: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    country: v.optional(v.string()),
    pincode: v.optional(v.string()),
    category: v.optional(v.string()),
    lastQualification: v.optional(v.string()),
    username: v.optional(v.string()),
    fees: v.optional(v.number()),
    paymentMode: v.optional(v.string()),
    photoUrl: v.optional(v.string()),
    certificateUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_profile", ["profileId"])
    .index("by_enrollment", ["enrollmentNo"]),

  courses: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_name", ["name"]),

  exams: defineTable({
    name: v.string(),
    courseId: v.id("courses"),
    examDate: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    durationMinutes: v.optional(v.number()),
    status: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_course", ["courseId"])
    .index("by_date", ["examDate"]),

  questions: defineTable({
    courseId: v.id("courses"),
    questionText: v.string(), // Keep for backward compatibility
    optionA: v.string(),      // Keep for backward compatibility
    optionB: v.string(),      // Keep for backward compatibility
    optionC: v.string(),      // Keep for backward compatibility
    optionD: v.string(),      // Keep for backward compatibility
    
    question_en: v.optional(v.string()),
    question_gu: v.optional(v.string()),
    optionA_en: v.optional(v.string()),
    optionA_gu: v.optional(v.string()),
    optionB_en: v.optional(v.string()),
    optionB_gu: v.optional(v.string()),
    optionC_en: v.optional(v.string()),
    optionC_gu: v.optional(v.string()),
    optionD_en: v.optional(v.string()),
    optionD_gu: v.optional(v.string()),

    correctOption: v.string(),
    marks: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_course", ["courseId"]),

  examAssignments: defineTable({
    examId: v.id("exams"),
    studentId: v.id("students"),
    status: v.optional(v.string()),
    assignedAt: v.number(),
  })
    .index("by_exam", ["examId"])
    .index("by_student", ["studentId"])
    .index("by_exam_student", ["examId", "studentId"]),

  examAttempts: defineTable({
    examId: v.id("exams"),
    studentId: v.id("students"),
    startedAt: v.string(),
    submittedAt: v.optional(v.string()),
    status: v.string(),
    score: v.optional(v.number()),
    percentage: v.optional(v.number()),
    isPassed: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_exam", ["examId"])
    .index("by_student", ["studentId"])
    .index("by_exam_student", ["examId", "studentId"]),

  examAnswers: defineTable({
    attemptId: v.id("examAttempts"),
    questionId: v.id("questions"),
    selectedOption: v.string(),
    isCorrect: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_attempt", ["attemptId"])
    .index("by_attempt_question", ["attemptId", "questionId"]),

  certificates: defineTable({
    siNumber: v.string(),
    studentId: v.id("students"),
    studentName: v.string(),
    enrollmentNumber: v.string(),
    courseName: v.string(),
    examId: v.optional(v.id("exams")),
    examName: v.optional(v.string()),
    score: v.optional(v.number()),
    percentage: v.optional(v.number()),
    grade: v.optional(v.string()),
    totalMarks: v.optional(v.number()),
    issueDate: v.string(),
    issuedBy: v.optional(v.string()),
    isVerified: v.boolean(),
    isActive: v.boolean(),
    remarks: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_si_number", ["siNumber"])
    .index("by_student", ["studentId"]),

  auditLogs: defineTable({
    action: v.string(),
    userProfileId: v.optional(v.id("profiles")),
    details: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    timestamp: v.number(),
    createdAt: v.number(),
  })
    .index("by_action", ["action"])
    .index("by_user", ["userProfileId"])
    .index("by_timestamp", ["timestamp"]),

  uploads: defineTable({
    studentId: v.optional(v.id("students")),
    storageId: v.string(),
    fileName: v.string(),
    contentType: v.string(),
    size: v.number(),
    createdAt: v.number(),
  }).index("by_student", ["studentId"]),
});
