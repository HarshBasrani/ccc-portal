// pages/student/exams.tsx
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
  exam_id: string
  exams: Exam
}

export default function StudentExams() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [exams, setExams] = useState<Exam[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkStudentAndFetch = async () => {
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

      if (profile?.role === 'admin') {
        router.replace('/admin/dashboard')
        return
      }

      const { data: existingStudents, error: fetchStudentError } = await legacyClient
        .from('students')
        .select('id')
        .eq('profile_id', user.id)

      let studentId: string

      if (existingStudents && existingStudents.length > 0) {
        studentId = existingStudents[0].id
      } else {
        const { data: newStudent, error: createError } = await legacyClient
          .from('students')
          .insert({
            profile_id: user.id,
            status: 'approved'
          })
          .select('id')
          .single()

        if (createError || !newStudent) {
          setError('Failed to create student record: ' + (createError?.message || 'Unknown error'))
          setLoading(false)
          return
        }
        studentId = newStudent.id
      }

      const { data, error: fetchError } = await legacyClient
        .from('exam_assignments')
        .select(`
          exam_id,
          exams (
            id,
            name,
            exam_date,
            start_time,
            end_time,
            duration_minutes,
            status
          )
        `)
        .eq('student_id', studentId)

      if (fetchError) {
        setError(fetchError.message)
      } else if (data) {
        const assignedExams = data
          .map((a: any) => a.exams)
          .filter((e: any) => e !== null)
          .sort((a: Exam, b: Exam) => 
            new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime()
          )
        setExams(assignedExams)
      }

      setLoading(false)
    }

    checkStudentAndFetch()
  }, [router])

  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    if (!timeString) return '-'
    return timeString.slice(0, 5)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return { bg: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', text: 'Active' }
      case 'completed':
        return { bg: 'linear-gradient(135deg, #6c757d 0%, #495057 100%)', text: 'Completed' }
      case 'scheduled':
        return { bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', text: 'Scheduled' }
      case 'cancelled':
        return { bg: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)', text: 'Cancelled' }
      default:
        return { bg: 'linear-gradient(135deg, #F2994A 0%, #F2C94C 100%)', text: status }
    }
  }

  if (loading) {
    return (
      <div style={{ background: 'var(--light-bg)', minHeight: 'calc(100vh - 70px)' }}>
        <div className="container py-5">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading your exams...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>My Exams  CCC Exam Portal</title>
      </Head>
      <div style={{ background: 'var(--light-bg)', minHeight: 'calc(100vh - 70px)', padding: '2rem 0' }}>
        <div className="container">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4 fade-in">
            <div>
              <h1 className="page-title">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="url(#examGrad)" strokeWidth="2" style={{ marginRight: '0.5rem' }}>
                  <defs>
                    <linearGradient id="examGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#667eea" />
                      <stop offset="100%" stopColor="#764ba2" />
                    </linearGradient>
                  </defs>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
                My Exams
              </h1>
              <p className="page-subtitle">View your assigned exams and start when ready</p>
            </div>
            <Link href="/student/dashboard" className="btn-premium btn-premium-outline">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Back to Dashboard
            </Link>
          </div>

          {error && (
            <div className="alert alert-danger d-flex align-items-center fade-in" role="alert">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="me-2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              {error}
            </div>
          )}

          {!error && exams.length === 0 ? (
            <div className="premium-card text-center fade-in" style={{ padding: '4rem 2rem' }}>
              <div style={{
                width: '100px',
                height: '100px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                opacity: 0.8
              }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <h4 className="mb-3" style={{ color: 'var(--dark-text)' }}>No Exams Assigned Yet</h4>
              <p className="text-muted mb-0">You don't have any exams assigned to you at the moment.<br/>Check back later or contact your administrator.</p>
            </div>
          ) : !error && (
            <div className="premium-card fade-in">
              <div className="premium-card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0 d-flex align-items-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  Assigned Exams
                </h5>
                <span className="badge" style={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  fontSize: '0.85rem'
                }}>
                  {exams.length} exam{exams.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="premium-card-body p-0">
                <div className="table-responsive">
                  <table className="table table-premium mb-0">
                    <thead>
                      <tr>
                        <th>Exam Name</th>
                        <th>Date</th>
                        <th>Time Window</th>
                        <th>Duration</th>
                        <th>Status</th>
                        <th className="text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exams.map((exam, index) => {
                        const statusInfo = getStatusBadge(exam.status)
                        return (
                          <tr key={exam.id} className="fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                            <td>
                              <div className="d-flex align-items-center gap-3">
                                <div style={{
                                  width: '40px',
                                  height: '40px',
                                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                  borderRadius: '10px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}>
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                    <polyline points="14 2 14 8 20 8"/>
                                  </svg>
                                </div>
                                <span className="fw-semibold" style={{ color: 'var(--dark-text)' }}>{exam.name}</span>
                              </div>
                            </td>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2">
                                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                  <line x1="16" y1="2" x2="16" y2="6"/>
                                  <line x1="8" y1="2" x2="8" y2="6"/>
                                  <line x1="3" y1="10" x2="21" y2="10"/>
                                </svg>
                                {formatDate(exam.exam_date)}
                              </div>
                            </td>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#11998e" strokeWidth="2">
                                  <circle cx="12" cy="12" r="10"/>
                                  <polyline points="12 6 12 12 16 14"/>
                                </svg>
                                {formatTime(exam.start_time)}  {formatTime(exam.end_time)}
                              </div>
                            </td>
                            <td>
                              <span className="badge" style={{ 
                                background: 'rgba(102, 126, 234, 0.1)',
                                color: '#667eea',
                                padding: '0.4rem 0.8rem',
                                borderRadius: '6px',
                                fontWeight: '600'
                              }}>
                                {exam.duration_minutes} min
                              </span>
                            </td>
                            <td>
                              <span style={{
                                background: statusInfo.bg,
                                color: 'white',
                                padding: '0.4rem 0.8rem',
                                borderRadius: '20px',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                textTransform: 'capitalize',
                                display: 'inline-block'
                              }}>
                                {statusInfo.text}
                              </span>
                            </td>
                            <td className="text-center">
                              {exam.status === 'active' ? (
                                <Link
                                  href={`/student/exams/${exam.id}/start`}
                                  className="btn-premium btn-premium-success btn-premium-sm"
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polygon points="5 3 19 12 5 21 5 3"/>
                                  </svg>
                                  Start Exam
                                </Link>
                              ) : (
                                <span className="text-muted d-flex align-items-center justify-content-center gap-1">
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                  </svg>
                                  Not Available
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Info Card */}
          <div className="row mt-4">
            <div className="col-md-6 fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="glass-card p-4">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div style={{
                    width: '45px',
                    height: '45px',
                    background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                  </div>
                  <h6 className="mb-0 fw-bold">Exam Tips</h6>
                </div>
                <ul className="mb-0" style={{ paddingLeft: '1.2rem', color: 'var(--text-muted)' }}>
                  <li className="mb-2">Ensure stable internet connection before starting</li>
                  <li className="mb-2">Read all questions carefully before answering</li>
                  <li>Keep track of time using the on-screen timer</li>
                </ul>
              </div>
            </div>
            <div className="col-md-6 fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="glass-card p-4">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div style={{
                    width: '45px',
                    height: '45px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="16" x2="12" y2="12"/>
                      <line x1="12" y1="8" x2="12.01" y2="8"/>
                    </svg>
                  </div>
                  <h6 className="mb-0 fw-bold">Important Note</h6>
                </div>
                <ul className="mb-0" style={{ paddingLeft: '1.2rem', color: 'var(--text-muted)' }}>
                  <li className="mb-2">Only active exams can be started</li>
                  <li className="mb-2">Once started, the timer cannot be paused</li>
                  <li>Submit before time runs out for your answers to be saved</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
