import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { legacyClient } from '../../lib/legacyClient'

interface Certificate {
  id: string
  si_number: string
  student_name: string
  enrollment_number: string
  course_name: string
  exam_name?: string
  grade?: string
  percentage?: number
  score?: number
  total_marks?: number
  issue_date: string
  issued_by: string
  is_verified: boolean
  is_active: boolean
  remarks?: string
}

export default function AdminCertificates() {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all') // all, active, inactive
  const router = useRouter()

  useEffect(() => {
    const checkAdminAccess = async () => {
      const { data: { user } } = await legacyClient.auth.getUser()
      
      if (!user) {
        router.push('/admin/login')
        return
      }

      // Check if user has admin role
      const { data: profile } = await legacyClient
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin') {
        router.push('/login')
        return
      }

      fetchCertificates()
    }

    checkAdminAccess()
  }, [router])

  const fetchCertificates = async () => {
    try {
      const { data, error } = await legacyClient
        .from('certificates')
        .select('*')
        .order('issue_date', { ascending: false })

      if (error) {
        console.error('Error fetching certificates:', error)
        setCertificates([])
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formatted: Certificate[] = (data || []).map((cert: any) => ({
          id: cert.id,
          si_number: cert.si_number,
          student_name: cert.student_name,
          enrollment_number: cert.enrollment_number,
          course_name: cert.course_name,
          exam_name: cert.exam_name,
          grade: cert.grade,
          percentage: cert.percentage,
          score: cert.score,
          total_marks: cert.total_marks,
          issue_date: new Date(cert.issue_date).toLocaleDateString('en-IN'),
          issued_by: cert.issued_by,
          is_verified: cert.is_verified,
          is_active: cert.is_active,
          remarks: cert.remarks
        }))
        setCertificates(formatted)
      }
    } catch (error) {
      console.error('Error in fetchCertificates:', error)
      setCertificates([])
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (certId: string, currentStatus: boolean) => {
    setUpdating(certId)

    const { error } = await legacyClient
      .from('certificates')
      .update({ is_active: !currentStatus })
      .eq('id', certId)

    if (error) {
      alert('Failed to update status: ' + error.message)
    } else {
      setCertificates(prev => prev.map(cert => 
        cert.id === certId ? { ...cert, is_active: !currentStatus } : cert
      ))
    }

    setUpdating(null)
  }

  const handleToggleVerification = async (certId: string, currentStatus: boolean) => {
    setUpdating(certId)

    const { error } = await legacyClient
      .from('certificates')
      .update({ is_verified: !currentStatus })
      .eq('id', certId)

    if (error) {
      alert('Failed to update verification: ' + error.message)
    } else {
      setCertificates(prev => prev.map(cert => 
        cert.id === certId ? { ...cert, is_verified: !currentStatus } : cert
      ))
    }

    setUpdating(null)
  }

  const handleDelete = async (certId: string, studentName: string) => {
    if (!confirm(`Are you sure you want to delete the certificate for ${studentName}? This action cannot be undone.`)) {
      return
    }

    setUpdating(certId)

    const { error } = await legacyClient
      .from('certificates')
      .delete()
      .eq('id', certId)

    if (error) {
      alert('Failed to delete certificate: ' + error.message)
    } else {
      setCertificates(prev => prev.filter(cert => cert.id !== certId))
    }

    setUpdating(null)
  }

  // Filter and search logic
  const filteredCertificates = certificates.filter(cert => {
    // Status filter
    if (filterStatus === 'active' && !cert.is_active) return false
    if (filterStatus === 'inactive' && cert.is_active) return false

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return (
        cert.student_name.toLowerCase().includes(search) ||
        cert.enrollment_number.toLowerCase().includes(search) ||
        cert.si_number.toLowerCase().includes(search) ||
        cert.course_name.toLowerCase().includes(search) ||
        (cert.exam_name && cert.exam_name.toLowerCase().includes(search))
      )
    }

    return true
  })

  const getGradeBadgeStyle = (grade: string) => {
    switch (grade) {
      case 'S': return { background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }
      case 'A': return { background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }
      case 'B': return { background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }
      case 'C': return { background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }
      case 'D': return { background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', color: '#666' }
      default: return { background: 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)', color: '#666' }
    }
  }

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'var(--light-bg)'
      }}>
        <div className="text-center">
          <div className="spinner-border" style={{ color: '#11998e' }} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3" style={{ color: '#6c757d' }}>Loading certificates...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Certificate Management | CCC Admin Portal</title>
      </Head>
      
      <div style={{ background: 'var(--light-bg)', minHeight: 'calc(100vh - 70px)', padding: '2rem 0' }}>
        <div className="container">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4 fade-in">
            <div>
              <h1 className="page-title">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="url(#certGrad)" strokeWidth="2" style={{ marginRight: '0.5rem' }}>
                  <defs>
                    <linearGradient id="certGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#667eea" />
                      <stop offset="100%" stopColor="#764ba2" />
                    </linearGradient>
                  </defs>
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                </svg>
                Certificate Management
              </h1>
              <p className="page-subtitle">View and manage issued certificates</p>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="card glass-card fade-in" style={{ marginBottom: '2rem' }}>
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col-md-6">
                  <div className="input-group">
                    <span className="input-group-text" style={{ 
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none'
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"/>
                        <path d="m21 21-4.35-4.35"/>
                      </svg>
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search by name, enrollment, SI.No...."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.07)' }}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <select
                    className="form-select"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    style={{ border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.07)' }}
                  >
                    <option value="all">All Certificates</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive Only</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="row mb-4 fade-in">
            <div className="col-md-3">
              <div className="card glass-card text-center">
                <div className="card-body">
                  <h3 style={{ color: '#667eea', fontWeight: '700' }}>{certificates.length}</h3>
                  <p style={{ color: '#6c757d', marginBottom: 0 }}>Total Certificates</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card glass-card text-center">
                <div className="card-body">
                  <h3 style={{ color: '#28a745', fontWeight: '700' }}>
                    {certificates.filter(c => c.is_active).length}
                  </h3>
                  <p style={{ color: '#6c757d', marginBottom: 0 }}>Active</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card glass-card text-center">
                <div className="card-body">
                  <h3 style={{ color: '#17a2b8', fontWeight: '700' }}>
                    {certificates.filter(c => c.is_verified).length}
                  </h3>
                  <p style={{ color: '#6c757d', marginBottom: 0 }}>Verified</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card glass-card text-center">
                <div className="card-body">
                  <h3 style={{ color: '#ffc107', fontWeight: '700' }}>
                    {filteredCertificates.length}
                  </h3>
                  <p style={{ color: '#6c757d', marginBottom: 0 }}>Filtered Results</p>
                </div>
              </div>
            </div>
          </div>

          {/* Certificates Table */}
          <div className="card glass-card fade-in">
            <div className="card-body">
              {filteredCertificates.length === 0 ? (
                <div className="text-center py-5">
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#6c757d" strokeWidth="1.5" style={{ marginBottom: '1rem', opacity: 0.5 }}>
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                  </svg>
                  <h5 style={{ color: '#6c757d' }}>No certificates found</h5>
                  <p style={{ color: '#6c757d' }}>
                    {searchTerm ? 'Try adjusting your search criteria' : 'No certificates have been issued yet'}
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Course/Exam</th>
                        <th>Grade & Score</th>
                        <th>SI.No.</th>
                        <th>Issue Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCertificates.map((cert) => (
                        <tr key={cert.id}>
                          <td>
                            <div>
                              <div style={{ fontWeight: '600', color: '#495057' }}>{cert.student_name}</div>
                              <small style={{ color: '#6c757d' }}>{cert.enrollment_number}</small>
                            </div>
                          </td>
                          <td>
                            <div>
                              <div style={{ fontWeight: '600', color: '#495057' }}>{cert.course_name}</div>
                              {cert.exam_name && (
                                <small style={{ color: '#6c757d' }}>{cert.exam_name}</small>
                              )}
                            </div>
                          </td>
                          <td>
                            {cert.grade && cert.score ? (
                              <div className="d-flex align-items-center gap-2">
                                <span style={{
                                  ...getGradeBadgeStyle(cert.grade),
                                  padding: '0.25rem 0.75rem',
                                  borderRadius: '15px',
                                  fontSize: '0.9rem',
                                  fontWeight: '700'
                                }}>
                                  {cert.grade}
                                </span>
                                <div>
                                  <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>
                                    {cert.score}/{cert.total_marks}
                                  </div>
                                  <small style={{ color: '#6c757d' }}>
                                    {cert.percentage?.toFixed(1)}%
                                  </small>
                                </div>
                              </div>
                            ) : (
                              <span style={{ color: '#6c757d', fontSize: '0.9rem' }}>N/A</span>
                            )}
                          </td>
                          <td>
                            <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: '600' }}>
                              {cert.si_number}
                            </div>
                          </td>
                          <td>
                            <small style={{ color: '#6c757d' }}>{cert.issue_date}</small>
                          </td>
                          <td>
                            <div className="d-flex flex-column gap-1">
                              <span style={{
                                background: cert.is_active ? '#28a745' : '#dc3545',
                                color: 'white',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '10px',
                                fontSize: '0.75rem',
                                textAlign: 'center'
                              }}>
                                {cert.is_active ? 'Active' : 'Inactive'}
                              </span>
                              <span style={{
                                background: cert.is_verified ? '#17a2b8' : '#ffc107',
                                color: cert.is_verified ? 'white' : '#212529',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '10px',
                                fontSize: '0.75rem',
                                textAlign: 'center'
                              }}>
                                {cert.is_verified ? 'Verified' : 'Pending'}
                              </span>
                            </div>
                          </td>
                          <td>
                            <div className="d-flex gap-1">
                              <button
                                onClick={() => handleToggleStatus(cert.id, cert.is_active)}
                                disabled={updating === cert.id}
                                style={{
                                  background: cert.is_active ? '#dc3545' : '#28a745',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '8px',
                                  padding: '0.5rem',
                                  fontSize: '0.75rem',
                                  cursor: updating === cert.id ? 'not-allowed' : 'pointer',
                                  opacity: updating === cert.id ? 0.7 : 1
                                }}
                                title={cert.is_active ? 'Deactivate' : 'Activate'}
                              >
                                {cert.is_active ? '' : ''}
                              </button>
                              <button
                                onClick={() => handleToggleVerification(cert.id, cert.is_verified)}
                                disabled={updating === cert.id}
                                style={{
                                  background: cert.is_verified ? '#ffc107' : '#17a2b8',
                                  color: cert.is_verified ? '#212529' : 'white',
                                  border: 'none',
                                  borderRadius: '8px',
                                  padding: '0.5rem',
                                  fontSize: '0.75rem',
                                  cursor: updating === cert.id ? 'not-allowed' : 'pointer',
                                  opacity: updating === cert.id ? 0.7 : 1
                                }}
                                title={cert.is_verified ? 'Unverify' : 'Verify'}
                              >
                                {cert.is_verified ? '' : ''}
                              </button>
                              <button
                                onClick={() => handleDelete(cert.id, cert.student_name)}
                                disabled={updating === cert.id}
                                style={{
                                  background: '#dc3545',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '8px',
                                  padding: '0.5rem',
                                  fontSize: '0.75rem',
                                  cursor: updating === cert.id ? 'not-allowed' : 'pointer',
                                  opacity: updating === cert.id ? 0.7 : 1
                                }}
                                title="Delete"
                              >
                                
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .page-title {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          font-weight: 700;
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
        }
        .page-subtitle {
          color: #6c757d;
          font-size: 1.1rem;
          margin-bottom: 0;
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          border-radius: 15px;
        }
        .fade-in {
          animation: fadeIn 0.8s ease-in;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        :global(:root) {
          --light-bg: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        }
      `}</style>
    </>
  )
}