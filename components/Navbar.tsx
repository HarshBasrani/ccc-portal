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
  const [showMenu, setShowMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.universal-dropdown-container')) {
        setShowMenu(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  return (
    <nav className={`universal-navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="container">
        <div className="navbar-inner">
          
          {/* Brand Logo */}
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div className="brand-logo-container">
              <div className="brand-icon">
                <span className="brand-letter">I</span>
              </div>
              <span className="brand-text">Infonix Portal</span>
            </div>
          </Link>

          {/* Desktop Links */}
          <div className="desktop-nav d-none d-lg-flex">
            
            {/* Unified Portal Menu for everyone */}
            <div className="universal-dropdown-container" onClick={(e) => e.stopPropagation()}>
              <button 
                className={`portal-menu-btn ${showMenu ? 'active' : ''}`}
                onClick={() => setShowMenu(!showMenu)}
              >
                <span className="menu-text">Portal Menu</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`arrow-icon ${showMenu ? 'open' : ''}`}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              {showMenu && (
                <div className="universal-dropdown-menu">
                  <div className="menu-group">
                    <div className="menu-label">Admin Area</div>
                    <Link href="/admin/dashboard" className={`menu-item ${isActive('/admin/dashboard') ? 'active' : ''}`}>
                      Dashboard
                    </Link>
                    <Link href="/admin/students" className={`menu-item ${isActive('/admin/students') ? 'active' : ''}`}>
                      Manage Students
                    </Link>
                    <Link href="/admin/exams" className={`menu-item ${isActive('/admin/exams') ? 'active' : ''}`}>
                      Exams & Questions
                    </Link>
                    <Link href="/admin/certificates" className={`menu-item ${isActive('/admin/certificates') ? 'active' : ''}`}>
                      Certificates
                    </Link>
                  </div>
                  
                  <div className="menu-divider"></div>
                  
                  <div className="menu-group">
                    <div className="menu-label">Student Area</div>
                    <Link href="/student/dashboard" className={`menu-item ${isActive('/student/dashboard') ? 'active' : ''}`}>
                      Student Dashboard
                    </Link>
                    <Link href="/student/exams" className={`menu-item ${isActive('/student/exams') ? 'active' : ''}`}>
                      My Exams
                    </Link>
                    <Link href="/student/results" className={`menu-item ${isActive('/student/results') ? 'active' : ''}`}>
                      My Results
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className="nav-divider"></div>

            <Link href="/mock-exam" className={`nav-pill ${isActive('/mock-exam') ? 'active' : ''}`}>
              Mock Exam
            </Link>
            <Link href="/verify-certificate" className={`nav-pill ${isActive('/verify-certificate') ? 'active' : ''}`}>
              Verify Certificate
            </Link>
            <Link href="/about" className={`nav-pill ${isActive('/about') ? 'active' : ''}`}>
              About
            </Link>
          </div>

          {/* User & Actions */}
          <div className="actions-container d-none d-lg-flex">
            {!loading && user ? (
              <div className="user-profile-wrapper">
                <div className="user-info">
                  <div className="avatar-circle">
                    {user.email?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <span className="user-identifier">
                    {role === 'student' && user.enrollmentNo ? user.enrollmentNo : user.email?.split('@')[0]}
                  </span>
                </div>
                <button className="action-btn logout-btn" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            ) : (
              !loading && (
                <Link href="/login" className="action-btn login-btn">
                  Get Started
                </Link>
              )
            )}
          </div>

          {/* Mobile Toggle */}
          <button className="mobile-toggle d-lg-none" onClick={() => setShowMobileMenu(!showMobileMenu)}>
            <div className={`hamburger ${showMobileMenu ? 'open' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </button>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="mobile-nav-menu d-lg-none">
            <div className="mobile-nav-inner">
              <div className="mobile-group">
                <div className="mobile-label">Portal Access</div>
                <Link href="/admin/dashboard" className="mobile-item">Admin Dashboard</Link>
                <Link href="/student/dashboard" className="mobile-item">Student Dashboard</Link>
                <Link href="/mock-exam" className="mobile-item">Mock Exam</Link>
                <Link href="/verify-certificate" className="mobile-item">Verify Certificate</Link>
              </div>
              
              {!loading && user ? (
                <div className="mobile-user-section">
                  <div className="mobile-user-info">
                    <div className="avatar-circle">{user.email?.charAt(0)?.toUpperCase()}</div>
                    <span>{user.email}</span>
                  </div>
                  <button className="mobile-logout-btn" onClick={handleLogout}>Logout</button>
                </div>
              ) : (
                <Link href="/login" className="mobile-login-btn">Get Started</Link>
              )}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .universal-navbar {
          position: sticky;
          top: 0;
          z-index: 1000;
          padding: 1.2rem 0;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .universal-navbar.scrolled {
          padding: 0.8rem 0;
          background: rgba(255, 255, 255, 0.95);
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05);
        }

        .navbar-inner {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .brand-logo-container {
          display: flex;
          align-items: center;
          gap: 1rem;
          text-decoration: none;
          group: hover;
        }

        .brand-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: linear-gradient(135deg, #00C6FF 0%, #0072FF 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 15px rgba(0, 114, 255, 0.3);
          transition: transform 0.3s ease;
        }

        .brand-logo-container:hover .brand-icon {
          transform: scale(1.05) rotate(5deg);
        }

        .brand-letter {
          color: white;
          font-weight: 800;
          font-size: 1.4rem;
        }

        .brand-text {
          font-size: 1.4rem;
          font-weight: 800;
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          letter-spacing: -0.5px;
        }

        .desktop-nav {
          display: flex;
          align-items: center;
          gap: 1rem;
          background: rgba(241, 245, 249, 0.6);
          padding: 0.4rem;
          border-radius: 100px;
          border: 1px solid rgba(255, 255, 255, 0.5);
        }

        .nav-divider {
          width: 1px;
          height: 24px;
          background: rgba(0, 0, 0, 0.1);
          margin: 0 0.5rem;
        }

        .portal-menu-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.6rem 1.2rem;
          border-radius: 100px;
          border: none;
          background: transparent;
          color: #334155;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .portal-menu-btn:hover, .portal-menu-btn.active {
          background: white;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
          color: #0072FF;
        }

        .arrow-icon {
          transition: transform 0.3s ease;
        }
        .arrow-icon.open {
          transform: rotate(180deg);
        }

        .universal-dropdown-container {
          position: relative;
        }

        .universal-dropdown-menu {
          position: absolute;
          top: calc(100% + 15px);
          left: 0;
          width: 280px;
          background: white;
          border-radius: 20px;
          padding: 1.5rem;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(0, 0, 0, 0.05);
          animation: fadeSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(15px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .menu-group {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }

        .menu-label {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #94a3b8;
          font-weight: 700;
          margin-bottom: 0.5rem;
          padding-left: 0.8rem;
        }

        .menu-item {
          text-decoration: none;
          color: #475569;
          font-weight: 500;
          padding: 0.6rem 0.8rem;
          border-radius: 10px;
          transition: all 0.2s ease;
        }

        .menu-item:hover, .menu-item.active {
          background: #f1f5f9;
          color: #0072FF;
          transform: translateX(4px);
        }

        .menu-divider {
          height: 1px;
          background: #f1f5f9;
          margin: 1rem 0;
        }

        .nav-pill {
          text-decoration: none;
          color: #64748b;
          font-weight: 600;
          padding: 0.6rem 1.2rem;
          border-radius: 100px;
          transition: all 0.3s ease;
        }

        .nav-pill:hover, .nav-pill.active {
          background: white;
          color: #0072FF;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
        }

        .actions-container {
          display: flex;
          align-items: center;
        }

        .user-profile-wrapper {
          display: flex;
          align-items: center;
          gap: 1rem;
          background: white;
          padding: 0.4rem;
          padding-right: 1rem;
          border-radius: 100px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
          border: 1px solid rgba(0, 0, 0, 0.02);
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 0.8rem;
        }

        .avatar-circle {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
        }

        .user-identifier {
          font-weight: 600;
          color: #334155;
          max-width: 120px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .action-btn {
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 100px;
          font-weight: 600;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.3s ease;
        }

        .logout-btn {
          background: #fee2e2;
          color: #ef4444;
        }

        .logout-btn:hover {
          background: #fecaca;
          transform: translateY(-2px);
        }

        .login-btn {
          background: linear-gradient(135deg, #00C6FF 0%, #0072FF 100%);
          color: white;
          padding: 0.8rem 1.8rem;
          box-shadow: 0 4px 15px rgba(0, 114, 255, 0.3);
        }

        .login-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 114, 255, 0.4);
        }

        .mobile-toggle {
          background: transparent;
          border: none;
          padding: 0.5rem;
          cursor: pointer;
        }

        .hamburger {
          width: 24px;
          height: 20px;
          position: relative;
        }

        .hamburger span {
          display: block;
          position: absolute;
          height: 2px;
          width: 100%;
          background: #334155;
          border-radius: 2px;
          transition: all 0.3s ease;
        }

        .hamburger span:nth-child(1) { top: 0; }
        .hamburger span:nth-child(2) { top: 9px; }
        .hamburger span:nth-child(3) { top: 18px; }

        .hamburger.open span:nth-child(1) {
          top: 9px;
          transform: rotate(45deg);
        }
        .hamburger.open span:nth-child(2) {
          opacity: 0;
        }
        .hamburger.open span:nth-child(3) {
          top: 9px;
          transform: rotate(-45deg);
        }

        .mobile-nav-menu {
          position: absolute;
          top: 100%;
          left: 0;
          width: 100%;
          background: white;
          padding: 1.5rem;
          border-top: 1px solid rgba(0,0,0,0.05);
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          animation: slideDown 0.3s ease;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .mobile-group {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .mobile-label {
          font-size: 0.8rem;
          text-transform: uppercase;
          color: #94a3b8;
          font-weight: 700;
          letter-spacing: 1px;
        }

        .mobile-item {
          text-decoration: none;
          color: #334155;
          font-weight: 600;
          font-size: 1.1rem;
        }

        .mobile-user-section {
          padding-top: 1.5rem;
          border-top: 1px solid #f1f5f9;
        }

        .mobile-user-info {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
          font-weight: 600;
          color: #334155;
        }

        .mobile-logout-btn, .mobile-login-btn {
          display: block;
          width: 100%;
          padding: 1rem;
          border-radius: 12px;
          border: none;
          font-weight: 600;
          text-align: center;
          text-decoration: none;
        }

        .mobile-logout-btn {
          background: #fee2e2;
          color: #ef4444;
        }

        .mobile-login-btn {
          background: linear-gradient(135deg, #00C6FF 0%, #0072FF 100%);
          color: white;
        }
      `}</style>
    </nav>
  )
}
