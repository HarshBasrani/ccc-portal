// pages/admin/exams/index.tsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { legacyClient } from '../../../lib/legacyClient'

interface Exam {
  id: string
  course_id: string
  name: string
  exam_date: string
  start_time: string
  end_time: string
  duration_minutes: number
  status: string
  created_at: string
}

export default function AdminExams() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [exams, setExams] = useState<Exam[]>([])
  const [error, setError] = useState<string | null>(null)

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

      await fetchExams()
      setLoading(false)
    }

    checkAdminAccess()
  }, [router])

  const fetchExams = async () => {
    const { data, error } = await legacyClient
      .from('exams')
      .select('id, course_id, name, exam_date, start_time, end_time, duration_minutes, status, created_at')
      .order('exam_date', { ascending: true })

    if (error) {
      setError(error.message)
    } else if (data) {
      setExams(data)
    }
  }

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

  const getStatusInfo = (status: string) => {
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
            <p className="loading-text">Loading exams...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Exams  CCC Exam Portal</title>
      </Head>
      <div style={{ background: 'var(--light-bg)', minHeight: 'calc(100vh - 70px)', padding: '2rem 0' }}>
        <div className="container">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4 fade-in">
            <div>
              <h1 className="page-title">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="url(#examAdminGrad)" strokeWidth="2" style={{ marginRight: '0.5rem' }}>
                  <defs>
                    <linearGradient id="examAdminGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#11998e" />
                      <stop offset="100%" stopColor="#38ef7d" />
                    </linearGradient>
                  </defs>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
                Manage Exams
              </h1>
              <p className="page-subtitle">Create and manage examinations</p>
            </div>
            <Link href="/admin/exams/new" className="btn-premium btn-premium-success">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Create Exam
            </Link>
          </div>

          {/* Stats */}
          <div className="row g-3 mb-4">
            <div className="col-md-3">
              <div className="glass-card p-3 text-center fade-in stagger-1">
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
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                  </div>
                  <div className="text-start">
                    <div className="fw-bold" style={{ fontSize: '1.5rem', color: 'var(--dark-text)' }}>{exams.length}</div>
                    <div className="text-muted small">Total Exams</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
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
                      <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                  </div>
                  <div className="text-start">
                    <div className="fw-bold" style={{ fontSize: '1.5rem', color: 'var(--dark-text)' }}>
                      {exams.filter(e => e.status === 'active').length}
                    </div>
                    <div className="text-muted small">Active</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="glass-card p-3 text-center fade-in stagger-3">
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
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                  </div>
                  <div className="text-start">
                    <div className="fw-bold" style={{ fontSize: '1.5rem', color: 'var(--dark-text)' }}>
                      {exams.filter(e => e.status === 'scheduled').length}
                    </div>
                    <div className="text-muted small">Scheduled</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="glass-card p-3 text-center fade-in stagger-4">
                <div className="d-flex align-items-center justify-content-center gap-3">
                  <div style={{
                    width: '45px',
                    height: '45px',
                    background: 'linear-gradient(135deg, #6c757d 0%, #495057 100%)',
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
                    <div className="fw-bold" style={{ fontSize: '1.5rem', color: 'var(--dark-text)' }}>
                      {exams.filter(e => e.status === 'completed').length}
                    </div>
                    <div className="text-muted small">Completed</div>
                  </div>
                </div>
              </div>
            </div>
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

          <div className="premium-card fade-in">
            <div className="premium-card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0 d-flex align-items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                Exam List
              </h5>
              <span className="badge" style={{ 
                background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                fontSize: '0.85rem'
              }}>
                {exams.length} exam{exams.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="premium-card-body p-0">
              {exams.length === 0 ? (
                <div className="text-center py-5">
                  <div style={{
                    width: '80px',
                    height: '80px',
                    background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem',
                    opacity: 0.6
                  }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                  </div>
                  <p className="text-muted mb-3">No exams created yet.</p>
                  <Link href="/admin/exams/new" className="btn-premium btn-premium-success">
                    Create Your First Exam
                  </Link>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-premium mb-0">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Exam Date</th>
                        <th>Time Window</th>
                        <th>Duration</th>
                        <th>Status</th>
                        <th>Created On</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exams.map((exam, index) => {
                        const statusInfo = getStatusInfo(exam.status)
                        return (
                          <tr key={exam.id} className="fade-in" style={{ animationDelay: `${index * 0.03}s` }}>
                            <td>
                              <div className="d-flex align-items-center gap-3">
                                <div style={{
                                  width: '40px',
                                  height: '40px',
                                  background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
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
                                display: 'inline-block'
                              }}>
                                {statusInfo.text}
                              </span>
                            </td>
                            <td>
                              <span style={{ color: 'var(--text-muted)' }}>{formatDate(exam.created_at)}</span>
                            </td>
                            <td className="text-center">
                              <div className="d-flex gap-2 justify-content-center">
                                <Link
                                  href={`/admin/exams/${exam.id}`}
                                  className="btn-premium btn-premium-outline btn-premium-sm"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                  </svg>
                                  Edit
                                </Link>
                                <Link
                                  href={`/admin/exams/${exam.id}/assign`}
                                  className="btn-premium btn-premium-primary btn-premium-sm"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                                    <circle cx="8.5" cy="7" r="4"/>
                                    <line x1="20" y1="8" x2="20" y2="14"/>
                                    <line x1="23" y1="11" x2="17" y2="11"/>
                                  </svg>
                                  Assign
                                </Link>
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
