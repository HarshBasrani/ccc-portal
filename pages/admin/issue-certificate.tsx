import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { legacyClient } from '../../lib/legacyClient'

interface Student {
  id: string
  name: string
  enrollment_number: string
  email: string
  phone: string
}

export default function IssueCertificate() {
  const [students, setStudents] = useState<Student[]>([])
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)
  const [issuing, setIssuing] = useState(false)
  
  // Certificate form data
  const [siNumber, setSiNumber] = useState('')
  const [courseName, setCourseName] = useState('Course on Computer Concepts (CCC)')
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0])
  const [remarks, setRemarks] = useState('')
  
  // Optional exam/result data
  const [includeExamData, setIncludeExamData] = useState(false)
  const [examName, setExamName] = useState('')
  const [score, setScore] = useState('')
  const [totalMarks, setTotalMarks] = useState('')
  const [percentage, setPercentage] = useState('')
  const [grade, setGrade] = useState('')

  const router = useRouter()

  useEffect(() => {
    const checkAdminAccess = async () => {
      const { data: { user } } = await legacyClient.auth.getUser()
      
      if (!user) {
        router.push('/admin/login')
        return
      }

      const { data: profile } = await legacyClient
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin') {
        router.push('/login')
        return
      }

      fetchStudents()
    }

    checkAdminAccess()
  }, [router])

  const fetchStudents = async () => {
    try {
      const { data: students, error: studentsError } = await legacyClient
        .from('students')
        .select('*')
        .order('created_at', { ascending: false })

      if (studentsError) {
        console.error('Error fetching students:', studentsError)
        return
      }

      const { data: profiles, error: profilesError } = await legacyClient
        .from('profiles')
        .select('*')

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError)
        return
      }

      // Combine student and profile data
      const studentMap = new Map()
      if (students) {
        students.forEach((student: any) => {
          studentMap.set(student.id, student)
        })
      }

      const profileMap = new Map()
      if (profiles) {
        profiles.forEach((profile: any) => {
          profileMap.set(profile.id, profile)
        })
      }

      const formattedStudents: Student[] = (students || []).map((student: any) => {
        const profile = profileMap.get(student.profile_id)
        return {
          id: student.id,
          name: profile?.full_name || profile?.name || 'Unknown Name',
          enrollment_number: student.enrollment_no || 'N/A',
          email: profile?.email || 'N/A',
          phone: student.phone || 'N/A'
        }
      })

      setStudents(formattedStudents)
      setFilteredStudents(formattedStudents)
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter students based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredStudents(students)
    } else {
      const filtered = students.filter(student => 
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.enrollment_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredStudents(filtered)
    }
  }, [searchTerm, students])

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student)
    setSearchTerm('')
  }

  const handleIssueCertificate = async () => {
    if (!selectedStudent || !siNumber || !courseName) {
      alert('Please fill all required fields')
      return
    }

    // Validate SI.No. format (basic check)
    if (!siNumber.match(/^IC\/\d{2}\/\d{4}\/\d+\/\d+$/)) {
      alert('Please enter SI.No. in correct format (e.g., IC/06/2021/1/1055)')
      return
    }

    setIssuing(true)

    try {
      // Check if SI.No. already exists
      const { data: existingCert, error: checkError } = await legacyClient
        .from('certificates')
        .select('si_number')
        .eq('si_number', siNumber)
        .single()

      if (existingCert) {
        alert('This SI.No. is already in use. Please use a different number.')
        setIssuing(false)
        return
      }

      // Prepare certificate data
      const certificateData: any = {
        si_number: siNumber,
        student_id: selectedStudent.id,
        student_name: selectedStudent.name,
        enrollment_number: selectedStudent.enrollment_number,
        course_name: courseName,
        issue_date: issueDate,
        remarks: remarks || null
      }

      // Add exam data if included
      if (includeExamData) {
        certificateData.exam_name = examName || null
        certificateData.score = score ? parseInt(score) : null
        certificateData.total_marks = totalMarks ? parseInt(totalMarks) : null
        certificateData.percentage = percentage ? parseFloat(percentage) : null
        certificateData.grade = grade || null
      }

      // Insert certificate
      const { error: insertError } = await legacyClient
        .from('certificates')
        .insert(certificateData)

      if (insertError) {
        throw insertError
      }

      alert(`Certificate issued successfully! SI.No.: ${siNumber}`)
      
      // Reset form
      setSelectedStudent(null)
      setSiNumber('')
      setCourseName('Course on Computer Concepts (CCC)')
      setIssueDate(new Date().toISOString().split('T')[0])
      setRemarks('')
      setExamName('')
      setScore('')
      setTotalMarks('')
      setPercentage('')
      setGrade('')
      setIncludeExamData(false)

    } catch (error) {
      console.error('Error issuing certificate:', error)
      alert('Failed to issue certificate: ' + (error as any).message)
    } finally {
      setIssuing(false)
    }
  }

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'var(--light-bg)'
      }}>
        <div className="text-center">
          <div className="spinner-border" style={{ color: '#667eea' }} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3" style={{ color: '#6c757d' }}>Loading students...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Issue Certificate | CCC Admin Portal</title>
      </Head>
      
      <div style={{ background: 'var(--light-bg)', minHeight: 'calc(100vh - 70px)', padding: '2rem 0' }}>
        <div className="container">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4 fade-in">
            <div>
              <h1 className="page-title">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="url(#issueGrad)" strokeWidth="2" style={{ marginRight: '0.5rem' }}>
                  <defs>
                    <linearGradient id="issueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#667eea" />
                      <stop offset="100%" stopColor="#764ba2" />
                    </linearGradient>
                  </defs>
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <path d="M12 8v8"/>
                  <path d="M8 12h8"/>
                </svg>
                Issue Certificate
              </h1>
              <p className="page-subtitle">Issue certificates with SI.No. for verification</p>
            </div>
            <Link href="/admin/certificates" className="btn btn-outline-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.5rem' }}>
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
              </svg>
              View Certificates
            </Link>
          </div>

          <div className="row">
            {/* Student Selection */}
            <div className="col-md-6">
              <div className="card glass-card fade-in">
                <div className="card-header">
                  <h5 style={{ margin: 0, color: '#495057' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.5rem' }}>
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                    Select Student
                  </h5>
                </div>
                <div className="card-body">
                  {!selectedStudent ? (
                    <>
                      {/* Search Input */}
                      <div className="mb-3">
                        <div className="input-group">
                          <span className="input-group-text">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="11" cy="11" r="8"/>
                              <path d="m21 21-4.35-4.35"/>
                            </svg>
                          </span>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Search by name or enrollment number..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Students List */}
                      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {filteredStudents.length === 0 ? (
                          <div className="text-center py-4">
                            <p style={{ color: '#6c757d' }}>
                              {searchTerm ? 'No students found matching your search' : 'No students available'}
                            </p>
                          </div>
                        ) : (
                          filteredStudents.map((student) => (
                            <div
                              key={student.id}
                              className="student-card"
                              onClick={() => handleSelectStudent(student)}
                              style={{
                                padding: '1rem',
                                border: '1px solid #dee2e6',
                                borderRadius: '8px',
                                marginBottom: '0.5rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                backgroundColor: '#f8f9fa'
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.backgroundColor = '#e9ecef'
                                e.currentTarget.style.borderColor = '#667eea'
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.backgroundColor = '#f8f9fa'
                                e.currentTarget.style.borderColor = '#dee2e6'
                              }}
                            >
                              <div style={{ fontWeight: '600', color: '#495057' }}>{student.name}</div>
                              <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>
                                Enrollment: {student.enrollment_number}
                              </div>
                              <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>
                                Email: {student.email}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Selected Student */}
                      <div style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        padding: '1.5rem',
                        borderRadius: '10px',
                        marginBottom: '1rem'
                      }}>
                        <h6 style={{ margin: '0 0 0.5rem 0', opacity: 0.9 }}>Selected Student</h6>
                        <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>{selectedStudent.name}</div>
                        <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                          Enrollment: {selectedStudent.enrollment_number}
                        </div>
                        <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                          Email: {selectedStudent.email}
                        </div>
                      </div>
                      <button
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => setSelectedStudent(null)}
                      >
                        Change Student
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Certificate Details */}
            <div className="col-md-6">
              <div className="card glass-card fade-in">
                <div className="card-header">
                  <h5 style={{ margin: 0, color: '#495057' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.5rem' }}>
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                    </svg>
                    Certificate Details
                  </h5>
                </div>
                <div className="card-body">
                  <form onSubmit={(e) => { e.preventDefault(); handleIssueCertificate(); }}>
                    {/* SI Number */}
                    <div className="mb-3">
                      <label className="form-label fw-bold">
                        SI.No. <span style={{ color: 'red' }}>*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={siNumber}
                        onChange={(e) => setSiNumber(e.target.value.toUpperCase())}
                        placeholder="IC/06/2021/1/1055"
                        required
                        style={{ fontFamily: 'monospace' }}
                      />
                      <small className="text-muted">Format: IC/MM/YYYY/C/NNNN</small>
                    </div>

                    {/* Course Name */}
                    <div className="mb-3">
                      <label className="form-label fw-bold">
                        Course Name <span style={{ color: 'red' }}>*</span>
                      </label>
                      <select
                        className="form-select"
                        value={courseName}
                        onChange={(e) => setCourseName(e.target.value)}
                        required
                      >
                        <option value="Course on Computer Concepts (CCC)">Course on Computer Concepts (CCC)</option>
                        <option value="Diploma in Computer Application (DCA)">Diploma in Computer Application (DCA)</option>
                        <option value="Advanced Diploma in Computer Application (ADCA)">Advanced Diploma in Computer Application (ADCA)</option>
                        <option value="Programming with C++">Programming with C++</option>
                        <option value="Web Designing">Web Designing</option>
                        <option value="Tally with GST">Tally with GST</option>
                        <option value="Digital Marketing">Digital Marketing</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    {/* Issue Date */}
                    <div className="mb-3">
                      <label className="form-label fw-bold">
                        Issue Date <span style={{ color: 'red' }}>*</span>
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        value={issueDate}
                        onChange={(e) => setIssueDate(e.target.value)}
                        required
                      />
                    </div>

                    {/* Include Exam Results */}
                    <div className="mb-3">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="includeExamData"
                          checked={includeExamData}
                          onChange={(e) => setIncludeExamData(e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="includeExamData">
                          Include Exam Results
                        </label>
                      </div>
                    </div>

                    {/* Exam Results Section */}
                    {includeExamData && (
                      <div className="border rounded p-3 mb-3" style={{ backgroundColor: '#f8f9fa' }}>
                        <h6 style={{ color: '#495057', marginBottom: '1rem' }}>Exam Results</h6>
                        
                        <div className="row">
                          <div className="col-md-12 mb-2">
                            <label className="form-label">Exam Name</label>
                            <input
                              type="text"
                              className="form-control"
                              value={examName}
                              onChange={(e) => setExamName(e.target.value)}
                              placeholder="Final Assessment"
                            />
                          </div>
                          <div className="col-md-6 mb-2">
                            <label className="form-label">Score</label>
                            <input
                              type="number"
                              className="form-control"
                              value={score}
                              onChange={(e) => setScore(e.target.value)}
                              min="0"
                            />
                          </div>
                          <div className="col-md-6 mb-2">
                            <label className="form-label">Total Marks</label>
                            <input
                              type="number"
                              className="form-control"
                              value={totalMarks}
                              onChange={(e) => setTotalMarks(e.target.value)}
                              min="0"
                            />
                          </div>
                          <div className="col-md-6 mb-2">
                            <label className="form-label">Percentage</label>
                            <input
                              type="number"
                              className="form-control"
                              value={percentage}
                              onChange={(e) => setPercentage(e.target.value)}
                              min="0"
                              max="100"
                              step="0.1"
                            />
                          </div>
                          <div className="col-md-6 mb-2">
                            <label className="form-label">Grade</label>
                            <select
                              className="form-select"
                              value={grade}
                              onChange={(e) => setGrade(e.target.value)}
                            >
                              <option value="">Select Grade</option>
                              <option value="S">S (Superior)</option>
                              <option value="A">A (Excellent)</option>
                              <option value="B">B (Good)</option>
                              <option value="C">C (Average)</option>
                              <option value="D">D (Pass)</option>
                              <option value="F">F (Fail)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Remarks */}
                    <div className="mb-3">
                      <label className="form-label fw-bold">Remarks</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="Any additional notes (optional)"
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={!selectedStudent || !siNumber || !courseName || issuing}
                      style={{
                        background: !selectedStudent || !siNumber || !courseName || issuing 
                          ? '#6c757d' 
                          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '0.75rem 2rem',
                        fontSize: '1rem',
                        fontWeight: '600',
                        width: '100%',
                        cursor: !selectedStudent || !siNumber || !courseName || issuing ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      {issuing ? (
                        <>
                          <span className="spinner-border spinner-border-sm" role="status"></span>
                          Issuing Certificate...
                        </>
                      ) : (
                        <>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                            <path d="M12 8v8"/>
                            <path d="M8 12h8"/>
                          </svg>
                          Issue Certificate
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .page-title {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          font-weight: 700;
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
        }
        .page-subtitle {
          color: #6c757d;
          font-size: 1.1rem;
          margin-bottom: 0;
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          border-radius: 15px;
        }
        .fade-in {
          animation: fadeIn 0.8s ease-in;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        :global(:root) {
          --light-bg: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        }
      `}</style>
    </>
  )
}