// pages/student/exams/[examId]/start.tsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { db } from '../../../../lib/dbClient'

interface Student {
  id: string
  profile_id: string
}

interface Exam {
  id: string
  name: string
  exam_date: string
  start_time: string
  end_time: string
  duration_minutes: number
  status: string
}

export default function StartExam() {
  const router = useRouter()
  const { examId } = router.query

  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const [student, setStudent] = useState<Student | null>(null)
  const [exam, setExam] = useState<Exam | null>(null)
  const [canStart, setCanStart] = useState(false)
  const [timeStatus, setTimeStatus] = useState<string | null>(null)

  useEffect(() => {
    if (!examId) return

    const checkAndFetch = async () => {
      try {
        //  AUTH + STUDENT LOAD
        const { data: { user } } = await db.auth.getUser()

        if (!user) {
          router.replace('/login')
          return
        }

        console.log('Current user ID:', user.id) // Debug log

        // Fetch student row with correct column names
        const { data: studentData, error: studentError } = await db
          .from('students')
          .select('id, profile_id, enrollment_no, status')
          .eq('profile_id', user.id)
          .maybeSingle()

        console.log('Student query result:', { studentData, studentError }) // Debug log

        if (studentError) {
          console.error('Student lookup error:', studentError)
          setError('Database error: ' + studentError.message)
          setLoading(false)
          return
        }

        if (!studentData) {
          // No student record found - check user profile and provide helpful message
          const { data: profileData } = await db
            .from('profiles')
            .select('role, full_name')
            .eq('id', user.id)
            .single()

          if (profileData?.role === 'admin') {
            setError('Admin users cannot take exams. Please use a student account or contact administration to create a student profile.')
            setLoading(false)
            return
          } else {
            // Redirect to profile setup for missing student records
            router.replace('/student/setup-profile')
            return
          }
        }

        // Check if student is approved
        if (studentData.status !== 'approved') {
          setError('Your student account is not yet approved. Please contact administration.')
          setLoading(false)
          return
        }

      setStudent(studentData)

      //  LOAD EXAM
      const { data: examData, error: examError } = await db
        .from('exams')
        .select('id, name, exam_date, start_time, end_time, duration_minutes, status')
        .eq('id', examId)
        .single()

      if (examError || !examData) {
        setError('Exam not found.')
        setLoading(false)
        return
      }

      setExam(examData)

      //  VERIFY ASSIGNMENT
      const { data: assignment } = await db
        .from('exam_assignments')
        .select('id, status')
        .eq('exam_id', examId)
        .eq('student_id', studentData.id)
        .maybeSingle()

      if (!assignment) {
        setError('You are not assigned to this exam.')
        setLoading(false)
        return
      }

      //  CHECK TIME WINDOW
      checkTimeWindow(examData)

      setLoading(false)
    } catch (error: any) {
      console.error('Unexpected error in checkAndFetch:', error)
      setError('An unexpected error occurred. Please refresh the page and try again.')
      setLoading(false)
    }
  }

  checkAndFetch()
}, [examId, router])

  const checkTimeWindow = (examData: Exam) => {
    const now = new Date()
    
    // Get today's date in yyyy-mm-dd format
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const todayStr = `${year}-${month}-${day}`
    
    const examDate = examData.exam_date

    // Check if today is exam date
    if (todayStr !== examDate) {
      if (todayStr < examDate) {
        setTimeStatus(`This exam is scheduled for ${formatDate(examDate)}.`)
        setCanStart(false)
        return
      } else {
        setTimeStatus('Exam date has passed.')
        setCanStart(false)
        return
      }
    }

    // Check time window
    const currentTime = now.toTimeString().slice(0, 5)
    const startTime = examData.start_time.slice(0, 5)
    const endTime = examData.end_time.slice(0, 5)

    if (currentTime < startTime) {
      setTimeStatus(`Exam hasn't started yet. Starts at ${startTime}.`)
      setCanStart(false)
    } else if (currentTime > endTime) {
      setTimeStatus('Exam window has closed.')
      setCanStart(false)
    } else {
      setTimeStatus(null)
      setCanStart(true)
    }
  }

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

  //  START / RESUME ATTEMPT
  const handleStart = async () => {
    if (!student || !examId) return

    setStarting(true)
    setError(null)
    setMessage(null)

    try {
      // Check if existing attempt
      const { data: existing } = await db
        .from('exam_attempts')
        .select('id, status')
        .eq('exam_id', examId)
        .eq('student_id', student.id)
        .maybeSingle()

      if (existing) {
        if (existing.status === 'submitted' || existing.status === 'completed' || existing.status === 'auto_submitted') {
          setMessage('You have already completed this exam.')
          setStarting(false)
          return
        }

        if (existing.status === 'in_progress') {
          // Resume existing attempt
          router.push('/exam/' + existing.id)
          return
        }
      }

      // Create a new attempt if none exists
      const { data: newAttempt, error: insertError } = await db
        .from('exam_attempts')
        .insert({
          exam_id: examId,
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
      setStarting(false)
    }
  }

  if (loading) {
    return (
      <div style={{ background: 'var(--light-bg)', minHeight: 'calc(100vh - 70px)' }}>
        <div className="container py-5">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading exam details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ background: 'var(--light-bg)', minHeight: 'calc(100vh - 70px)', padding: '2rem 0' }}>
        <div className="container">
          <div className="alert alert-danger d-flex align-items-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="me-2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            {error}
          </div>
          <Link href="/student/exams" className="btn-premium btn-premium-outline">
            Back to My Exams
          </Link>
        </div>
      </div>
    )
  }

  if (!exam) {
    return (
      <div style={{ background: 'var(--light-bg)', minHeight: 'calc(100vh - 70px)', padding: '2rem 0' }}>
        <div className="container">
          <div className="alert alert-danger">Exam not found.</div>
          <Link href="/student/exams" className="btn-premium btn-premium-outline">
            Back to My Exams
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Start Exam  {exam.name}  CCC Exam Portal</title>
      </Head>
      <div style={{ background: 'var(--light-bg)', minHeight: 'calc(100vh - 70px)', padding: '2rem 0' }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="premium-card fade-in">
                <div className="premium-card-header" style={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  padding: '1.5rem'
                }}>
                  <h4 className="mb-0 d-flex align-items-center gap-2">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    {exam.name}
                  </h4>
                </div>
                <div className="premium-card-body">
                  {message && (
                    <div className="alert alert-info d-flex align-items-center">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="me-2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="16" x2="12" y2="12"/>
                        <line x1="12" y1="8" x2="12.01" y2="8"/>
                      </svg>
                      {message}
                    </div>
                  )}

                  {timeStatus && (
                    <div className="alert alert-warning d-flex align-items-center">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="me-2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                      {timeStatus}
                    </div>
                  )}

                  <h5 className="mb-3 d-flex align-items-center gap-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="16" x2="12" y2="12"/>
                      <line x1="12" y1="8" x2="12.01" y2="8"/>
                    </svg>
                    Exam Details
                  </h5>
                  
                  <div className="glass-card p-0 mb-4" style={{ overflow: 'hidden' }}>
                    <table className="table table-premium mb-0">
                      <tbody>
                        <tr>
                          <th style={{ width: '40%', background: 'rgba(102, 126, 234, 0.05)' }}>Exam Name</th>
                          <td className="fw-semibold">{exam.name}</td>
                        </tr>
                        <tr>
                          <th style={{ background: 'rgba(102, 126, 234, 0.05)' }}>Exam Date</th>
                          <td>{formatDate(exam.exam_date)}</td>
                        </tr>
                        <tr>
                          <th style={{ background: 'rgba(102, 126, 234, 0.05)' }}>Time Window</th>
                          <td>{formatTime(exam.start_time)}  {formatTime(exam.end_time)}</td>
                        </tr>
                        <tr>
                          <th style={{ background: 'rgba(102, 126, 234, 0.05)' }}>Duration</th>
                          <td>
                            <span className="badge" style={{
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              padding: '0.5rem 1rem'
                            }}>
                              {exam.duration_minutes} minutes
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <h5 className="mt-4 mb-3 d-flex align-items-center gap-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F2994A" strokeWidth="2">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    Important Instructions
                  </h5>
                  
                  <div className="glass-card p-0 mb-4" style={{ overflow: 'hidden' }}>
                    <ul className="list-group list-group-flush">
                      <li className="list-group-item d-flex align-items-center gap-2" style={{ border: 'none', padding: '1rem 1.25rem' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#eb3349" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="15" y1="9" x2="9" y2="15"/>
                          <line x1="9" y1="9" x2="15" y2="15"/>
                        </svg>
                        Do not refresh the exam page.
                      </li>
                      <li className="list-group-item d-flex align-items-center gap-2" style={{ border: 'none', borderTop: '1px solid #e9ecef', padding: '1rem 1.25rem' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#11998e" strokeWidth="2">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                          <polyline points="22 4 12 14.01 9 11.01"/>
                        </svg>
                        Your answers will auto-save.
                      </li>
                      <li className="list-group-item d-flex align-items-center gap-2" style={{ border: 'none', borderTop: '1px solid #e9ecef', padding: '1rem 1.25rem' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/>
                          <polyline points="12 6 12 12 16 14"/>
                        </svg>
                        Timer will begin as soon as you start.
                      </li>
                      <li className="list-group-item d-flex align-items-center gap-2" style={{ border: 'none', borderTop: '1px solid #e9ecef', padding: '1rem 1.25rem' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F2994A" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/>
                          <polyline points="12 6 12 12 16 14"/>
                        </svg>
                        You have <strong className="mx-1">{exam.duration_minutes} minutes</strong> to complete the exam.
                      </li>
                      <li className="list-group-item d-flex align-items-center gap-2" style={{ border: 'none', borderTop: '1px solid #e9ecef', padding: '1rem 1.25rem' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#eb3349" strokeWidth="2">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                        You cannot re-attempt once the exam is submitted.
                      </li>
                    </ul>
                  </div>

                  <div className="d-flex gap-3">
                    <button
                      className="btn-premium btn-premium-success btn-premium-lg"
                      onClick={() => router.push(`/student/exams/${examId}/terms`)}
                      disabled={!canStart || !!message}
                      style={{ opacity: (!canStart || !!message) ? 0.6 : 1 }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                      Review Terms & Start Exam
                    </button>
                    <Link href="/student/exams" className="btn-premium btn-premium-outline btn-premium-lg">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                      </svg>
                      Back
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
