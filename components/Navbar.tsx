import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { clearSession, getSession } from '../lib/session'
import { legacyClient } from '../lib/legacyClient'

export default function Navbar() {
  const router = useRouter()
  const [user, setUser] = useState<{ email?: string; enrollmentNo?: string } | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAdminDropdown, setShowAdminDropdown] = useState(false)
  const [showStudentDropdown, setShowStudentDropdown] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  useEffect(() => {
    const session = getSession()
    if (session) {
      setUser({ email: session.email, enrollmentNo: session.enrollmentNo })
      setRole(session.role)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (role !== 'student' || !user?.email) return

    const fetchEnrollment = async () => {
      try {
        const { data } = await legacyClient
          .from('students')
          .select('enrollment_no')
          .eq('email', user.email)
          .maybeSingle()
        
        if (data?.enrollment_no) {
          setUser(prev => prev ? { ...prev, enrollmentNo: data.enrollment_no } : null)
        }
      } catch (error) {
        console.error('Failed to fetch enrollment number', error)
      }
    }

    fetchEnrollment()
  }, [role, user?.email])

  const handleLogout = async () => {
    clearSession()
    setUser(null)
    setRole(null)
    router.push('/login')
  }

  const isActive = (path: string) => router.pathname === path || router.pathname.startsWith(path + '/')

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.dropdown-container')) {
        setShowAdminDropdown(false)
        setShowStudentDropdown(false)
      }
    }
    
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  return (
    <nav className="premium-navbar">
      <div className="container">
        <div className="d-flex justify-content-between align-items-center">
          {/* Brand */}
          <Link href="/" className="navbar-brand-premium">
            <div className="brand-logo">
              <span style={{ fontSize: '1.2rem', fontWeight: '800' }}>I</span>
            </div>
            <span>Infonix Computers</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="d-none d-lg-flex align-items-center gap-4">
            {!loading && role === 'admin' && (
              <div className="dropdown-container" onClick={(e) => e.stopPropagation()}>
                <button
                  className={`dropdown-trigger ${showAdminDropdown || isActive('/admin') ? 'active' : ''}`}
                  onClick={() => setShowAdminDropdown(!showAdminDropdown)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                  </svg>
                  Admin Panel
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`dropdown-arrow ${showAdminDropdown ? 'rotated' : ''}`}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                
                {showAdminDropdown && (
                  <div className="dropdown-menu">
                    <Link href="/admin/dashboard" className={`dropdown-item ${isActive('/admin/dashboard') ? 'active' : ''}`}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="7" height="9" rx="1"/>
                        <rect x="14" y="3" width="7" height="5" rx="1"/>
                        <rect x="14" y="12" width="7" height="9" rx="1"/>
                        <rect x="3" y="16" width="7" height="5" rx="1"/>
                      </svg>
                      Dashboard
                    </Link>
                    <Link href="/admin/students" className={`dropdown-item ${isActive('/admin/students') ? 'active' : ''}`}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                      </svg>
                      Students
                    </Link>
                    <Link href="/admin/exams" className={`dropdown-item ${isActive('/admin/exams') ? 'active' : ''}`}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                      </svg>
                      Exams & Questions
                    </Link>
                    <div className="dropdown-divider"></div>
                    <Link href="/admin/certificates" className={`dropdown-item ${isActive('/admin/certificates') ? 'active' : ''}`}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                      </svg>
                      Manage Certificates
                    </Link>
                    <Link href="/admin/issue-certificate" className={`dropdown-item ${isActive('/admin/issue-certificate') ? 'active' : ''}`}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <path d="M12 8v8"/>
                        <path d="M8 12h8"/>
                      </svg>
                      Issue Certificate
                    </Link>
                  </div>
                )}
              </div>
            )}

            {!loading && role === 'student' && (
              <div className="dropdown-container" onClick={(e) => e.stopPropagation()}>
                <button
                  className={`dropdown-trigger ${showStudentDropdown || isActive('/student') ? 'active' : ''}`}
                  onClick={() => setShowStudentDropdown(!showStudentDropdown)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  Student Portal
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`dropdown-arrow ${showStudentDropdown ? 'rotated' : ''}`}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                
                {showStudentDropdown && (
                  <div className="dropdown-menu">
                    <Link href="/student/dashboard" className={`dropdown-item ${isActive('/student/dashboard') ? 'active' : ''}`}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="7" height="9" rx="1"/>
                        <rect x="14" y="3" width="7" height="5" rx="1"/>
                        <rect x="14" y="12" width="7" height="9" rx="1"/>
                        <rect x="3" y="16" width="7" height="5" rx="1"/>
                      </svg>
                      Dashboard
                    </Link>
                    <Link href="/student/exams" className={`dropdown-item ${isActive('/student/exams') ? 'active' : ''}`}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                      </svg>
                      My Exams
                    </Link>
                    <Link href="/student/results" className={`dropdown-item ${isActive('/student/results') ? 'active' : ''}`}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="20" x2="18" y2="10"/>
                        <line x1="12" y1="20" x2="12" y2="4"/>
                        <line x1="6" y1="20" x2="6" y2="14"/>
                      </svg>
                      Results
                    </Link>
                    <div className="dropdown-divider"></div>
                    <Link href="/student/profile" className={`dropdown-item ${isActive('/student/profile') ? 'active' : ''}`}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                      My Profile
                    </Link>
                  </div>
                )}
              </div>
            )}
            
            {/* Public Links */}
            <Link 
              href="/mock-exam" 
              className={`nav-link-clean ${isActive('/mock-exam') ? 'active' : ''}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
              Mock Exam
            </Link>

            <Link 
              href="/verify-certificate" 
              className={`nav-link-clean ${isActive('/verify-certificate') ? 'active' : ''}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
              </svg>
              Verify Certificate
            </Link>

            <Link 
              href="/about" 
              className={`nav-link-clean ${isActive('/about') ? 'active' : ''}`}
            >
              About
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="mobile-menu-btn d-lg-none"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {showMobileMenu ? (
                <path d="M18 6L6 18M6 6l12 12"/>
              ) : (
                <path d="M3 12h18M3 6h18M3 18h18"/>
              )}
            </svg>
          </button>

          {/* User Section */}
          <div className="d-none d-lg-flex align-items-center gap-3">
            {!loading && user ? (
              <>
                <div className="user-badge">
                  <div className="user-avatar">
                    {user.email?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <span className="user-name">
                    {role === 'student' && user.enrollmentNo ? user.enrollmentNo : user.email?.split('@')[0]}
                  </span>
                </div>
                <button className="btn-logout" onClick={handleLogout}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  Logout
                </button>
              </>
            ) : (
              !loading && (
                <Link href="/login" className="btn-login">
                  Get Started
                </Link>
              )
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="mobile-menu d-lg-none">
            {!loading && role === 'admin' && (
              <div className="mobile-section">
                <h6>Admin Panel</h6>
                <Link href="/admin/dashboard" className={`mobile-link ${isActive('/admin/dashboard') ? 'active' : ''}`}>Dashboard</Link>
                <Link href="/admin/students" className={`mobile-link ${isActive('/admin/students') ? 'active' : ''}`}>Students</Link>
                <Link href="/admin/exams" className={`mobile-link ${isActive('/admin/exams') ? 'active' : ''}`}>Exams</Link>
                <Link href="/admin/certificates" className={`mobile-link ${isActive('/admin/certificates') ? 'active' : ''}`}>Certificates</Link>
                <Link href="/admin/issue-certificate" className={`mobile-link ${isActive('/admin/issue-certificate') ? 'active' : ''}`}>Issue Certificate</Link>
              </div>
            )}

            {!loading && role === 'student' && (
              <div className="mobile-section">
                <h6>Student Portal</h6>
                <Link href="/student/dashboard" className={`mobile-link ${isActive('/student/dashboard') ? 'active' : ''}`}>Dashboard</Link>
                <Link href="/student/exams" className={`mobile-link ${isActive('/student/exams') ? 'active' : ''}`}>My Exams</Link>
                <Link href="/student/results" className={`mobile-link ${isActive('/student/results') ? 'active' : ''}`}>Results</Link>
                <Link href="/student/profile" className={`mobile-link ${isActive('/student/profile') ? 'active' : ''}`}>Profile</Link>
              </div>
            )}

            <div className="mobile-section">
              <h6>Public</h6>
              <Link href="/verify-certificate" className={`mobile-link ${isActive('/verify-certificate') ? 'active' : ''}`}>Verify Certificate</Link>
              <Link href="/mock-exam" className={`mobile-link ${isActive('/mock-exam') ? 'active' : ''}`}>Mock Exam</Link>
              <Link href="/about" className={`mobile-link ${isActive('/about') ? 'active' : ''}`}>About</Link>
            </div>

            {!loading && user && (
              <div className="mobile-section">
                <div className="mobile-user">
                  <div className="user-avatar">
                    {user.email?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <span>{role === 'student' && user.enrollmentNo ? user.enrollmentNo : user.email?.split('@')[0]}</span>
                </div>
                <button className="mobile-logout" onClick={handleLogout}>Logout</button>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .premium-navbar {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          position: sticky;
          top: 0;
          z-index: 1000;
          padding: 1rem 0;
        }

        .navbar-brand-premium {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 1.5rem;
          font-weight: 700;
          color: #2c3e50;
          text-decoration: none;
          transition: all 0.3s ease;
        }

        .navbar-brand-premium:hover {
          color: #3498db;
          transform: translateY(-1px);
        }

        .brand-logo {
          padding: 0.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .dropdown-container {
          position: relative;
          display: inline-block;
        }

        .dropdown-trigger {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: transparent;
          border: none;
          padding: 0.75rem 1rem;
          border-radius: 12px;
          color: #64748b;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .dropdown-trigger:hover,
        .dropdown-trigger.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
        }

        .dropdown-arrow {
          transition: transform 0.3s ease;
        }

        .dropdown-arrow.rotated {
          transform: rotate(180deg);
        }

        .dropdown-menu {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          min-width: 220px;
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
          padding: 0.5rem;
          animation: dropdownSlide 0.3s ease;
          z-index: 9999;
          display: block;
        }

        @keyframes dropdownSlide {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          color: #64748b;
          text-decoration: none;
          border-radius: 12px;
          transition: all 0.3s ease;
          font-weight: 500;
        }

        .dropdown-item:hover {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          transform: translateX(4px);
        }

        .dropdown-item.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .dropdown-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
          margin: 0.5rem 0;
        }

        .nav-link-clean {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          color: #64748b;
          text-decoration: none;
          border-radius: 12px;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .nav-link-clean:hover,
        .nav-link-clean.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
        }

        .user-badge {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem 1rem;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border-radius: 20px;
          border: 1px solid #e2e8f0;
        }

        .user-avatar {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .user-name {
          color: #475569;
          font-weight: 500;
        }

        .btn-logout {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #ef4444;
          color: white;
          border: none;
          padding: 0.75rem 1rem;
          border-radius: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-logout:hover {
          background: #dc2626;
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(239, 68, 68, 0.4);
        }

        .btn-login {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-decoration: none;
          padding: 0.75rem 1.5rem;
          border-radius: 12px;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .btn-login:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
          color: white;
        }

        .mobile-menu-btn {
          background: transparent;
          border: none;
          color: #64748b;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 8px;
          transition: all 0.3s ease;
        }

        .mobile-menu-btn:hover {
          background: #f1f5f9;
          color: #475569;
        }

        .mobile-menu {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(20px);
          border-top: 1px solid #e2e8f0;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          padding: 1.5rem;
          animation: mobileSlide 0.3s ease;
        }

        @keyframes mobileSlide {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .mobile-section {
          margin-bottom: 2rem;
        }

        .mobile-section h6 {
          color: #475569;
          font-weight: 600;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .mobile-link {
          display: block;
          padding: 0.75rem 0;
          color: #64748b;
          text-decoration: none;
          font-weight: 500;
          transition: all 0.3s ease;
          border-left: 3px solid transparent;
          padding-left: 1rem;
        }

        .mobile-link:hover,
        .mobile-link.active {
          color: #667eea;
          border-left-color: #667eea;
          background: #f8fafc;
          padding-left: 1.5rem;
        }

        .mobile-user {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 0;
          border-bottom: 1px solid #e2e8f0;
          margin-bottom: 1rem;
        }

        .mobile-logout {
          width: 100%;
          background: #ef4444;
          color: white;
          border: none;
          padding: 0.75rem;
          border-radius: 12px;
          font-weight: 500;
          cursor: pointer;
        }

        @media (max-width: 991.98px) {
          .user-name {
            display: none;
          }
        }
      `}</style>
    </nav>
  )
}
