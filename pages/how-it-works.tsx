import Head from 'next/head'

export default function HowItWorks() {
  return (
    <>
      <Head>
        <title>How It Works - CCC Exam Portal</title>
        <meta name="description" content="Learn how the CCC Exam Portal works and understand the examination process." />
      </Head>

      <div className="min-vh-100 bg-gradient-primary">
        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-lg-10">
              {/* Header */}
              <div className="text-center mb-5">
                <h1 className="display-4 text-white mb-4">
                  How It Works
                </h1>
                <p className="lead text-white-50">
                  Understanding the CCC examination process step by step
                </p>
              </div>

              {/* How It Works Content */}
              <div className="card glass-card border-0 shadow-lg mb-5">
                <div className="card-body p-5">
                  
                  {/* For Students */}
                  <div className="mb-5">
                    <h2 className="h3 text-primary mb-4">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-2">
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                        <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                      </svg>
                      For Students
                    </h2>

                    <div className="row g-4">
                      <div className="col-md-6">
                        <div className="step-card h-100">
                          <div className="step-number">1</div>
                          <h4>Registration</h4>
                          <p>Register with Infonix Computers and get your login credentials from the center.</p>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="step-card h-100">
                          <div className="step-number">2</div>
                          <h4>Login</h4>
                          <p>Access the portal using your credentials and review your profile information.</p>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="step-card h-100">
                          <div className="step-number">3</div>
                          <h4>Take Exam</h4>
                          <p>When assigned, read instructions carefully and take your examination online.</p>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="step-card h-100">
                          <div className="step-number">4</div>
                          <h4>View Results</h4>
                          <p>Check your results and download certificates once processing is complete.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <hr className="my-5" />

                  {/* For Administrators */}
                  <div className="mb-5">
                    <h2 className="h3 text-success mb-4">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-2">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                      For Center Administrators
                    </h2>

                    <div className="row g-4">
                      <div className="col-md-6">
                        <div className="step-card h-100">
                          <div className="step-number">1</div>
                          <h4>Manage Students</h4>
                          <p>Add student profiles, manage registrations, and maintain student records.</p>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="step-card h-100">
                          <div className="step-number">2</div>
                          <h4>Create Exams</h4>
                          <p>Set up examinations, configure questions, and schedule exam sessions.</p>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="step-card h-100">
                          <div className="step-number">3</div>
                          <h4>Monitor Progress</h4>
                          <p>Track student progress, monitor exam attempts, and review performance.</p>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="step-card h-100">
                          <div className="step-number">4</div>
                          <h4>Generate Reports</h4>
                          <p>Create detailed reports, export results, and manage certifications.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <hr className="my-5" />

                  {/* System Features */}
                  <div>
                    <h2 className="h3 text-info mb-4">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-2">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                        <line x1="8" y1="21" x2="16" y2="21"/>
                        <line x1="12" y1="17" x2="12" y2="21"/>
                      </svg>
                      Key Features
                    </h2>

                    <div className="row g-4">
                      <div className="col-md-4">
                        <div className="feature-card text-center">
                          <div className="feature-icon">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M9 12l2 2 4-4"/>
                              <path d="M21 12c.552 0 1-.448 1-1V5c0-.552-.448-1-1-1H3c-.552 0-1 .448-1 1v6c0 .552.448 1 1 1h9l4 4z"/>
                            </svg>
                          </div>
                          <h5>Secure Testing</h5>
                          <p className="small text-muted">Secure online examination environment with anti-cheating measures.</p>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="feature-card text-center">
                          <div className="feature-icon">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"/>
                              <polyline points="12,6 12,12 16,14"/>
                            </svg>
                          </div>
                          <h5>Real-time Results</h5>
                          <p className="small text-muted">Instant result processing and immediate feedback after exam completion.</p>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="feature-card text-center">
                          <div className="feature-icon">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                              <polyline points="14,2 14,8 20,8"/>
                              <line x1="16" y1="13" x2="8" y2="13"/>
                              <line x1="16" y1="17" x2="8" y2="17"/>
                            </svg>
                          </div>
                          <h5>Detailed Analytics</h5>
                          <p className="small text-muted">Comprehensive reporting and analytics for performance tracking.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Contact CTA */}
              <div className="card glass-card border-0 shadow-lg">
                <div className="card-body p-4 text-center">
                  <h3 className="h4 mb-3">Need Help?</h3>
                  <p className="text-muted mb-4">
                    Contact Infonix Computers for assistance with the examination process
                  </p>
                  <div className="d-flex justify-content-center gap-3">
                    <a href="tel:02672243397" className="btn btn-outline-primary">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-1">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                      </svg>
                      Call Us
                    </a>
                    <a href="mailto:infonixcomputers@gmail.com" className="btn btn-primary">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-1">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                      </svg>
                      Email Us
                    </a>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .step-card {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-radius: 16px;
          padding: 2rem;
          position: relative;
          transition: all 0.3s ease;
        }

        .step-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }

        .step-number {
          position: absolute;
          top: -15px;
          left: -15px;
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 1.2rem;
        }

        .step-card h4 {
          color: #495057;
          margin-bottom: 1rem;
          font-weight: 600;
        }

        .step-card p {
          color: #6c757d;
          margin: 0;
          line-height: 1.6;
        }

        .feature-card {
          padding: 1.5rem;
        }

        .feature-icon {
          color: #667eea;
          margin-bottom: 1rem;
        }

        .feature-card h5 {
          color: #495057;
          margin-bottom: 0.5rem;
          font-weight: 600;
        }
      `}</style>
    </>
  )
}