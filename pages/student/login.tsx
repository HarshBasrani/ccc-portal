// pages/student/login.tsx
import { FormEvent, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { legacyClient } from '../../lib/legacyClient'

export default function StudentLoginPage() {
  const [enrollmentNo, setEnrollmentNo] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!enrollmentNo.trim() || !password) {
        setError('Enrollment Number and Password are required.')
        setLoading(false)
        return
      }

      const { data, error: loginError } = await legacyClient.auth.signInWithPassword({
        enrollmentNo: enrollmentNo.trim(),
        password: password,
      })

      if (loginError) {
        setError(loginError.message)
        setLoading(false)
        return
      }

      const user = data.user
      if (!user) {
        setError('Login succeeded but user is missing.')
        setLoading(false)
        return
      }

      router.push('/student/dashboard')

    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : String(err)) || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Student Login  CCC Exam Portal</title>
      </Head>

      <div style={{ 
        minHeight: 'calc(100vh - 70px)', 
        display: 'flex', 
        alignItems: 'center',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        padding: '2rem 0'
      }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-6 col-lg-5 col-xl-4">
              <div className="login-card student fade-in">
                {/* Header */}
                <div style={{
                  background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                  padding: '2.5rem 2rem',
                  textAlign: 'center',
                  color: 'white'
                }}>
                  <div style={{
                    width: '70px',
                    height: '70px',
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                      <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                    </svg>
                  </div>
                  <h4 style={{ fontWeight: '700', marginBottom: '0.5rem' }}>Student Login</h4>
                  <p style={{ opacity: '0.9', marginBottom: '0', fontSize: '0.9rem' }}>
                    Access your exams and results
                  </p>
                </div>

                {/* Form */}
                <div className="card-body p-4">
                  <form onSubmit={handleSubmit}>
                    <div className="form-group-premium">
                      <label className="form-label-premium">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.5rem', opacity: '0.7' }}>
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                          <line x1="16" y1="2" x2="16" y2="6"/>
                          <line x1="8" y1="2" x2="8" y2="6"/>
                          <line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        Enrollment Number
                      </label>
                      <input
                        type="text"
                        className="form-control-premium"
                        placeholder="e.g., CCC20250001"
                        value={enrollmentNo}
                        onChange={(e) => setEnrollmentNo(e.target.value)}
                        disabled={loading}
                        autoFocus
                      />
                    </div>

                    <div className="form-group-premium">
                      <label className="form-label-premium">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.5rem', opacity: '0.7' }}>
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                        Password
                      </label>
                      <input
                        type="password"
                        className="form-control-premium"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                      />
                    </div>

                    {error && (
                      <div className="alert-premium alert-danger mb-3">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="12" y1="8" x2="12" y2="12"/>
                          <line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                        <span>{error}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="btn-premium btn-premium-success w-100"
                      disabled={loading}
                      style={{ marginTop: '0.5rem' }}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Logging in...
                        </>
                      ) : (
                        <>
                          Login to Portal
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"/>
                            <polyline points="12 5 19 12 12 19"/>
                          </svg>
                        </>
                      )}
                    </button>
                  </form>

                  <div style={{ 
                    borderTop: '1px solid var(--light-border)', 
                    marginTop: '1.5rem', 
                    paddingTop: '1.5rem',
                    textAlign: 'center'
                  }}>
                    <p className="text-muted small mb-3">
                      Credentials provided by your institute
                    </p>
                    <Link href="/admin/login" className="btn btn-outline-secondary btn-sm">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.5rem' }}>
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                      Admin Login
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
