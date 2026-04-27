// pages/admin/exams/[id]/assign.tsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { db } from '../../../../lib/dbClient'

interface Student {
  id: string
  profile_id: string
  enrollment_no: string
  name: string
  email: string
}

interface Exam {
  id: string
  name: string
}

export default function AssignStudents() {
  const router = useRouter()
  const { id } = router.query

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [exam, setExam] = useState<Exam | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [assignedStudents, setAssignedStudents] = useState<string[]>([])

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

      await Promise.all([fetchExam(), fetchStudents(), fetchAssignedStudents()])
      setLoading(false)
    }

    checkAdminAndFetch()
  }, [id, router])

  const fetchExam = async () => {
    const { data } = await db
      .from('exams')
      .select('id, name')
      .eq('id', id)
      .single()

    if (data) {
      setExam(data)
    }
  }

  const fetchStudents = async () => {
    const { data, error } = await db
      .from('students')
      .select(`
        id,
        profile_id,
        enrollment_no,
        profiles (
          full_name,
          email
        )
      `)
      .order('enrollment_no', { ascending: true })

    if (data) {
      const formatted = data.map((student: any) => ({
        id: student.id,
        profile_id: student.profile_id,
        enrollment_no: student.enrollment_no || '-',
        name: student.profiles?.full_name || '-',
        email: student.profiles?.email || '-'
      }))
      setStudents(formatted)
    }
  }

  const fetchAssignedStudents = async () => {
    const { data } = await db
      .from('exam_assignments')
      .select('student_id')
      .eq('exam_id', id)

    if (data) {
      const assigned = data.map((a: any) => a.student_id)
      setAssignedStudents(assigned)
      setSelectedStudents(assigned)
    }
  }

  const handleCheckboxChange = (studentId: string) => {
    setSelectedStudents((prev) => {
      if (prev.includes(studentId)) {
        return prev.filter((id) => id !== studentId)
      } else {
        return [...prev, studentId]
      }
    })
  }

  const handleSelectAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([])
    } else {
      setSelectedStudents(students.map((s) => s.id))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      // Remove existing assignments for this exam
      const { error: deleteError } = await db
        .from('exam_assignments')
        .delete()
        .eq('exam_id', id)

      if (deleteError) {
        throw new Error(deleteError.message)
      }

      // Insert new assignments
      if (selectedStudents.length > 0) {
        const assignments = selectedStudents.map((studentId) => ({
          exam_id: id,
          student_id: studentId
        }))

        const { error: insertError } = await db
          .from('exam_assignments')
          .insert(assignments)

        if (insertError) {
          throw new Error(insertError.message)
        }
      }

      setAssignedStudents(selectedStudents)
      setSuccess(`Successfully assigned ${selectedStudents.length} student(s) to this exam.`)
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
        <title>Assign Students  {exam.name}  CCC Exam Portal</title>
      </Head>
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h1 className="h4 mb-0">Assign Students</h1>
            <small className="text-muted">Exam: {exam.name}</small>
          </div>
          <Link href="/admin/exams" className="btn btn-outline-secondary btn-sm">
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

        <form onSubmit={handleSubmit}>
          <div className="card mb-3">
            <div className="card-header d-flex justify-content-between align-items-center">
              <span>Select Students</span>
              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={handleSelectAll}
              >
                {selectedStudents.length === students.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="card-body" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {students.length === 0 ? (
                <p className="text-muted mb-0">No students found.</p>
              ) : (
                <div className="list-group">
                  {students.map((student) => (
                    <label
                      key={student.id}
                      className="list-group-item list-group-item-action d-flex align-items-center"
                      style={{ cursor: 'pointer' }}
                    >
                      <input
                        type="checkbox"
                        className="form-check-input me-3"
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => handleCheckboxChange(student.id)}
                      />
                      <div className="flex-grow-1">
                        <div className="fw-medium">{student.name}</div>
                        <small className="text-muted">
                          {student.enrollment_no}  {student.email}
                        </small>
                      </div>
                      {assignedStudents.includes(student.id) && (
                        <span className="badge bg-info">Assigned</span>
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="card-footer">
              <small className="text-muted">
                {selectedStudents.length} student(s) selected
              </small>
            </div>
          </div>

          <div className="d-flex gap-2">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Saving' : 'Save Assignments'}
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
