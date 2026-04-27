// pages/login.tsx
import Head from 'next/head'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <>
      <Head>
        <title>CCC Exam Portal  Course on Computer Concepts</title>
        <meta name="description" content="Official CCC Examination Portal - Course on Computer Concepts. Take your certification exam online." />
      </Head>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-bg-pattern"></div>
        
        {/* Floating Elements */}
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '5%',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'float 8s ease-in-out infinite'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '10%',
          right: '10%',
          width: '200px',
          height: '200px',
          background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'float 6s ease-in-out infinite reverse'
        }}></div>

        <div className="hero-content">
          {/* Badge */}
          <div className="hero-badge fade-in">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
            </svg>
            Government Certified Program
          </div>

          {/* Main Title */}
          <h1 className="hero-title fade-in" style={{ animationDelay: '0.1s' }}>
            Course on Computer<br />Concepts Portal
          </h1>
          
          {/* Subtitle */}
          <p className="hero-subtitle fade-in" style={{ animationDelay: '0.2s' }}>
            Official online examination system for CCC certification. 
            Empowering digital literacy across India with world-class assessment platform.
          </p>

          {/* CTA Buttons */}
          <div className="hero-buttons fade-in" style={{ animationDelay: '0.3s' }}>
            <Link href="/student/login" className="btn-premium btn-premium-white btn-premium-lg">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                <path d="M6 12v5c3 3 9 3 12 0v-5"/>
              </svg>
              Student Login
            </Link>
            <Link href="/admin/login" className="btn-premium btn-premium-outline btn-premium-lg">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              Admin Access
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: '5rem 0', background: 'var(--light-bg)' }}>
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="page-title" style={{ fontSize: '2.25rem' }}>Why Choose CCC Portal?</h2>
            <p className="page-subtitle">Trusted by thousands of students across India</p>
          </div>

          <div className="row g-4">
            {/* Feature 1 */}
            <div className="col-md-6 col-lg-3">
              <div className="dashboard-card students fade-in stagger-1 text-center">
                <div style={{
                  width: '70px',
                  height: '70px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                  boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)'
                }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                </div>
                <h5 className="fw-bold mb-2">Real-time Exams</h5>
                <p className="text-muted small mb-0">Take exams with live timer and instant feedback</p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="col-md-6 col-lg-3">
              <div className="dashboard-card exams fade-in stagger-2 text-center">
                <div style={{
                  width: '70px',
                  height: '70px',
                  background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                  boxShadow: '0 10px 30px rgba(56, 239, 125, 0.3)'
                }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    <polyline points="9 12 11 14 15 10"/>
                  </svg>
                </div>
                <h5 className="fw-bold mb-2">Secure Platform</h5>
                <p className="text-muted small mb-0">Enterprise-grade security for all examinations</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="col-md-6 col-lg-3">
              <div className="dashboard-card questions fade-in stagger-3 text-center">
                <div style={{
                  width: '70px',
                  height: '70px',
                  background: 'linear-gradient(135deg, #F2994A 0%, #F2C94C 100%)',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                  boxShadow: '0 10px 30px rgba(242, 201, 76, 0.3)'
                }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                </div>
                <h5 className="fw-bold mb-2">Instant Results</h5>
                <p className="text-muted small mb-0">Get your scores immediately after submission</p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="col-md-6 col-lg-3">
              <div className="dashboard-card results fade-in stagger-4 text-center">
                <div style={{
                  width: '70px',
                  height: '70px',
                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                  boxShadow: '0 10px 30px rgba(79, 172, 254, 0.3)'
                }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                    <line x1="8" y1="21" x2="16" y2="21"/>
                    <line x1="12" y1="17" x2="12" y2="21"/>
                  </svg>
                </div>
                <h5 className="fw-bold mb-2">Any Device</h5>
                <p className="text-muted small mb-0">Access from desktop, tablet, or mobile</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section style={{ 
        padding: '4rem 0', 
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        color: 'white'
      }}>
        <div className="container">
          <div className="row text-center g-4">
            <div className="col-6 col-md-3">
              <h2 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '0.5rem' }}>10K+</h2>
              <p style={{ opacity: '0.7', marginBottom: '0' }}>Students Certified</p>
            </div>
            <div className="col-6 col-md-3">
              <h2 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '0.5rem' }}>500+</h2>
              <p style={{ opacity: '0.7', marginBottom: '0' }}>Exams Conducted</p>
            </div>
            <div className="col-6 col-md-3">
              <h2 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '0.5rem' }}>98%</h2>
              <p style={{ opacity: '0.7', marginBottom: '0' }}>Satisfaction Rate</p>
            </div>
            <div className="col-6 col-md-3">
              <h2 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '0.5rem' }}>24/7</h2>
              <p style={{ opacity: '0.7', marginBottom: '0' }}>Support Available</p>
            </div>
          </div>
        </div>
      </section>

      {/* Login Cards Section */}
      <section style={{ padding: '5rem 0', background: 'var(--light-bg)' }}>
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="page-title" style={{ fontSize: '2.25rem' }}>Get Started Now</h2>
            <p className="page-subtitle">Choose your login type to continue</p>
          </div>

          <div className="row justify-content-center g-4">
            {/* Student Login Card */}
            <div className="col-md-6 col-lg-5">
              <div className="login-card student card-hover-lift">
                <div className="card-body text-center p-5">
                  <div className="login-card-icon">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                      <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                    </svg>
                  </div>
                  <h4 className="fw-bold mb-3" style={{ color: 'var(--light-text)' }}>Student Portal</h4>
                  <p className="text-muted mb-4">
                    Access your exams, view results, and manage your profile using your enrollment number.
                  </p>
                  <Link href="/student/login" className="btn-premium btn-premium-success w-100">
                    Login as Student
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"/>
                      <polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </Link>
                </div>
              </div>
            </div>

            {/* Admin Login Card */}
            <div className="col-md-6 col-lg-5">
              <div className="login-card admin card-hover-lift">
                <div className="card-body text-center p-5">
                  <div className="login-card-icon">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                  <h4 className="fw-bold mb-3" style={{ color: 'var(--light-text)' }}>Admin Portal</h4>
                  <p className="text-muted mb-4">
                    Manage students, create exams, add questions, and monitor results with full control.
                  </p>
                  <Link href="/admin/login" className="btn-premium btn-premium-primary w-100">
                    Login as Admin
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"/>
                      <polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
