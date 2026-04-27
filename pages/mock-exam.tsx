import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { legacyClient } from '../lib/legacyClient'

interface Question {
  id: string
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_option: string
}

export default function MockExam() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<{ [key: number]: string }>({})
  const [showResults, setShowResults] = useState(false)
  const [loading, setLoading] = useState(true)
  const [timeLeft, setTimeLeft] = useState(3000) // 50 minutes = 3000 seconds
  const [examStarted, setExamStarted] = useState(false)

  useEffect(() => {
    fetchRandomQuestions()
  }, [])

  useEffect(() => {
    if (!examStarted || showResults) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [examStarted, showResults])

  const fetchRandomQuestions = async () => {
    try {
      // Fetch all questions and randomly select 50
      const { data, error } = await legacyClient
        .from('questions')
        .select('*')
        .limit(1000)

      if (error) throw error

      if (data && data.length > 0) {
        // Shuffle and take first 50
        const shuffled = data.sort(() => Math.random() - 0.5).slice(0, 50)
        setQuestions(shuffled)
      }

      setLoading(false)
    } catch (error) {
      console.error('Error fetching questions:', error)
      setLoading(false)
    }
  }

  const handleAnswerSelect = (answer: string) => {
    setAnswers({ ...answers, [currentQuestion]: answer })
  }

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const handleQuestionJump = (index: number) => {
    setCurrentQuestion(index)
  }

  const handleSubmit = () => {
    const unanswered = questions.length - Object.keys(answers).length
    const message = unanswered > 0 
      ? `You have ${unanswered} unanswered question(s). Are you sure you want to submit?`
      : 'Are you sure you want to submit your exam?'
    
    if (confirm(message)) {
      setShowResults(true)
    }
  }

  const calculateResults = () => {
    let correct = 0
    questions.forEach((q, index) => {
      if (answers[index] === q.correct_option) {
        correct++
      }
    })
    const percentage = (correct / questions.length) * 100
    return { correct, total: questions.length, percentage }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading mock exam...</p>
        </div>
      </div>
    )
  }

  if (!examStarted) {
    return (
      <>
        <Head>
          <title>Mock Exam - CCC Practice Test</title>
        </Head>
        
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '2rem' }}>
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-8">
                <div className="card shadow-lg" style={{ borderRadius: '15px', border: 'none' }}>
                  <div className="card-body p-5">
                    <div className="text-center mb-4">
                      <h1 className="display-4 fw-bold text-primary">Mock Exam</h1>
                      <p className="lead text-muted">Test your CCC knowledge</p>
                    </div>

                    <div className="alert alert-info">
                      <h5 className="alert-heading"> Exam Instructions</h5>
                      <ul className="mb-0">
                        <li>Total Questions: <strong>50</strong></li>
                        <li>Time Duration: <strong>50 minutes</strong></li>
                        <li>Each question carries equal marks</li>
                        <li>You can navigate between questions freely</li>
                        <li>Your answers will be auto-submitted when time runs out</li>
                        <li>No login required - this is a practice test</li>
                      </ul>
                    </div>

                    <div className="d-grid gap-3 mt-4">
                      <button 
                        className="btn btn-primary btn-lg"
                        onClick={() => setExamStarted(true)}
                        style={{ 
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          border: 'none',
                          padding: '1rem'
                        }}
                      >
                        Start Mock Exam
                      </button>
                      <Link href="/" className="btn btn-outline-secondary btn-lg">
                        Back to Home
                      </Link>
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

  if (showResults) {
    const results = calculateResults()
    const passed = results.percentage >= 45

    return (
      <>
        <Head>
          <title>Mock Exam Results</title>
        </Head>
        
        <div style={{ minHeight: '100vh', background: '#f8f9fa', padding: '2rem' }}>
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-8">
                <div className="card shadow-lg" style={{ borderRadius: '15px', border: 'none' }}>
                  <div className="card-body p-5 text-center">
                    <div className="mb-4">
                      {passed ? (
                        <div className="text-success">
                          <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                          </svg>
                          <h2 className="mt-3 fw-bold">Congratulations!</h2>
                        </div>
                      ) : (
                        <div className="text-warning">
                          <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                          </svg>
                          <h2 className="mt-3 fw-bold">Keep Practicing!</h2>
                        </div>
                      )}
                    </div>

                    <div className="row g-4 my-4">
                      <div className="col-md-4">
                        <div className="p-3 bg-light rounded">
                          <h3 className="display-6 text-primary mb-0">{results.correct}</h3>
                          <p className="text-muted mb-0">Correct</p>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="p-3 bg-light rounded">
                          <h3 className="display-6 text-danger mb-0">{results.total - results.correct}</h3>
                          <p className="text-muted mb-0">Incorrect</p>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="p-3 bg-light rounded">
                          <h3 className="display-6 text-success mb-0">{results.percentage.toFixed(1)}%</h3>
                          <p className="text-muted mb-0">Score</p>
                        </div>
                      </div>
                    </div>

                    <div className="alert alert-info mt-4">
                      <p className="mb-0">
                        {passed 
                          ? "Great job! You're well-prepared for the actual exam."
                          : "Keep practicing! The passing score is 45%. Review the topics and try again."}
                      </p>
                    </div>

                    <div className="d-grid gap-3 mt-4">
                      <button 
                        className="btn btn-primary btn-lg"
                        onClick={() => {
                          setShowResults(false)
                          setExamStarted(false)
                          setCurrentQuestion(0)
                          setAnswers({})
                          setTimeLeft(3000)
                          fetchRandomQuestions()
                        }}
                      >
                        Take Another Mock Exam
                      </button>
                      <Link href="/" className="btn btn-outline-secondary btn-lg">
                        Back to Home
                      </Link>
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

  const currentQ = questions[currentQuestion]
  const selectedAnswer = answers[currentQuestion]

  return (
    <>
      <Head>
        <title>Mock Exam - Question {currentQuestion + 1} of {questions.length}</title>
      </Head>
      
      <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
        {/* Top Bar */}
        <div style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
          color: 'white', 
          padding: '1rem',
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <div className="container">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0">Mock Exam</h5>
                <small>Question {currentQuestion + 1} of {questions.length}</small>
              </div>
              <div className="text-end">
                <div className="fs-4 fw-bold">{formatTime(timeLeft)}</div>
                <small>Time Remaining</small>
              </div>
            </div>
          </div>
        </div>

        <div className="container py-4">
          <div className="row">
            {/* Question Area */}
            <div className="col-lg-8">
              <div className="card shadow-sm mb-4" style={{ borderRadius: '10px', border: 'none' }}>
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="badge bg-primary">Question {currentQuestion + 1}</span>
                    {answers[currentQuestion] && (
                      <span className="badge bg-success">Answered</span>
                    )}
                  </div>
                  
                  <h4 className="mb-4">{currentQ.question_text}</h4>

                  <div className="d-grid gap-3">
                    {['A', 'B', 'C', 'D'].map((option) => {
                      const optionText = currentQ[`option_${option.toLowerCase()}` as keyof Question]
                      const isSelected = selectedAnswer === option
                      
                      return (
                        <button
                          key={option}
                          className={`btn btn-lg text-start ${isSelected ? 'btn-primary' : 'btn-outline-secondary'}`}
                          onClick={() => handleAnswerSelect(option)}
                          style={{ 
                            padding: '1rem',
                            border: isSelected ? 'none' : '2px solid #dee2e6',
                            background: isSelected ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white'
                          }}
                        >
                          <strong>{option}.</strong> {optionText}
                        </button>
                      )
                    })}
                  </div>

                  <div className="d-flex justify-content-between mt-4 pt-4 border-top">
                    <button 
                      className="btn btn-outline-secondary"
                      onClick={handlePrevious}
                      disabled={currentQuestion === 0}
                    >
                       Previous
                    </button>
                    
                    {currentQuestion === questions.length - 1 ? (
                      <button 
                        className="btn btn-warning"
                        onClick={handleSubmit}
                      >
                        Submit Exam
                      </button>
                    ) : (
                      <button 
                        className="btn btn-primary"
                        onClick={handleNext}
                      >
                        Next 
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Question Palette */}
            <div className="col-lg-4">
              <div className="card shadow-sm" style={{ borderRadius: '10px', border: 'none', position: 'sticky', top: '100px' }}>
                <div className="card-body">
                  <h6 className="mb-3">Question Palette</h6>
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    {questions.map((_, index) => (
                      <button
                        key={index}
                        className={`btn btn-sm ${
                          index === currentQuestion 
                            ? 'btn-primary' 
                            : answers[index] 
                              ? 'btn-success' 
                              : 'btn-outline-secondary'
                        }`}
                        onClick={() => handleQuestionJump(index)}
                        style={{ width: '40px', height: '40px' }}
                      >
                        {index + 1}
                      </button>
                    ))}
                  </div>

                  <div className="border-top pt-3 mt-3">
                    <div className="d-flex justify-content-between mb-2">
                      <small>Answered:</small>
                      <strong>{Object.keys(answers).length}</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <small>Not Answered:</small>
                      <strong>{questions.length - Object.keys(answers).length}</strong>
                    </div>
                  </div>

                  <button 
                    className="btn btn-warning w-100 mt-3"
                    onClick={handleSubmit}
                  >
                    Submit Exam
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
