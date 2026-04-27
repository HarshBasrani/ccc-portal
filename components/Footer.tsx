import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="premium-footer">
      <div className="container">
        <div className="row gy-4">
          {/* Brand Section */}
          <div className="col-lg-4">
            <div className="footer-brand mb-3">
              <div className="d-flex align-items-center gap-2 mb-3">
                <div className="brand-logo">
                  <span style={{ fontSize: '1.5rem', fontWeight: '800', color: 'white' }}>I</span>
                </div>
                <span className="h5 mb-0">Infonix Computers</span>
              </div>
              <p className="text-light-secondary mb-0">
                Providing quality computer education and certification programs to help students excel in their careers.
              </p>
            </div>
          </div>

          {/* Help & Support */}
          <div className="col-lg-2 col-md-4">
            <h6 className="footer-heading mb-3">HELP & SUPPORT</h6>
            <ul className="footer-links">
              <li><Link href="/about">About Us</Link></li>
              <li><Link href="/how-it-works">How It Works</Link></li>
              <li><Link href="/center-terms">Center Terms And Conditions</Link></li>
              <li><Link href="/student-terms">Student Terms And Conditions</Link></li>
              <li><Link href="/privacy-policy">Privacy & Policy</Link></li>
              <li><Link href="/faq">FAQ</Link></li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="col-lg-2 col-md-4">
            <h6 className="footer-heading mb-3">QUICK LINKS</h6>
            <ul className="footer-links">
              <li><Link href="/verify-certificate">Verify Certificate</Link></li>
              <li><Link href="/login">Student Login</Link></li>
              <li><Link href="/admin/login">Admin Login</Link></li>
              <li><Link href="/student/exams">Exams</Link></li>
              <li><Link href="/student/results">Results</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="col-lg-4 col-md-4">
            <h6 className="footer-heading mb-3">GET IN TOUCH</h6>
            <div className="contact-info">
              <div className="contact-item mb-3">
                <div className="d-flex align-items-start gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-1 text-primary">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  <div className="contact-text">
                    <strong>Address:</strong><br />
                    Infonix Computers,<br />
                    2nd Floor, Satguru Complex,<br />
                    Opp. Jain Society Godhra-389001<br />
                    Gujarat INDIA
                  </div>
                </div>
              </div>

              <div className="contact-item mb-3">
                <div className="d-flex align-items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  <div className="contact-text">
                    <strong>Tel:</strong> (02672) 243397, 253397
                  </div>
                </div>
              </div>

              <div className="contact-item mb-3">
                <div className="d-flex align-items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  <div className="contact-text">
                    <strong>Phone:</strong> 9377226363, 9429451524
                  </div>
                </div>
              </div>

              <div className="contact-item">
                <div className="d-flex align-items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  <div className="contact-text">
                    <strong>Email:</strong> 
                    <a href="mailto:infonixcomputers@gmail.com" className="text-primary ms-1">
                      infonixcomputers@gmail.com
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <div className="row align-items-center">
            <div className="col-md-6">
              <div className="footer-copyright">
                 {new Date().getFullYear()} Infonix Computers. All rights reserved.
              </div>
            </div>
            <div className="col-md-6 text-md-end">
              <div className="footer-brand">
                <span style={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>Infonix</span> CCC Portal
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}