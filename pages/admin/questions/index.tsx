// pages/admin/questions/index.tsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { legacyClient } from '../../../lib/legacyClient'

interface Question {
  id: string
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_option: string
  marks: number
  created_at: string
}

export default function AdminQuestions() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  const fetchQuestions = async () => {
    const { data, error: fetchError } = await legacyClient
      .from('questions')
      .select('*')
      .order('created_at', { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
      return
    }

    if (data) {
      setQuestions(data)
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

      await fetchQuestions()
      setLoading(false)
    }

    checkAdminAccess()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const filteredQuestions = questions.filter(q =>
    q.question_text.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div style={{ background: 'var(--light-bg)', minHeight: 'calc(100vh - 70px)' }}>
        <div className="container py-5">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading questions...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Questions  CCC Exam Portal</title>
      </Head>
      <div style={{ background: 'var(--light-bg)', minHeight: 'calc(100vh - 70px)', padding: '2rem 0' }}>
        <div className="container">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4 fade-in">
            <div>
              <h1 className="page-title">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="url(#quesGrad)" strokeWidth="2" style={{ marginRight: '0.5rem' }}>
                  <defs>
                    <linearGradient id="quesGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#F2994A" />
                      <stop offset="100%" stopColor="#F2C94C" />
                    </linearGradient>
                  </defs>
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                Question Bank
              </h1>
              <p className="page-subtitle">Manage CCC exam questions</p>
            </div>
            <Link href="/admin/questions/new" className="btn-premium btn-premium-primary" style={{ background: 'linear-gradient(135deg, #F2994A 0%, #F2C94C 100%)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add New Question
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
                    background: 'linear-gradient(135deg, #F2994A 0%, #F2C94C 100%)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                  </div>
                  <div className="text-start">
                    <div className="fw-bold" style={{ fontSize: '1.5rem', color: 'var(--dark-text)' }}>{questions.length}</div>
                    <div className="text-muted small">Total Questions</div>
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
                      {questions.reduce((sum, q) => sum + q.marks, 0)}
                    </div>
                    <div className="text-muted small">Total Marks</div>
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
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="7"/>
                      <rect x="14" y="3" width="7" height="7"/>
                      <rect x="14" y="14" width="7" height="7"/>
                      <rect x="3" y="14" width="7" height="7"/>
                    </svg>
                  </div>
                  <div className="text-start">
                    <div className="fw-bold" style={{ fontSize: '1.5rem', color: 'var(--dark-text)' }}>4</div>
                    <div className="text-muted small">Options Each</div>
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
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                Question List
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
                    placeholder="Search questions..."
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
                  background: 'linear-gradient(135deg, #F2994A 0%, #F2C94C 100%)',
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  fontSize: '0.85rem'
                }}>
                  {filteredQuestions.length} question{filteredQuestions.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
            <div className="premium-card-body p-0">
              {filteredQuestions.length === 0 ? (
                <div className="text-center py-5">
                  <div style={{
                    width: '80px',
                    height: '80px',
                    background: 'linear-gradient(135deg, #F2994A 0%, #F2C94C 100%)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem',
                    opacity: 0.6
                  }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                  </div>
                  <p className="text-muted mb-3">
                    {searchTerm ? 'No questions match your search.' : 'No questions added yet.'}
                  </p>
                  {!searchTerm && (
                    <Link href="/admin/questions/new" className="btn-premium btn-premium-primary" style={{ background: 'linear-gradient(135deg, #F2994A 0%, #F2C94C 100%)' }}>
                      Add Your First Question
                    </Link>
                  )}
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-premium mb-0">
                    <thead>
                      <tr>
                        <th style={{ width: '50%' }}>Question</th>
                        <th>Correct Answer</th>
                        <th>Marks</th>
                        <th>Created On</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredQuestions.map((question, index) => (
                        <tr key={question.id} className="fade-in" style={{ animationDelay: `${index * 0.03}s` }}>
                          <td>
                            <div className="d-flex align-items-start gap-3">
                              <div style={{
                                minWidth: '36px',
                                height: '36px',
                                background: 'linear-gradient(135deg, #F2994A 0%, #F2C94C 100%)',
                                borderRadius: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: '600',
                                fontSize: '0.85rem'
                              }}>
                                Q
                              </div>
                              <span className="text-truncate d-inline-block" style={{ maxWidth: '400px', color: 'var(--dark-text)' }}>
                                {question.question_text}
                              </span>
                            </div>
                          </td>
                          <td>
                            <span style={{
                              background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                              color: 'white',
                              padding: '0.4rem 0.8rem',
                              borderRadius: '8px',
                              fontSize: '0.85rem',
                              fontWeight: '700',
                              display: 'inline-block'
                            }}>
                              Option {question.correct_option.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <span className="badge" style={{ 
                              background: 'rgba(102, 126, 234, 0.1)',
                              color: '#667eea',
                              padding: '0.4rem 0.8rem',
                              borderRadius: '6px',
                              fontWeight: '600'
                            }}>
                              {question.marks} mark{question.marks !== 1 ? 's' : ''}
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
                              <span style={{ color: 'var(--text-muted)' }}>{formatDate(question.created_at)}</span>
                            </div>
                          </td>
                          <td className="text-center">
                            <Link
                              href={`/admin/questions/${question.id}`}
                              className="btn-premium btn-premium-outline btn-premium-sm"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                              Edit
                            </Link>
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
    </>
  )
}
