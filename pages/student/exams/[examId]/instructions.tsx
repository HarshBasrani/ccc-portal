// pages/student/exams/[examId]/instructions.tsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { db } from '../../../../lib/dbClient'

interface Exam {
  id: string
  name: string
  exam_date: string
  start_time: string
  end_time: string
  duration_minutes: number
}

export default function ExamInstructions() {
  const router = useRouter()
  const { examId } = router.query
  const [loading, setLoading] = useState(true)
  const [exam, setExam] = useState<Exam | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!examId) return

    const loadExamDetails = async () => {
      // Check auth
      const { data: { user } } = await db.auth.getUser()

      if (!user) {
        router.replace('/login')
        return
      }

      // Get student ID
      const { data: students } = await db
        .from('students')
        .select('id')
        .eq('profile_id', user.id)

      if (!students || students.length === 0) {
        setError('Student record not found.')
        setLoading(false)
        return
      }

      // Fetch exam details
      const { data: examData, error: examError } = await db
        .from('exams')
        .select('id, name, exam_date, start_time, end_time, duration_minutes')
        .eq('id', examId)
        .single()

      if (examError || !examData) {
        setError('Exam not found.')
        setLoading(false)
        return
      }

      setExam(examData)
      setLoading(false)
    }

    loadExamDetails()
  }, [examId, router])

  const formatDateTime = (date: string, time: string) => {
    if (!date || !time) return 'TBA'
    const dateTime = new Date(`${date}T${time}`)
    return dateTime.toLocaleString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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

  if (error || !exam) {
    return (
      <div style={{ background: 'var(--light-bg)', minHeight: 'calc(100vh - 70px)', padding: '2rem 0' }}>
        <div className="container">
          <div className="alert alert-danger">{error || 'Exam not found.'}</div>
          <Link href="/student/exams" className="btn btn-secondary">
            Back to My Exams
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Exam Instructions  {exam.name}  CCC Exam Portal</title>
      </Head>
      <div style={{ background: 'var(--light-bg)', minHeight: 'calc(100vh - 70px)', padding: '2rem 0' }}>
        <div className="container">
          {/* Header */}
          <div className="text-center mb-5 fade-in">
            <div style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)'
            }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
            <h1 className="page-title">Exam Instructions</h1>
            <p className="page-subtitle">Please read all instructions carefully before proceeding</p>
          </div>

          {/* Exam Details Card */}
          <div className="premium-card mb-4 fade-in stagger-1">
            <div className="premium-card-header">
              <h5 className="mb-0 d-flex align-items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                Exam Details
              </h5>
            </div>
            <div className="premium-card-body">
              <div className="row">
                <div className="col-md-6 mb-3">
                  <div className="d-flex align-items-center gap-3">
                    <div style={{
                      width: '48px',
                      height: '48px',
                      background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                    </div>
                    <div>
                      <div className="fw-bold text-dark">{exam.name}</div>
                      <div className="text-muted small">Exam Name</div>
                    </div>
                  </div>
                </div>
                <div className="col-md-6 mb-3">
                  <div className="d-flex align-items-center gap-3">
                    <div style={{
                      width: '48px',
                      height: '48px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                    </div>
                    <div>
                      <div className="fw-bold text-dark">{exam.duration_minutes} minutes</div>
                      <div className="text-muted small">Duration</div>
                    </div>
                  </div>
                </div>
                <div className="col-md-6 mb-3">
                  <div className="d-flex align-items-center gap-3">
                    <div style={{
                      width: '48px',
                      height: '48px',
                      background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                    </div>
                    <div>
                      <div className="fw-bold text-dark">{formatDateTime(exam.exam_date, exam.start_time)}</div>
                      <div className="text-muted small">Start Time</div>
                    </div>
                  </div>
                </div>
                <div className="col-md-6 mb-3">
                  <div className="d-flex align-items-center gap-3">
                    <div style={{
                      width: '48px',
                      height: '48px',
                      background: 'linear-gradient(135deg, #F2994A 0%, #F2C94C 100%)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                    </div>
                    <div>
                      <div className="fw-bold text-dark">{formatDateTime(exam.exam_date, exam.end_time)}</div>
                      <div className="text-muted small">End Time</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions Grid */}
          <div className="row g-4 mb-5">
            {/* System Requirements */}
            <div className="col-lg-6">
              <div className="premium-card h-100 fade-in stagger-2">
                <div className="premium-card-header">
                  <h6 className="mb-0 d-flex align-items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#11998e" strokeWidth="2">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                      <line x1="8" y1="21" x2="16" y2="21"/>
                      <line x1="12" y1="17" x2="12" y2="21"/>
                    </svg>
                    System Requirements
                  </h6>
                </div>
                <div className="premium-card-body">
                  <ul className="list-unstyled">
                    <li className="d-flex align-items-start gap-2 mb-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#11998e" strokeWidth="2" className="mt-1" style={{flexShrink: 0}}>
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      <span>Modern web browser (Chrome, Firefox, Safari, Edge)</span>
                    </li>
                    <li className="d-flex align-items-start gap-2 mb-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#11998e" strokeWidth="2" className="mt-1" style={{flexShrink: 0}}>
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      <span>Stable internet connection (minimum 1 Mbps)</span>
                    </li>
                    <li className="d-flex align-items-start gap-2 mb-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#11998e" strokeWidth="2" className="mt-1" style={{flexShrink: 0}}>
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      <span>Enable JavaScript in your browser</span>
                    </li>
                    <li className="d-flex align-items-start gap-2 mb-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#11998e" strokeWidth="2" className="mt-1" style={{flexShrink: 0}}>
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      <span>Disable popup blockers for this site</span>
                    </li>
                    <li className="d-flex align-items-start gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#11998e" strokeWidth="2" className="mt-1" style={{flexShrink: 0}}>
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      <span>Screen resolution: minimum 1024x768</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Allowed Items */}
            <div className="col-lg-6">
              <div className="premium-card h-100 fade-in stagger-3">
                <div className="premium-card-header">
                  <h6 className="mb-0 d-flex align-items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    Allowed Items
                  </h6>
                </div>
                <div className="premium-card-body">
                  <ul className="list-unstyled">
                    <li className="d-flex align-items-start gap-2 mb-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2" className="mt-1" style={{flexShrink: 0}}>
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      <span>Pen/pencil for rough work</span>
                    </li>
                    <li className="d-flex align-items-start gap-2 mb-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2" className="mt-1" style={{flexShrink: 0}}>
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      <span>Blank paper for calculations</span>
                    </li>
                    <li className="d-flex align-items-start gap-2 mb-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2" className="mt-1" style={{flexShrink: 0}}>
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      <span>Water bottle</span>
                    </li>
                    <li className="d-flex align-items-start gap-2 mb-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2" className="mt-1" style={{flexShrink: 0}}>
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      <span>Calculator (if specified for the exam)</span>
                    </li>
                    <li className="d-flex align-items-start gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2" className="mt-1" style={{flexShrink: 0}}>
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      <span>Valid ID proof (keep ready if asked)</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Important Rules */}
            <div className="col-12">
              <div className="premium-card fade-in stagger-4">
                <div className="premium-card-header">
                  <h6 className="mb-0 d-flex align-items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#eb3349" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    Important Rules & Guidelines
                  </h6>
                </div>
                <div className="premium-card-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <h6 className="text-danger mb-3"> Strictly Prohibited</h6>
                      <ul className="list-unstyled">
                        <li className="d-flex align-items-start gap-2 mb-2">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#eb3349" strokeWidth="2" className="mt-1" style={{flexShrink: 0}}>
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="15" y1="9" x2="9" y2="15"/>
                            <line x1="9" y1="9" x2="15" y2="15"/>
                          </svg>
                          <span>Switching browser tabs or windows</span>
                        </li>
                        <li className="d-flex align-items-start gap-2 mb-2">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#eb3349" strokeWidth="2" className="mt-1" style={{flexShrink: 0}}>
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="15" y1="9" x2="9" y2="15"/>
                            <line x1="9" y1="9" x2="15" y2="15"/>
                          </svg>
                          <span>Refreshing or reloading the page</span>
                        </li>
                        <li className="d-flex align-items-start gap-2 mb-2">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#eb3349" strokeWidth="2" className="mt-1" style={{flexShrink: 0}}>
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="15" y1="9" x2="9" y2="15"/>
                            <line x1="9" y1="9" x2="15" y2="15"/>
                          </svg>
                          <span>Using search engines or external help</span>
                        </li>
                        <li className="d-flex align-items-start gap-2 mb-2">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#eb3349" strokeWidth="2" className="mt-1" style={{flexShrink: 0}}>
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="15" y1="9" x2="9" y2="15"/>
                            <line x1="9" y1="9" x2="15" y2="15"/>
                          </svg>
                          <span>Communication with others during exam</span>
                        </li>
                        <li className="d-flex align-items-start gap-2">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#eb3349" strokeWidth="2" className="mt-1" style={{flexShrink: 0}}>
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="15" y1="9" x2="9" y2="15"/>
                            <line x1="9" y1="9" x2="15" y2="15"/>
                          </svg>
                          <span>Mobile phones or electronic devices</span>
                        </li>
                      </ul>
                    </div>
                    <div className="col-md-6 mb-3">
                      <h6 className="text-success mb-3"> Important Guidelines</h6>
                      <ul className="list-unstyled">
                        <li className="d-flex align-items-start gap-2 mb-2">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#11998e" strokeWidth="2" className="mt-1" style={{flexShrink: 0}}>
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="8" x2="12" y2="12"/>
                            <line x1="12" y1="16" x2="12.01" y2="16"/>
                          </svg>
                          <span>Save answers frequently (auto-saved)</span>
                        </li>
                        <li className="d-flex align-items-start gap-2 mb-2">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#11998e" strokeWidth="2" className="mt-1" style={{flexShrink: 0}}>
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="8" x2="12" y2="12"/>
                            <line x1="12" y1="16" x2="12.01" y2="16"/>
                          </svg>
                          <span>Keep track of remaining time</span>
                        </li>
                        <li className="d-flex align-items-start gap-2 mb-2">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#11998e" strokeWidth="2" className="mt-1" style={{flexShrink: 0}}>
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="8" x2="12" y2="12"/>
                            <line x1="12" y1="16" x2="12.01" y2="16"/>
                          </svg>
                          <span>Review all answers before submitting</span>
                        </li>
                        <li className="d-flex align-items-start gap-2 mb-2">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#11998e" strokeWidth="2" className="mt-1" style={{flexShrink: 0}}>
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="8" x2="12" y2="12"/>
                            <line x1="12" y1="16" x2="12.01" y2="16"/>
                          </svg>
                          <span>Submit before time expires</span>
                        </li>
                        <li className="d-flex align-items-start gap-2">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#11998e" strokeWidth="2" className="mt-1" style={{flexShrink: 0}}>
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="8" x2="12" y2="12"/>
                            <line x1="12" y1="16" x2="12.01" y2="16"/>
                          </svg>
                          <span>Ensure stable internet throughout</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center fade-in stagger-5">
            <Link href="/student/exams" className="btn-premium-outline">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.5rem' }}>
                <line x1="19" y1="12" x2="5" y2="12"/>
                <polyline points="12 19 5 12 12 5"/>
              </svg>
              Back to My Exams
            </Link>
            <Link href={`/student/exams/${examId}/terms`} className="btn-premium" style={{
              background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
              padding: '1rem 2rem',
              fontSize: '1.1rem',
              fontWeight: '600'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.5rem' }}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              Review Terms & Conditions
            </Link>
          </div>

          {/* Footer Note */}
          <div className="text-center mt-5 fade-in stagger-6">
            <div className="glass-card p-3">
              <p className="mb-0 text-muted">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="me-2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                By clicking "Proceed to Start Exam", you acknowledge that you have read and understood all the instructions above.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}