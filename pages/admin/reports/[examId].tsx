// pages/admin/reports/[examId].tsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { db } from '../../../lib/dbClient'

interface Exam {
  id: string
  name: string
  exam_date: string
  start_time: string
  end_time: string
  duration_minutes: number
}

interface StudentReport {
  student_id: string
  student_name: string
  enrollment_number: string
  attempt_id: string | null
  attempt_status: 'not_started' | 'in_progress' | 'submitted' | 'auto_submitted'
  score: number | null
  percentage: number | null
  submitted_at: string | null
  is_passed: boolean | null
}

export default function AdminExamReport() {
  const router = useRouter()
  const { examId } = router.query
  const [loading, setLoading] = useState(true)
  const [exam, setExam] = useState<Exam | null>(null)
  const [studentReports, setStudentReports] = useState<StudentReport[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkAdminAndLoad = async () => {
      const { data: { user } } = await db.auth.getUser()

      if (!user) {
        router.replace('/login')
        return
      }

      const { data: profile } = await db
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin') {
        router.replace('/student/dashboard')
        return
      }

      if (examId) {
        await fetchExamReport()
      }
    }

    checkAdminAndLoad()
  }, [router, examId])

  const fetchExamReport = async () => {
    try {
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

      // Fetch all assigned students for this exam
      const { data: assignments } = await db
        .from('exam_assignments')
        .select('student_id')
        .eq('exam_id', examId)

      if (!assignments || assignments.length === 0) {
        setStudentReports([])
        setLoading(false)
        return
      }

      const studentIds = assignments.map(a => a.student_id)

      // Fetch student details
      const { data: students } = await db
        .from('students')
        .select('id, enrollment_number, profile_id, profiles:profile_id(full_name)')
        .in('id', studentIds)

      // Fetch exam attempts for these students
      const { data: attempts } = await db
        .from('exam_attempts')
        .select('id, student_id, status, score, percentage, submitted_at, is_passed')
        .eq('exam_id', examId)
        .in('student_id', studentIds)

      // Create student reports
      const reports: StudentReport[] = (students || []).map((student: any) => {
        const profile = Array.isArray(student.profiles) ? student.profiles[0] : student.profiles
        const attempt = (attempts || []).find(a => a.student_id === student.id)

        return {
          student_id: student.id,
          student_name: profile?.full_name || 'Unknown',
          enrollment_number: student.enrollment_number || '-',
          attempt_id: attempt?.id || null,
          attempt_status: attempt?.status || 'not_started',
          score: attempt?.score || null,
          percentage: attempt?.percentage || null,
          submitted_at: attempt?.submitted_at || null,
          is_passed: attempt?.is_passed || null
        }
      })

      setStudentReports(reports)
      setLoading(false)
    } catch (err: any) {
      setError(err.message || 'Failed to load exam report')
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return { bg: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', text: 'Completed' }
      case 'auto_submitted':
        return { bg: 'linear-gradient(135deg, #F2994A 0%, #F2C94C 100%)', text: 'Auto Submitted' }
      case 'in_progress':
        return { bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', text: 'In Progress' }
      default:
        return { bg: 'linear-gradient(135deg, #6c757d 0%, #495057 100%)', text: 'Not Started' }
    }
  }

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const exportToPDF = async () => {
    // Import jsPDF dynamically to avoid SSR issues
    const { default: jsPDF } = await import('jspdf')
    const doc = new jsPDF()

    // Header
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('CCC Exam Report', 20, 20)
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(`Exam: ${exam?.name || 'N/A'}`, 20, 30)
    doc.text(`Date: ${exam?.exam_date || 'N/A'}`, 20, 40)
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 50)

    // Stats
    const completed = studentReports.filter(s => s.attempt_status === 'submitted' || s.attempt_status === 'auto_submitted').length
    const avgScore = studentReports.filter(s => s.percentage !== null).reduce((sum, s) => sum + (s.percentage || 0), 0) / Math.max(studentReports.filter(s => s.percentage !== null).length, 1)

    doc.text(`Total Students: ${studentReports.length}`, 20, 65)
    doc.text(`Completed: ${completed}`, 20, 75)
    doc.text(`Average Score: ${avgScore.toFixed(1)}%`, 20, 85)

    // Table headers
    let yPos = 100
    doc.setFont('helvetica', 'bold')
    doc.text('Student Name', 20, yPos)
    doc.text('Enrollment', 80, yPos)
    doc.text('Status', 130, yPos)
    doc.text('Score', 170, yPos)

    yPos += 10
    doc.setFont('helvetica', 'normal')

    // Table data
    studentReports.forEach((report) => {
      if (yPos > 250) {
        doc.addPage()
        yPos = 20
      }

      doc.text(report.student_name.substring(0, 20), 20, yPos)
      doc.text(report.enrollment_number, 80, yPos)
      doc.text(report.attempt_status, 130, yPos)
      doc.text(report.percentage ? `${report.percentage.toFixed(1)}%` : '-', 170, yPos)

      yPos += 8
    })

    doc.save(`exam-report-${exam?.name?.replace(/\s+/g, '-') || 'unknown'}.pdf`)
  }

  const exportToExcel = async () => {
    // Import xlsx dynamically
    const XLSX = await import('xlsx')

    const data = studentReports.map(report => ({
      'Student Name': report.student_name,
      'Enrollment Number': report.enrollment_number,
      'Status': report.attempt_status,
      'Score': report.score || 0,
      'Percentage': report.percentage ? `${report.percentage.toFixed(1)}%` : '-',
      'Submitted At': report.submitted_at ? new Date(report.submitted_at).toLocaleString() : '-',
      'Result': report.is_passed === true ? 'PASSED' : report.is_passed === false ? 'FAILED' : '-'
    }))

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Exam Report')

    XLSX.writeFile(wb, `exam-report-${exam?.name?.replace(/\s+/g, '-') || 'unknown'}.xlsx`)
  }

  const handlePrint = () => {
    window.print()
  }

  // Stats
  const totalStudents = studentReports.length
  const completed = studentReports.filter(s => s.attempt_status === 'submitted' || s.attempt_status === 'auto_submitted').length
  const notStarted = studentReports.filter(s => s.attempt_status === 'not_started').length
  const inProgress = studentReports.filter(s => s.attempt_status === 'in_progress').length
  const passedCount = studentReports.filter(s => s.is_passed === true).length
  const avgScore = completed > 0 
    ? studentReports.filter(s => s.percentage !== null).reduce((sum, s) => sum + (s.percentage || 0), 0) / completed
    : 0

  if (loading) {
    return (
      <div style={{ background: 'var(--light-bg)', minHeight: 'calc(100vh - 70px)' }}>
        <div className="container py-5">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading exam report...</p>
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
          <Link href="/admin/exams" className="btn btn-secondary">
            Back to Exams
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Exam Report  {exam.name}  CCC Exam Portal</title>
      </Head>

      <style jsx>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          .container {
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
        .print-only {
          display: none;
        }
      `}</style>

      <div style={{ background: 'var(--light-bg)', minHeight: 'calc(100vh - 70px)', padding: '2rem 0' }}>
        <div className="container">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4 fade-in no-print">
            <div>
              <h1 className="page-title">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="url(#reportGrad)" strokeWidth="2" style={{ marginRight: '0.5rem' }}>
                  <defs>
                    <linearGradient id="reportGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#667eea" />
                      <stop offset="100%" stopColor="#764ba2" />
                    </linearGradient>
                  </defs>
                  <line x1="18" y1="20" x2="18" y2="10"/>
                  <line x1="12" y1="20" x2="12" y2="4"/>
                  <line x1="6" y1="20" x2="6" y2="14"/>
                </svg>
                Exam Report
              </h1>
              <p className="page-subtitle">Detailed analysis of exam performance</p>
            </div>
            <div className="d-flex gap-2">
              <Link href="/admin/exams" className="btn-premium-outline">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.5rem' }}>
                  <line x1="19" y1="12" x2="5" y2="12"/>
                  <polyline points="12 19 5 12 12 5"/>
                </svg>
                Back to Exams
              </Link>
            </div>
          </div>

          {/* Print Header */}
          <div className="print-only mb-4">
            <h1 style={{ fontSize: '24px', marginBottom: '10px' }}>CCC Exam Report</h1>
            <p style={{ margin: '5px 0' }}><strong>Exam:</strong> {exam.name}</p>
            <p style={{ margin: '5px 0' }}><strong>Date:</strong> {exam.exam_date}</p>
            <p style={{ margin: '5px 0' }}><strong>Generated:</strong> {new Date().toLocaleDateString()}</p>
          </div>

          {/* Exam Info Card */}
          <div className="premium-card mb-4 fade-in stagger-1">
            <div className="premium-card-header">
              <h5 className="mb-0 d-flex align-items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                {exam.name}
              </h5>
            </div>
            <div className="premium-card-body">
              <div className="row">
                <div className="col-md-3">
                  <div className="text-center">
                    <div className="h5 text-primary mb-0">{exam.exam_date}</div>
                    <small className="text-muted">Exam Date</small>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-center">
                    <div className="h5 text-primary mb-0">{exam.duration_minutes} min</div>
                    <small className="text-muted">Duration</small>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-center">
                    <div className="h5 text-primary mb-0">{exam.start_time}</div>
                    <small className="text-muted">Start Time</small>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-center">
                    <div className="h5 text-primary mb-0">{exam.end_time}</div>
                    <small className="text-muted">End Time</small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="row g-3 mb-4">
            <div className="col-md-6 col-lg-3">
              <div className="glass-card p-3 text-center fade-in stagger-2">
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
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </div>
                  <div className="text-start">
                    <div className="fw-bold" style={{ fontSize: '1.5rem', color: 'var(--dark-text)' }}>{totalStudents}</div>
                    <div className="text-muted small">Total Assigned</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-6 col-lg-3">
              <div className="glass-card p-3 text-center fade-in stagger-3">
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
                    <div className="fw-bold" style={{ fontSize: '1.5rem', color: 'var(--dark-text)' }}>{completed}</div>
                    <div className="text-muted small">Completed</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-6 col-lg-3">
              <div className="glass-card p-3 text-center fade-in stagger-4">
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
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                    </svg>
                  </div>
                  <div className="text-start">
                    <div className="fw-bold" style={{ fontSize: '1.5rem', color: 'var(--dark-text)' }}>{avgScore.toFixed(1)}%</div>
                    <div className="text-muted small">Average Score</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-6 col-lg-3">
              <div className="glass-card p-3 text-center fade-in stagger-5">
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
                      <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m0 0V9l3-3 3 3v12a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-1a1 1 0 011-1h2a1 1 0 011 1v1a1 1 0 001 1"/>
                    </svg>
                  </div>
                  <div className="text-start">
                    <div className="fw-bold" style={{ fontSize: '1.5rem', color: 'var(--dark-text)' }}>{passedCount}</div>
                    <div className="text-muted small">Passed</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="d-flex flex-wrap gap-3 mb-4 no-print fade-in stagger-6">
            <button onClick={exportToPDF} className="btn-premium">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.5rem' }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              Export to PDF
            </button>
            <button onClick={exportToExcel} className="btn-premium-outline">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.5rem' }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              Export to Excel
            </button>
            <button onClick={handlePrint} className="btn-premium-outline">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.5rem' }}>
                <polyline points="6 9 6 2 18 2 18 9"/>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                <rect x="6" y="14" width="12" height="8"/>
              </svg>
              Print Report
            </button>
          </div>

          {/* Student Reports Table */}
          <div className="premium-card fade-in stagger-7">
            <div className="premium-card-header">
              <h5 className="mb-0 d-flex align-items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-4"/>
                  <rect x="9" y="7" width="6" height="4"/>
                </svg>
                Student Performance Details
              </h5>
            </div>
            <div className="premium-card-body p-0">
              {studentReports.length === 0 ? (
                <div className="text-center py-5">
                  <p className="text-muted">No students assigned to this exam.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-premium mb-0">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Enrollment No.</th>
                        <th>Status</th>
                        <th>Score</th>
                        <th>Percentage</th>
                        <th>Result</th>
                        <th>Submitted At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentReports.map((report, index) => {
                        const statusInfo = getStatusBadge(report.attempt_status)
                        const isPassed = report.is_passed === true || (report.is_passed === null && (report.percentage || 0) >= 40)
                        
                        return (
                          <tr key={report.student_id} className="fade-in" style={{ animationDelay: `${index * 0.03}s` }}>
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
                                  {report.student_name.charAt(0).toUpperCase()}
                                </div>
                                <span className="fw-semibold" style={{ color: 'var(--dark-text)' }}>
                                  {report.student_name}
                                </span>
                              </div>
                            </td>
                            <td>
                              <code style={{ 
                                background: 'rgba(102, 126, 234, 0.1)',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '4px',
                                color: '#667eea'
                              }}>
                                {report.enrollment_number}
                              </code>
                            </td>
                            <td>
                              <span style={{
                                background: statusInfo.bg,
                                color: 'white',
                                padding: '0.4rem 0.8rem',
                                borderRadius: '20px',
                                fontSize: '0.75rem',
                                fontWeight: '600'
                              }}>
                                {statusInfo.text}
                              </span>
                            </td>
                            <td>
                              <span className="fw-bold">
                                {report.score !== null ? report.score : '-'}
                              </span>
                            </td>
                            <td>
                              {report.percentage !== null ? (
                                <div className="d-flex align-items-center gap-2">
                                  <div style={{
                                    width: '60px',
                                    height: '6px',
                                    background: '#e9ecef',
                                    borderRadius: '3px',
                                    overflow: 'hidden'
                                  }}>
                                    <div style={{
                                      width: `${Math.min(report.percentage, 100)}%`,
                                      height: '100%',
                                      background: isPassed 
                                        ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
                                        : 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)',
                                      borderRadius: '3px'
                                    }}></div>
                                  </div>
                                  <span className="fw-semibold" style={{ 
                                    color: isPassed ? '#11998e' : '#eb3349' 
                                  }}>
                                    {report.percentage.toFixed(1)}%
                                  </span>
                                </div>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td>
                              {report.attempt_status === 'submitted' || report.attempt_status === 'auto_submitted' ? (
                                <span className="badge" style={{
                                  background: isPassed 
                                    ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
                                    : 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)',
                                  padding: '0.4rem 0.8rem',
                                  borderRadius: '20px',
                                  fontSize: '0.75rem'
                                }}>
                                  {isPassed ? 'PASSED' : 'FAILED'}
                                </span>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                {formatDateTime(report.submitted_at)}
                              </span>
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