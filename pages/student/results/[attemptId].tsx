// pages/student/results/[attemptId].tsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { db } from '../../../lib/dbClient'

interface Exam {
  id: string
  name: string
  duration_minutes: number
}

interface Attempt {
  id: string
  exam_id: string
  student_id: string
  started_at: string
  submitted_at: string
  status: string
  score: number
  percentage: number
  is_passed: boolean | null
  exams: Exam
}

interface Question {
  id: string
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_option: string
  marks: number
}

interface Answer {
  question_id: string
  selected_option: string
  is_correct: boolean
}

interface QuestionWithAnswer extends Question {
  selected_option: string | null
  is_correct: boolean | null
}

export default function AttemptResult() {
  const router = useRouter()
  const { attemptId } = router.query

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState<Attempt | null>(null)
  const [questionsWithAnswers, setQuestionsWithAnswers] = useState<QuestionWithAnswer[]>([])

  useEffect(() => {
    if (!attemptId) return

    const loadData = async () => {
      try {
        // Check auth
        const { data: { user } } = await db.auth.getUser()

        if (!user) {
          router.replace('/login')
          return
        }

        // Get student ID
        const { data: students, error: studentsError } = await db
          .from('students')
          .select('id')
          .eq('profile_id', user.id)

        if (studentsError) {
          console.error('Error fetching student:', studentsError)
          setError('Failed to load student information.')
          setLoading(false)
          return
        }

        if (!students || students.length === 0) {
          setError('Student record not found. Please contact support.')
          setLoading(false)
          return
        }

        const studentId = students[0].id

        // Fetch attempt with exam - no total_marks column in DB
      const { data: attemptData, error: attemptError } = await db
        .from('exam_attempts')
        .select(`
          id,
          exam_id,
          student_id,
          started_at,
          submitted_at,
          status,
          score,
          percentage,
          is_passed,
          exams:exam_id (
            id,
            name,
            duration_minutes
          )
        `)
        .eq('id', attemptId)
        .single()

      if (attemptError) {
        console.error('Error fetching attempt:', attemptError)
        setError('Failed to load exam attempt. Please try again.')
        setLoading(false)
        return
      }
      
      if (!attemptData) {
        setError('Exam attempt not found or has been deleted.')
        setLoading(false)
        return
      }

      // Verify student owns this attempt
      if (attemptData.student_id !== studentId) {
        setError('You are not authorized to view this result.')
        setLoading(false)
        return
      }

      // Check if attempt is submitted
      if (attemptData.status === 'in_progress') {
        router.replace(`/exam/${attemptId}`)
        return
      }

      // Handle exams as object from Convex join (not array)
      const examData = attemptData.exams as unknown as Exam
      
      if (!examData) {
        setError('Exam information is missing from the attempt record.')
        setLoading(false)
        return
      }

      const formattedAttempt: Attempt = {
        id: attemptData.id,
        exam_id: attemptData.exam_id,
        student_id: attemptData.student_id,
        started_at: attemptData.started_at,
        submitted_at: attemptData.submitted_at,
        status: attemptData.status,
        score: attemptData.score ?? 0,
        percentage: attemptData.percentage ?? (attemptData.score ?? 0),
        is_passed: attemptData.is_passed,
        exams: examData
      }

      setAttempt(formattedAttempt)

      // Fetch questions for this exam's course
      const { data: examInfo, error: examInfoError } = await db
        .from('exams')
        .select('course_id')
        .eq('id', attemptData.exam_id)
        .single()

      if (examInfoError) {
        console.error('Error fetching exam info:', examInfoError)
        setError('Failed to load exam information.')
        setLoading(false)
        return
      }

      if (!examInfo) {
        setError('Exam information not found.')
        setLoading(false)
        return
      }

      const { data: questions, error: questionsError } = await db
        .from('questions')
        .select('id, question_text, option_a, option_b, option_c, option_d, correct_option, marks')
        .eq('course_id', examInfo.course_id)
        .order('created_at', { ascending: true })

      // Fetch answers
      const { data: answers, error: answersError } = await db
        .from('exam_answers')
        .select('question_id, selected_option, is_correct')
        .eq('attempt_id', attemptId)

      if (questionsError) {
        console.error('Error fetching questions:', questionsError)
      }
      
      if (answersError) {
        console.error('Error fetching answers:', answersError)
      }

      // Merge questions with answers
      const answersMap = new Map<string, Answer>()
      if (answers) {
        answers.forEach((a: Answer) => {
          answersMap.set(a.question_id, a)
        })
      }

      const merged: QuestionWithAnswer[] = (questions || []).map((q: Question) => {
        const answer = answersMap.get(q.id)
        return {
          ...q,
          selected_option: answer?.selected_option || null,
          is_correct: answer?.is_correct ?? null
        }
      })

      // Debug logging for troubleshooting
      console.log('Exam attempt data loaded:', {
        attemptId: attemptId,
        examId: attemptData.exam_id,
        courseId: examInfo.course_id,
        questionsCount: questions?.length || 0,
        answersCount: answers?.length || 0,
        studentId: studentId
      })

      setQuestionsWithAnswers(merged)
      setLoading(false)
    } catch (error) {
      console.error('Unexpected error loading attempt data:', error)
      setError('An unexpected error occurred. Please try refreshing the page.')
      setLoading(false)
    }
  }

    loadData()
  }, [attemptId, router])

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const calculateTimeTaken = (started: string, submitted: string) => {
    if (!started || !submitted) return '-'
    const startTime = new Date(started).getTime()
    const endTime = new Date(submitted).getTime()
    const diffMs = endTime - startTime
    const diffMins = Math.floor(diffMs / 60000)
    const diffSecs = Math.floor((diffMs % 60000) / 1000)
    return `${diffMins} min ${diffSecs} sec`
  }

  const getOptionText = (question: Question, option: string | null) => {
    if (!option) return '-'
    const key = `option_${option.toLowerCase()}` as keyof Question
    return `${option}. ${question[key]}`
  }

  const getGradeBadge = (percentage: number, isPassed: boolean | null) => {
    // Ensure percentage is valid
    const validPercentage = Math.max(0, Math.min(100, percentage || 0))
    
    // If is_passed is explicitly set, use it with appropriate badge
    if (isPassed === true) {
      if (validPercentage >= 80) return { class: 'bg-success', text: 'Excellent' }
      if (validPercentage >= 60) return { class: 'bg-primary', text: 'Good' }
      return { class: 'bg-success', text: 'Passed' }
    }
    
    if (isPassed === false) {
      return { class: 'bg-danger', text: 'Failed' }
    }
    
    // Otherwise, use percentage-based grading
    if (validPercentage >= 80) return { class: 'bg-success', text: 'Excellent' }
    if (validPercentage >= 60) return { class: 'bg-primary', text: 'Good' }
    if (validPercentage >= 40) return { class: 'bg-success', text: 'Passed' }
    return { class: 'bg-danger', text: 'Failed' }
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading exam results...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">{error}</div>
        <Link href="/student/results" className="btn btn-secondary">
          Back to Results
        </Link>
      </div>
    )
  }

  if (!attempt) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">Result not found.</div>
        <Link href="/student/results" className="btn btn-secondary">
          Back to Results
        </Link>
      </div>
    )
  }

  const percentage = attempt?.percentage ?? 0
  const grade = getGradeBadge(percentage, attempt?.is_passed ?? null)
  const correctCount = questionsWithAnswers.filter(q => q.is_correct === true).length
  const incorrectCount = questionsWithAnswers.filter(q => q.is_correct === false).length
  const unansweredCount = questionsWithAnswers.filter(q => q.selected_option === null).length

  return (
    <>
      <Head>
        <title>Result  {attempt.exams?.name || 'Exam'}  CCC Exam Portal</title>
      </Head>
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1>Exam Result</h1>
          <Link href="/student/results" className="btn btn-outline-secondary">
            Back to Results
          </Link>
        </div>

        {/* Summary Card */}
        <div className="card mb-4">
          <div className="card-header bg-primary text-white">
            <h4 className="mb-0">{attempt.exams.name}</h4>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-3 text-center mb-3">
                <div className={`display-4 fw-bold ${grade.class.replace('bg-', 'text-')}`}>
                  {percentage.toFixed(1)}%
                </div>
                <span className={`badge ${grade.class} fs-6`}>{grade.text}</span>
              </div>
              <div className="col-md-9">
                <div className="row">
                  <div className="col-sm-6 col-lg-3 mb-3">
                    <div className="border rounded p-3 text-center">
                      <div className="fs-4 fw-bold text-primary">{attempt.score}</div>
                      <small className="text-muted">Score</small>
                    </div>
                  </div>
                  <div className="col-sm-6 col-lg-3 mb-3">
                    <div className="border rounded p-3 text-center">
                      <div className="fs-4 fw-bold">{questionsWithAnswers.length}</div>
                      <small className="text-muted">Total Questions</small>
                    </div>
                  </div>
                  <div className="col-sm-6 col-lg-3 mb-3">
                    <div className="border rounded p-3 text-center">
                      <div className="fs-4 fw-bold text-success">{correctCount}</div>
                      <small className="text-muted">Correct</small>
                    </div>
                  </div>
                  <div className="col-sm-6 col-lg-3 mb-3">
                    <div className="border rounded p-3 text-center">
                      <div className="fs-4 fw-bold text-danger">{incorrectCount}</div>
                      <small className="text-muted">Incorrect</small>
                    </div>
                  </div>
                </div>
                <div className="row mt-2">
                  <div className="col-sm-6">
                    <p className="mb-1"><strong>Started:</strong> {formatDateTime(attempt.started_at)}</p>
                    <p className="mb-1"><strong>Submitted:</strong> {formatDateTime(attempt.submitted_at)}</p>
                  </div>
                  <div className="col-sm-6">
                    <p className="mb-1"><strong>Time Taken:</strong> {calculateTimeTaken(attempt.started_at, attempt.submitted_at)}</p>
                    <p className="mb-1"><strong>Status:</strong> <span className="badge bg-secondary">{attempt.status}</span></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Questions Review */}
        <div className="card">
          <div className="card-header">
            <h5 className="mb-0">Questions Review</h5>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '50px' }}>#</th>
                    <th>Question</th>
                    <th>Your Answer</th>
                    <th>Correct Answer</th>
                    <th style={{ width: '80px' }} className="text-center">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {questionsWithAnswers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-4">
                        <div className="text-muted">
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-2" style={{ opacity: 0.5 }}>
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="8" x2="12" y2="12"/>
                            <line x1="12" y1="16" x2="12.01" y2="16"/>
                          </svg>
                          <p className="mb-1">No questions found for this exam</p>
                          <small>This might be due to questions not being linked to the exam's course.</small>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    questionsWithAnswers.map((q, index) => (
                    <tr key={q.id} className={q.is_correct === false ? 'table-danger' : q.is_correct === true ? 'table-success' : 'table-warning'}>
                      <td>{index + 1}</td>
                      <td>
                        <div className="fw-medium">{q.question_text}</div>
                        <small className="text-muted">{q.marks} mark(s)</small>
                      </td>
                      <td>
                        {q.selected_option ? (
                          <span className={q.is_correct ? 'text-success' : 'text-danger'}>
                            {getOptionText(q, q.selected_option)}
                          </span>
                        ) : (
                          <span className="text-muted fst-italic">Not answered</span>
                        )}
                      </td>
                      <td>
                        <span className="text-success">
                          {getOptionText(q, q.correct_option)}
                        </span>
                      </td>
                      <td className="text-center">
                        {q.is_correct === true && (
                          <span className="badge bg-success fs-6"></span>
                        )}
                        {q.is_correct === false && (
                          <span className="badge bg-danger fs-6"></span>
                        )}
                        {q.selected_option === null && (
                          <span className="badge bg-warning text-dark fs-6"></span>
                        )}
                      </td>
                    </tr>
                  ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="mt-4 mb-4">
          <Link href="/student/results" className="btn btn-primary">
            Back to All Results
          </Link>
        </div>
      </div>
    </>
  )
}
