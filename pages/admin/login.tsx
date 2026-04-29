// pages/admin/login.tsx
import { FormEvent, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { convex } from '../../lib/convexClient'
import { api } from '../../convex/_generated/api'
import { setSession } from '../../lib/session'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!email.trim() || !password) {
        setError('Email and Password are required.')
        setLoading(false)
        return
      }

      const result = await convex.mutation(api.auth.login, {
        email: email.trim(),
        password,
      })

      if (!result.success) {
        setError("Login failed")
        setLoading(false)
        return
      }

      setSession({
        profileId: result.profileId,
        email: result.email,
        fullName: result.fullName,
        role: result.role,
        token: result.token,
      })

      router.push('/admin/dashboard')

    } catch (err: any) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Admin Login  CCC Exam Portal</title>
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
              <div className="login-card admin fade-in">
                {/* Header */}
                <div style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                  <h4 style={{ fontWeight: '700', marginBottom: '0.5rem' }}>Admin Login</h4>
                  <p style={{ opacity: '0.9', marginBottom: '0', fontSize: '0.9rem' }}>
                    Secure administrator access
                  </p>
                </div>

                {/* Form */}
                <div className="card-body p-4">
                  <form onSubmit={handleSubmit}>
                    <div className="form-group-premium">
                      <label className="form-label-premium">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.5rem', opacity: '0.7' }}>
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                          <polyline points="22,6 12,13 2,6"/>
                        </svg>
                        Email Address
                      </label>
                      <input
                        type="email"
                        className="form-control-premium"
                        placeholder="admin@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
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
                      className="btn-premium btn-premium-primary w-100"
                      disabled={loading}
                      style={{ marginTop: '0.5rem' }}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Authenticating...
                        </>
                      ) : (
                        <>
                          Access Dashboard
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
                      For administrators and center managers only
                    </p>
                    <Link href="/student/login" className="btn btn-outline-success btn-sm">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.5rem' }}>
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                        <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                      </svg>
                      Student Login
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
