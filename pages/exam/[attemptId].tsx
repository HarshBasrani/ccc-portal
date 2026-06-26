// pages/exam/[attemptId].tsx
import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { db } from '../../lib/dbClient'
import { getSession } from '../../lib/session'
import { convex } from '../../lib/convexClient'
import { api } from '../../convex/_generated/api'

interface Exam {
  id: string
  name: string
  exam_date: string
  start_time: string
  end_time: string
  duration_minutes: number
  course_id: string
}

interface Attempt {
  id: string
  exam_id: string
  student_id: string
  started_at: string
  status: string
  score: number | null
  exams: Exam
}

interface Question {
  id: string
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  
  question_en?: string
  question_gu?: string
  optionA_en?: string
  optionA_gu?: string
  optionB_en?: string
  optionB_gu?: string
  optionC_en?: string
  optionC_gu?: string
  optionD_en?: string
  optionD_gu?: string

  correct_option: string
  marks: number
}

interface StudentProfile {
  id: string
  full_name: string
  email: string
  enrollment_no: string
  photo_url?: string
  phone?: string
}

export default function ExamEngine() {
  const router = useRouter()
  const { attemptId } = router.query

  const deterministicShuffle = (array: any[], seed: string) => {
    if (!array || array.length === 0) return [];
    let m = 0x80000000, a = 1103515245, c = 12345;
    let state = 0;
    for (let i = 0; i < seed.length; i++) {
      state = (state + seed.charCodeAt(i)) % m;
    }
    const random = () => {
      state = (a * state + c) % m;
      return state / (m - 1);
    }
    let clone = [...array];
    for (let i = clone.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [clone[i], clone[j]] = [clone[j], clone[i]];
    }
    return clone;
  }

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [language, setLanguage] = useState<'EN' | 'GU'>('EN')

  const [attempt, setAttempt] = useState<Attempt | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [remainingTime, setRemainingTime] = useState<number>(0)
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | 'offline' | 'unsaved'>('saved')
  const [isOnline, setIsOnline] = useState(true)
  const [showRestoreNotification, setShowRestoreNotification] = useState(false)
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null)
  
  // REFS FOR SAFELY HANDLING DATA WITHOUT STALE CLOSURES
  const dirtyAnswersRef = useRef<Set<string>>(new Set())
  const answersRef = useRef(answers)

  // Keep answersRef synced with state
  useEffect(() => {
    answersRef.current = answers
  }, [answers])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // AUTOSAVE UTILITIES
  const getStorageKey = (attemptId: string) => `exam_answers_${attemptId}`
  
  const saveToLocalStorage = useCallback((data: any) => {
    try {
      localStorage.setItem(getStorageKey(attemptId as string), JSON.stringify({
        ...data,
        timestamp: new Date().toISOString()
      }))
    } catch (error) {
      console.error('Failed to save to localStorage:', error)
    }
  }, [attemptId])
  
  const loadFromLocalStorage = useCallback(() => {
    try {
      const saved = localStorage.getItem(getStorageKey(attemptId as string))
      return saved ? JSON.parse(saved) : null
    } catch (error) {
      return null
    }
  }, [attemptId])
  
  const clearLocalStorage = useCallback(() => {
    try {
      localStorage.removeItem(getStorageKey(attemptId as string))
    } catch (error) {
      // ignore
    }
  }, [attemptId])

  // RETRY WRAPPER FOR CONVEX MUTATION
  const batchUpsertAnswersWithRetry = async (payloadAnswers: Array<{questionId: string, selectedOption: string}>, maxRetries = 3) => {
    let attemptCount = 0;
    while (attemptCount < maxRetries) {
      try {
        const result = await convex.mutation(api.compat.batchUpsertAnswers as any, {
          attemptId: attempt!.id,
          answers: payloadAnswers
        })
        if (result.success) return true;
        throw new Error(result.error || "Batch upsert failed");
      } catch (err) {
        attemptCount++;
        if (attemptCount >= maxRetries) {
          return false;
        }
        await new Promise(r => setTimeout(r, 5000));
      }
    }
    return false;
  }

  // MAIN DATA LOADING
  useEffect(() => {
    if (!attemptId) return

    const loadExamData = async () => {
      setLoading(true)
      setError(null)

      try {
        const { data: { user } } = await db.auth.getUser()

        if (!user) {
          router.replace('/login')
          return
        }

        const { data: studentData, error: studentError } = await db
          .from('students')
          .select(`id, profile_id, enrollment_no, status, first_name, last_name, full_name, email, photo_url, phone`)
          .eq('profile_id', user.id)
          .maybeSingle()

        if (studentError) {
          setError('Database error: ' + studentError.message)
          setLoading(false)
          return
        }

        if (!studentData) {
          const { data: profileData } = await db.from('profiles').select('role, full_name').eq('id', user.id).single()
          if (profileData?.role === 'admin') {
            setError('Admin users cannot take exams. Please use a student account.')
            setLoading(false)
            return
          } else {
            router.replace('/student/setup-profile')
            return
          }
        }

        setStudentProfile({
          id: studentData.id,
          full_name: studentData.full_name || `${studentData.first_name} ${studentData.last_name}`,
          email: studentData.email || '',
          enrollment_no: studentData.enrollment_no,
          photo_url: studentData.photo_url
        })

        const { data: attemptData, error: attemptError } = await db
          .from('exam_attempts')
          .select(`id, exam_id, student_id, started_at, status, score`)
          .eq('id', attemptId)
          .eq('student_id', studentData.id)
          .single()

        if (attemptError || !attemptData) {
          setError('Exam attempt not found or access denied.')
          setLoading(false)
          return
        }

        const { data: examData, error: examError } = await db
          .from('exams')
          .select(`id, name, exam_date, start_time, end_time, duration_minutes, course_id`)
          .eq('id', attemptData.exam_id)
          .single()

        if (examError || !examData || !examData.course_id) {
          setError('Exam configuration error. Please contact administrator.')
          setLoading(false)
          return
        }

        setAttempt({ ...attemptData, exams: examData })

        const { data: questionData, error: questionError } = await db
          .from('questions')
          .select('*')
          .eq('course_id', examData.course_id)
          .order('created_at')

        if (questionError || !questionData || questionData.length === 0) {
          setError('Failed to load exam questions. Please contact administration.')
          setLoading(false)
          return
        }

        const uniqueQuestionsData = Array.from(new Map(questionData.map((q: any) => [q.question_text?.trim().toLowerCase(), q])).values());
        const shuffled = deterministicShuffle(uniqueQuestionsData, attemptId as string);
        setQuestions(shuffled.slice(0, 100))

        const startTime = new Date(attemptData.started_at).getTime()
        const now = new Date().getTime()
        const elapsedSeconds = Math.floor((now - startTime) / 1000)
        const totalSeconds = examData.duration_minutes * 60
        setRemainingTime(Math.max(0, totalSeconds - elapsedSeconds))

        // Restore from Database
        const { data: answerData } = await db.from('exam_answers').select('question_id, selected_option').eq('attempt_id', attemptId)
        const existingAnswers: Record<string, string> = {}
        if (answerData) {
          answerData.forEach(a => { existingAnswers[a.question_id] = a.selected_option })
        }

        // Restore from LocalStorage
        const saved = loadFromLocalStorage()
        if (saved && saved.answers) {
          setAnswers({ ...existingAnswers, ...saved.answers })
          setCurrentIndex(saved.currentIndex || 0)
          setShowRestoreNotification(true)
          setTimeout(() => setShowRestoreNotification(false), 5000)
        } else {
          setAnswers(existingAnswers)
        }

        setLoading(false)
      } catch (error: any) {
        setError('Failed to load exam: ' + error.message)
        setLoading(false)
      }
    }

    loadExamData()
  }, [attemptId, router, loadFromLocalStorage])

  // ONLINE/OFFLINE DETECTION
  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); setSaveStatus('saved') }
    const handleOffline = () => { setIsOnline(false); setSaveStatus('offline') }
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // AUTOSAVE LOGIC
  const autoSave = useCallback(async (forced = false) => {
    if (!attempt) return
    
    if (!forced && dirtyAnswersRef.current.size === 0) return
    
    const questionsToSave = Array.from(dirtyAnswersRef.current);
    if (questionsToSave.length === 0) return;

    // Use answersRef.current to get the absolute latest state
    const currentAnswers = answersRef.current;
    
    const payloadAnswers = questionsToSave.map(qId => ({
      questionId: qId,
      selectedOption: currentAnswers[qId]
    }))
    
    if (isOnline) {
      setSaveStatus('saving')
      const success = await batchUpsertAnswersWithRetry(payloadAnswers, 3);
        
      if (success) {
        setSaveStatus('saved')
        setLastSaveTime(new Date())
        questionsToSave.forEach(qId => dirtyAnswersRef.current.delete(qId))
      } else {
        setSaveStatus('offline')
      }
    } else {
      setSaveStatus('offline')
    }
  }, [attempt, isOnline])

  // 60 SECOND INTERVAL
  useEffect(() => {
    if (!attempt) return
    const interval = setInterval(() => { autoSave() }, 60000)
    return () => clearInterval(interval)
  }, [autoSave, attempt])

  // EMERGENCY BEACON & UNLOAD LISTENER
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirtyAnswersRef.current.size > 0) {
        e.preventDefault()
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
        return e.returnValue
      }
    }
    
    const handleUnload = () => {
      if (dirtyAnswersRef.current.size > 0 && navigator.sendBeacon && attempt) {
        const questionsToSave = Array.from(dirtyAnswersRef.current);
        const currentAnswers = answersRef.current;
        const payloadAnswers = questionsToSave.map(qId => ({
          questionId: qId,
          selectedOption: currentAnswers[qId]
        }))
        
        try {
          const session = getSession()
          navigator.sendBeacon(
            '/api/exam/emergency-save',
            JSON.stringify({ attemptId: attempt.id, data: { answers: payloadAnswers }, sessionToken: session?.token })
          )
        } catch (error) {
          console.error('Emergency save failed:', error)
        }
      }
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('unload', handleUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('unload', handleUnload)
    }
  }, [attempt])

  // TIMER LOGIC FIX
  useEffect(() => {
    if (loading || remainingTime <= 0) return

    const timer = setInterval(() => {
      setRemainingTime((prev) => Math.max(0, prev - 1))
    }, 1000)

    return () => clearInterval(timer)
  }, [loading, remainingTime])

  // SUBMIT LOGIC
  const handleSubmit = useCallback(async (isAutoSubmit = false) => {
    if (!attempt || submitting) return

    setSubmitting(true)

    try {
      const savedData = loadFromLocalStorage()
      let mergedAnswers = { ...answersRef.current }
      if (savedData && savedData.answers) {
        mergedAnswers = { ...savedData.answers, ...mergedAnswers }
      }

      const allAnswersPayload = Object.entries(mergedAnswers).map(([qId, opt]) => ({
        questionId: qId,
        selectedOption: opt as string
      }))

      let hasSubmissionWarning = false;

      if (allAnswersPayload.length > 0) {
        const success = await batchUpsertAnswersWithRetry(allAnswersPayload, 3)
        if (!success) hasSubmissionWarning = true;
      }

      const examTotalMarks = questions.reduce((sum, q) => sum + (q.marks || 1), 0)
      
      const score = Object.entries(mergedAnswers).reduce((sum, [qId, opt]) => {
        const question = questions.find(q => q.id === qId)
        if (question && question.correct_option === opt) {
          return sum + (question.marks || 1)
        }
        return sum
      }, 0)
      
      const percentage = examTotalMarks > 0 ? (score * 100) / examTotalMarks : 0
      const isPassed = percentage >= 45

      const { error: updateAttemptError } = await db
        .from('exam_attempts')
        .update({
          score,
          percentage,
          is_passed: isPassed,
          submitted_at: new Date().toISOString(),
          status: hasSubmissionWarning ? 'submitted_with_errors' : (isAutoSubmit ? 'auto_submitted' : 'submitted')
        })
        .eq('id', attempt.id)

      if (updateAttemptError) {
        alert('Failed to update submission status: ' + updateAttemptError.message)
        setSubmitting(false)
        return
      }

      await db.from('exam_assignments').update({ status: 'completed' }).eq('exam_id', attempt.exam_id).eq('student_id', attempt.student_id)

      clearLocalStorage()
      router.push(`/student/exam-submitted?examName=${encodeURIComponent(attempt.exams.name)}`)
    } catch (err: any) {
      alert('An error occurred: ' + (err.message || 'Failed to submit exam'))
      setSubmitting(false)
    }
  }, [attempt, submitting, router, questions, loadFromLocalStorage, clearLocalStorage])

  // SEPARATE AUTO-SUBMIT TRIGGER
  useEffect(() => {
    if (
      remainingTime === 0 && 
      attempt && 
      !submitting && 
      attempt.status === 'in_progress'
    ) {
      handleSubmit(true)
    }
  }, [remainingTime, attempt, submitting, handleSubmit])

  // SELECT OPTION
  const handleSelectOption = (questionId: string, selected: string) => {
    if (!attempt) return

    const newAnswers = { ...answersRef.current, [questionId]: selected }
    setAnswers(newAnswers)

    dirtyAnswersRef.current.add(questionId)
    setSaveStatus('unsaved')

    saveToLocalStorage({
      answers: newAnswers,
      currentIndex,
      remainingTime,
      lastActivity: new Date().toISOString()
    })
  }

  // NAVIGATE QUESTIONS
  const goToPrevious = () => { if (currentIndex > 0) setCurrentIndex(currentIndex - 1) }
  const goToNext = () => { if (currentIndex < questions.length - 1) setCurrentIndex(currentIndex + 1) }
  const goToQuestion = (index: number) => { if (index >= 0 && index < questions.length) setCurrentIndex(index) }

  // Loading state
  if (loading) {
    return (
      <div className="container mt-4">
        <div className="d-flex align-items-center">
          <div className="spinner-border spinner-border-sm me-2" role="status"></div>
          <span>Loading exam...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">{error}</div>
        <button className="btn btn-secondary" onClick={() => router.push('/student/exams')}>Back to My Exams</button>
      </div>
    )
  }

  if (!attempt || questions.length === 0) {
    return (
      <div className="container mt-4">
        <div className="alert alert-warning">No questions found for this exam.</div>
        <button className="btn btn-secondary" onClick={() => router.push('/student/exams')}>Back to My Exams</button>
      </div>
    )
  }

  const currentQuestion = questions[currentIndex]
  const selectedOption = answers[currentQuestion.id]
  const answeredCount = Object.keys(answers).length
  const totalQuestions = questions.length
  const isTimerCritical = remainingTime < 300
  const isTimerDanger = remainingTime < 60

  return (
    <>
      <Head><title>Exam {attempt.exams.name} CCC Exam Portal</title></Head>

      <div className="bg-dark text-white py-3 sticky-top shadow">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-4">
              <h5 className="mb-0">{attempt.exams.name}</h5>
              <small className="text-muted">Question {currentIndex + 1} of {totalQuestions}</small>
            </div>
            <div className="col-md-4 text-center">
              {saveStatus === 'saving' && (
                <div className="d-flex align-items-center justify-content-center text-warning">
                  <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                  <small>Saving...</small>
                </div>
              )}
              {saveStatus === 'saved' && (
                <div className="text-success">
                  <small> All answers saved ✓ {lastSaveTime && `(${lastSaveTime.toLocaleTimeString()})`}</small>
                </div>
              )}
              {saveStatus === 'unsaved' && (
                <div className="text-warning">
                  <small> Unsaved changes ⚠️</small>
                </div>
              )}
              {saveStatus === 'offline' && (
                <div className="text-info">
                  <small> Working offline — answers safe locally ✓</small>
                </div>
              )}
              {saveStatus === 'error' && (
                <div className="text-danger">
                  <small> Error saving to server ⚠️</small>
                </div>
              )}
            </div>
            <div className="col-md-4 text-md-end mt-2 mt-md-0">
              <span className="badge bg-info me-2">{answeredCount}/{totalQuestions} Answered</span>
              <span className={`badge fs-5 ${isTimerDanger ? 'bg-danger' : isTimerCritical ? 'bg-warning text-dark' : 'bg-success'}`}>
                Time Left: {formatTime(remainingTime)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {studentProfile && (
        <div className="bg-light border-bottom py-3">
          <div className="container">
            <div className="row align-items-center">
              <div className="col-lg-8 col-md-7 mb-2 mb-md-0">
                <div className="d-flex align-items-center gap-3">
                  <div style={{
                    width: '60px', height: '60px', borderRadius: '50%',
                    background: studentProfile.photo_url ? `url(${studentProfile.photo_url}) center/cover` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 'bold', fontSize: '1.5rem',
                    border: '3px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', flexShrink: 0
                  }}>
                    {!studentProfile.photo_url && studentProfile.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{minWidth: 0}}>
                    <h6 className="mb-1 text-dark fw-bold">{studentProfile.full_name}</h6>
                    <div className="d-flex flex-wrap align-items-center gap-2 gap-md-3 text-muted small">
                      <span className="d-flex align-items-center">ID: {studentProfile.enrollment_no}</span>
                      <span className="d-none d-sm-flex align-items-center">Mail: {studentProfile.email}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRestoreNotification && (
        <div className="container mt-2">
          <div className="alert alert-success alert-dismissible fade show" role="alert">
            <strong> Progress Restored!</strong> Your previous answers have been restored
            <button type="button" className="btn-close" onClick={() => setShowRestoreNotification(false)}></button>
          </div>
        </div>
      )}

      <div className="container mt-4 mb-4">
        <div className="row">
          <div className="col-lg-8 mb-4">
            <div className="card">
              <div className="card-header bg-light d-flex justify-content-between align-items-center">
                <span className="fw-bold">Question {currentIndex + 1}</span>
                <div className="d-flex align-items-center gap-3">
                  <div className="btn-group btn-group-sm" role="group">
                    <button className={`btn ${language === 'EN' ? 'btn-dark' : 'btn-outline-dark'}`} onClick={() => setLanguage('EN')}>EN</button>
                    <button className={`btn ${language === 'GU' ? 'btn-dark' : 'btn-outline-dark'}`} onClick={() => setLanguage('GU')}>ગુજરાતી</button>
                  </div>
                  <span className="badge bg-secondary">{currentQuestion.marks || 1} mark(s)</span>
                </div>
              </div>
              <div className="card-body">
                <p className="fs-5 mb-4">
                  {language === 'GU' && currentQuestion.question_gu 
                    ? currentQuestion.question_gu 
                    : currentQuestion.question_en || currentQuestion.question_text}
                </p>

                <div className="d-flex flex-column gap-2">
                  {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                    const isSelected = selectedOption === opt
                    let optionText = ''
                    if (language === 'GU') {
                      optionText = (currentQuestion[`option${opt}_gu` as keyof Question] || '') as string
                    }
                    if (!optionText) {
                      optionText = (currentQuestion[`option${opt}_en` as keyof Question] || '') as string
                    }
                    if (!optionText) {
                      optionText = (currentQuestion[`option_${opt.toLowerCase()}` as keyof Question] || '') as string
                    }

                    return (
                      <div
                        key={opt}
                        className={`form-check p-3 border rounded ${isSelected ? 'bg-primary text-white border-primary' : 'bg-light'}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleSelectOption(currentQuestion.id, opt)}
                      >
                        <input className="form-check-input" type="radio" checked={isSelected} readOnly />
                        <label className={`form-check-label w-100 ${isSelected ? 'text-white' : ''}`} style={{ cursor: 'pointer' }}>
                          <strong className="me-2">{opt}.</strong> {optionText}
                        </label>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="card-footer d-flex justify-content-between">
                <button className="btn btn-secondary" onClick={goToPrevious} disabled={currentIndex === 0}>Previous</button>
                <button className="btn btn-primary" onClick={goToNext} disabled={currentIndex === totalQuestions - 1}>Next</button>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card mb-4">
              <div className="card-header bg-light"><strong>Question Navigator</strong></div>
              <div className="card-body">
                <div className="d-flex flex-wrap gap-2 mb-3">
                  {questions.map((q, index) => (
                    <button
                      key={q.id}
                      className={`btn btn-sm ${index === currentIndex ? 'btn-dark' : answers[q.id] ? 'btn-success' : 'btn-outline-secondary'}`}
                      style={{ width: '42px', height: '42px' }}
                      onClick={() => goToQuestion(index)}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
                <hr />
                <div className="d-flex gap-3 mb-3 small">
                  <span><span className="badge bg-success me-1"></span> Answered</span>
                  <span><span className="badge border text-dark me-1"></span> Not Answered</span>
                  <span><span className="badge bg-dark me-1"></span> Current</span>
                </div>
                <hr />
                <div className="mb-3">
                  <div className="alert alert-info small mb-2">
                    <strong> Review Before Submit:</strong><br />
                    Answered: {answeredCount}/{totalQuestions} questions<br />
                    Time remaining: {formatTime(remainingTime)}
                  </div>
                  {answeredCount < totalQuestions && (
                    <div className="alert alert-warning small mb-2">
                      <strong> Warning:</strong> You have {totalQuestions - answeredCount} unanswered question(s).
                    </div>
                  )}
                </div>
                <div className="d-grid gap-2">
                  <button
                    className="btn btn-outline-danger"
                    onClick={() => {
                      if (confirm("Are you sure you want to submit your exam? This action cannot be undone!")) {
                        handleSubmit(false)
                      }
                    }}
                    disabled={submitting}
                    style={{ border: '2px solid #dc3545', fontWeight: 'bold', backgroundColor: 'white', color: '#dc3545' }}
                  >
                    {submitting ? 'Submitting...' : 'SUBMIT EXAM'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
