// pages/student/exams/[examId]/terms.tsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { db } from '../../../../lib/dbClient'

interface Student {
  id: string
  profile_id: string
  full_name: string
  enrollment_number: string
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

export default function ExamTerms() {
  const router = useRouter()
  const { examId } = router.query

  const [loading, setLoading] = useState(true)
  const [proceeding, setProceeding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [student, setStudent] = useState<Student | null>(null)
  const [exam, setExam] = useState<Exam | null>(null)
  const [agreed, setAgreed] = useState(false)
  const [understoodRules, setUnderstoodRules] = useState(false)
  const [acceptedConsequences, setAcceptedConsequences] = useState(false)

  useEffect(() => {
    if (!examId) return

    const loadData = async () => {
      try {
        //  AUTH + STUDENT LOAD
        const { data: { user } } = await db.auth.getUser()

        if (!user) {
          router.replace('/login')
          return
        }

        console.log('Current user ID:', user.id) // Debug log

        // Fetch student with profile data - using correct column names
        const { data: studentData, error: studentError } = await db
          .from('students')
          .select(`
            id,
            profile_id,
            enrollment_no,
            status,
            profiles(full_name)
          `)
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

        const profile = Array.isArray(studentData.profiles) ? studentData.profiles[0] : studentData.profiles

        setStudent({
          id: studentData.id,
          profile_id: studentData.profile_id,
          enrollment_number: studentData.enrollment_no,
          full_name: profile?.full_name || 'Student'
        })

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

      setLoading(false)
    } catch (error: any) {
      console.error('Unexpected error in loadData:', error)
      setError('An unexpected error occurred. Please refresh the page and try again.')
      setLoading(false)
    }
  }

  loadData()
}, [examId, router])

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

  const canProceed = agreed && understoodRules && acceptedConsequences

  const handleProceed = async () => {
    if (!canProceed || !student || !examId) return

    setProceeding(true)

    try {
      // Log terms acceptance
      const { error: logError } = await db
        .from('audit_logs')
        .insert({
          user_id: student.profile_id,
          action: 'exam_terms_accepted',
          details: {
            exam_id: examId,
            student_id: student.id,
            exam_name: exam?.name,
            accepted_at: new Date().toISOString(),
            ip_address: 'client', // In production, you'd get actual IP
            user_agent: navigator.userAgent
          }
        })

      if (logError) {
        console.warn('Failed to log terms acceptance:', logError)
      }

      // Check if existing attempt
      const { data: existing } = await db
        .from('exam_attempts')
        .select('id, status')
        .eq('exam_id', examId)
        .eq('student_id', student.id)
        .maybeSingle()

      if (existing) {
        if (existing.status === 'submitted' || existing.status === 'completed' || existing.status === 'auto_submitted') {
          setError('You have already completed this exam.')
          setProceeding(false)
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
      setError(err.message || 'Failed to proceed')
      setProceeding(false)
    }
  }

  if (loading) {
    return (
      <div style={{ background: 'var(--light-bg)', minHeight: 'calc(100vh - 70px)' }}>
        <div className="container py-5">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading exam terms...</p>
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

  if (!exam || !student) {
    return (
      <div style={{ background: 'var(--light-bg)', minHeight: 'calc(100vh - 70px)', padding: '2rem 0' }}>
        <div className="container">
          <div className="alert alert-danger">Required data not found.</div>
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
        <title>Exam Terms & Conditions  {exam.name}  CCC Exam Portal</title>
      </Head>
      <div style={{ background: 'var(--light-bg)', minHeight: 'calc(100vh - 70px)', padding: '2rem 0' }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-10 col-xl-8">
              <div className="premium-card fade-in">
                {/* Header */}
                <div className="premium-card-header" style={{ 
                  background: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)',
                  color: 'white',
                  padding: '2rem'
                }}>
                  <div className="text-center">
                    <div style={{
                      width: '80px',
                      height: '80px',
                      background: 'rgba(255, 255, 255, 0.2)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 1rem'
                    }}>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                    </div>
                    <h3 className="mb-2">EXAM TERMS & CONDITIONS</h3>
                    <p className="mb-0 opacity-90">Please read carefully and accept all terms before proceeding</p>
                  </div>
                </div>

                <div className="premium-card-body">
                  {/* Student & Exam Info */}
                  <div className="glass-card p-4 mb-4">
                    <div className="row">
                      <div className="col-md-6">
                        <h6 className="text-muted mb-2">STUDENT INFORMATION</h6>
                        <div className="fw-bold mb-1">{student.full_name}</div>
                        <div className="text-muted small">Enrollment: {student.enrollment_number}</div>
                      </div>
                      <div className="col-md-6 mt-3 mt-md-0">
                        <h6 className="text-muted mb-2">EXAM INFORMATION</h6>
                        <div className="fw-bold mb-1">{exam.name}</div>
                        <div className="text-muted small">
                          {formatDate(exam.exam_date)} | {formatTime(exam.start_time)} - {formatTime(exam.end_time)} | Duration: {exam.duration_minutes} min
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Terms Sections */}
                  <div className="mb-4">
                    <h5 className="mb-3 d-flex align-items-center gap-2 text-danger">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/>
                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                      </svg>
                      EXAM CONDUCT RULES
                    </h5>
                    
                    <div className="glass-card p-0 mb-4">
                      <div className="list-group list-group-flush">
                        <div className="list-group-item border-0 p-3">
                          <div className="d-flex gap-3">
                            <div className="text-danger">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="15" y1="9" x2="9" y2="15"/>
                                <line x1="9" y1="9" x2="15" y2="15"/>
                              </svg>
                            </div>
                            <div>
                              <strong>No External Assistance</strong>
                              <p className="mb-0 text-muted small mt-1">You must not seek help from any person, book, website, or external source during the exam.</p>
                            </div>
                          </div>
                        </div>
                        <div className="list-group-item border-0 border-top p-3">
                          <div className="d-flex gap-3">
                            <div className="text-danger">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                                <line x1="8" y1="21" x2="16" y2="21"/>
                                <line x1="12" y1="17" x2="12" y2="21"/>
                              </svg>
                            </div>
                            <div>
                              <strong>Single Device Policy</strong>
                              <p className="mb-0 text-muted small mt-1">Use only the device you're currently on. Do not switch devices during the exam.</p>
                            </div>
                          </div>
                        </div>
                        <div className="list-group-item border-0 border-top p-3">
                          <div className="d-flex gap-3">
                            <div className="text-warning">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"/>
                                <polyline points="12 6 12 12 16 14"/>
                              </svg>
                            </div>
                            <div>
                              <strong>Time Management</strong>
                              <p className="mb-0 text-muted small mt-1">You have exactly {exam.duration_minutes} minutes to complete the exam. Plan your time wisely.</p>
                            </div>
                          </div>
                        </div>
                        <div className="list-group-item border-0 border-top p-3">
                          <div className="d-flex gap-3">
                            <div className="text-info">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                                <line x1="16" y1="13" x2="8" y2="13"/>
                                <line x1="16" y1="17" x2="8" y2="17"/>
                                <line x1="10" y1="9" x2="8" y2="9"/>
                              </svg>
                            </div>
                            <div>
                              <strong>Auto-Save Enabled</strong>
                              <p className="mb-0 text-muted small mt-1">Your answers will be automatically saved every 10 seconds. No need to manually save.</p>
                            </div>
                          </div>
                        </div>
                        <div className="list-group-item border-0 border-top p-3">
                          <div className="d-flex gap-3">
                            <div className="text-success">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                                <polyline points="22 4 12 14.01 9 11.01"/>
                              </svg>
                            </div>
                            <div>
                              <strong>Single Attempt Only</strong>
                              <p className="mb-0 text-muted small mt-1">You get only ONE attempt. Once submitted, you cannot retake the exam.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h5 className="mb-3 d-flex align-items-center gap-2 text-warning">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 12l2 2 4-4"/>
                        <path d="M21 12c.552 0 1-.448 1-1V5c0-.552-.448-1-1-1H3c-.552 0-1 .448-1 1v6c0 .552.448 1 1 1h9l4 4z"/>
                      </svg>
                      MONITORING & SECURITY
                    </h5>
                    
                    <div className="glass-card p-0 mb-4">
                      <div className="list-group list-group-flush">
                        <div className="list-group-item border-0 p-3">
                          <div className="d-flex gap-3">
                            <div className="text-warning">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M2 3h6l4 4h8a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V3z"/>
                              </svg>
                            </div>
                            <div>
                              <strong>Session Monitoring</strong>
                              <p className="mb-0 text-muted small mt-1">Your exam session is monitored and logged for security purposes.</p>
                            </div>
                          </div>
                        </div>
                        <div className="list-group-item border-0 border-top p-3">
                          <div className="d-flex gap-3">
                            <div className="text-info">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                              </svg>
                            </div>
                            <div>
                              <strong>Anti-Cheating Detection</strong>
                              <p className="mb-0 text-muted small mt-1">Tab switching, window switching, and suspicious activities are tracked.</p>
                            </div>
                          </div>
                        </div>
                        <div className="list-group-item border-0 border-top p-3">
                          <div className="d-flex gap-3">
                            <div className="text-primary">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                              </svg>
                            </div>
                            <div>
                              <strong>Secure Environment</strong>
                              <p className="mb-0 text-muted small mt-1">The exam environment is secured against copy-paste and right-click actions.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h5 className="mb-3 d-flex align-items-center gap-2 text-danger">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/>
                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                      </svg>
                      CONSEQUENCES OF VIOLATIONS
                    </h5>
                    
                    <div className="alert alert-danger">
                      <div className="d-flex gap-3">
                        <div className="text-danger">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="15" y1="9" x2="9" y2="15"/>
                            <line x1="9" y1="9" x2="15" y2="15"/>
                          </svg>
                        </div>
                        <div>
                          <strong>Academic Dishonesty Policy</strong>
                          <ul className="mb-0 mt-2">
                            <li>Violation of exam rules will result in immediate disqualification</li>
                            <li>Your exam may be terminated and marked as failed</li>
                            <li>Serious violations may result in course failure</li>
                            <li>All violations are logged and reported to academic authorities</li>
                            <li>No appeals will be considered for proven violations</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Agreement Checkboxes */}
                  <div className="mb-4">
                    <h5 className="mb-3 text-success">ACCEPTANCE DECLARATION</h5>
                    
                    <div className="glass-card p-4">
                      <div className="form-check mb-3">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="agreeTerms"
                          checked={agreed}
                          onChange={(e) => setAgreed(e.target.checked)}
                        />
                        <label className="form-check-label fw-semibold" htmlFor="agreeTerms">
                          <strong>I agree to all the terms and conditions</strong> stated above for this examination.
                        </label>
                      </div>
                      
                      <div className="form-check mb-3">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="understoodRules"
                          checked={understoodRules}
                          onChange={(e) => setUnderstoodRules(e.target.checked)}
                        />
                        <label className="form-check-label fw-semibold" htmlFor="understoodRules">
                          <strong>I have read and understood</strong> all the exam conduct rules and monitoring policies.
                        </label>
                      </div>
                      
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="acceptedConsequences"
                          checked={acceptedConsequences}
                          onChange={(e) => setAcceptedConsequences(e.target.checked)}
                        />
                        <label className="form-check-label fw-semibold" htmlFor="acceptedConsequences">
                          <strong>I acknowledge the consequences</strong> of any violation and agree to abide by academic integrity policies.
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="d-flex gap-3 justify-content-center">
                    <button
                      className={`btn-premium ${canProceed ? 'btn-premium-success' : 'btn-premium-outline'} btn-premium-lg`}
                      onClick={handleProceed}
                      disabled={!canProceed || proceeding}
                      style={{ 
                        opacity: (!canProceed || proceeding) ? 0.6 : 1,
                        minWidth: '200px'
                      }}
                    >
                      {proceeding ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Proceeding...
                        </>
                      ) : canProceed ? (
                        <>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                            <polyline points="22 4 12 14.01 9 11.01"/>
                          </svg>
                          I Accept - Proceed to Exam
                        </>
                      ) : (
                        <>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                          </svg>
                          Accept All Terms to Proceed
                        </>
                      )}
                    </button>
                    
                    <Link href="/student/exams" className="btn-premium btn-premium-outline btn-premium-lg">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                      </svg>
                      Cancel
                    </Link>
                  </div>

                  <div className="text-center mt-4">
                    <small className="text-muted">
                      By proceeding, you confirm that you are {student.full_name} (Enrollment: {student.enrollment_number}) 
                      and are authorized to take this examination. Your acceptance of these terms is logged for academic integrity purposes.
                    </small>
                    <div className="mt-2">
                      <small className="text-muted">
                        This exam is conducted under the academic integrity policies of Infonix Computers. 
                        Any violation may result in disciplinary action as per institution guidelines.
                      </small>
                    </div>
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