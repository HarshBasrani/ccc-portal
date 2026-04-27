// pages/student/results.tsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { legacyClient } from '../../lib/legacyClient'

interface Result {
  id: string
  score: number
  percentage: number | null
  status: string
  submitted_at: string
  exam_name: string
  is_passed: boolean | null
}

export default function StudentResults() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState<Result[]>([])
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

      const { data: existingStudents } = await legacyClient
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
        .from('exam_attempts')
        .select(`
          id,
          score,
          percentage,
          status,
          submitted_at,
          is_passed,
          exams:exam_id ( name )
        `)
        .eq('student_id', studentId)
        .order('submitted_at', { ascending: false })

      if (fetchError) {
        setError(fetchError.message)
      } else if (data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formatted = data.map((r: any) => {
          const examsData = Array.isArray(r.exams) ? r.exams[0] : r.exams
          return {
            id: r.id,
            score: r.score ?? 0,
            percentage: r.percentage,
            status: r.status || '-',
            submitted_at: r.submitted_at,
            exam_name: examsData?.name || '-',
            is_passed: r.is_passed
          }
        })
        setResults(formatted)
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getGradeInfo = (percentage: number) => {
    if (percentage >= 80) return { grade: 'A', bg: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', color: '#11998e' }
    if (percentage >= 60) return { grade: 'B', bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#667eea' }
    if (percentage >= 40) return { grade: 'C', bg: 'linear-gradient(135deg, #F2994A 0%, #F2C94C 100%)', color: '#F2994A' }
    return { grade: 'D', bg: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)', color: '#eb3349' }
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'submitted':
        return { bg: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', text: 'Submitted' }
      case 'auto_submitted':
        return { bg: 'linear-gradient(135deg, #F2994A 0%, #F2C94C 100%)', text: 'Auto Submitted' }
      case 'in_progress':
        return { bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', text: 'In Progress' }
      default:
        return { bg: 'linear-gradient(135deg, #6c757d 0%, #495057 100%)', text: status }
    }
  }

  if (loading) {
    return (
      <div style={{ background: 'var(--light-bg)', minHeight: 'calc(100vh - 70px)' }}>
        <div className="container py-5">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading your results...</p>
          </div>
        </div>
      </div>
    )
  }

  // Calculate stats - use is_passed field if available
  const totalExams = results.length
  const avgPercentage = totalExams > 0 
    ? results.reduce((sum, r) => sum + (r.percentage ?? r.score ?? 0), 0) / totalExams 
    : 0
  const passed = results.filter(r => r.is_passed === true || (r.is_passed === null && (r.percentage ?? r.score ?? 0) >= 40)).length

  return (
    <>
      <Head>
        <title>My Results  CCC Exam Portal</title>
      </Head>
      <div style={{ background: 'var(--light-bg)', minHeight: 'calc(100vh - 70px)', padding: '2rem 0' }}>
        <div className="container">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4 fade-in">
            <div>
              <h1 className="page-title">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="url(#resultGrad)" strokeWidth="2" style={{ marginRight: '0.5rem' }}>
                  <defs>
                    <linearGradient id="resultGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#11998e" />
                      <stop offset="100%" stopColor="#38ef7d" />
                    </linearGradient>
                  </defs>
                  <line x1="18" y1="20" x2="18" y2="10"/>
                  <line x1="12" y1="20" x2="12" y2="4"/>
                  <line x1="6" y1="20" x2="6" y2="14"/>
                </svg>
                My Results
              </h1>
              <p className="page-subtitle">View your exam performance and detailed results</p>
            </div>
            <Link href="/student/dashboard" className="btn-premium btn-premium-outline">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Back to Dashboard
            </Link>
          </div>

          {/* Stats Cards */}
          {results.length > 0 && (
            <div className="row g-4 mb-4">
              <div className="col-md-4">
                <div className="stats-card primary fade-in stagger-1">
                  <div className="card-body p-4">
                    <div className="d-flex align-items-center">
                      <div className="stats-icon" style={{ 
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white'
                      }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                        </svg>
                      </div>
                      <div className="ms-3">
                        <div className="stats-value">{totalExams}</div>
                        <div className="stats-label">Total Exams</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="stats-card success fade-in stagger-2">
                  <div className="card-body p-4">
                    <div className="d-flex align-items-center">
                      <div className="stats-icon" style={{ 
                        background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                        color: 'white'
                      }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                          <polyline points="22 4 12 14.01 9 11.01"/>
                        </svg>
                      </div>
                      <div className="ms-3">
                        <div className="stats-value">{passed}</div>
                        <div className="stats-label">Passed</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="stats-card warning fade-in stagger-3">
                  <div className="card-body p-4">
                    <div className="d-flex align-items-center">
                      <div className="stats-icon" style={{ 
                        background: 'linear-gradient(135deg, #F2994A 0%, #F2C94C 100%)',
                        color: 'white'
                      }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="12" y1="2" x2="12" y2="22"/>
                          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                        </svg>
                      </div>
                      <div className="ms-3">
                        <div className="stats-value">{avgPercentage.toFixed(1)}%</div>
                        <div className="stats-label">Avg. Score</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

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

          {!error && results.length === 0 ? (
            <div className="premium-card text-center fade-in" style={{ padding: '4rem 2rem' }}>
              <div style={{
                width: '100px',
                height: '100px',
                background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                opacity: 0.8
              }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <line x1="18" y1="20" x2="18" y2="10"/>
                  <line x1="12" y1="20" x2="12" y2="4"/>
                  <line x1="6" y1="20" x2="6" y2="14"/>
                </svg>
              </div>
              <h4 className="mb-3" style={{ color: 'var(--dark-text)' }}>No Results Available Yet</h4>
              <p className="text-muted mb-4">Complete an exam to see your results here.</p>
              <Link href="/student/exams" className="btn-premium btn-premium-primary">
                View Available Exams
              </Link>
            </div>
          ) : !error && (
            <div className="premium-card fade-in">
              <div className="premium-card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0 d-flex align-items-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  Exam Results
                </h5>
                <span className="badge" style={{ 
                  background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  fontSize: '0.85rem'
                }}>
                  {results.length} result{results.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="premium-card-body p-0">
                <div className="table-responsive">
                  <table className="table table-premium mb-0">
                    <thead>
                      <tr>
                        <th>Exam Name</th>
                        <th>Score</th>
                        <th>Percentage</th>
                        <th>Status</th>
                        <th>Submitted On</th>
                        <th className="text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((result, index) => {
                        const computedPercentage = result.percentage ?? (result.score ?? 0)
                        const gradeInfo = getGradeInfo(computedPercentage)
                        const statusInfo = getStatusInfo(result.status)
                        // Determine if passed: use is_passed if set, otherwise check percentage
                        const isPassed = result.is_passed === true || (result.is_passed === null && computedPercentage >= 40)
                        return (
                          <tr key={result.id} className="fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                            <td>
                              <div className="d-flex align-items-center gap-3">
                                <div style={{
                                  width: '40px',
                                  height: '40px',
                                  background: isPassed 
                                    ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
                                    : 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)',
                                  borderRadius: '10px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: '700',
                                  color: 'white',
                                  fontSize: '0.8rem'
                                }}>
                                  {isPassed ? (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                      <polyline points="20 6 9 17 4 12"/>
                                    </svg>
                                  ) : (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                      <line x1="18" y1="6" x2="6" y2="18"/>
                                      <line x1="6" y1="6" x2="18" y2="18"/>
                                    </svg>
                                  )}
                                </div>
                                <div>
                                  <span className="fw-semibold d-block" style={{ color: 'var(--dark-text)' }}>{result.exam_name}</span>
                                  <span className="badge" style={{
                                    background: isPassed 
                                      ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
                                      : 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)',
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: '10px',
                                    fontSize: '0.65rem',
                                    fontWeight: '600'
                                  }}>
                                    {isPassed ? 'PASSED' : 'FAILED'}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="fw-bold" style={{ color: gradeInfo.color, fontSize: '1.1rem' }}>
                                {result.score ?? 0}
                              </span>
                            </td>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <div style={{
                                  width: '60px',
                                  height: '6px',
                                  background: '#e9ecef',
                                  borderRadius: '3px',
                                  overflow: 'hidden'
                                }}>
                                  <div style={{
                                    width: `${Math.min(computedPercentage, 100)}%`,
                                    height: '100%',
                                    background: gradeInfo.bg,
                                    borderRadius: '3px'
                                  }}></div>
                                </div>
                                <span style={{ 
                                  fontWeight: '600',
                                  color: gradeInfo.color
                                }}>
                                  {computedPercentage.toFixed(1)}%
                                </span>
                              </div>
                            </td>
                            <td>
                              <span style={{
                                background: statusInfo.bg,
                                color: 'white',
                                padding: '0.4rem 0.8rem',
                                borderRadius: '20px',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                display: 'inline-block'
                              }}>
                                {statusInfo.text}
                              </span>
                            </td>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2">
                                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                  <line x1="16" y1="2" x2="16" y2="6"/>
                                  <line x1="8" y1="2" x2="8" y2="6"/>
                                  <line x1="3" y1="10" x2="21" y2="10"/>
                                </svg>
                                <span style={{ color: 'var(--text-muted)' }}>{formatDate(result.submitted_at)}</span>
                              </div>
                            </td>
                            <td className="text-center">
                              <Link
                                href={`/student/results/${result.id}`}
                                className="btn-premium btn-premium-outline btn-premium-sm"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                  <circle cx="12" cy="12" r="3"/>
                                </svg>
                                View Details
                              </Link>
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
        </div>
      </div>
    </>
  )
}
