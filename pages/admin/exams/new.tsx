// pages/admin/exams/new.tsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { legacyClient } from '../../../lib/legacyClient'

interface Course {
  id: string
  name: string
}

export default function NewExam() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [courses, setCourses] = useState<Course[]>([])

  const [formData, setFormData] = useState({
    course_id: '',
    name: '',
    exam_date: '',
    start_time: '',
    end_time: ''
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

      await fetchCourses()
      setLoading(false)
    }

    checkAdminAccess()
  }, [router])

  const fetchCourses = async () => {
    const { data, error } = await legacyClient
      .from('courses')
      .select('id, name')
      .order('name', { ascending: true })

    if (!error && data) {
      setCourses(data)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const [startH, startM] = formData.start_time.split(':').map(Number)
      const [endH, endM] = formData.end_time.split(':').map(Number)
      const startTotal = startH * 60 + startM
      const endTotal = endH * 60 + endM
      const durationMinutes = endTotal >= startTotal ? endTotal - startTotal : (24 * 60 - startTotal) + endTotal

      const { error: insertError } = await legacyClient
        .from('exams')
        .insert({
          course_id: formData.course_id || null,
          name: formData.name,
          exam_date: formData.exam_date,
          start_time: formData.start_time,
          end_time: formData.end_time,
          duration_minutes: durationMinutes,
          status: 'scheduled'
        })

      if (insertError) {
        throw new Error(insertError.message)
      }

      alert('Exam created successfully!')
      router.push('/admin/exams')
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
        <title>Add New Exam  CCC Exam Portal</title>
      </Head>
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h1 className="h4 mb-0">Add New Exam</h1>
          <Link href="/admin/exams" className="btn btn-outline-secondary btn-sm">
            Back to Exams
          </Link>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="name" className="form-label">
              Exam Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className="form-control"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label htmlFor="course_id" className="form-label">
              Course
            </label>
            <select
              className="form-select"
              id="course_id"
              name="course_id"
              value={formData.course_id}
              onChange={handleChange}
            >
              <option value="">-- Select Course --</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label htmlFor="exam_date" className="form-label">
              Exam Date <span className="text-danger">*</span>
            </label>
            <input
              type="date"
              className="form-control"
              id="exam_date"
              name="exam_date"
              value={formData.exam_date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="start_time" className="form-label">
                Start Time <span className="text-danger">*</span>
              </label>
              <input
                type="time"
                className="form-control"
                id="start_time"
                name="start_time"
                value={formData.start_time}
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-md-6 mb-3">
              <label htmlFor="end_time" className="form-label">
                End Time <span className="text-danger">*</span>
              </label>
              <input
                type="time"
                className="form-control"
                id="end_time"
                name="end_time"
                value={formData.end_time}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="d-flex gap-2">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Saving' : 'Save Exam'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => router.push('/admin/exams')}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
