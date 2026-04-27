// pages/admin/exams/[id].tsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { db } from '../../../lib/dbClient'

interface Exam {
  id: string
  name: string
  course_id: string
  exam_date: string
  start_time: string
  end_time: string
  duration_minutes: number
  status: string
}

interface Course {
  id: string
  name: string
}

export default function EditExam() {
  const router = useRouter()
  const { id } = router.query

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [courses, setCourses] = useState<Course[]>([])
  const [exam, setExam] = useState<Exam | null>(null)

  // Form fields
  const [name, setName] = useState('')
  const [courseId, setCourseId] = useState('')
  const [examDate, setExamDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [status, setStatus] = useState('active')

  useEffect(() => {
    if (!id) return

    const checkAdminAndFetch = async () => {
      const { data: { user } } = await db.auth.getUser()

      if (!user) {
        router.replace('/login')
        return
      }

      const { data: profile } = await db
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin') {
        router.replace('/student/dashboard')
        return
      }

      // Fetch courses
      const { data: coursesData } = await db
        .from('courses')
        .select('id, name')
        .order('name')

      if (coursesData) {
        setCourses(coursesData)
      }

      // Fetch exam
      const { data: examData, error: examError } = await db
        .from('exams')
        .select('*')
        .eq('id', id)
        .single()

      if (examError || !examData) {
        setError('Exam not found.')
        setLoading(false)
        return
      }

      setExam(examData)
      setName(examData.name || '')
      setCourseId(examData.course_id || '')
      setExamDate(examData.exam_date || '')
      setStartTime(examData.start_time?.slice(0, 5) || '')
      setEndTime(examData.end_time?.slice(0, 5) || '')
      setDurationMinutes(examData.duration_minutes || 60)
      setStatus(examData.status || 'active')

      setLoading(false)
    }

    checkAdminAndFetch()
  }, [id, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const { error: updateError } = await db
        .from('exams')
        .update({
          name,
          course_id: courseId,
          exam_date: examDate,
          start_time: startTime,
          end_time: endTime,
          duration_minutes: durationMinutes,
          status
        })
        .eq('id', id)

      if (updateError) {
        throw new Error(updateError.message)
      }

      setSuccess('Exam updated successfully!')
    } catch (err: any) {
      setError(err.message || 'Failed to update exam')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mt-4">
        <p>Loading exam...</p>
      </div>
    )
  }

  if (!exam) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">Exam not found.</div>
        <Link href="/admin/exams" className="btn btn-secondary">
          Back to Exams
        </Link>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Edit Exam  {exam.name}  CCC Exam Portal</title>
      </Head>
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1>Edit Exam</h1>
          <Link href="/admin/exams" className="btn btn-outline-secondary">
            Back to Exams
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

        <div className="card">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="name" className="form-label">Exam Name *</label>
                <input
                  type="text"
                  id="name"
                  className="form-control"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label htmlFor="courseId" className="form-label">Course *</label>
                <select
                  id="courseId"
                  className="form-select"
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  required
                >
                  <option value="">Select a course</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="row">
                <div className="col-md-4 mb-3">
                  <label htmlFor="examDate" className="form-label">Exam Date *</label>
                  <input
                    type="date"
                    id="examDate"
                    className="form-control"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    required
                  />
                </div>

                <div className="col-md-4 mb-3">
                  <label htmlFor="startTime" className="form-label">Start Time *</label>
                  <input
                    type="time"
                    id="startTime"
                    className="form-control"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>

                <div className="col-md-4 mb-3">
                  <label htmlFor="endTime" className="form-label">End Time *</label>
                  <input
                    type="time"
                    id="endTime"
                    className="form-control"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="durationMinutes" className="form-label">Duration (minutes) *</label>
                  <input
                    type="number"
                    id="durationMinutes"
                    className="form-control"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 60)}
                    min="1"
                    required
                  />
                </div>

                <div className="col-md-6 mb-3">
                  <label htmlFor="status" className="form-label">Status *</label>
                  <select
                    id="status"
                    className="form-select"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    required
                  >
                    <option value="active">Active</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="d-flex gap-2">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <Link href="/admin/exams" className="btn btn-secondary">
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
