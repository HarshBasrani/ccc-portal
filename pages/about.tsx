// pages/about.tsx
import Head from 'next/head'

export default function About() {
  return (
    <>
      <Head>
        <title>About Us  CCC Exam Portal</title>
        <meta name="description" content="Learn about our institute, mission, and computer courses offered including CCC certification programs." />
      </Head>
      
      <div style={{ background: 'var(--light-bg)', minHeight: 'calc(100vh - 70px)', padding: '2rem 0' }}>
        <div className="container">
          {/* Page Header */}
          <div className="text-center mb-5 fade-in">
            <div style={{
              width: '100px',
              height: '100px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: '0 15px 35px rgba(102, 126, 234, 0.3)'
            }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <h1 className="page-title">About Our Institute</h1>
            <p className="page-subtitle">Empowering students with quality computer education and certification</p>
          </div>

          {/* Main Content */}
          <div className="row g-4 mb-5">
            {/* About Section */}
            <div className="col-lg-8">
              <div className="premium-card h-100 fade-in stagger-1">
                <div className="premium-card-header">
                  <h4 className="mb-0 d-flex align-items-center gap-2">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <circle cx="12" cy="12" r="6"/>
                      <circle cx="12" cy="12" r="2"/>
                    </svg>
                    About Excellence Computer Institute
                  </h4>
                </div>
                <div className="premium-card-body">
                  <div className="mb-4">
                    <p className="lead" style={{ color: 'var(--dark-text)', lineHeight: '1.8' }}>
                      Welcome to Excellence Computer Institute, a premier destination for quality computer education 
                      and professional certification programs. We are committed to providing comprehensive training 
                      that empowers individuals with the digital skills needed in today's technology-driven world.
                    </p>
                  </div>

                  <div className="row g-4 mb-4">
                    <div className="col-md-6">
                      <div className="d-flex gap-3">
                        <div style={{
                          width: '48px',
                          height: '48px',
                          background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                            <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                          </svg>
                        </div>
                        <div>
                          <h6 className="fw-bold mb-2" style={{ color: 'var(--dark-text)' }}>Established Excellence</h6>
                          <p className="text-muted small mb-0">
                            Founded with a vision to bridge the digital divide, we have been serving the community 
                            with quality computer education for over a decade.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="d-flex gap-3">
                        <div style={{
                          width: '48px',
                          height: '48px',
                          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                          </svg>
                        </div>
                        <div>
                          <h6 className="fw-bold mb-2" style={{ color: 'var(--dark-text)' }}>Expert Faculty</h6>
                          <p className="text-muted small mb-0">
                            Our team of experienced instructors brings real-world expertise and 
                            industry knowledge to provide hands-on, practical learning.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-light p-4 rounded-3">
                    <h6 className="fw-bold mb-3" style={{ color: 'var(--dark-text)' }}>What Sets Us Apart:</h6>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <ul className="list-unstyled">
                          <li className="d-flex align-items-start gap-2 mb-2">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#11998e" strokeWidth="2" className="mt-1" style={{flexShrink: 0}}>
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                            <span>Government-recognized certification programs</span>
                          </li>
                          <li className="d-flex align-items-start gap-2 mb-2">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#11998e" strokeWidth="2" className="mt-1" style={{flexShrink: 0}}>
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                            <span>Modern computer lab with latest software</span>
                          </li>
                          <li className="d-flex align-items-start gap-2">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#11998e" strokeWidth="2" className="mt-1" style={{flexShrink: 0}}>
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                            <span>Flexible timing and affordable fee structure</span>
                          </li>
                        </ul>
                      </div>
                      <div className="col-md-6">
                        <ul className="list-unstyled">
                          <li className="d-flex align-items-start gap-2 mb-2">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#11998e" strokeWidth="2" className="mt-1" style={{flexShrink: 0}}>
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                            <span>100% placement assistance</span>
                          </li>
                          <li className="d-flex align-items-start gap-2 mb-2">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#11998e" strokeWidth="2" className="mt-1" style={{flexShrink: 0}}>
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                            <span>Online exam system for convenience</span>
                          </li>
                          <li className="d-flex align-items-start gap-2">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#11998e" strokeWidth="2" className="mt-1" style={{flexShrink: 0}}>
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                            <span>Continuous support and guidance</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Info Sidebar */}
            <div className="col-lg-4">
              <div className="row g-4">
                {/* Mission & Vision */}
                <div className="col-12">
                  <div className="premium-card h-100 fade-in stagger-2">
                    <div className="premium-card-header">
                      <h6 className="mb-0 d-flex align-items-center gap-2">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                        Our Mission
                      </h6>
                    </div>
                    <div className="premium-card-body">
                      <p className="small mb-3" style={{ color: 'var(--text-muted)' }}>
                        To provide accessible, high-quality computer education that empowers individuals 
                        with essential digital literacy skills and professional certifications.
                      </p>
                      <h6 className="mb-2 d-flex align-items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F2994A" strokeWidth="2">
                          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                        </svg>
                        Our Vision
                      </h6>
                      <p className="small mb-0" style={{ color: 'var(--text-muted)' }}>
                        To be the leading institute for computer education, creating a digitally 
                        empowered community ready for the challenges of the modern world.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Courses Offered */}
                <div className="col-12">
                  <div className="premium-card fade-in stagger-3">
                    <div className="premium-card-header">
                      <h6 className="mb-0 d-flex align-items-center gap-2">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#11998e" strokeWidth="2">
                          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                          <line x1="8" y1="21" x2="16" y2="21"/>
                          <line x1="12" y1="17" x2="12" y2="21"/>
                        </svg>
                        Courses Offered
                      </h6>
                    </div>
                    <div className="premium-card-body">
                      <div className="d-flex align-items-center gap-3 p-3 rounded-3" style={{ background: 'linear-gradient(135deg, rgba(17, 153, 142, 0.1) 0%, rgba(56, 239, 125, 0.1) 100%)' }}>
                        <div style={{
                          width: '48px',
                          height: '48px',
                          background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                          </svg>
                        </div>
                        <div>
                          <h6 className="fw-bold mb-1" style={{ color: 'var(--dark-text)' }}>CCC Course</h6>
                          <p className="small text-muted mb-0">Course on Computer Concepts</p>
                          <span className="badge bg-success small mt-1">Available Now</span>
                        </div>
                      </div>
                      <div className="mt-3 p-3 border rounded-3">
                        <h6 className="small fw-bold mb-2" style={{ color: 'var(--dark-text)' }}>Coming Soon:</h6>
                        <ul className="list-unstyled small">
                          <li className="mb-1"> CCC+ (Advanced Computer Course)</li>
                          <li className="mb-1"> BCC (Basic Computer Course)</li>
                          <li> O-Level Certification</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="row g-4">
            {/* Contact Details */}
            <div className="col-lg-8">
              <div className="premium-card fade-in stagger-4">
                <div className="premium-card-header">
                  <h4 className="mb-0 d-flex align-items-center gap-2">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    Contact Information
                  </h4>
                </div>
                <div className="premium-card-body">
                  <div className="row g-4">
                    <div className="col-md-6">
                      <div className="d-flex align-items-start gap-3 mb-4">
                        <div style={{
                          width: '48px',
                          height: '48px',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                            <circle cx="12" cy="10" r="3"/>
                          </svg>
                        </div>
                        <div>
                          <h6 className="fw-bold mb-2" style={{ color: 'var(--dark-text)' }}>Institute Address</h6>
                          <address className="small text-muted mb-0" style={{ lineHeight: '1.6' }}>
                            Excellence Computer Institute<br/>
                            123 Knowledge Street, Tech Park<br/>
                            Digital City, State - 123456<br/>
                            Near Government School
                          </address>
                        </div>
                      </div>

                      <div className="d-flex align-items-start gap-3 mb-4">
                        <div style={{
                          width: '48px',
                          height: '48px',
                          background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                          </svg>
                        </div>
                        <div>
                          <h6 className="fw-bold mb-2" style={{ color: 'var(--dark-text)' }}>Phone Numbers</h6>
                          <div className="small text-muted">
                            <p className="mb-1">Office: +91 9876543210</p>
                            <p className="mb-1">Mobile: +91 8765432109</p>
                            <p className="mb-0">WhatsApp: +91 7654321098</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="d-flex align-items-start gap-3 mb-4">
                        <div style={{
                          width: '48px',
                          height: '48px',
                          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                            <polyline points="22 6 12 13 2 6"/>
                          </svg>
                        </div>
                        <div>
                          <h6 className="fw-bold mb-2" style={{ color: 'var(--dark-text)' }}>Email Contacts</h6>
                          <div className="small text-muted">
                            <p className="mb-1">info@excellencecomputer.edu</p>
                            <p className="mb-1">admissions@excellencecomputer.edu</p>
                            <p className="mb-0">support@excellencecomputer.edu</p>
                          </div>
                        </div>
                      </div>

                      <div className="d-flex align-items-start gap-3">
                        <div style={{
                          width: '48px',
                          height: '48px',
                          background: 'linear-gradient(135deg, #F2994A 0%, #F2C94C 100%)',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                          </svg>
                        </div>
                        <div>
                          <h6 className="fw-bold mb-2" style={{ color: 'var(--dark-text)' }}>Office Hours</h6>
                          <div className="small text-muted">
                            <p className="mb-1">Monday - Friday: 9:00 AM - 6:00 PM</p>
                            <p className="mb-1">Saturday: 9:00 AM - 4:00 PM</p>
                            <p className="mb-0">Sunday: Closed</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Map Placeholder */}
            <div className="col-lg-4">
              <div className="premium-card h-100 fade-in stagger-5">
                <div className="premium-card-header">
                  <h6 className="mb-0 d-flex align-items-center gap-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4facfe" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    Location
                  </h6>
                </div>
                <div className="premium-card-body">
                  {/* Embedded Google Map */}
                  <div style={{ 
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: '2px solid rgba(79, 172, 254, 0.2)'
                  }}>
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14714.85571301401!2d73.60338318715816!3d22.775995400000017!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39609a445ecb4ca5%3A0x25c620864fc61842!2sV.M.Patel%20Institute%20of%20I.T.!5e0!3m2!1sen!2sin!4v1764415800155!5m2!1sen!2sin"
                      width="100%"
                      height="250"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Infonix Computers Location - Near V.M.Patel Institute of I.T., Godhra"
                    ></iframe>
                  </div>
                  
                  <div className="mt-3 text-center">
                    <a 
                      href="https://goo.gl/maps/search/Infonix+Computers+Satguru+Complex+Godhra+Gujarat" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn-premium-outline btn-sm"
                      style={{ textDecoration: 'none' }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="me-1">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                      View on Google Maps
                    </a>
                  </div>
                  
                  <div className="mt-4">
                    <h6 className="small fw-bold mb-2" style={{ color: 'var(--dark-text)' }}>Nearby Landmarks:</h6>
                    <ul className="list-unstyled small text-muted">
                      <li className="mb-1"> Government School (50m)</li>
                      <li className="mb-1"> City Bus Stop (100m)</li>
                      <li className="mb-1"> Banking Complex (200m)</li>
                      <li> Shopping Center (300m)</li>
                    </ul>
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