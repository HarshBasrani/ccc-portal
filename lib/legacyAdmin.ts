import { ConvexHttpClient } from 'convex/browser'

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
    const mapped = toCamelField(key)
    out[mapped] = toCamelObject(inner)
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

class LegacyAdminQueryBuilder {
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
    if (options?.count === 'exact') this.wantsCount = true
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

  private async execute() {
    const client = getConvexClient()
    const table = TABLE_MAP[this.table]
    if (!table) {
      return { data: this.singleMode === 'none' ? [] : null, error: null }
    }

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
      })

      if (this.operation === 'delete') {
        return { data: null, error: null }
      }

      const ids = mutationResult.ids ?? []
      if (ids.length === 0) {
        return { data: this.singleMode === 'none' ? [] : null, error: null }
      }

      const fetchResult = await (client as any).query('compat:listRows', {
        table,
        filters: [{ field: '_id', op: 'in', value: ids }],
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

  then<TResult1 = { data: unknown[] | null; error: null }, TResult2 = never>(
    onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled ?? undefined, onrejected ?? undefined)
  }
}

export const legacyAdmin: any = {
  auth: {
    getUser: async (token?: string) => {
      try {
        const client = getConvexClient()
        if (token?.startsWith('session:')) {
          const profileId = token.replace('session:', '')
          const profile = await (client as any).query('compat:getProfileById', { profileId })
          if (profile) {
            return {
              data: { user: { id: profile._id, email: profile.email } },
              error: null,
            }
          }
        }

        const admin = await (client as any).query('compat:getFirstAdmin', {})
        if (!admin) {
          return { data: { user: null }, error: { message: 'No admin found' } }
        }

        return {
          data: { user: { id: admin._id, email: admin.email } },
          error: null,
        }
      } catch {
        return { data: { user: null }, error: { message: 'Legacy admin auth failed' } }
      }
    },
    admin: {
      createUser: async (input: { email: string; user_metadata?: { full_name?: string; role?: 'admin' | 'student' } }) => {
        try {
          const client = getConvexClient()
          const result = await (client as any).mutation('compat:createAuthUser', {
            email: input.email,
            fullName: input.user_metadata?.full_name,
            role: input.user_metadata?.role,
          })
          return { data: result, error: null }
        } catch (error: any) {
          return { data: { user: null }, error: { message: error?.message ?? 'Create user failed' } }
        }
      },
    },
  },
  from: (table: string) => new LegacyAdminQueryBuilder(table),
}
