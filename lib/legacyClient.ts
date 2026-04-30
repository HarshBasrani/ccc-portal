/* eslint-disable @typescript-eslint/no-explicit-any */
import { ConvexHttpClient } from 'convex/browser'

type LegacyResponse<T = unknown> = {
  data: T
  error: { message: string } | null
  count?: number
}

type Role = 'admin' | 'student'

const SESSION_KEY = 'ccc_portal_session'

const TABLE_MAP: Record<string, string> = {
  profiles: 'profiles',
  students: 'students',
  courses: 'courses',
  exams: 'exams',
  questions: 'questions',
  exam_assignments: 'examAssignments',
  exam_attempts: 'examAttempts',
  exam_answers: 'examAnswers',
  certificates: 'certificates',
  audit_logs: 'auditLogs',
  uploads: 'uploads',
}

const FIELD_MAP: Record<string, string> = {
  id: '_id',
  full_name: 'fullName',
  profile_id: 'profileId',
  enrollment_no: 'enrollmentNo',
  first_name: 'firstName',
  last_name: 'lastName',
  father_name: 'fatherName',
  mother_name: 'motherName',
  last_qualification: 'lastQualification',
  payment_mode: 'paymentMode',
  photo_url: 'photoUrl',
  certificate_url: 'certificateUrl',
  created_at: 'createdAt',
  updated_at: 'updatedAt',
  exam_id: 'examId',
  student_id: 'studentId',
  exam_date: 'examDate',
  start_time: 'startTime',
  end_time: 'endTime',
  duration_minutes: 'durationMinutes',
  course_id: 'courseId',
  question_text: 'questionText',
  option_a: 'optionA',
  option_b: 'optionB',
  option_c: 'optionC',
  option_d: 'optionD',
  correct_option: 'correctOption',
  assigned_at: 'assignedAt',
  started_at: 'startedAt',
  submitted_at: 'submittedAt',
  is_passed: 'isPassed',
  attempt_id: 'attemptId',
  question_id: 'questionId',
  selected_option: 'selectedOption',
  is_correct: 'isCorrect',
  si_number: 'siNumber',
  student_name: 'studentName',
  enrollment_number: 'enrollmentNumber',
  course_name: 'courseName',
  exam_name: 'examName',
  total_marks: 'totalMarks',
  issue_date: 'issueDate',
  issued_by: 'issuedBy',
  is_verified: 'isVerified',
  is_active: 'isActive',
  user_id: 'userProfileId',
  ip_address: 'ipAddress',
  user_agent: 'userAgent',
  storage_id: 'storageId',
  file_name: 'fileName',
  content_type: 'contentType',
  _creationTime: '_creationTime',
}

const toCamelField = (field: string) => FIELD_MAP[field] ?? field

const camelToSnake = (value: string) =>
  value
    .replace(/([A-Z])/g, '_$1')
    .replace(/^_/, '')
    .toLowerCase()

const fromCamelObject = (value: any): any => {
  if (Array.isArray(value)) return value.map(fromCamelObject)
  if (!value || typeof value !== 'object') return value

  const out: Record<string, unknown> = {}
  for (const [key, inner] of Object.entries(value)) {
    if (key === '_id') {
      out.id = inner
      out._id = inner
      continue
    }
    if (key === '_creationTime') {
      out.created_at = inner
      out._creationTime = inner
      continue
    }

    const snake = camelToSnake(key)
    out[snake] = fromCamelObject(inner)
    out[key] = fromCamelObject(inner)
  }
  return out
}

const toCamelObject = (value: any): any => {
  if (Array.isArray(value)) return value.map(toCamelObject)
  if (!value || typeof value !== 'object') return value

  const out: Record<string, unknown> = {}
  for (const [key, inner] of Object.entries(value)) {
    const mappedKey = toCamelField(key)
    out[mappedKey] = toCamelObject(inner)
  }

  if (out.id && !out._id) {
    out._id = out.id
    delete out.id
  }

  return out
}

const getConvexClient = () => {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL
  if (!url) {
    throw new Error('Missing NEXT_PUBLIC_CONVEX_URL')
  }
  return new ConvexHttpClient(url)
}

const getSession = () => {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as {
      profileId: string
      email: string
      fullName: string
      role: Role
      enrollmentNo?: string
      token?: string
    }
  } catch {
    return null
  }
}

const setSession = (session: { profileId: string; email: string; fullName: string; role: Role; enrollmentNo?: string; token?: string }) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

const clearSession = () => {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(SESSION_KEY)
}

class LegacyQueryBuilder {
  private operation: 'select' | 'insert' | 'update' | 'upsert' | 'delete' = 'select'
  private values: any = null
  private filters: Array<{ field: string; op: 'eq' | 'in'; value: any }> = []
  private orderField?: string
  private orderAsc = true
  private rangeFrom?: number
  private rangeTo?: number
  private limitValue?: number
  private singleMode: 'none' | 'single' | 'maybeSingle' = 'none'
  private wantsCount = false
  private onConflictFields?: string[]

  constructor(private readonly table: string) {}

  select(_columns?: string, options?: { count?: 'exact'; head?: boolean }) {
    if (options?.count === 'exact') {
      this.wantsCount = true
    }
    return this
  }

  insert(value?: unknown) {
    this.operation = 'insert'
    this.values = value
    return this
  }

  update(value?: unknown) {
    this.operation = 'update'
    this.values = value
    return this
  }

  upsert(value?: unknown, options?: { onConflict?: string }) {
    this.operation = 'upsert'
    this.values = value
    if (options?.onConflict) {
      this.onConflictFields = options.onConflict.split(',').map((s) => toCamelField(s.trim()))
    }
    return this
  }

  delete() {
    this.operation = 'delete'
    return this
  }

  eq(column: string, value: unknown) {
    this.filters.push({ field: toCamelField(column), op: 'eq', value })
    return this
  }

  in(column: string, values: unknown[]) {
    this.filters.push({ field: toCamelField(column), op: 'in', value: values })
    return this
  }

  order(column: string, opts?: { ascending?: boolean }) {
    this.orderField = toCamelField(column)
    this.orderAsc = opts?.ascending !== false
    return this
  }

  range(from: number, to: number) {
    this.rangeFrom = from
    this.rangeTo = to
    return this
  }

  limit(size: number) {
    this.limitValue = size
    return this
  }

  maybeSingle() {
    this.singleMode = 'maybeSingle'
    return this
  }

  single() {
    this.singleMode = 'single'
    return this
  }

  private async execute(): Promise<LegacyResponse<any>> {
    const client = getConvexClient()
    const table = TABLE_MAP[this.table]
    if (!table) {
      return { data: this.singleMode === 'none' ? [] : null, error: null }
    }

    const session = getSession()
    const sessionToken = session?.token

    try {
      if (this.operation === 'select') {
        const result = await (client as any).query('compat:listRows', {
          table,
          filters: this.filters,
          orderField: this.orderField,
          orderAsc: this.orderAsc,
          rangeFrom: this.rangeFrom,
          rangeTo: this.rangeTo,
          limit: this.limitValue,
          singleMode: this.singleMode,
          sessionToken,
        })

        const rows = fromCamelObject(result.rows || [])
        const data = this.singleMode === 'none' ? rows : rows[0] ?? null

        if (this.wantsCount) {
          return { data: this.singleMode === 'none' ? [] : null, error: null, count: result.total ?? 0 }
        }

        return { data, error: null, count: result.total }
      }

      const mutationResult = await (client as any).mutation('compat:mutateRows', {
        table,
        action: this.operation,
        values: toCamelObject(this.values),
        filters: this.filters,
        onConflict: this.onConflictFields,
        sessionToken,
      })

      const ids = mutationResult.ids ?? []
      if (this.operation === 'delete') {
        return { data: null, error: null }
      }

      if (ids.length === 0) {
        return { data: this.singleMode === 'none' ? [] : null, error: null }
      }

      const fetchResult = await (client as any).query('compat:listRows', {
        table,
        filters: [{ field: '_id', op: 'in', value: ids }],
        sessionToken,
      })
      const rows = fromCamelObject(fetchResult.rows || [])
      const data = this.singleMode === 'none' ? rows : rows[0] ?? null
      return { data, error: null }
    } catch (error: any) {
      return {
        data: this.singleMode === 'none' ? [] : null,
        error: { message: error?.message ?? 'Convex operation failed' },
      }
    }
  }

  then<TResult1 = LegacyResponse<any>, TResult2 = never>(
    onfulfilled?: ((value: LegacyResponse<any>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled ?? undefined, onrejected ?? undefined)
  }
}

export const legacyClient: any = {
  auth: {
    // Cache-bust comment to force Vercel redeployment and clear edge cache
    getUser: async () => {
      const session = getSession()
      if (!session?.profileId || !session?.token) {
        clearSession()
        return { data: { user: null }, error: null }
      }

      try {
        const client = getConvexClient()
        const profile = await (client as any).query('compat:getProfileById', {
          profileId: session.profileId,
        })

        if (!profile) {
          clearSession()
          return { data: { user: null }, error: null }
        }

        return {
          data: {
            user: {
              id: profile._id,
              email: profile.email,
              user_metadata: {
                full_name: profile.fullName ?? '',
                role: profile.role,
              },
            },
          },
          error: null,
        }
      } catch {
        return { data: { user: null }, error: null }
      }
    },

    signInWithPassword: async ({ email, enrollmentNo, password }: { email?: string; enrollmentNo?: string; password: string }) => {
      try {
        const client = getConvexClient()
        const result = await (client as any).mutation('auth:login', {
          email,
          enrollmentNo,
          password,
        })

        if (!result.success) {
          return {
            data: { user: null, session: null },
            error: { message: 'Login failed' },
          }
        }

        setSession({
          profileId: result.profileId,
          email: result.email,
          fullName: result.fullName,
          role: result.role,
          enrollmentNo: result.enrollmentNo,
          token: result.token,
        })

        return {
          data: {
            user: {
              id: result.profileId,
              email: result.email,
            },
            session: {
              access_token: `session:${result.profileId}`,
            },
          },
          error: null,
        }
      } catch (error: any) {
        return {
          data: { user: null, session: null },
          error: { message: error?.message ?? 'Login failed' },
        }
      }
    },

    signOut: async () => {
      clearSession()
      return { error: null }
    },

    onAuthStateChange: () => ({
      data: { subscription: { unsubscribe: () => undefined } },
    }),
  },

  from: (table: string) => new LegacyQueryBuilder(table),
}
