// pages/student/exam-submitted.tsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { legacyClient } from '../../lib/legacyClient'

export default function ExamSubmitted() {
  const router = useRouter()
  const { examName } = router.query
  const [loading, setLoading] = useState(true)
  const [studentName, setStudentName] = useState('')

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await legacyClient.auth.getUser()

      if (!user) {
        router.replace('/login')
        return
      }

      // Get student name
      const { data: profile } = await legacyClient
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

      if (profile) {
        setStudentName(profile.full_name)
      }

      setLoading(false)
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div style={{ background: 'var(--light-bg)', minHeight: '100vh' }}>
        <div className="container py-5">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Exam Submitted  CCC Exam Portal</title>
      </Head>
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}>
        <div className="text-center" style={{ maxWidth: '600px' }}>
          {/* Success Animation */}
          <div className="mb-4" style={{
            width: '120px',
            height: '120px',
            background: 'rgba(255, 255, 255, 0.15)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
            backdropFilter: 'blur(10px)',
            animation: 'pulse 2s infinite'
          }}>
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>

          {/* Main Content */}
          <div className="glass-card p-5" style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '1rem'
            }}>
              Exam Submitted!
            </h1>

            <div style={{
              fontSize: '1.1rem',
              color: '#6c757d',
              marginBottom: '2rem',
              lineHeight: '1.8'
            }}>
              {studentName && (
                <p className="mb-2">
                  <strong style={{ color: '#333' }}>Dear {studentName},</strong>
                </p>
              )}
              <p className="mb-2">
                Your exam <strong style={{ color: '#667eea' }}>{examName || ''}</strong> has been successfully submitted.
              </p>
              <p className="mb-0">
                Your results will be available after evaluation by the administrator.
                Please check the <strong>Results</strong> section later.
              </p>
            </div>

            {/* Info Box */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
              borderRadius: '16px',
              padding: '1.5rem',
              marginBottom: '2rem',
              border: '1px solid rgba(102, 126, 234, 0.2)'
            }}>
              <div className="d-flex align-items-center gap-3">
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="16" x2="12" y2="12"/>
                    <line x1="12" y1="8" x2="12.01" y2="8"/>
                  </svg>
                </div>
                <div className="text-start">
                  <strong style={{ color: '#333' }}>What's Next?</strong>
                  <p className="mb-0 small text-muted">
                    The administrator will review and publish results. You'll be able to see your score and detailed feedback in the Results section.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center">
              <Link href="/student/dashboard" className="btn-premium" style={{
                padding: '0.875rem 2rem',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                Go to Dashboard
              </Link>
              <Link href="/student/exams" className="btn-premium-outline" style={{
                padding: '0.875rem 2rem',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
                View My Exams
              </Link>
            </div>
          </div>

          {/* Footer Message */}
          <p style={{
            color: 'rgba(255, 255, 255, 0.8)',
            marginTop: '2rem',
            fontSize: '0.9rem'
          }}>
            Thank you for completing your exam. Good luck!
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.9;
          }
        }
      `}</style>
    </>
  )
}
