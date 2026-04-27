// pages/admin/results.tsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { legacyClient } from '../../lib/legacyClient'

interface Result {
  id: string
  student_name: string
  student_email: string
  exam_name: string
  score: number
  percentage: number
  submitted_at: string
}

export default function AdminResults() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState<Result[]>([])
  const [searchTerm, setSearchTerm] = useState('')

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

      await fetchResults()
      setLoading(false)
    }

    checkAdminAccess()
  }, [router])

  const fetchResults = async () => {
    const { data, error } = await legacyClient
      .from('exam_attempts')
      .select(`
        id,
        score,
        percentage,
        submitted_at,
        student_id,
        exam_id
      `)
      .order('submitted_at', { ascending: false })

    if (error) {
      console.error('Error fetching results:', error)
      return
    }

    if (data && data.length > 0) {
      // Fetch related data separately
      const studentIds = [...new Set(data.map(a => a.student_id).filter(Boolean))]
      const examIds = [...new Set(data.map(a => a.exam_id).filter(Boolean))]

      // Fetch students with profiles
      const { data: studentsData } = await legacyClient
        .from('students')
        .select('id, profile_id, profiles:profile_id(full_name, email)')
        .in('id', studentIds)

      // Fetch exams
      const { data: examsData } = await legacyClient
        .from('exams')
        .select('id, name')
        .in('id', examIds)

      // Create lookup maps
      const studentMap = new Map()
      studentsData?.forEach((s: any) => {
        const profile = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles
        studentMap.set(s.id, {
          name: profile?.full_name || '-',
          email: profile?.email || '-'
        })
      })

      const examMap = new Map()
      examsData?.forEach((e: any) => {
        examMap.set(e.id, e.name)
      })

      const formatted = data.map((attempt: any) => {
        const student = studentMap.get(attempt.student_id) || { name: '-', email: '-' }
        return {
          id: attempt.id,
          student_name: student.name,
          student_email: student.email,
          exam_name: examMap.get(attempt.exam_id) || '-',
          score: attempt.score || 0,
          percentage: attempt.percentage || 0,
          submitted_at: attempt.submitted_at
        }
      })
      setResults(formatted)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getScoreInfo = (percentage: number) => {
    if (percentage >= 80) return { bg: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', percentage }
    if (percentage >= 50) return { bg: 'linear-gradient(135deg, #F2994A 0%, #F2C94C 100%)', percentage }
    return { bg: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)', percentage }
  }

  const filteredResults = results.filter(r =>
    r.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.student_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.exam_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Stats calculations - use percentage directly
  const avgScore = results.length > 0
    ? results.reduce((sum, r) => sum + (r.percentage || 0), 0) / results.length
    : 0
  const passedCount = results.filter(r => (r.percentage || 0) >= 40).length

  if (loading) {
    return (
      <div style={{ background: 'var(--light-bg)', minHeight: 'calc(100vh - 70px)' }}>
        <div className="container py-5">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading results...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Results  CCC Exam Portal</title>
      </Head>
      <div style={{ background: 'var(--light-bg)', minHeight: 'calc(100vh - 70px)', padding: '2rem 0' }}>
        <div className="container">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4 fade-in">
            <div>
              <h1 className="page-title">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="url(#resGrad)" strokeWidth="2" style={{ marginRight: '0.5rem' }}>
                  <defs>
                    <linearGradient id="resGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#4facfe" />
                      <stop offset="100%" stopColor="#00f2fe" />
                    </linearGradient>
                  </defs>
                  <line x1="18" y1="20" x2="18" y2="10"/>
                  <line x1="12" y1="20" x2="12" y2="4"/>
                  <line x1="6" y1="20" x2="6" y2="14"/>
                </svg>
                Exam Results
              </h1>
              <p className="page-subtitle">View all student exam attempts and scores</p>
            </div>
          </div>

          {/* Stats */}
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <div className="glass-card p-3 text-center fade-in stagger-1">
                <div className="d-flex align-items-center justify-content-center gap-3">
                  <div style={{
                    width: '45px',
                    height: '45px',
                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <line x1="18" y1="20" x2="18" y2="10"/>
                      <line x1="12" y1="20" x2="12" y2="4"/>
                      <line x1="6" y1="20" x2="6" y2="14"/>
                    </svg>
                  </div>
                  <div className="text-start">
                    <div className="fw-bold" style={{ fontSize: '1.5rem', color: 'var(--dark-text)' }}>{results.length}</div>
                    <div className="text-muted small">Total Attempts</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="glass-card p-3 text-center fade-in stagger-2">
                <div className="d-flex align-items-center justify-content-center gap-3">
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
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                  </div>
                  <div className="text-start">
                    <div className="fw-bold" style={{ fontSize: '1.5rem', color: 'var(--dark-text)' }}>{passedCount}</div>
                    <div className="text-muted small">Passed (40%)</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="glass-card p-3 text-center fade-in stagger-3">
                <div className="d-flex align-items-center justify-content-center gap-3">
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
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                    </svg>
                  </div>
                  <div className="text-start">
                    <div className="fw-bold" style={{ fontSize: '1.5rem', color: 'var(--dark-text)' }}>{avgScore.toFixed(1)}%</div>
                    <div className="text-muted small">Avg. Score</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="premium-card fade-in">
            <div className="premium-card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0 d-flex align-items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="20" x2="18" y2="10"/>
                  <line x1="12" y1="20" x2="12" y2="4"/>
                  <line x1="6" y1="20" x2="6" y2="14"/>
                </svg>
                All Results
              </h5>
              <div className="d-flex align-items-center gap-3">
                <div style={{ position: 'relative' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6c757d" strokeWidth="2" 
                    style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <input
                    type="text"
                    placeholder="Search results..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="form-control"
                    style={{ 
                      paddingLeft: '40px',
                      borderRadius: '10px',
                      border: '2px solid #e9ecef',
                      minWidth: '250px'
                    }}
                  />
                </div>
                <span className="badge" style={{ 
                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  fontSize: '0.85rem'
                }}>
                  {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
            <div className="premium-card-body p-0">
              {filteredResults.length === 0 ? (
                <div className="text-center py-5">
                  <div style={{
                    width: '80px',
                    height: '80px',
                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem',
                    opacity: 0.6
                  }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <line x1="18" y1="20" x2="18" y2="10"/>
                      <line x1="12" y1="20" x2="12" y2="4"/>
                      <line x1="6" y1="20" x2="6" y2="14"/>
                    </svg>
                  </div>
                  <p className="text-muted mb-0">
                    {searchTerm ? 'No results match your search.' : 'No exam results found yet.'}
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-premium mb-0">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Email</th>
                        <th>Exam</th>
                        <th>Score</th>
                        <th>Submitted At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredResults.map((result, index) => {
                        const scoreInfo = getScoreInfo(result.percentage || 0)
                        return (
                          <tr key={result.id} className="fade-in" style={{ animationDelay: `${index * 0.03}s` }}>
                            <td>
                              <div className="d-flex align-items-center gap-3">
                                <div style={{
                                  width: '36px',
                                  height: '36px',
                                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                  borderRadius: '10px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'white',
                                  fontWeight: '600',
                                  fontSize: '0.85rem'
                                }}>
                                  {result.student_name.charAt(0).toUpperCase()}
                                </div>
                                <span className="fw-semibold" style={{ color: 'var(--dark-text)' }}>
                                  {result.student_name}
                                </span>
                              </div>
                            </td>
                            <td>
                              <span style={{ color: 'var(--text-muted)' }}>{result.student_email}</span>
                            </td>
                            <td>
                              <span className="badge" style={{ 
                                background: 'rgba(102, 126, 234, 0.1)',
                                color: '#667eea',
                                padding: '0.4rem 0.8rem',
                                borderRadius: '6px',
                                fontWeight: '600'
                              }}>
                                {result.exam_name}
                              </span>
                            </td>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <div style={{
                                  width: '50px',
                                  height: '6px',
                                  background: '#e9ecef',
                                  borderRadius: '3px',
                                  overflow: 'hidden'
                                }}>
                                  <div style={{
                                    width: `${Math.min(scoreInfo.percentage, 100)}%`,
                                    height: '100%',
                                    background: scoreInfo.bg,
                                    borderRadius: '3px'
                                  }}></div>
                                </div>
                                <span style={{
                                  background: scoreInfo.bg,
                                  color: 'white',
                                  padding: '0.4rem 0.8rem',
                                  borderRadius: '20px',
                                  fontSize: '0.75rem',
                                  fontWeight: '600'
                                }}>
                                  {result.score} ({scoreInfo.percentage.toFixed(1)}%)
                                </span>
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
                                <span style={{ color: 'var(--text-muted)' }}>{formatDate(result.submitted_at)}</span>
                              </div>
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
        </div>
      </div>
    </>
  )
}
