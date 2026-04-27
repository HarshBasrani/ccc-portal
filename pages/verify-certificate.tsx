import { useState } from 'react'
import Head from 'next/head'
import { legacyClient } from '../lib/legacyClient'

interface VerificationResult {
  isValid: boolean
  certificate?: {
    si_number: string
    student_name: string
    enrollment_number: string
    course_name: string
    exam_name?: string
    grade?: string
    percentage?: number
    score?: number
    total_marks?: number
    issue_date: string
    issued_by: string
    remarks?: string
  }
  error?: string
}

export default function VerifyCertificate() {
  const [siNumber, setSiNumber] = useState('')
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)

  const handleVerify = async () => {
    if (!siNumber.trim()) {
      alert('Please enter a SI.No.')
      return
    }

    setIsVerifying(true)
    setResult(null)

    try {
      const { data: certificate, error } = await legacyClient
        .from('certificates')
        .select('*')
        .eq('si_number', siNumber.trim().toUpperCase())
        .eq('is_active', true)
        .eq('is_verified', true)
        .single()

      if (error || !certificate) {
        setResult({
          isValid: false,
          error: 'Certificate not found or invalid SI.No.'
        })
      } else {
        setResult({
          isValid: true,
          certificate: {
            si_number: certificate.si_number,
            student_name: certificate.student_name,
            enrollment_number: certificate.enrollment_number,
            course_name: certificate.course_name,
            exam_name: certificate.exam_name,
            grade: certificate.grade,
            percentage: certificate.percentage,
            score: certificate.score,
            total_marks: certificate.total_marks,
            issue_date: new Date(certificate.issue_date).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'long',
              year: 'numeric'
            }),
            issued_by: certificate.issued_by,
            remarks: certificate.remarks
          }
        })
      }
    } catch (error) {
      console.error('Verification error:', error)
      setResult({
        isValid: false,
        error: 'Failed to verify certificate. Please try again.'
      })
    }

    setIsVerifying(false)
  }

  const handleReset = () => {
    setSiNumber('')
    setResult(null)
  }

  return (
    <>
      <Head>
        <title>Certificate Verification | CCC Portal</title>
        <meta name="description" content="Verify the authenticity of CCC certificates issued by Infonix Computers" />
      </Head>

      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-8 col-lg-6">
              <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '20px',
                padding: '3rem',
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
                {/* Header */}
                <div className="text-center mb-4">
                  <div style={{
                    width: '80px',
                    height: '80px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.5rem',
                    boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)'
                  }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                    </svg>
                  </div>
                  <h1 style={{
                    fontSize: '2rem',
                    fontWeight: '700',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: '0.5rem'
                  }}>
                    Certificate Verification
                  </h1>
                  <p style={{ color: '#6c757d', fontSize: '1.1rem' }}>
                    Verify certificates using SI.No. issued by Infonix Computers
                  </p>
                </div>

                {/* Verification Form */}
                {!result && (
                  <div>
                    <div className="mb-4">
                      <label htmlFor="siNumber" style={{ 
                        fontWeight: '600', 
                        marginBottom: '0.75rem',
                        display: 'block',
                        color: '#495057'
                      }}>
                        SI.No. (Certificate Number)
                      </label>
                      <input
                        type="text"
                        id="siNumber"
                        className="form-control"
                        value={siNumber}
                        onChange={(e) => setSiNumber(e.target.value.toUpperCase())}
                        placeholder="Enter SI.No. (e.g., IC/06/2021/1/1055)"
                        style={{
                          padding: '1rem',
                          borderRadius: '12px',
                          border: '2px solid #e9ecef',
                          fontSize: '1.1rem',
                          fontFamily: 'monospace',
                          textAlign: 'center',
                          letterSpacing: '1px'
                        }}
                        onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
                      />
                      <small style={{ color: '#6c757d', marginTop: '0.5rem', display: 'block' }}>
                        SI.No. format: IC/MM/YYYY/C/NNNN (e.g., IC/06/2021/1/1055)
                      </small>
                    </div>

                    <button
                      onClick={handleVerify}
                      disabled={isVerifying || !siNumber.trim()}
                      style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '1rem 2rem',
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        width: '100%',
                        cursor: isVerifying || !siNumber.trim() ? 'not-allowed' : 'pointer',
                        opacity: isVerifying || !siNumber.trim() ? 0.7 : 1,
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      {isVerifying ? (
                        <>
                          <span className="spinner-border spinner-border-sm" role="status"></span>
                          Verifying...
                        </>
                      ) : (
                        <>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 12l2 2 4-4"/>
                            <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"/>
                            <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"/>
                            <path d="M13 12h3"/>
                            <path d="M8 12H5"/>
                          </svg>
                          Verify Certificate
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Verification Results */}
                {result && (
                  <div>
                    {result.isValid && result.certificate ? (
                      <div>
                        {/* Success Header */}
                        <div className="text-center mb-4">
                          <div style={{
                            width: '60px',
                            height: '60px',
                            background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1rem'
                          }}>
                            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          </div>
                          <h3 style={{ color: '#28a745', fontWeight: '700', marginBottom: '0.5rem' }}>
                             Certificate Verified
                          </h3>
                          <p style={{ color: '#6c757d' }}>
                            This certificate is authentic and valid
                          </p>
                        </div>

                        {/* Certificate Details */}
                        <div style={{
                          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                          borderRadius: '15px',
                          padding: '2rem',
                          marginBottom: '2rem'
                        }}>
                          <h4 style={{ marginBottom: '1.5rem', color: '#495057' }}>Certificate Details</h4>
                          
                          <div className="row">
                            <div className="col-md-6 mb-3">
                              <strong style={{ color: '#6c757d' }}>Student Name:</strong>
                              <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>{result.certificate.student_name}</div>
                            </div>
                            <div className="col-md-6 mb-3">
                              <strong style={{ color: '#6c757d' }}>Enrollment Number:</strong>
                              <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>{result.certificate.enrollment_number}</div>
                            </div>
                            <div className="col-md-12 mb-3">
                              <strong style={{ color: '#6c757d' }}>Course:</strong>
                              <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>{result.certificate.course_name}</div>
                            </div>
                            {result.certificate.exam_name && (
                              <div className="col-md-12 mb-3">
                                <strong style={{ color: '#6c757d' }}>Exam:</strong>
                                <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>{result.certificate.exam_name}</div>
                              </div>
                            )}
                            {result.certificate.grade && (
                              <div className="col-md-6 mb-3">
                                <strong style={{ color: '#6c757d' }}>Grade:</strong>
                                <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>
                                  <span style={{
                                    background: result.certificate.grade === 'S' ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' :
                                              result.certificate.grade === 'A' ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' :
                                              result.certificate.grade === 'B' ? 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' :
                                              result.certificate.grade === 'C' ? 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' :
                                              result.certificate.grade === 'D' ? 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' :
                                              'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
                                    color: 'white',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '25px',
                                    fontSize: '1rem',
                                    fontWeight: '700'
                                  }}>
                                    {result.certificate.grade}
                                  </span>
                                </div>
                              </div>
                            )}
                            {result.certificate.score && result.certificate.total_marks && (
                              <div className="col-md-6 mb-3">
                                <strong style={{ color: '#6c757d' }}>Score:</strong>
                                <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>
                                  {result.certificate.score}/{result.certificate.total_marks} 
                                  {result.certificate.percentage && ` (${result.certificate.percentage.toFixed(1)}%)`}
                                </div>
                              </div>
                            )}
                            <div className="col-md-6 mb-3">
                              <strong style={{ color: '#6c757d' }}>Issue Date:</strong>
                              <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>{result.certificate.issue_date}</div>
                            </div>
                            <div className="col-md-6 mb-3">
                              <strong style={{ color: '#6c757d' }}>Issued By:</strong>
                              <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>{result.certificate.issued_by}</div>
                            </div>
                            <div className="col-12 mb-3">
                              <strong style={{ color: '#6c757d' }}>SI.No.:</strong>
                              <div style={{ fontSize: '1.1rem', fontWeight: '600', fontFamily: 'monospace' }}>
                                {result.certificate.si_number}
                              </div>
                            </div>
                            {result.certificate.remarks && (
                              <div className="col-12">
                                <strong style={{ color: '#6c757d' }}>Remarks:</strong>
                                <div style={{ fontSize: '1rem', color: '#495057' }}>
                                  {result.certificate.remarks}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {/* Error Header */}
                        <div className="text-center mb-4">
                          <div style={{
                            width: '60px',
                            height: '60px',
                            background: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1rem'
                          }}>
                            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                              <line x1="18" y1="6" x2="6" y2="18"/>
                              <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                          </div>
                          <h3 style={{ color: '#dc3545', fontWeight: '700', marginBottom: '0.5rem' }}>
                             Certificate Not Found
                          </h3>
                          <p style={{ color: '#6c757d' }}>
                            {result.error || 'The verification code entered is invalid or the certificate does not exist'}
                          </p>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleReset}
                      style={{
                        background: 'transparent',
                        color: '#667eea',
                        border: '2px solid #667eea',
                        borderRadius: '12px',
                        padding: '0.75rem 2rem',
                        fontSize: '1rem',
                        fontWeight: '600',
                        width: '100%',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = '#667eea'
                        e.currentTarget.style.color = 'white'
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.color = '#667eea'
                      }}
                    >
                      Verify Another Certificate
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .fade-in {
          animation: fadeIn 0.8s ease-in;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  )
}