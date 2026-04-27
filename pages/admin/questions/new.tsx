// pages/admin/questions/new.tsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { legacyClient } from '../../../lib/legacyClient'

interface Course {
  id: string
  name: string
}

export default function NewQuestion() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [courses, setCourses] = useState<Course[]>([])

  const [formData, setFormData] = useState({
    course_id: '',
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_option: 'A',
    marks: 1
  })

  useEffect(() => {
    const checkAdminAccess = async () => {
      const { data: { user } } = await legacyClient.auth.getUser()

      if (!user) {
        router.replace('/login')
        return
      }

      const { data: profile } = await legacyClient
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin') {
        router.replace('/student/dashboard')
        return
      }

      // Fetch courses for dropdown
      const { data: coursesData } = await legacyClient
        .from('courses')
        .select('id, name')
        .order('name', { ascending: true })

      if (coursesData) {
        setCourses(coursesData)
      }

      setLoading(false)
    }

    checkAdminAccess()
  }, [router])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setSuccess(null)

    // Validate required fields
    if (!formData.course_id) {
      setError('Please select a course. Add courses first from Manage Courses page.')
      setSubmitting(false)
      return
    }

    if (!formData.question_text.trim() || !formData.option_a.trim() || !formData.option_b.trim() || !formData.option_c.trim() || !formData.option_d.trim()) {
      setError('Please fill in all required fields.')
      setSubmitting(false)
      return
    }

    try {
      const { error: insertError } = await legacyClient
        .from('questions')
        .insert({
          course_id: formData.course_id,
          question_text: formData.question_text.trim(),
          option_a: formData.option_a.trim(),
          option_b: formData.option_b.trim(),
          option_c: formData.option_c.trim(),
          option_d: formData.option_d.trim(),
          correct_option: formData.correct_option,
          marks: formData.marks
        })

      if (insertError) {
        throw new Error(insertError.message)
      }

      setSuccess('Question created successfully!')
      setTimeout(() => {
        router.push('/admin/questions')
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="container mt-4">
        <p>Checking admin access</p>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Add New Question | CCC Exam Portal</title>
      </Head>
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h1 className="h4 mb-0">Add New Question</h1>
          <Link href="/admin/questions" className="btn btn-outline-secondary btn-sm">
            Back to Questions
          </Link>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success" role="alert">
            {success}
          </div>
        )}

        {courses.length === 0 && (
          <div className="alert alert-warning d-flex align-items-center gap-2" role="alert">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <div>
              <strong>No courses found!</strong> You need to{' '}
              <Link href="/admin/courses" className="alert-link">add courses first</Link>{' '}
              before creating questions.
            </div>
          </div>
        )}

        <div className="card">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              {/* Course selector */}
              <div className="mb-3">
                <label htmlFor="course_id" className="form-label">
                  Course <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select"
                  id="course_id"
                  name="course_id"
                  value={formData.course_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Select Course --</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </select>
                {courses.length === 0 && (
                  <div className="form-text text-danger">
                    No courses available.{' '}
                    <Link href="/admin/courses">Create one here</Link>.
                  </div>
                )}
              </div>

              <div className="mb-3">
                <label htmlFor="question_text" className="form-label">
                  Question Text <span className="text-danger">*</span>
                </label>
                <textarea
                  className="form-control"
                  id="question_text"
                  name="question_text"
                  rows={3}
                  value={formData.question_text}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="option_a" className="form-label">
                    Option A <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="option_a"
                    name="option_a"
                    value={formData.option_a}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="option_b" className="form-label">
                    Option B <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="option_b"
                    name="option_b"
                    value={formData.option_b}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="option_c" className="form-label">
                    Option C <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="option_c"
                    name="option_c"
                    value={formData.option_c}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="option_d" className="form-label">
                    Option D <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="option_d"
                    name="option_d"
                    value={formData.option_d}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="correct_option" className="form-label">
                    Correct Option <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    id="correct_option"
                    name="correct_option"
                    value={formData.correct_option}
                    onChange={handleChange}
                    required
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="marks" className="form-label">
                    Marks <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    id="marks"
                    name="marks"
                    min="1"
                    value={formData.marks}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="d-flex gap-2">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting || courses.length === 0}
                >
                  {submitting ? 'Saving' : 'Save Question'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => router.push('/admin/questions')}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
