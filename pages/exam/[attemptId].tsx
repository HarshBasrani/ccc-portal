// pages/exam/[attemptId].tsx
import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { db } from '../../lib/dbClient'
import { getSession } from '../../lib/session'

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
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | 'offline'>('saved')
  const [isOnline, setIsOnline] = useState(true)
  const [showRestoreNotification, setShowRestoreNotification] = useState(false)
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSaveRef = useRef<Date>(new Date())

  // Format time as mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  //  AUTOSAVE UTILITIES
  const getStorageKey = (attemptId: string) => `exam_autosave_${attemptId}`
  
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
      console.error('Failed to load from localStorage:', error)
      return null
    }
  }, [attemptId])
  
  const clearLocalStorage = useCallback(() => {
    try {
      localStorage.removeItem(getStorageKey(attemptId as string))
    } catch (error) {
      console.error('Failed to clear localStorage:', error)
    }
  }, [attemptId])

  //  MAIN DATA LOADING
  useEffect(() => {
    if (!attemptId) return

    const loadExamData = async () => {
      setLoading(true)
      setError(null)

      try {
        //  AUTH + STUDENT LOAD
        const { data: { user } } = await db.auth.getUser()

        if (!user) {
          router.replace('/login')
          return
        }

        console.log('Current user ID:', user.id) // Debug log

        // Fetch student with profile data - using correct column names
        const { data: studentData, error: studentError } = await db
          .from('students')
          .select(`
            id,
            profile_id,
            enrollment_no,
            status,
            first_name,
            last_name,
            full_name,
            email,
            photo_url,
            phone
          `)
          .eq('profile_id', user.id)
          .maybeSingle()

        console.log('Student query result:', { studentData, studentError }) // Debug log

        if (studentError) {
          console.error('Student lookup error:', studentError)
          setError('Database error: ' + studentError.message)
          setLoading(false)
          return
        }

        if (!studentData) {
          // No student record found - check user profile and provide helpful message
          const { data: profileData } = await db
            .from('profiles')
            .select('role, full_name')
            .eq('id', user.id)
            .single()

          if (profileData?.role === 'admin') {
            setError('Admin users cannot take exams. Please use a student account or contact administration to create a student profile.')
            setLoading(false)
            return
          } else {
            // Redirect to profile setup for missing student records
            router.replace('/student/setup-profile')
            return
          }
        }

        // Set student profile for display
        setStudentProfile({
          id: studentData.id,
          full_name: studentData.full_name || `${studentData.first_name} ${studentData.last_name}`,
          email: studentData.email || '',
          enrollment_no: studentData.enrollment_no,
          photo_url: studentData.photo_url
        })

        // Load attempt data with exam info
        const { data: attemptData, error: attemptError } = await db
          .from('exam_attempts')
          .select(`
            id,
            exam_id,
            student_id,
            started_at,
            status,
            score
          `)
          .eq('id', attemptId)
          .eq('student_id', studentData.id)
          .single()

        if (attemptError || !attemptData) {
          console.error('Attempt loading error:', {
            attemptId,
            studentId: studentData.id,
            attemptError,
            attemptData
          })
          setError('Exam attempt not found or access denied.')
          setLoading(false)
          return
        }

        // Load exam data separately to ensure we get the course_id
        const { data: examData, error: examError } = await db
          .from('exams')
          .select(`
            id,
            name,
            exam_date,
            start_time,
            end_time,
            duration_minutes,
            course_id
          `)
          .eq('id', attemptData.exam_id)
          .single()

        if (examError || !examData) {
          console.error('Exam loading error:', {
            examId: attemptData.exam_id,
            examError,
            examData
          })
          setError('Exam data not found. Please contact administrator.')
          setLoading(false)
          return
        }

        console.log('Attempt data loaded:', {
          attemptId: attemptData.id,
          examId: attemptData.exam_id,
          studentId: attemptData.student_id,
          examData: examData,
          examName: examData.name
        })

        if (!examData.course_id) {
          console.error('No course_id found in exam:', examData)
          setError('Exam configuration error. Please contact administrator.')
          setLoading(false)
          return
        }

        setAttempt({
          ...attemptData,
          exams: examData // Set the single exam object
        })

        // Load questions for this exam
        const { data: questionData, error: questionError } = await db
          .from('questions')
          .select('*')
          .eq('course_id', examData.course_id)
          .order('created_at')

        console.log('Questions query result:', {
          examId: attemptData.exam_id,
          courseId: examData.course_id,
          questionData,
          questionError,
          questionCount: questionData?.length
        })

        if (questionError) {
          console.error('Question loading error:', questionError)
          setError('Failed to load exam questions: ' + questionError.message)
          setLoading(false)
          return
        }

        if (!questionData || questionData.length === 0) {
          setError('No questions found for this exam. Please contact administration.')
          setLoading(false)
          return
        }

        const shuffled = deterministicShuffle(questionData || [], attemptId as string);
        const selectedQuestions = shuffled.slice(0, 100);
        setQuestions(selectedQuestions)

        // Load existing answers
        const { data: answerData } = await db
          .from('exam_answers')
          .select('question_id, selected_option')
          .eq('attempt_id', attemptId)

        if (answerData) {
          const existingAnswers: Record<string, string> = {}
          answerData.forEach(answer => {
            existingAnswers[answer.question_id] = answer.selected_option
          })
          setAnswers(existingAnswers)
        }

        // Calculate remaining time
        const startTime = new Date(attemptData.started_at).getTime()
        const now = new Date().getTime()
        const elapsedSeconds = Math.floor((now - startTime) / 1000)
        const totalSeconds = examData.duration_minutes * 60
        const remaining = Math.max(0, totalSeconds - elapsedSeconds)
        
        setRemainingTime(remaining)

        // Try to restore from localStorage if available
        const saved = loadFromLocalStorage()
        if (saved && saved.timestamp) {
          const savedTime = new Date(saved.timestamp).getTime()
          const currentTime = new Date().getTime()
          const timeDiff = (currentTime - savedTime) / 1000 / 60 // minutes
          
          // Only restore if saved within last 30 minutes
          if (timeDiff <= 30) {
            setAnswers(prev => ({ ...prev, ...saved.answers }))
            setCurrentIndex(saved.currentIndex || 0)
            setShowRestoreNotification(true)
            setTimeout(() => setShowRestoreNotification(false), 5000)
          }
        }

        setLoading(false)

      } catch (error: any) {
        console.error('Failed to load exam data:', error)
        setError('Failed to load exam: ' + error.message)
        setLoading(false)
      }
    }

    loadExamData()
  }, [attemptId, router, loadFromLocalStorage])

  //  ONLINE/OFFLINE DETECTION
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setSaveStatus('saved')
      // Try to sync any pending saves
      syncPendingSaves()
    }
    
    const handleOffline = () => {
      setIsOnline(false)
      setSaveStatus('offline')
    }
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  //  SYNC PENDING SAVES
  const syncPendingSaves = useCallback(async () => {
    if (!attempt || !isOnline) return
    
    const savedData = loadFromLocalStorage()
    if (!savedData || !savedData.answers) return
    
    try {
      setSaveStatus('saving')
      
      // Sync all answers from localStorage to database
      const upsertPromises = Object.entries(savedData.answers).map(([questionId, selectedOption]) => {
        const question = questions.find(q => q.id === questionId)
        if (!question) return Promise.resolve()
        
        return db
          .from('exam_answers')
          .upsert({
            attempt_id: attempt.id,
            question_id: questionId,
            selected_option: selectedOption as string,
            is_correct: (selectedOption as string) === question.correct_option
          }, {
            onConflict: 'attempt_id,question_id'
          })
      })
      
      await Promise.all(upsertPromises)
      
      // Update current index and remaining time
      if (savedData.currentIndex !== undefined) {
        setCurrentIndex(savedData.currentIndex)
      }
      
      setSaveStatus('saved')
      setLastSaveTime(new Date())
      lastSaveRef.current = new Date()
      
    } catch (error) {
      console.error('Failed to sync pending saves:', error)
      setSaveStatus('error')
    }
  }, [attempt, isOnline, loadFromLocalStorage, questions])

  //  AUTOSAVE FUNCTION
  const autoSave = useCallback(async (forced = false) => {
    if (!attempt) return
    
    // Don't save too frequently unless forced
    const now = new Date()
    const timeSinceLastSave = now.getTime() - lastSaveRef.current.getTime()
    if (!forced && timeSinceLastSave < 3000) return // 3 seconds minimum
    
    const saveData = {
      answers,
      currentIndex,
      remainingTime,
      lastActivity: now.toISOString()
    }
    
    // Always save to localStorage first
    saveToLocalStorage(saveData)
    
    // Try to save to database if online
    if (isOnline) {
      try {
        setSaveStatus('saving')
        
        // Save current progress to database
        const upsertPromises = Object.entries(answers).map(([questionId, selectedOption]) => {
          const question = questions.find(q => q.id === questionId)
          if (!question) return Promise.resolve()
          
          return db
            .from('exam_answers')
            .upsert({
              attempt_id: attempt.id,
              question_id: questionId,
              selected_option: selectedOption,
              is_correct: selectedOption === question.correct_option
            }, {
              onConflict: 'attempt_id,question_id'
            })
        })
        
        await Promise.all(upsertPromises)
        
        setSaveStatus('saved')
        setLastSaveTime(new Date())
        lastSaveRef.current = new Date()
        
      } catch (error) {
        console.error('Autosave failed:', error)
        setSaveStatus('error')
        // Data is still saved locally, so we can retry later
      }
    } else {
      setSaveStatus('offline')
    }
  }, [attempt, answers, currentIndex, remainingTime, isOnline, questions, saveToLocalStorage])

  //  PERIODIC AUTOSAVE
  useEffect(() => {
    if (!attempt) return
    
    const interval = setInterval(() => {
      autoSave()
    }, 10000) // Save every 10 seconds
    
    return () => clearInterval(interval)
  }, [autoSave, attempt])

  //  EMERGENCY SAVE ON PAGE UNLOAD
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (Object.keys(answers).length > 0) {
        // Force immediate save
        autoSave(true)
        
        // Show warning to user
        e.preventDefault()
        e.returnValue = 'You have unsaved progress. Are you sure you want to leave?'
        return e.returnValue
      }
    }
    
    const handleUnload = () => {
      // Last chance save using sendBeacon if available
      if (navigator.sendBeacon && attempt) {
        const saveData = {
          answers,
          currentIndex,
          remainingTime,
          lastActivity: new Date().toISOString()
        }
        
        try {
          const session = getSession()
          const sessionToken = session?.token
          
          navigator.sendBeacon(
            '/api/exam/emergency-save',
            JSON.stringify({
              attemptId: attempt.id,
              data: saveData,
              sessionToken
            })
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
  }, [answers, currentIndex, remainingTime, attempt, autoSave])

  //  PART 7  SUBMIT EXAM
  const handleSubmit = useCallback(async (isAutoSubmit = false) => {
    if (!attempt || submitting) return

    setSubmitting(true)

    try {
      // Fetch all answers for this attempt with question marks
      const { data: answers, error: answersError } = await db
        .from('exam_answers')
        .select('is_correct, question:question_id (marks)')
        .eq('attempt_id', attempt.id)

      if (answersError) {
        alert('Failed to fetch answers: ' + answersError.message)
        setSubmitting(false)
        return
      }

      if (!answers || answers.length === 0) {
        alert('No answers found. Please answer at least one question before submitting.')
        setSubmitting(false)
        return
      }

      // CRITICAL FIX: Calculate total marks from ALL exam questions, not just answered ones
      // This prevents students from getting high percentage by answering only few questions
      const examTotalMarks = questions.reduce(
        (sum, q) => sum + (q.marks || 1),
        0
      )
      
      // Calculate score from answered questions
      const score = answers.reduce(
        (sum, a: any) => sum + (a.is_correct ? (a.question?.marks ?? 1) : 0),
        0
      )
      
      // Calculate percentage based on TOTAL exam marks, not just answered questions
      const percentage = examTotalMarks > 0 ? (score * 100) / examTotalMarks : 0
      
      // Determine pass status (45% is passing threshold)
      const isPassed = percentage >= 45

      // Update exam_attempts - include pass status
      const { error: updateAttemptError } = await db
        .from('exam_attempts')
        .update({
          score,
          percentage,
          is_passed: isPassed,
          submitted_at: new Date().toISOString(),
          status: isAutoSubmit ? 'auto_submitted' : 'submitted'
        })
        .eq('id', attempt.id)

      if (updateAttemptError) {
        alert('Failed to submit exam: ' + updateAttemptError.message)
        setSubmitting(false)
        return
      }

      // Update exam_assignments status to 'completed'
      const { error: updateAssignmentError } = await db
        .from('exam_assignments')
        .update({ status: 'completed' })
        .eq('exam_id', attempt.exam_id)
        .eq('student_id', attempt.student_id)

      if (updateAssignmentError) {
        console.warn('Failed to update assignment status:', updateAssignmentError.message)
        // Don't block redirect - assignment update is secondary
      }

      // Clear autosave data after successful submission
      clearLocalStorage()

      // Redirect to thank you page (results will be available after admin review)
      router.push(`/student/exam-submitted?examName=${encodeURIComponent(attempt.exams.name)}`)
    } catch (err: any) {
      alert('An error occurred: ' + (err.message || 'Failed to submit exam'))
      setSubmitting(false)
    }
  }, [attempt, submitting, router])

  //  PART 1  AUTH + ATTEMPT VALIDATION
  useEffect(() => {
    if (!attemptId) return

    const loadData = async () => {
      // Check auth
      const { data: { user } } = await db.auth.getUser()

      if (!user) {
        router.replace('/login')
        return
      }

      // Fetch attempt with exact query structure
      const { data: attemptData, error: attemptError } = await db
        .from('exam_attempts')
        .select(`
          id,
          exam_id,
          student_id,
          started_at,
          status,
          score,
          exams:exam_id (
            id,
            name,
            exam_date,
            start_time,
            end_time,
            duration_minutes,
            course_id
          )
        `)
        .eq('id', attemptId)
        .single()

      if (attemptError || !attemptData) {
        setError('Exam attempt not found.')
        setLoading(false)
        return
      }

      // Get student record to verify ownership and fetch profile details
      const { data: students, error: studentError } = await db
        .from('students')
        .select(`
          id,
          enrollment_no,
          profile_id,
          status,
          full_name,
          email,
          photo_url,
          phone
        `)
        .eq('profile_id', user.id)

      if (studentError) {
        console.error('Student lookup error:', studentError)
        setError('Database error: ' + studentError.message)
        setLoading(false)
        return
      }

      if (!students || students.length === 0) {
        setError('Student record not found. Please contact administration.')
        setLoading(false)
        return
      }

      const student = students[0]
      
      // Check if student is approved
      if (student.status !== 'approved') {
        setError('Your student account is not yet approved. Please contact administration.')
        setLoading(false)
        return
      }
      
      const studentId = student.id

      // Set student profile data
      setStudentProfile({
        id: student.id,
        full_name: student.full_name || 'Student',
        email: student.email || '',
        enrollment_no: student.enrollment_no || 'N/A',
        photo_url: student.photo_url,
        phone: student.phone
      })

      // Verify attempt.student_id === currentUser
      if (attemptData.student_id !== studentId) {
        router.replace('/student/dashboard')
        return
      }

      // Check status !== 'in_progress'
      if (attemptData.status !== 'in_progress') {
        setError('Exam already submitted or expired.')
        setLoading(false)
        return
      }

      const examData = (Array.isArray(attemptData.exams) ? attemptData.exams[0] : attemptData.exams) as Exam
      const attemptWithExam = {
        ...attemptData,
        exams: examData
      } as Attempt
      setAttempt(attemptWithExam)

      //  PART 2  TIMER LOGIC
      // Compute exam end time
      const endTime = new Date(attemptData.started_at)
      endTime.setMinutes(endTime.getMinutes() + examData.duration_minutes)

      const now = new Date()
      const remainingMs = endTime.getTime() - now.getTime()

      if (remainingMs <= 0) {
        // Time already expired - auto submit
        setRemainingTime(0)
      } else {
        setRemainingTime(Math.floor(remainingMs / 1000))
      }

      //  PART 3  LOAD QUESTIONS
      const { data: questionsData, error: questionsError } = await db
        .from('questions')
        .select('*')
        .eq('course_id', examData.course_id)
        .order('created_at', { ascending: true })

      if (questionsError) {
        setError('Failed to load questions.')
        setLoading(false)
        return
      }

      const shuffledQuestions = deterministicShuffle(questionsData || [], attemptId as string);
      const selectedQuestions = shuffledQuestions.slice(0, 100);
      setQuestions(selectedQuestions)

      //  PART 4  LOAD SAVED ANSWERS & RESTORE FROM AUTOSAVE
      const { data: existingAnswers } = await db
        .from('exam_answers')
        .select('*')
        .eq('attempt_id', attemptData.id)

      // Check for local autosave data
      const savedData = loadFromLocalStorage()
      let answersRecord: Record<string, string> = {}
      let restoredIndex = 0
      
      if (existingAnswers) {
        existingAnswers.forEach((a: any) => {
          answersRecord[a.question_id] = a.selected_option
        })
      }
      
      // Restore from autosave if available and more recent
      if (savedData && savedData.answers) {
        const savedTime = new Date(savedData.timestamp).getTime()
        const dbTime = existingAnswers && existingAnswers.length > 0 
          ? Math.max(...existingAnswers.map((a: any) => new Date(a.created_at || 0).getTime()))
          : 0
          
        if (savedTime > dbTime) {
          // Merge saved answers with database answers (saved takes priority)
          answersRecord = { ...answersRecord, ...savedData.answers }
          restoredIndex = savedData.currentIndex || 0
          
          // Show restoration notification
          setShowRestoreNotification(true)
          console.log('Restored exam progress from autosave')
          
          // Hide notification after 5 seconds
          setTimeout(() => setShowRestoreNotification(false), 5000)
          
          // Sync restored data to database
          setTimeout(() => syncPendingSaves(), 1000)
        }
      }
      
      setAnswers(answersRecord)
      setCurrentIndex(Math.min(restoredIndex, (questionsData?.length || 1) - 1))

      setLoading(false)
    }

    loadData()
  }, [attemptId, router])

  //  Timer countdown - updates every second
  useEffect(() => {
    if (loading || remainingTime <= 0) return

    const timer = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          // Auto-submit when time expires
          handleSubmit(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [loading, remainingTime, handleSubmit])

  //  PART 5  SELECT OPTION (SAVE IMMEDIATELY + AUTOSAVE)
  const handleSelectOption = async (questionId: string, selected: string, correctOption: string) => {
    if (!attempt) return

    // Update local state
    const newAnswers = {
      ...answers,
      [questionId]: selected
    }
    setAnswers(newAnswers)

    // Save to localStorage immediately
    saveToLocalStorage({
      answers: newAnswers,
      currentIndex,
      remainingTime,
      lastActivity: new Date().toISOString()
    })

    // Save to database if online
    if (isOnline) {
      try {
        setSaveStatus('saving')
        await db
          .from('exam_answers')
          .upsert({
            attempt_id: attempt.id,
            question_id: questionId,
            selected_option: selected,
            is_correct: selected === correctOption
          }, {
            onConflict: 'attempt_id,question_id'
          })
        setSaveStatus('saved')
        setLastSaveTime(new Date())
        lastSaveRef.current = new Date()
      } catch (error) {
        console.error('Failed to save answer:', error)
        setSaveStatus('error')
      }
    } else {
      setSaveStatus('offline')
    }
  }

  //  PART 6  NAVIGATE QUESTIONS
  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      autoSave()
    }
  }

  const goToNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
      autoSave()
    }
  }

  const goToQuestion = (index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentIndex(index)
      autoSave()
    }
  }

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

  // Error state
  if (error) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">{error}</div>
        <button className="btn btn-secondary" onClick={() => router.push('/student/exams')}>
          Back to My Exams
        </button>
      </div>
    )
  }

  // No questions
  if (!attempt || questions.length === 0) {
    return (
      <div className="container mt-4">
        <div className="alert alert-warning">No questions found for this exam.</div>
        <button className="btn btn-secondary" onClick={() => router.push('/student/exams')}>
          Back to My Exams
        </button>
      </div>
    )
  }

  const currentQuestion = questions[currentIndex]
  const selectedOption = answers[currentQuestion.id]
  const answeredCount = Object.keys(answers).length
  const totalQuestions = questions.length

  // Timer color: red when < 5 minutes (300 seconds)
  const isTimerCritical = remainingTime < 300
  const isTimerDanger = remainingTime < 60

  return (
    <>
      <Head>
        <title>Exam  {attempt.exams.name}  CCC Exam Portal</title>
      </Head>

      {/*  Top Card - Exam Name + Timer + Save Status */}
      <div className="bg-dark text-white py-3 sticky-top shadow">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-4">
              <h5 className="mb-0">{attempt.exams.name}</h5>
              <small className="text-muted">
                Question {currentIndex + 1} of {totalQuestions}
              </small>
            </div>
            <div className="col-md-4 text-center">
              {/* Save Status Indicator */}
              {saveStatus === 'saving' && (
                <div className="d-flex align-items-center justify-content-center text-warning">
                  <div className="spinner-border spinner-border-sm me-2" role="status">
                    <span className="visually-hidden">Saving...</span>
                  </div>
                  <small>Saving...</small>
                </div>
              )}
              {saveStatus === 'saved' && (
                <div className="text-success">
                  <small> Saved {lastSaveTime && `at ${lastSaveTime.toLocaleTimeString()}`}</small>
                </div>
              )}
              {saveStatus === 'offline' && (
                <div className="text-warning">
                  <small> Offline - Saved locally</small>
                </div>
              )}
              {saveStatus === 'error' && (
                <div className="text-danger">
                  <small> Error - Saved locally</small>
                </div>
              )}
            </div>
            <div className="col-md-4 text-md-end mt-2 mt-md-0">
              <span className="badge bg-info me-2">
                {answeredCount}/{totalQuestions} Answered
              </span>
              <span className={`badge fs-5 ${isTimerDanger ? 'bg-danger' : isTimerCritical ? 'bg-warning text-dark' : 'bg-success'}`}>
                Time Left: {formatTime(remainingTime)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Student Profile Section */}
      {studentProfile && (
        <div className="bg-light border-bottom py-3">
          <div className="container">
            <div className="row align-items-center">
              <div className="col-lg-8 col-md-7 mb-2 mb-md-0">
                <div className="d-flex align-items-center gap-3">
                  {/* Profile Picture */}
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: studentProfile.photo_url 
                      ? `url(${studentProfile.photo_url}) center/cover`
                      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '1.5rem',
                    border: '3px solid white',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    flexShrink: 0
                  }}>
                    {!studentProfile.photo_url && studentProfile.full_name.charAt(0).toUpperCase()}
                  </div>
                  
                  {/* Student Details */}
                  <div style={{minWidth: 0}}>
                    <h6 className="mb-1 text-dark fw-bold">{studentProfile.full_name}</h6>
                    <div className="d-flex flex-wrap align-items-center gap-2 gap-md-3 text-muted small">
                      <span className="d-flex align-items-center">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '4px'}}>
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                          <line x1="16" y1="2" x2="16" y2="6"/>
                          <line x1="8" y1="2" x2="8" y2="6"/>
                          <line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        {studentProfile.enrollment_no}
                      </span>
                      <span className="d-none d-sm-flex align-items-center">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '4px'}}>
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                          <polyline points="22,6 12,13 2,6"/>
                        </svg>
                        {studentProfile.email}
                      </span>
                      {studentProfile.phone && (
                        <span className="d-none d-md-flex align-items-center">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '4px'}}>
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                          </svg>
                          {studentProfile.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Exam Session Status */}
              <div className="col-lg-4 col-md-5 text-md-end">
                <div className="d-flex flex-column align-items-md-end gap-1">
                  <div className="badge bg-success px-3 py-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '6px'}}>
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    Exam in Progress
                  </div>
                  <div className="badge bg-warning text-dark px-2 py-1 mt-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '4px'}}>
                      <path d="M2 3h6l4 4h8a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V3z"/>
                    </svg>
                    Session Monitored
                  </div>
                  <small className="text-muted">
                    Started: {attempt.started_at ? new Date(attempt.started_at).toLocaleTimeString() : 'N/A'}
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Restoration Notification */}
      {showRestoreNotification && (
        <div className="container mt-2">
          <div className="alert alert-success alert-dismissible fade show" role="alert">
            <strong> Progress Restored!</strong> Your previous answers have been recovered from autosave.
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setShowRestoreNotification(false)}
              aria-label="Close"
            ></button>
          </div>
        </div>
      )}

      <div className="container mt-4 mb-4">
        <div className="row">
          {/* Question Card */}
          <div className="col-lg-8 mb-4">
            <div className="card">
              <div className="card-header bg-light d-flex justify-content-between align-items-center">
                <span className="fw-bold">Question {currentIndex + 1}</span>
                <div className="d-flex align-items-center gap-3">
                  <div className="btn-group btn-group-sm" role="group" aria-label="Language Toggle">
                    <button
                      type="button"
                      className={`btn ${language === 'EN' ? 'btn-dark' : 'btn-outline-dark'}`}
                      onClick={() => setLanguage('EN')}
                    >
                      EN
                    </button>
                    <button
                      type="button"
                      className={`btn ${language === 'GU' ? 'btn-dark' : 'btn-outline-dark'}`}
                      onClick={() => setLanguage('GU')}
                    >
                      ગુજરાતી
                    </button>
                  </div>
                  <span className="badge bg-secondary">{currentQuestion.marks || 1} mark(s)</span>
                </div>
              </div>
              <div className="card-body">
                {/* Large question text */}
                <p className="fs-5 mb-4">
                  {language === 'GU' && currentQuestion.question_gu 
                    ? currentQuestion.question_gu 
                    : currentQuestion.question_en || currentQuestion.question_text}
                </p>

                {/* Radio buttons for A/B/C/D */}
                <div className="d-flex flex-column gap-2">
                  {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                    const isSelected = selectedOption === opt
                    
                    let optionText = ''
                    if (language === 'GU') {
                      const guKey = `option${opt}_gu` as keyof Question
                      optionText = (currentQuestion[guKey] || '') as string
                    }
                    if (!optionText) {
                      const enKey = `option${opt}_en` as keyof Question
                      optionText = (currentQuestion[enKey] || '') as string
                    }
                    if (!optionText) {
                      const fallbackKey = `option_${opt.toLowerCase()}` as keyof Question
                      optionText = (currentQuestion[fallbackKey] || '') as string
                    }

                    return (
                      <div
                        key={opt}
                        className={`form-check p-3 border rounded ${isSelected ? 'bg-primary text-white border-primary' : 'bg-light'}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleSelectOption(currentQuestion.id, opt, currentQuestion.correct_option)}
                      >
                        <input
                          className="form-check-input"
                          type="radio"
                          name={`question-${currentQuestion.id}`}
                          id={`option-${opt}`}
                          checked={isSelected}
                          onChange={() => handleSelectOption(currentQuestion.id, opt, currentQuestion.correct_option)}
                        />
                        <label
                          className={`form-check-label w-100 ${isSelected ? 'text-white' : ''}`}
                          htmlFor={`option-${opt}`}
                          style={{ cursor: 'pointer' }}
                        >
                          <strong className="me-2">{opt}.</strong>
                          {optionText}
                        </label>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="card-footer d-flex justify-content-between">
                <button
                  className="btn btn-secondary"
                  onClick={goToPrevious}
                  disabled={currentIndex === 0}
                >
                   Previous
                </button>
                <button
                  className="btn btn-primary"
                  onClick={goToNext}
                  disabled={currentIndex === totalQuestions - 1}
                >
                  Next 
                </button>
              </div>
            </div>
          </div>

          {/* Question Navigator */}
          <div className="col-lg-4">
            {/* Student Info Card */}
            {studentProfile && (
              <div className="card mb-3 border-primary">
                <div className="card-header bg-primary text-white">
                  <strong>Student Information</strong>
                </div>
                <div className="card-body p-3">
                  <div className="d-flex align-items-center gap-3">
                    <div style={{
                      width: '45px',
                      height: '45px',
                      borderRadius: '50%',
                      background: studentProfile.photo_url 
                        ? `url(${studentProfile.photo_url}) center/cover`
                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '1.2rem',
                      border: '2px solid white',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      flexShrink: 0
                    }}>
                      {!studentProfile.photo_url && studentProfile.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{minWidth: 0}}>
                      <div className="fw-bold text-dark" style={{fontSize: '0.95rem'}}>{studentProfile.full_name}</div>
                      <div className="text-muted small">ID: {studentProfile.enrollment_no}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="card mb-4">
              <div className="card-header bg-light">
                <strong>Question Navigator</strong>
              </div>
              <div className="card-body">
                <div className="d-flex flex-wrap gap-2 mb-3">
                  {questions.map((q, index) => {
                    const isAnswered = answers[q.id] !== undefined
                    const isCurrent = index === currentIndex

                    return (
                      <button
                        key={q.id}
                        className={`btn btn-sm ${isCurrent ? 'btn-dark' : isAnswered ? 'btn-success' : 'btn-outline-secondary'}`}
                        style={{ width: '42px', height: '42px' }}
                        onClick={() => goToQuestion(index)}
                      >
                        {index + 1}
                      </button>
                    )
                  })}
                </div>

                <hr />

                <div className="d-flex gap-3 mb-3 small">
                  <span><span className="badge bg-success me-1"></span> Answered</span>
                  <span><span className="badge border text-dark me-1"></span> Not Answered</span>
                  <span><span className="badge bg-dark me-1"></span> Current</span>
                </div>

                <hr />

                {/* Submit Section with Enhanced Safety */}
                <div className="mb-3">
                  <div className="alert alert-info small mb-2">
                    <strong> Review Before Submit:</strong>
                    <br /> Answered: {answeredCount}/{totalQuestions} questions
                    <br /> Time remaining: {formatTime(remainingTime)}
                    <br /> This action cannot be undone
                  </div>
                  
                  {answeredCount < totalQuestions && (
                    <div className="alert alert-warning small mb-2">
                      <strong> Warning:</strong> You have {totalQuestions - answeredCount} unanswered question(s). Unanswered questions will be marked as incorrect.
                    </div>
                  )}
                </div>

                {/* Two-step submit process */}
                <div className="d-grid gap-2">
                  <button
                    className="btn btn-outline-danger"
                    onClick={() => {
                      const confirmMsg = `Are you sure you want to submit your exam?\n\n` +
                        ` Questions answered: ${answeredCount}/${totalQuestions}\n` +
                        ` Time remaining: ${formatTime(remainingTime)}\n\n` +
                        `This action cannot be undone!`
                      
                      if (confirm(confirmMsg)) {
                        handleSubmit(false)
                      }
                    }}
                    disabled={submitting}
                    style={{
                      border: '2px solid #dc3545',
                      fontWeight: 'bold',
                      backgroundColor: 'white',
                      color: '#dc3545'
                    }}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Submitting...
                      </>
                    ) : (
                      ' SUBMIT EXAM (Click to Confirm)'
                    )}
                  </button>
                  
                  <small className="text-muted text-center">
                    Click "SUBMIT EXAM" above and type "SUBMIT" when prompted to finalize your exam
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
