# Convex to Convex Migration

This project has started migration from Convex to Convex.

## What is already done

1. Installed Convex dependency in `package.json`.
2. Added Convex schema in `convex/schema.ts`.
3. Added Convex client in `lib/convexClient.ts`.
4. Added Convex provider at app root in `pages/_app.tsx`.
5. Added `NEXT_PUBLIC_CONVEX_URL` to `.env.local`.

## Convex data model mapping

- `profiles` -> `profiles`
- `students` -> `students`
- `courses` -> `courses`
- `exams` -> `exams`
- `questions` -> `questions`
- `exam_assignments` -> `examAssignments`
- `exam_attempts` -> `examAttempts`
- `exam_answers` -> `examAnswers`
- `certificates` -> `certificates`
- `audit_logs` -> `auditLogs`
- `uploads` -> `uploads`

## Required next steps

1. Create a Convex deployment and set `NEXT_PUBLIC_CONVEX_URL`.
2. Add Convex mutations/queries for each feature module:
   - auth/session
   - students
   - exams/assignments
   - exam engine/answers/attempt submission
   - certificates
   - audit logs
3. Replace all `db.from(...)` calls in pages and API routes with Convex query/mutation calls.
4. Replace Convex auth flow (`db.auth.*`) with Convex-compatible auth/session flow.
5. Remove Convex dependencies and old SQL migration files after cutover.

## Why full cutover is a multi-file change

Current codebase directly calls Convex in many pages and API files and relies on Convex Auth and SQL-style joins. Convex uses function-based access (queries/mutations/actions), so every direct Convex call must be migrated to a typed Convex function.

## Safe cutover strategy

1. Keep Convex and Convex side-by-side temporarily.
2. Migrate feature by feature (admin auth, student auth, exam engine, reporting, certificates).
3. Verify each feature in runtime.
4. Remove Convex only after parity is complete.
