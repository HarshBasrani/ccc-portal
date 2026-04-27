// pages/admin/students.tsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { legacyClient } from '../../lib/legacyClient'

interface StudentRow {
  id: string
  profile_id: string
  full_name: string | null
  email: string | null
  enrollment_no: string | null
  status: string
  created_at: string
}

export default function AdminStudents() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [students, setStudents] = useState<StudentRow[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const checkAdminAndFetch = async () => {
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

      await fetchStudents()
      setLoading(false)
    }

    checkAdminAndFetch()
  }, [router])

  const fetchStudents = async () => {
    const { data, error: fetchError } = await legacyClient
      .from('students')
      .select(`
        id,
        profile_id,
        enrollment_no,
        status,
        created_at,
        profiles:profile_id ( full_name, email )
      `)
      .order('created_at', { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
      return
    }

    if (data) {
      const formatted: StudentRow[] = data.map((student: any) => {
        const profile = Array.isArray(student.profiles) ? student.profiles[0] : student.profiles
        return {
          id: student.id,
          profile_id: student.profile_id,
          full_name: profile?.full_name || null,
          email: profile?.email || null,
          enrollment_no: student.enrollment_no || null,
          status: student.status || 'pending',
          created_at: student.created_at
        }
      })
      setStudents(formatted)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'active':
      case 'approved':
        return { bg: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', text: status }
      case 'inactive':
      case 'rejected':
        return { bg: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)', text: status }
      default:
        return { bg: 'linear-gradient(135deg, #F2994A 0%, #F2C94C 100%)', text: status }
    }
  }

  const filteredStudents = students.filter(student =>
    (student.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (student.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (student.enrollment_no?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div style={{ background: 'var(--light-bg)', minHeight: 'calc(100vh - 70px)' }}>
        <div className="container py-5">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading students...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Students  CCC Exam Portal</title>
      </Head>
      <div style={{ background: 'var(--light-bg)', minHeight: 'calc(100vh - 70px)', padding: '2rem 0' }}>
        <div className="container">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4 fade-in">
            <div>
              <h1 className="page-title">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="url(#studGrad)" strokeWidth="2" style={{ marginRight: '0.5rem' }}>
                  <defs>
                    <linearGradient id="studGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#667eea" />
                      <stop offset="100%" stopColor="#764ba2" />
                    </linearGradient>
                  </defs>
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                Manage Students
              </h1>
              <p className="page-subtitle">View and manage registered students</p>
            </div>
            <Link href="/admin/students/new" className="btn-premium btn-premium-success">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add New Student
            </Link>
          </div>

          {/* Stats */}
          <div className="row g-3 mb-4">
            <div className="col-md-4">
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
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                    </svg>
                  </div>
                  <div className="text-start">
                    <div className="fw-bold" style={{ fontSize: '1.5rem', color: 'var(--dark-text)' }}>{students.length}</div>
                    <div className="text-muted small">Total Students</div>
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
                    <div className="fw-bold" style={{ fontSize: '1.5rem', color: 'var(--dark-text)' }}>
                      {students.filter(s => s.status === 'approved' || s.status === 'active').length}
                    </div>
                    <div className="text-muted small">Active Students</div>
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
                    background: 'linear-gradient(135deg, #F2994A 0%, #F2C94C 100%)',
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
                  <div className="text-start">
                    <div className="fw-bold" style={{ fontSize: '1.5rem', color: 'var(--dark-text)' }}>
                      {students.filter(s => s.status === 'pending').length}
                    </div>
                    <div className="text-muted small">Pending</div>
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
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                </svg>
                Student List
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
                    placeholder="Search students..."
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
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  fontSize: '0.85rem'
                }}>
                  {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
            <div className="premium-card-body p-0">
              {filteredStudents.length === 0 ? (
                <div className="text-center py-5">
                  <div style={{
                    width: '80px',
                    height: '80px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem',
                    opacity: 0.6
                  }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                    </svg>
                  </div>
                  <p className="text-muted mb-0">
                    {searchTerm ? 'No students match your search.' : 'No students found yet.'}
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-premium mb-0">
                    <thead>
                      <tr>
                        <th>Enrollment No</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Status</th>
                        <th>Registered On</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((student, index) => {
                        const statusInfo = getStatusInfo(student.status)
                        return (
                          <tr key={student.id} className="fade-in" style={{ animationDelay: `${index * 0.03}s` }}>
                            <td>
                              <span className="badge" style={{ 
                                background: 'rgba(102, 126, 234, 0.1)',
                                color: '#667eea',
                                padding: '0.4rem 0.8rem',
                                borderRadius: '6px',
                                fontWeight: '600',
                                fontFamily: 'monospace'
                              }}>
                                {student.enrollment_no || '-'}
                              </span>
                            </td>
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
                                  {student.full_name?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                                <span className="fw-semibold" style={{ color: 'var(--dark-text)' }}>
                                  {student.full_name || '-'}
                                </span>
                              </div>
                            </td>
                            <td>
                              <span style={{ color: 'var(--text-muted)' }}>{student.email || '-'}</span>
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
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2">
                                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                  <line x1="16" y1="2" x2="16" y2="6"/>
                                  <line x1="8" y1="2" x2="8" y2="6"/>
                                  <line x1="3" y1="10" x2="21" y2="10"/>
                                </svg>
                                <span style={{ color: 'var(--text-muted)' }}>{formatDate(student.created_at)}</span>
                              </div>
                            </td>
                            <td className="text-center">
                              <Link
                                href={`/admin/students/${student.id}`}
                                className="btn-premium btn-premium-outline btn-premium-sm"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                  <circle cx="12" cy="12" r="3"/>
                                </svg>
                                View
                              </Link>
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
