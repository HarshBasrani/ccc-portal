// pages/admin/dashboard.tsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { convex } from '../../lib/convexClient'
import { api } from '../../convex/_generated/api'
import { getSession } from '../../lib/session'

interface Stats {
  students: number
  exams: number
  questions: number
  attempts: number
}

export default function AdminDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({ students: 0, exams: 0, questions: 0, attempts: 0 })

  useEffect(() => {
    const checkAdminAccess = async () => {
      const session = getSession()
      if (!session) {
        router.replace('/login')
        return
      }

      if (session.role !== 'admin') {
        router.replace('/student/dashboard')
        return
      }

      const statsResult = await convex.query(api.admin.dashboardStats, {})
      setStats(statsResult)

      setLoading(false)
    }

    checkAdminAccess()
  }, [router])

  if (loading) {
    return (
      <div style={{ background: 'var(--light-bg)', minHeight: 'calc(100vh - 70px)' }}>
        <div className="container py-5">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Admin Dashboard  CCC Exam Portal</title>
      </Head>
      <div style={{ background: 'var(--light-bg)', minHeight: 'calc(100vh - 70px)', padding: '2rem 0' }}>
        <div className="container">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4 fade-in">
            <div>
              <h1 className="page-title">Admin Dashboard </h1>
              <p className="page-subtitle">Manage students, exams, questions, and results</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="row g-4 mb-4">
            <div className="col-md-6 col-lg-3">
              <div className="stats-card primary fade-in stagger-1">
                <div className="card-body p-4">
                  <div className="d-flex align-items-center">
                    <div className="stats-icon" style={{ 
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white'
                    }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                      </svg>
                    </div>
                    <div className="ms-3">
                      <div className="stats-value">{stats.students}</div>
                      <div className="stats-label">Total Students</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="stats-card success fade-in stagger-2">
                <div className="card-body p-4">
                  <div className="d-flex align-items-center">
                    <div className="stats-icon" style={{ 
                      background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                      color: 'white'
                    }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                      </svg>
                    </div>
                    <div className="ms-3">
                      <div className="stats-value">{stats.exams}</div>
                      <div className="stats-label">Total Exams</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="stats-card warning fade-in stagger-3">
                <div className="card-body p-4">
                  <div className="d-flex align-items-center">
                    <div className="stats-icon" style={{ 
                      background: 'linear-gradient(135deg, #F2994A 0%, #F2C94C 100%)',
                      color: 'white'
                    }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                      </svg>
                    </div>
                    <div className="ms-3">
                      <div className="stats-value">{stats.questions}</div>
                      <div className="stats-label">Question Bank</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="stats-card info fade-in stagger-4">
                <div className="card-body p-4">
                  <div className="d-flex align-items-center">
                    <div className="stats-icon" style={{ 
                      background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                      color: 'white'
                    }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="20" x2="18" y2="10"/>
                        <line x1="12" y1="20" x2="12" y2="4"/>
                        <line x1="6" y1="20" x2="6" y2="14"/>
                      </svg>
                    </div>
                    <div className="ms-3">
                      <div className="stats-value">{stats.attempts}</div>
                      <div className="stats-label">Exam Attempts</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="row g-4 mb-4">
            <div className="col-md-6 col-lg-3">
              <div className="dashboard-card students fade-in" style={{ animationDelay: '0.2s' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                  boxShadow: '0 8px 25px rgba(102, 126, 234, 0.25)'
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <h5 className="fw-bold mb-2">Students</h5>
                <p className="text-muted small mb-3">Manage student registrations and profiles.</p>
                <Link href="/admin/students" className="btn-premium btn-premium-primary btn-premium-sm w-100">
                  Manage Students
                </Link>
              </div>
            </div>

            <div className="col-md-6 col-lg-3">
              <div className="dashboard-card exams fade-in" style={{ animationDelay: '0.3s' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                  boxShadow: '0 8px 25px rgba(56, 239, 125, 0.25)'
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                </div>
                <h5 className="fw-bold mb-2">Exams</h5>
                <p className="text-muted small mb-3">Create exams, set schedules, and assign.</p>
                <Link href="/admin/exams" className="btn-premium btn-premium-success btn-premium-sm w-100">
                  Manage Exams
                </Link>
              </div>
            </div>

            <div className="col-md-6 col-lg-3">
              <div className="dashboard-card questions fade-in" style={{ animationDelay: '0.4s' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  background: 'linear-gradient(135deg, #F2994A 0%, #F2C94C 100%)',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                  boxShadow: '0 8px 25px rgba(242, 201, 76, 0.25)'
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                </div>
                <h5 className="fw-bold mb-2">Question Bank</h5>
                <p className="text-muted small mb-3">Add and manage MCQ questions.</p>
                <Link href="/admin/questions" className="btn-premium btn-premium-primary btn-premium-sm w-100" style={{ background: 'linear-gradient(135deg, #F2994A 0%, #F2C94C 100%)' }}>
                  Manage Questions
                </Link>
              </div>
            </div>

            <div className="col-md-6 col-lg-3">
              <div className="dashboard-card results fade-in" style={{ animationDelay: '0.5s' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                  boxShadow: '0 8px 25px rgba(79, 172, 254, 0.25)'
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <line x1="18" y1="20" x2="18" y2="10"/>
                    <line x1="12" y1="20" x2="12" y2="4"/>
                    <line x1="6" y1="20" x2="6" y2="14"/>
                  </svg>
                </div>
                <h5 className="fw-bold mb-2">Results</h5>
                <p className="text-muted small mb-3">View exam results and performance.</p>
                <Link href="/admin/results" className="btn-premium btn-premium-primary btn-premium-sm w-100" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                  View Results
                </Link>
              </div>
            </div>
          </div>

          {/* Completed Exams - New Section */}
          <div className="row g-4 mb-4">
            <div className="col-12">
              <div className="dashboard-card fade-in" style={{ animationDelay: '0.55s', background: 'linear-gradient(135deg, rgba(17, 153, 142, 0.05) 0%, rgba(56, 239, 125, 0.05) 100%)' }}>
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                  <div className="d-flex align-items-center gap-3">
                    <div style={{
                      width: '60px',
                      height: '60px',
                      background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                      borderRadius: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 8px 25px rgba(56, 239, 125, 0.25)'
                    }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                      </svg>
                    </div>
                    <div>
                      <h5 className="fw-bold mb-1">Completed Exams</h5>
                      <p className="text-muted small mb-0">View submitted exams, pass/fail status, and manually pass failed students</p>
                    </div>
                  </div>
                  <Link href="/admin/completed-exams" className="btn-premium btn-premium-success">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    View Completed Exams
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Security & Management Section */}
          <div className="row g-4 mb-4">
            <div className="col-md-6">
              <div className="premium-card fade-in" style={{ animationDelay: '0.6s' }}>
                <div className="premium-card-header">
                  <h5 className="mb-0 d-flex align-items-center gap-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                    </svg>
                    Quick Actions
                  </h5>
                </div>
                <div className="premium-card-body">
                  <div className="d-flex flex-wrap gap-3">
                    <Link href="/admin/courses" className="btn-premium btn-premium-primary btn-premium-sm" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                      </svg>
                      Manage Courses
                    </Link>
                    <Link href="/admin/students/new" className="btn-premium btn-premium-success btn-premium-sm">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                      Add Student
                    </Link>
                    <Link href="/admin/exams/new" className="btn-premium btn-premium-primary btn-premium-sm">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                      Create Exam
                    </Link>
                    <Link href="/admin/questions/new" className="btn-premium btn-premium-primary btn-premium-sm" style={{ background: 'linear-gradient(135deg, #F2994A 0%, #F2C94C 100%)' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                      Add Question
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-md-6">
              <div className="premium-card fade-in" style={{ animationDelay: '0.65s', background: 'linear-gradient(135deg, rgba(220, 53, 69, 0.05) 0%, rgba(255, 107, 107, 0.05) 100%)' }}>
                <div className="premium-card-header">
                  <h5 className="mb-0 d-flex align-items-center gap-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <circle cx="12" cy="16" r="1"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    Security Dashboard
                  </h5>
                </div>
                <div className="premium-card-body">
                  <p className="text-muted small mb-3">Monitor security events, audit logs, and system protection status.</p>
                  <Link href="/admin/security" className="btn-premium btn-premium-danger">
                     View Security Dashboard
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Certificates Management Section */}
          <div className="row g-4 mb-4">
            <div className="col-12">
              <div className="premium-card fade-in" style={{ animationDelay: '0.7s', background: 'linear-gradient(135deg, rgba(138, 43, 226, 0.05) 0%, rgba(75, 0, 130, 0.05) 100%)' }}>
                <div className="premium-card-header">
                  <h5 className="mb-0 d-flex align-items-center gap-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <path d="M16 13H8"/>
                      <path d="M16 17H8"/>
                      <path d="M10 9H8"/>
                    </svg>
                    Certificate Management
                  </h5>
                </div>
                <div className="premium-card-body">
                  <div className="row">
                    <div className="col-md-8">
                      <p className="text-muted small mb-3">
                        Issue certificates to passed students and manage the certificate database. 
                        Certificates use the SI.No. format: IC/MM/YYYY/C/NNNN
                      </p>
                    </div>
                    <div className="col-md-4 text-end">
                      <div className="d-flex gap-2 justify-content-end flex-wrap">
                        <Link href="/admin/issue-certificate" className="btn-premium btn-premium-primary btn-premium-sm" style={{ background: 'linear-gradient(135deg, #8a2be2 0%, #4b0082 100%)' }}>
                           Issue Certificate
                        </Link>
                        <Link href="/admin/certificates" className="btn-premium btn-premium-secondary btn-premium-sm">
                           View All Certificates
                        </Link>
                      </div>
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
