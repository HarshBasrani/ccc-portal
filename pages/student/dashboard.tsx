// pages/student/dashboard.tsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { legacyClient } from '../../lib/legacyClient'

interface Exam {
  id: string
  name: string
  exam_date: string
  start_time: string
  end_time: string
  duration_minutes: number
  status: string
}

interface ExamAssignment {
  id: string
  status: string
  exam_id: string
  exams: Exam
}

interface Student {
  id: string
  profile_id: string
  first_name?: string
  last_name?: string
}

export default function StudentDashboard() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [starting, setStarting] = useState<string | null>(null)

  const [student, setStudent] = useState<Student | null>(null)
  const [assignments, setAssignments] = useState<ExamAssignment[]>([])

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await legacyClient.auth.getUser()

      if (!user) {
        router.replace('/login')
        return
      }

      const { data: existingStudents } = await legacyClient
        .from('students')
        .select('id, profile_id, first_name, last_name')
        .eq('profile_id', user.id)

      let studentData: Student | null = null

      if (existingStudents && existingStudents.length > 0) {
        studentData = existingStudents[0]
      } else {
        const { data: newStudent, error: createError } = await legacyClient
          .from('students')
          .insert({
            profile_id: user.id,
            status: 'approved'
          })
          .select('id, profile_id')
          .single()

        if (createError) {
          setError('Failed to create student profile: ' + createError.message)
          setLoading(false)
          return
        }
        studentData = newStudent
      }

      if (!studentData) {
        setError('Your student profile is not set up yet.')
        setLoading(false)
        return
      }

      setStudent(studentData)

      const { data: assignmentsData, error: assignmentsError } = await legacyClient
        .from('exam_assignments')
        .select(`
          id,
          status,
          exam_id,
          exams:exam_id (
            id,
            name,
            exam_date,
            start_time,
            end_time,
            duration_minutes,
            status
          )
        `)
        .eq('student_id', studentData.id)

      if (assignmentsError) {
        setError('Failed to load exam assignments.')
        setLoading(false)
        return
      }

      const processedAssignments: ExamAssignment[] = (assignmentsData || []).map((a: any) => ({
        id: a.id,
        status: a.status,
        exam_id: a.exam_id,
        exams: Array.isArray(a.exams) ? a.exams[0] : a.exams
      })).filter((a: ExamAssignment) => a.exams !== null)

      setAssignments(processedAssignments)
      setLoading(false)
    }

    loadData()
  }, [router])

  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    return new Date(dateString + 'T00:00:00').toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    if (!timeString) return '-'
    return timeString.slice(0, 5)
  }

  const getTodayDate = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const getCurrentTime = () => {
    const now = new Date()
    return now.toTimeString().slice(0, 5)
  }

  const canStartExam = (assignment: ExamAssignment): boolean => {
    const exam = assignment.exams
    const today = getTodayDate()
    const now = getCurrentTime()

    return (
      assignment.status !== 'completed' &&
      exam.status !== 'cancelled' &&
      today === exam.exam_date &&
      now >= exam.start_time.slice(0, 5) &&
      now <= exam.end_time.slice(0, 5)
    )
  }

  const getStatusText = (assignment: ExamAssignment): string => {
    const exam = assignment.exams
    const today = getTodayDate()
    const now = getCurrentTime()

    if (assignment.status === 'completed') return 'Completed'
    if (exam.status === 'cancelled') return 'Cancelled'
    if (today < exam.exam_date) return 'Scheduled'
    if (today > exam.exam_date) return 'Expired'
    if (now < exam.start_time.slice(0, 5)) return 'Not Started'
    if (now > exam.end_time.slice(0, 5)) return 'Time Closed'
    return 'Available'
  }

  const handleStartExam = async (assignment: ExamAssignment) => {
    if (!student) return

    const exam = assignment.exams
    setStarting(assignment.id)
    setMessage(null)
    setError(null)

    try {
      const { data: existingAttempt } = await legacyClient
        .from('exam_attempts')
        .select('id, status')
        .eq('exam_id', exam.id)
        .eq('student_id', student.id)
        .maybeSingle()

      if (existingAttempt) {
        if (existingAttempt.status === 'in_progress') {
          router.push('/exam/' + existingAttempt.id)
          return
        }

        if (existingAttempt.status === 'submitted' || existingAttempt.status === 'completed' || existingAttempt.status === 'auto_submitted') {
          setMessage('You already completed this exam.')
          setStarting(null)
          return
        }
      }

      const { data: newAttempt, error: insertError } = await legacyClient
        .from('exam_attempts')
        .insert({
          exam_id: exam.id,
          student_id: student.id,
          started_at: new Date().toISOString(),
          status: 'in_progress'
        })
        .select('id')
        .single()

      if (insertError) {
        throw new Error(insertError.message)
      }

      if (newAttempt) {
        router.push('/exam/' + newAttempt.id)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start exam')
      setStarting(null)
    }
  }

  if (loading) {
    return (
      <div style={{ background: 'var(--light-bg)', minHeight: 'calc(100vh - 70px)' }}>
        <div className="container py-5">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Student Dashboard  CCC Exam Portal</title>
      </Head>
      <div style={{ background: 'var(--light-bg)', minHeight: 'calc(100vh - 70px)', padding: '2rem 0' }}>
        <div className="container">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4 fade-in">
            <div>
              <h1 className="page-title">
                Welcome back{student?.first_name ? `, ${student.first_name}` : ''}! 
              </h1>
              <p className="page-subtitle">Here's your exam overview and upcoming schedules</p>
            </div>
          </div>

          {error && (
            <div className="alert-premium alert-danger mb-4 fade-in">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="alert-premium alert-info mb-4 fade-in">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
              <span>{message}</span>
            </div>
          )}

          {!student ? (
            <div className="alert-premium alert-warning">
              Your student profile is not set up yet. Please contact the administrator.
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="row g-4 mb-4">
                <div className="col-md-4">
                  <div className="stats-card primary fade-in stagger-1">
                    <div className="card-body p-4">
                      <div className="d-flex align-items-center">
                        <div className="stats-icon" style={{ background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%)' }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                          </svg>
                        </div>
                        <div className="ms-3">
                          <div className="stats-value">{assignments.length}</div>
                          <div className="stats-label">Assigned Exams</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="stats-card success fade-in stagger-2">
                    <div className="card-body p-4">
                      <div className="d-flex align-items-center">
                        <div className="stats-icon" style={{ background: 'linear-gradient(135deg, rgba(17, 153, 142, 0.15) 0%, rgba(56, 239, 125, 0.15) 100%)' }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#11998e" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                            <polyline points="22 4 12 14.01 9 11.01"/>
                          </svg>
                        </div>
                        <div className="ms-3">
                          <div className="stats-value">{assignments.filter(a => a.status === 'completed').length}</div>
                          <div className="stats-label">Completed</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="stats-card warning fade-in stagger-3">
                    <div className="card-body p-4">
                      <div className="d-flex align-items-center">
                        <div className="stats-icon" style={{ background: 'linear-gradient(135deg, rgba(242, 153, 74, 0.15) 0%, rgba(242, 201, 76, 0.15) 100%)' }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f2994a" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                          </svg>
                        </div>
                        <div className="ms-3">
                          <div className="stats-value">{assignments.filter(a => a.status !== 'completed').length}</div>
                          <div className="stats-label">Pending</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Exams Table */}
              <div className="premium-card fade-in" style={{ animationDelay: '0.3s' }}>
                <div className="premium-card-header d-flex justify-content-between align-items-center">
                  <h5 className="mb-0 d-flex align-items-center gap-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    My Assigned Exams
                  </h5>
                </div>
                <div className="premium-card-body p-0">
                  {assignments.length === 0 ? (
                    <div className="text-center py-5">
                      <div style={{
                        width: '80px',
                        height: '80px',
                        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                        borderRadius: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem'
                      }}>
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#a0aec0" strokeWidth="1.5">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                        </svg>
                      </div>
                      <h5 className="text-muted mb-2">No Exams Assigned Yet</h5>
                      <p className="text-muted small">When your institute assigns exams, they'll appear here.</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table-premium">
                        <thead>
                          <tr>
                            <th>Exam Name</th>
                            <th>Date</th>
                            <th>Time Window</th>
                            <th>Duration</th>
                            <th>Status</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {assignments.map((assignment) => {
                            const exam = assignment.exams
                            const canStart = canStartExam(assignment)
                            const statusText = getStatusText(assignment)

                            return (
                              <tr key={assignment.id}>
                                <td className="fw-medium" style={{ color: 'var(--light-text)' }}>{exam.name}</td>
                                <td>{formatDate(exam.exam_date)}</td>
                                <td>{formatTime(exam.start_time)}  {formatTime(exam.end_time)}</td>
                                <td>{exam.duration_minutes} min</td>
                                <td>
                                  <span className={`badge-premium ${
                                    statusText === 'Completed' ? 'badge-success' :
                                    statusText === 'Available' ? 'badge-info' :
                                    statusText === 'Scheduled' ? 'badge-primary' :
                                    statusText === 'Cancelled' || statusText === 'Expired' ? 'badge-danger' :
                                    'badge-warning'
                                  }`}>
                                    {statusText}
                                  </span>
                                </td>
                                <td>
                                  {canStart ? (
                                    <button
                                      className="btn-premium btn-premium-primary btn-premium-sm"
                                      onClick={() => handleStartExam(assignment)}
                                      disabled={starting === assignment.id}
                                    >
                                      {starting === assignment.id ? (
                                        <>
                                          <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                                          Starting...
                                        </>
                                      ) : (
                                        <>
                                          Start Exam
                                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="5" y1="12" x2="19" y2="12"/>
                                            <polyline points="12 5 19 12 12 19"/>
                                          </svg>
                                        </>
                                      )}
                                    </button>
                                  ) : (
                                    <span className="text-muted small"></span>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Links */}
              <div className="row g-4 mt-2">
                <div className="col-md-6">
                  <div className="dashboard-card exams fade-in" style={{ animationDelay: '0.4s' }}>
                    <div className="card-icon"></div>
                    <h5 className="fw-bold mb-2">My Exams</h5>
                    <p className="text-muted small mb-3">View all your assigned exams and their schedules.</p>
                    <Link href="/student/exams" className="btn-premium btn-premium-primary btn-premium-sm">
                      View All Exams
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="5" y1="12" x2="19" y2="12"/>
                        <polyline points="12 5 19 12 12 19"/>
                      </svg>
                    </Link>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="dashboard-card students fade-in" style={{ animationDelay: '0.5s' }}>
                    <div className="card-icon"></div>
                    <h5 className="fw-bold mb-2">My Profile</h5>
                    <p className="text-muted small mb-3">View and manage your personal information.</p>
                    <Link href="/student/profile" className="btn-premium btn-premium-primary btn-premium-sm">
                      View Profile
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="5" y1="12" x2="19" y2="12"/>
                        <polyline points="12 5 19 12 12 19"/>
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
