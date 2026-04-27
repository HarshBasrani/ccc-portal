// pages/admin/completed-exams.tsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { legacyClient } from '../../lib/legacyClient'

interface CompletedExam {
  id: string
  student_id: string
  student_name: string
  enrollment_number: string
  exam_id: string
  exam_name: string
  score: number
  percentage: number
  total_marks: number
  submitted_at: string
  status: string
  is_passed: boolean
}

export default function AdminCompletedExams() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [completedExams, setCompletedExams] = useState<CompletedExam[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'passed' | 'failed'>('all')
  const [updating, setUpdating] = useState<string | null>(null)
  const [editingExam, setEditingExam] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<{score: number, percentage: number}>({score: 0, percentage: 0})

  const getGrade = (percentage: number) => {
    if (percentage >= 85) return { grade: 'S', color: '#8b5cf6', label: 'Excellent' }
    if (percentage >= 75) return { grade: 'A', color: '#10b981', label: 'Very Good' }
    if (percentage >= 65) return { grade: 'B', color: '#3b82f6', label: 'Good' }
    if (percentage >= 55) return { grade: 'C', color: '#f59e0b', label: 'Average' }
    if (percentage >= 45) return { grade: 'D', color: '#ef4444', label: 'Below Average' }
    return { grade: 'F', color: '#6b7280', label: 'Fail' }
  }

  const getPassStatus = (percentage: number, is_passed: boolean) => {
    // Pass threshold is 45% (Grade D or above)
    const naturallyPassed = percentage >= 45
    const manuallyPassed = is_passed && !naturallyPassed
    
    return {
      passed: is_passed || naturallyPassed,
      isManual: manuallyPassed,
      isNatural: naturallyPassed
    }
  }

  const fetchCompletedExams = async () => {
    try {
      // Get all exam attempts
      const { data: attempts, error: attemptsError } = await legacyClient
        .from('exam_attempts')
        .select('*')
        .in('status', ['submitted', 'auto_submitted'])
        .order('submitted_at', { ascending: false })

      if (attemptsError || !attempts) {
        console.error('Error fetching attempts:', attemptsError)
        setCompletedExams([])
        return
      }

      // Get all students (like the students list page does)
      const { data: students, error: studentsError } = await legacyClient
        .from('students')
        .select('*')

      if (studentsError) {
        console.error('Error fetching students:', studentsError)
      }

      // Get all profiles to get student names
      const { data: profiles, error: profilesError } = await legacyClient
        .from('profiles')
        .select('*')

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError)
      }

      // Get all exams
      const { data: exams, error: examsError } = await legacyClient
        .from('exams')
        .select('*')

      if (examsError) {
        console.error('Error fetching exams:', examsError)
      }

      // Create lookup maps
      const studentMap = new Map()
      if (students) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        students.forEach((student: any) => {
          studentMap.set(student.id, student)
        })
      }

      const profileMap = new Map()
      if (profiles) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        profiles.forEach((profile: any) => {
          profileMap.set(profile.id, profile)
        })
      }

      const examMap = new Map()
      if (exams) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        exams.forEach((exam: any) => {
          examMap.set(exam.id, exam)
        })
      }

      // Format the attempts with student and exam data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const formatted: CompletedExam[] = attempts.map((attempt: any) => {
        const percentage = attempt.percentage || 0
        const isPassed = attempt.is_passed === true || percentage >= 45
        
        const student = studentMap.get(attempt.student_id)
        const profile = student ? profileMap.get(student.profile_id) : null
        const exam = examMap.get(attempt.exam_id)

        // Get name from profile and enrollment from student
        const studentName = profile?.full_name || profile?.name || 'Unknown Student'
        const enrollmentNumber = student?.enrollment_no || student?.enrollment_number || 'N/A'

        return {
          id: attempt.id,
          student_id: attempt.student_id,
          student_name: studentName,
          enrollment_number: enrollmentNumber,
          exam_id: attempt.exam_id,
          exam_name: exam?.name || exam?.title || 'Unknown Exam',
          score: attempt.score || 0,
          percentage: percentage,
          total_marks: 100,
          submitted_at: attempt.submitted_at,
          status: attempt.status,
          is_passed: isPassed
        }
      })

      setCompletedExams(formatted)

    } catch (error) {
      console.error('Error in fetchCompletedExams:', error)
      setCompletedExams([])
    }
  }

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

      await fetchCompletedExams()
      setLoading(false)
    }

    checkAdminAccess()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const processFallbackData = async (attempts: /* eslint-disable-next-line @typescript-eslint/no-explicit-any */ any[]) => {
    if (!attempts || attempts.length === 0) {
      setCompletedExams([])
      return
    }

    // Get unique student and exam IDs
    const studentIds = [...new Set(attempts.map(a => a.student_id).filter(Boolean))]
    const examIds = [...new Set(attempts.map(a => a.exam_id).filter(Boolean))]

    // Fetch students with their enrollment numbers
    const { data: studentsData } = await legacyClient
      .from('students')
      .select(`
        id, 
        enrollment_number, 
        profile_id,
        profiles!inner(full_name)
      `)
      .in('id', studentIds)

    // Fetch exams with their course for total marks
    const { data: examsData } = await legacyClient
      .from('exams')
      .select('id, name, course_id')
      .in('id', examIds)

    // Get total marks per course (sum of question marks)
    const courseIds = [...new Set((examsData || []).map((e: { course_id?: string }) => e.course_id).filter(Boolean))]
    const { data: questionsData } = await legacyClient
      .from('questions')
      .select('course_id, marks')
      .in('course_id', courseIds)

    // Calculate total marks per course
    const courseMarksMap = new Map<string, number>()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    questionsData?.forEach((q: any) => {
      const current = courseMarksMap.get(q.course_id) || 0
      courseMarksMap.set(q.course_id, current + (q.marks || 1))
    })

    // Create lookup maps
    const studentMap = new Map()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    studentsData?.forEach((s: any) => {
      studentMap.set(s.id, {
        name: s.profiles?.full_name || 'Unknown Student',
        enrollment_number: s.enrollment_number || '-'
      })
    })

    const examMap = new Map()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    examsData?.forEach((e: any) => {
      examMap.set(e.id, {
        name: e.name || 'Unknown Exam',
        course_id: e.course_id
      })
    })

    // Format the data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formatted: CompletedExam[] = attempts.map((attempt: any) => {
      const student = studentMap.get(attempt.student_id) || { name: 'Unknown Student', enrollment_number: '-' }
      const exam = examMap.get(attempt.exam_id) || { name: 'Unknown Exam', course_id: null }
      const totalMarks = courseMarksMap.get(exam.course_id) || 0
      const percentage = attempt.percentage || (totalMarks > 0 ? (attempt.score / totalMarks) * 100 : 0)
      
      // Pass threshold is 40%
      const isPassed = attempt.is_passed === true || percentage >= 40

      return {
        id: attempt.id,
        student_id: attempt.student_id,
        student_name: student.name,
        enrollment_number: student.enrollment_number,
        exam_id: attempt.exam_id,
        exam_name: exam.name,
        score: attempt.score || 0,
        percentage: percentage,
        total_marks: totalMarks,
        submitted_at: attempt.submitted_at,
        status: attempt.status,
        is_passed: isPassed
      }
    })

    setCompletedExams(formatted)
  }

  const handleMarkAsPassed = async (attemptId: string) => {
    setUpdating(attemptId)

    const { error } = await legacyClient
      .from('exam_attempts')
      .update({ is_passed: true })
      .eq('id', attemptId)

    if (error) {
      alert('Failed to update: ' + error.message)
      setUpdating(null)
      return
    }

    // Update local state
    setCompletedExams(prev => prev.map(exam => 
      exam.id === attemptId ? { ...exam, is_passed: true } : exam
    ))

    setUpdating(null)
  }

  const handleMarkAsFailed = async (attemptId: string) => {
    setUpdating(attemptId)

    const { error } = await legacyClient
      .from('exam_attempts')
      .update({ is_passed: false })
      .eq('id', attemptId)

    if (error) {
      alert('Failed to update: ' + error.message)
      setUpdating(null)
      return
    }

    // Update local state
    setCompletedExams(prev => prev.map(exam => 
      exam.id === attemptId ? { ...exam, is_passed: false } : exam
    ))

    setUpdating(null)
  }

  const startEditing = (exam: CompletedExam) => {
    setEditingExam(exam.id)
    setEditValues({ score: exam.score, percentage: exam.percentage })
  }

  const cancelEditing = () => {
    setEditingExam(null)
    setEditValues({ score: 0, percentage: 0 })
  }

  const saveEdit = async (examId: string, totalMarks: number) => {
    setUpdating(examId)
    
    try {
      // Validate inputs
      const newScore = Math.max(0, Math.min(editValues.score, totalMarks))
      const newPercentage = totalMarks > 0 ? (newScore / totalMarks) * 100 : editValues.percentage
      const newGrade = getGrade(newPercentage).grade
      
      // Update database (grade is calculated, not stored)
      const { error } = await legacyClient
        .from('exam_attempts')
        .update({ 
          score: newScore, 
          percentage: newPercentage,
          is_passed: newPercentage >= 45  // Auto-update pass status based on new percentage
        })
        .eq('id', examId)

      if (error) {
        alert('Failed to update marks: ' + error.message)
        setUpdating(null)
        return
      }

      // Update local state with calculated grade
      setCompletedExams(prev => prev.map(exam => 
        exam.id === examId ? { 
          ...exam, 
          score: newScore, 
          percentage: newPercentage,
          grade: newGrade,
          is_passed: newPercentage >= 45
        } : exam
      ))

      setEditingExam(null)
      setEditValues({ score: 0, percentage: 0 })
      setUpdating(null)
      
    } catch (error) {
      console.error('Error updating marks:', error)
      alert('Failed to update marks')
      setUpdating(null)
    }
  }

  const handleGenerateCertificate = async (exam: CompletedExam) => {
    if (!exam.is_passed) {
      alert('Can only generate certificates for passed students')
      return
    }

    // Navigate to certificate printing page
    router.push(`/admin/certificate-print/${exam.student_id}`)
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

  const getScoreColor = (percentage: number, isPassed: boolean) => {
    if (isPassed) return 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
    if (percentage >= 40) return 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
    return 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)'
  }

  // Filter logic
  let filteredExams = completedExams.filter(exam =>
    exam.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exam.enrollment_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exam.exam_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (filterStatus === 'passed') {
    filteredExams = filteredExams.filter(e => e.is_passed || e.percentage >= 45)
  } else if (filterStatus === 'failed') {
    filteredExams = filteredExams.filter(e => !e.is_passed && e.percentage < 45)
  }

  // Stats
  const totalCompleted = completedExams.length
  const passedCount = completedExams.filter(e => e.is_passed || e.percentage >= 45).length
  const failedCount = completedExams.filter(e => !e.is_passed && e.percentage < 45).length
  const manuallyPassedCount = completedExams.filter(e => e.is_passed && e.percentage < 45).length

  if (loading) {
    return (
      <div style={{ background: 'var(--light-bg)', minHeight: 'calc(100vh - 70px)' }}>
        <div className="container py-5">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading completed exams...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Completed Exams  Admin  CCC Exam Portal</title>
      </Head>
      <div style={{ background: 'var(--light-bg)', minHeight: 'calc(100vh - 70px)', padding: '2rem 0' }}>
        <div className="container">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4 fade-in">
            <div>
              <h1 className="page-title">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="url(#compGrad)" strokeWidth="2" style={{ marginRight: '0.5rem' }}>
                  <defs>
                    <linearGradient id="compGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#11998e" />
                      <stop offset="100%" stopColor="#38ef7d" />
                    </linearGradient>
                  </defs>
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                Completed Exams
              </h1>
              <p className="page-subtitle">Review student exam submissions and manage results</p>
            </div>
            <div className="d-flex align-items-center gap-3">
              <Link href="/admin/dashboard" className="btn btn-outline-secondary">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.5rem' }}>
                  <line x1="19" y1="12" x2="5" y2="12"/>
                  <polyline points="12 19 5 12 12 5"/>
                </svg>
                Back to Dashboard
              </Link>
              <button 
                className="btn btn-primary"
                onClick={fetchCompletedExams}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.6rem 1.2rem',
                  fontWeight: '600'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.5rem' }}>
                  <polyline points="23 4 23 10 17 10"/>
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                </svg>
                Refresh Data
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="row g-3 mb-4">
            <div className="col-md-3">
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
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                  </div>
                  <div className="text-start">
                    <div className="fw-bold" style={{ fontSize: '1.5rem', color: 'var(--dark-text)' }}>{totalCompleted}</div>
                    <div className="text-muted small">Total Completed</div>
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
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                  </div>
                  <div className="text-start">
                    <div className="fw-bold" style={{ fontSize: '1.5rem', color: 'var(--dark-text)' }}>{passedCount}</div>
                    <div className="text-muted small">Passed</div>
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
                    background: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="15" y1="9" x2="9" y2="15"/>
                      <line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                  </div>
                  <div className="text-start">
                    <div className="fw-bold" style={{ fontSize: '1.5rem', color: 'var(--dark-text)' }}>{failedCount}</div>
                    <div className="text-muted small">Failed</div>
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
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M12 20h9"/>
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                    </svg>
                  </div>
                  <div className="text-start">
                    <div className="fw-bold" style={{ fontSize: '1.5rem', color: 'var(--dark-text)' }}>{manuallyPassedCount}</div>
                    <div className="text-muted small">Manual Pass</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Card */}
          <div className="premium-card fade-in">
            <div className="premium-card-header">
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
                <h5 className="mb-0 d-flex align-items-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  Exam Submissions
                </h5>
                <div className="d-flex align-items-center gap-3 flex-wrap">
                  {/* Filter Buttons */}
                  <div className="btn-group">
                    <button 
                      className={`btn btn-sm ${filterStatus === 'all' ? 'btn-primary' : 'btn-outline-secondary'}`}
                      onClick={() => setFilterStatus('all')}
                    >
                      All
                    </button>
                    <button 
                      className={`btn btn-sm ${filterStatus === 'passed' ? 'btn-success' : 'btn-outline-secondary'}`}
                      onClick={() => setFilterStatus('passed')}
                    >
                      Passed
                    </button>
                    <button 
                      className={`btn btn-sm ${filterStatus === 'failed' ? 'btn-danger' : 'btn-outline-secondary'}`}
                      onClick={() => setFilterStatus('failed')}
                    >
                      Failed
                    </button>
                  </div>

                  {/* Search */}
                  <div style={{ position: 'relative' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6c757d" strokeWidth="2" 
                      style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                      <circle cx="11" cy="11" r="8"/>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <input
                      type="text"
                      placeholder="Search by name, enrollment, exam..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="form-control"
                      style={{ 
                        paddingLeft: '40px',
                        borderRadius: '10px',
                        border: '2px solid #e9ecef',
                        minWidth: '280px'
                      }}
                    />
                  </div>

                  <span className="badge" style={{ 
                    background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                    padding: '0.5rem 1rem',
                    borderRadius: '20px',
                    fontSize: '0.85rem'
                  }}>
                    {filteredExams.length} result{filteredExams.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
            <div className="premium-card-body p-0">
              {filteredExams.length === 0 ? (
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
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                  </div>
                  <p className="text-muted mb-0">
                    {searchTerm || filterStatus !== 'all' 
                      ? 'No exams match your filter criteria.' 
                      : 'No completed exams found yet.'}
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table mb-0" style={{
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                  }}>
                    <thead>
                      <tr style={{
                        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                        borderBottom: '2px solid #dee2e6'
                      }}>
                        <th style={{
                          padding: '1.2rem 1rem',
                          fontWeight: '600',
                          fontSize: '0.9rem',
                          color: '#495057',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          border: 'none'
                        }}>Student Info</th>
                        <th style={{
                          padding: '1.2rem 1rem',
                          fontWeight: '600',
                          fontSize: '0.9rem',
                          color: '#495057',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          border: 'none'
                        }}>Exam</th>
                        <th style={{
                          padding: '1.2rem 1rem',
                          fontWeight: '600',
                          fontSize: '0.9rem',
                          color: '#495057',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          border: 'none',
                          textAlign: 'center'
                        }}>Score</th>
                        <th style={{
                          padding: '1.2rem 1rem',
                          fontWeight: '600',
                          fontSize: '0.9rem',
                          color: '#495057',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          border: 'none',
                          textAlign: 'center'
                        }}>Grade</th>
                        <th style={{
                          padding: '1.2rem 1rem',
                          fontWeight: '600',
                          fontSize: '0.9rem',
                          color: '#495057',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          border: 'none',
                          textAlign: 'center'
                        }}>Status</th>
                        <th style={{
                          padding: '1.2rem 1rem',
                          fontWeight: '600',
                          fontSize: '0.9rem',
                          color: '#495057',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          border: 'none',
                          textAlign: 'center'
                        }}>Submitted</th>
                        <th style={{
                          padding: '1.2rem 1rem',
                          fontWeight: '600',
                          fontSize: '0.9rem',
                          color: '#495057',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          border: 'none',
                          textAlign: 'center'
                        }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredExams.map((exam, index) => (
                        <tr key={exam.id} className="fade-in" style={{ 
                          animationDelay: `${index * 0.03}s`,
                          borderBottom: index < filteredExams.length - 1 ? '1px solid #f1f3f5' : 'none'
                        }}>
                          <td style={{ padding: '1.5rem 1rem', border: 'none', verticalAlign: 'middle' }}>
                            <div className="d-flex align-items-center gap-3">
                              <div style={{
                                width: '48px',
                                height: '48px',
                                background: exam.is_passed 
                                  ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
                                  : 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: '700',
                                fontSize: '1.1rem',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                              }}>
                                {exam.student_name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ 
                                  fontWeight: '600',
                                  fontSize: '1rem',
                                  color: '#2d3748',
                                  marginBottom: '0.25rem'
                                }}>
                                  {exam.student_name}
                                </div>
                                <div style={{
                                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                  color: 'white',
                                  padding: '0.25rem 0.75rem',
                                  borderRadius: '20px',
                                  fontSize: '0.75rem',
                                  fontWeight: '600',
                                  display: 'inline-block'
                                }}>
                                  {exam.enrollment_number}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '1.5rem 1rem', border: 'none', verticalAlign: 'middle' }}>
                            <div style={{
                              background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                              padding: '0.75rem 1rem',
                              borderRadius: '12px',
                              border: '2px solid #dee2e6'
                            }}>
                              <div style={{
                                fontWeight: '600',
                                fontSize: '0.9rem',
                                color: '#495057',
                                marginBottom: '0.25rem'
                              }}>
                                {exam.exam_name}
                              </div>
                              <div style={{
                                fontSize: '0.75rem',
                                color: '#6c757d'
                              }}>
                                Total: {exam.total_marks} marks
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '1.5rem 1rem', border: 'none', verticalAlign: 'middle', textAlign: 'center' }}>
                            {editingExam === exam.id ? (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <input
                                    type="number"
                                    min="0"
                                    max={exam.total_marks}
                                    value={editValues.score}
                                    onChange={(e) => setEditValues(prev => ({ ...prev, score: parseInt(e.target.value) || 0 }))}
                                    style={{
                                      width: '80px',
                                      padding: '0.5rem',
                                      borderRadius: '8px',
                                      border: '2px solid #007bff',
                                      textAlign: 'center',
                                      fontSize: '1rem',
                                      fontWeight: '600'
                                    }}
                                  />
                                  <span style={{ color: '#6c757d', fontWeight: '600' }}>/ {exam.total_marks}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '0.25rem' }}>
                                  <button
                                    onClick={() => saveEdit(exam.id, exam.total_marks)}
                                    disabled={updating === exam.id}
                                    style={{
                                      background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '6px',
                                      padding: '0.25rem 0.5rem',
                                      fontSize: '0.75rem',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    {updating === exam.id ? '...' : ''}
                                  </button>
                                  <button
                                    onClick={cancelEditing}
                                    disabled={updating === exam.id}
                                    style={{
                                      background: '#6c757d',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '6px',
                                      padding: '0.25rem 0.5rem',
                                      fontSize: '0.75rem',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div 
                                onClick={() => startEditing(exam)}
                                style={{
                                  background: getScoreColor(exam.percentage, exam.is_passed),
                                  color: 'white',
                                  padding: '0.75rem 1.25rem',
                                  borderRadius: '25px',
                                  fontSize: '1rem',
                                  fontWeight: '700',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                  display: 'inline-block',
                                  minWidth: '90px',
                                  cursor: 'pointer',
                                  transition: 'all 0.3s ease',
                                  position: 'relative'
                                }}
                                onMouseOver={(e) => {
                                  e.currentTarget.style.transform = 'scale(1.05)'
                                  // Add edit icon on hover
                                  const editIcon = document.createElement('div')
                                  editIcon.innerHTML = ''
                                  editIcon.style.position = 'absolute'
                                  editIcon.style.top = '-8px'
                                  editIcon.style.right = '-8px'
                                  editIcon.style.background = 'white'
                                  editIcon.style.borderRadius = '50%'
                                  editIcon.style.width = '20px'
                                  editIcon.style.height = '20px'
                                  editIcon.style.display = 'flex'
                                  editIcon.style.alignItems = 'center'
                                  editIcon.style.justifyContent = 'center'
                                  editIcon.style.fontSize = '10px'
                                  editIcon.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)'
                                  editIcon.className = 'edit-icon'
                                  e.currentTarget.appendChild(editIcon)
                                }}
                                onMouseOut={(e) => {
                                  e.currentTarget.style.transform = 'scale(1)'
                                  const editIcon = e.currentTarget.querySelector('.edit-icon')
                                  if (editIcon) editIcon.remove()
                                }}
                                title="Click to edit marks"
                              >
                                {exam.score} / {exam.total_marks}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '1.5rem 1rem', border: 'none', verticalAlign: 'middle', textAlign: 'center' }}>
                            {(() => {
                              // Use edit values if editing, otherwise use exam values
                              const displayPercentage = editingExam === exam.id ? 
                                (exam.total_marks > 0 ? (editValues.score / exam.total_marks) * 100 : editValues.percentage) : 
                                exam.percentage
                              const gradeInfo = getGrade(displayPercentage)
                              // eslint-disable-next-line @typescript-eslint/no-unused-vars
                              const passInfo = getPassStatus(displayPercentage, exam.is_passed)
                              return (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                  <div style={{
                                    width: '60px',
                                    height: '60px',
                                    background: `linear-gradient(135deg, ${gradeInfo.color} 0%, ${gradeInfo.color}dd 100%)`,
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontSize: '1.5rem',
                                    fontWeight: '900',
                                    boxShadow: `0 4px 12px ${gradeInfo.color}40`,
                                    border: editingExam === exam.id ? '3px solid #007bff' : '3px solid white',
                                    transition: 'all 0.3s ease'
                                  }}>
                                    {gradeInfo.grade}
                                  </div>
                                  <div style={{ textAlign: 'center' }}>
                                    <div style={{
                                      fontWeight: '700',
                                      fontSize: '1rem',
                                      color: editingExam === exam.id ? '#007bff' : gradeInfo.color,
                                      marginBottom: '0.25rem',
                                      transition: 'all 0.3s ease'
                                    }}>
                                      {displayPercentage.toFixed(1)}%
                                    </div>
                                    <div style={{
                                      fontSize: '0.75rem',
                                      color: '#6c757d',
                                      fontWeight: '600'
                                    }}>
                                      {gradeInfo.label}
                                    </div>
                                  </div>
                                </div>
                              )
                            })()}
                          </td>
                          <td style={{ padding: '1.5rem 1rem', border: 'none', verticalAlign: 'middle', textAlign: 'center' }}>
                            {(() => {
                              const passInfo = getPassStatus(exam.percentage, exam.is_passed)
                              return (
                                <div>
                                  {passInfo.passed ? (
                                    <span style={{
                                      background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                                      color: 'white',
                                      padding: '0.6rem 1.2rem',
                                      borderRadius: '25px',
                                      fontSize: '0.85rem',
                                      fontWeight: '700',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.5rem',
                                      boxShadow: '0 4px 12px rgba(17, 153, 142, 0.3)'
                                    }}>
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="20 6 9 17 4 12"/>
                                      </svg>
                                      PASSED
                                    </span>
                                  ) : (
                                    <span style={{
                                      background: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)',
                                      color: 'white',
                                      padding: '0.6rem 1.2rem',
                                      borderRadius: '25px',
                                      fontSize: '0.85rem',
                                      fontWeight: '700',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.5rem',
                                      boxShadow: '0 4px 12px rgba(235, 51, 73, 0.3)'
                                    }}>
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18"/>
                                        <line x1="6" y1="6" x2="18" y2="18"/>
                                      </svg>
                                      FAILED
                                    </span>
                                  )}
                                  {passInfo.isManual && (
                                    <div style={{
                                      fontSize: '0.7rem',
                                      color: '#6c757d',
                                      marginTop: '0.25rem',
                                      fontStyle: 'italic'
                                    }}>
                                      (Manual Override)
                                    </div>
                                  )}
                                </div>
                              )
                            })()}
                          </td>
                          <td style={{ padding: '1.5rem 1rem', border: 'none', verticalAlign: 'middle', textAlign: 'center' }}>
                            <div style={{
                              background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                              padding: '0.75rem',
                              borderRadius: '12px',
                              border: '1px solid #dee2e6'
                            }}>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                marginBottom: '0.25rem'
                              }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2">
                                  <circle cx="12" cy="12" r="10"/>
                                  <polyline points="12 6 12 12 16 14"/>
                                </svg>
                                <span style={{ 
                                  fontSize: '0.8rem',
                                  fontWeight: '600',
                                  color: '#495057'
                                }}>
                                  {formatDate(exam.submitted_at)}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '1.5rem 1rem', border: 'none', verticalAlign: 'middle', textAlign: 'center' }}>
                            {(() => {
                              const passInfo = getPassStatus(exam.percentage, exam.is_passed)
                              
                              return (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                                  {/* Edit Marks Button */}
                                  {editingExam !== exam.id && (
                                    <button
                                      style={{
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '25px',
                                        padding: '0.5rem 1rem',
                                        fontWeight: '600',
                                        fontSize: '0.8rem',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                                        transition: 'all 0.3s ease'
                                      }}
                                      onClick={() => startEditing(exam)}
                                      title="Edit marks and grade"
                                    >
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 20h9"/>
                                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                                      </svg>
                                      Edit Marks
                                    </button>
                                  )}

                                  {/* Manual Pass Button - Show if student failed naturally */}
                                  {!passInfo.passed && (
                                    <button
                                      style={{
                                        background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '25px',
                                        padding: '0.5rem 1rem',
                                        fontWeight: '600',
                                        fontSize: '0.8rem',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        cursor: updating === exam.id ? 'not-allowed' : 'pointer',
                                        boxShadow: '0 4px 12px rgba(17, 153, 142, 0.3)',
                                        transition: 'all 0.3s ease',
                                        opacity: updating === exam.id ? 0.7 : 1
                                      }}
                                      onClick={() => handleMarkAsPassed(exam.id)}
                                      disabled={updating === exam.id}
                                      onMouseOver={(e) => {
                                        if (updating !== exam.id) {
                                          e.currentTarget.style.transform = 'translateY(-2px)'
                                          e.currentTarget.style.boxShadow = '0 6px 16px rgba(17, 153, 142, 0.4)'
                                        }
                                      }}
                                      onMouseOut={(e) => {
                                        if (updating !== exam.id) {
                                          e.currentTarget.style.transform = 'translateY(0px)'
                                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(17, 153, 142, 0.3)'
                                        }
                                      }}
                                    >
                                      {updating === exam.id ? (
                                        <>
                                          <span className="spinner-border spinner-border-sm" role="status" style={{ width: '14px', height: '14px' }}></span>
                                          Processing...
                                        </>
                                      ) : (
                                        <>
                                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="20 6 9 17 4 12"/>
                                          </svg>
                                          Override to Pass
                                        </>
                                      )}
                                    </button>
                                  )}

                                  {/* Manual Fail Button - Show if student was manually passed */}
                                  {passInfo.isManual && (
                                    <button
                                      style={{
                                        background: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '25px',
                                        padding: '0.5rem 1rem',
                                        fontWeight: '600',
                                        fontSize: '0.8rem',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        cursor: updating === exam.id ? 'not-allowed' : 'pointer',
                                        boxShadow: '0 4px 12px rgba(235, 51, 73, 0.3)',
                                        transition: 'all 0.3s ease',
                                        opacity: updating === exam.id ? 0.7 : 1
                                      }}
                                      onClick={() => handleMarkAsFailed(exam.id)}
                                      disabled={updating === exam.id}
                                    >
                                      {updating === exam.id ? (
                                        <>
                                          <span className="spinner-border spinner-border-sm" role="status" style={{ width: '14px', height: '14px' }}></span>
                                          Processing...
                                        </>
                                      ) : (
                                        <>
                                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="18" y1="6" x2="6" y2="18"/>
                                            <line x1="6" y1="6" x2="18" y2="18"/>
                                          </svg>
                                          Revert to Fail
                                        </>
                                      )}
                                    </button>
                                  )}

                                  {/* Certificate Generation Button - Show for passed students */}
                                  {exam.is_passed && (
                                    <button
                                      style={{
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '25px',
                                        padding: '0.5rem 1rem',
                                        fontWeight: '600',
                                        fontSize: '0.8rem',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        cursor: updating === exam.id ? 'not-allowed' : 'pointer',
                                        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                                        transition: 'all 0.3s ease',
                                        opacity: updating === exam.id ? 0.7 : 1,
                                        marginLeft: '0.5rem'
                                      }}
                                      onClick={() => handleGenerateCertificate(exam)}
                                      disabled={updating === exam.id}
                                      onMouseOver={(e) => {
                                        if (updating !== exam.id) {
                                          e.currentTarget.style.transform = 'translateY(-2px)'
                                          e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)'
                                        }
                                      }}
                                      onMouseOut={(e) => {
                                        if (updating !== exam.id) {
                                          e.currentTarget.style.transform = 'translateY(0px)'
                                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)'
                                        }
                                      }}
                                    >
                                      {updating === exam.id ? (
                                        <>
                                          <span className="spinner-border spinner-border-sm" role="status" style={{ width: '14px', height: '14px' }}></span>
                                          Generating...
                                        </>
                                      ) : (
                                        <>
                                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                            <circle cx="8.5" cy="8.5" r="1.5"/>
                                            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                                          </svg>
                                          Issue Certificate
                                        </>
                                      )}
                                    </button>
                                  )}

                                  {/* Status indicators for natural results */}
                                  {passInfo.isNatural && (
                                    <span style={{
                                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                      color: 'white',
                                      padding: '0.5rem 1rem',
                                      borderRadius: '25px',
                                      fontSize: '0.75rem',
                                      fontWeight: '600',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.5rem'
                                    }}>
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M9 12l2 2 4-4"/>
                                        <path d="M21 12c.552 0 1-.448 1-1V5c0-.552-.448-1-1-1H3c-.552 0-1 .448-1 1v6c0 .552.448 1 1 1h9l4 4z"/>
                                      </svg>
                                      Natural Pass
                                    </span>
                                  )}

                                  {(!passInfo.passed && !passInfo.isManual && exam.percentage < 45) && (
                                    <span style={{
                                      background: 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)',
                                      color: 'white',
                                      padding: '0.5rem 1rem',
                                      borderRadius: '25px',
                                      fontSize: '0.75rem',
                                      fontWeight: '600',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.5rem'
                                    }}>
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10"/>
                                        <line x1="15" y1="9" x2="9" y2="15"/>
                                        <line x1="9" y1="9" x2="15" y2="15"/>
                                      </svg>
                                      Natural Fail
                                    </span>
                                  )}
                                </div>
                              )
                            })()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 fade-in">
            <div className="glass-card p-4">
              <div className="row g-3">
                <div className="col-md-6">
                  <h6 className="fw-bold mb-3">Grading System:</h6>
                  <div className="d-flex flex-wrap gap-3">
                    <div className="d-flex align-items-center gap-2">
                      <div style={{ width: '24px', height: '24px', background: '#8b5cf6', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '700' }}>S</div>
                      <span className="text-muted small">85%+ (Excellent)</span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <div style={{ width: '24px', height: '24px', background: '#10b981', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '700' }}>A</div>
                      <span className="text-muted small">75-84% (Very Good)</span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <div style={{ width: '24px', height: '24px', background: '#3b82f6', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '700' }}>B</div>
                      <span className="text-muted small">65-74% (Good)</span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <div style={{ width: '24px', height: '24px', background: '#f59e0b', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '700' }}>C</div>
                      <span className="text-muted small">55-64% (Average)</span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <div style={{ width: '24px', height: '24px', background: '#ef4444', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '700' }}>D</div>
                      <span className="text-muted small">45-54% (Pass)</span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <div style={{ width: '24px', height: '24px', background: '#6b7280', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '700' }}>F</div>
                      <span className="text-muted small">Below 45% (Fail)</span>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <h6 className="fw-bold mb-3">Pass/Fail Status:</h6>
                  <div className="d-flex flex-wrap gap-3">
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge" style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>PASSED</span>
                      <span className="text-muted small">Score  45% or Manual Override</span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge" style={{ background: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)', padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>FAILED</span>
                      <span className="text-muted small">Score &lt; 45%</span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>Override</span>
                      <span className="text-muted small">Manual Pass/Fail by Admin</span>
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
