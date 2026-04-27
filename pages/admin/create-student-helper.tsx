// pages/admin/create-student-helper.tsx
import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { legacyClient } from '../../lib/legacyClient'

export default function CreateStudentHelper() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState('')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [userInfo, setUserInfo] = useState<any>(null)

  const searchUser = async () => {
    if (!userEmail.trim()) {
      setError('Please enter an email address')
      return
    }

    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      // Search for user profile
      const { data: profile, error: profileError } = await legacyClient
        .from('profiles')
        .select('*')
        .eq('email', userEmail.trim())
        .single()

      if (profileError || !profile) {
        setError('User profile not found for email: ' + userEmail)
        setLoading(false)
        return
      }

      // Check if student record already exists
      const { data: student } = await legacyClient
        .from('students')
        .select('*')
        .eq('profile_id', profile.id)
        .maybeSingle()

      setUserInfo({
        profile,
        existingStudent: student
      })

      if (student) {
        setMessage(`Student record already exists for ${profile.full_name} (Enrollment: ${student.enrollment_no})`)
      } else {
        setMessage(`User found: ${profile.full_name}. No student record exists - ready to create.`)
      }

    } catch (error: unknown) {
      setError('Search failed: ' + (error instanceof Error ? error.message : String(error)))
    } finally {
      setLoading(false)
    }
  }

  const createStudentRecord = async () => {
    if (!userInfo?.profile) return

    setLoading(true)
    setError(null)

    try {
      const profile = userInfo.profile
      
      // Generate enrollment number
      const year = new Date().getFullYear()
      const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
      const enrollmentNo = `CCC${year}${randomNum}`

      const { error: insertError } = await legacyClient
        .from('students')
        .insert({
          profile_id: profile.id,
          enrollment_no: enrollmentNo,
          first_name: profile.full_name?.split(' ')[0] || 'Student',
          last_name: profile.full_name?.split(' ').slice(1).join(' ') || '',
          email: profile.email,
          status: 'approved', // Admin creates as approved
          fees: 500
        })

      if (insertError) {
        throw insertError
      }

      setMessage(` Student record created successfully!\nEnrollment Number: ${enrollmentNo}\nStatus: Approved`)
      setUserInfo(null)
      setUserEmail('')

    } catch (error: unknown) {
      setError('Failed to create student record: ' + (error instanceof Error ? error.message : String(error)))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Create Student Record  Admin Portal</title>
      </Head>
      <div style={{ background: 'var(--light-bg)', minHeight: 'calc(100vh - 70px)', padding: '2rem 0' }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="premium-card">
                <div className="premium-card-header" style={{ 
                  background: 'linear-gradient(135deg, #dc3545 0%, #fd7e14 100%)',
                  color: 'white'
                }}>
                  <h4 className="mb-0"> Create Student Record</h4>
                  <small>Admin Tool - Create student records for existing users</small>
                </div>
                <div className="premium-card-body">
                  
                  {error && (
                    <div className="alert alert-danger">{error}</div>
                  )}
                  
                  {message && (
                    <div className="alert alert-success" style={{ whiteSpace: 'pre-line' }}>{message}</div>
                  )}

                  <div className="row">
                    <div className="col-md-8">
                      <label className="form-label">User Email Address</label>
                      <input
                        type="email"
                        className="form-control"
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        placeholder="Enter user's email address"
                        onKeyDown={(e) => e.key === 'Enter' && searchUser()}
                      />
                    </div>
                    <div className="col-md-4 d-flex align-items-end">
                      <button
                        className="btn-premium btn-premium-primary w-100"
                        onClick={searchUser}
                        disabled={loading || !userEmail.trim()}
                      >
                        {loading ? 'Searching...' : 'Search User'}
                      </button>
                    </div>
                  </div>

                  {userInfo && (
                    <div className="mt-4">
                      <h6>User Information</h6>
                      <div className="glass-card p-3 mb-3">
                        <div className="row">
                          <div className="col-md-6">
                            <p><strong>Name:</strong> {userInfo.profile.full_name || 'Not provided'}</p>
                            <p><strong>Email:</strong> {userInfo.profile.email}</p>
                            <p><strong>Role:</strong> {userInfo.profile.role || 'Not set'}</p>
                          </div>
                          <div className="col-md-6">
                            <p><strong>User ID:</strong> <small>{userInfo.profile.id}</small></p>
                            <p><strong>Created:</strong> {new Date(userInfo.profile.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>

                      {userInfo.existingStudent ? (
                        <div className="alert alert-warning">
                          <strong>Student Record Already Exists:</strong><br />
                          Enrollment Number: {userInfo.existingStudent.enrollment_no}<br />
                          Status: {userInfo.existingStudent.status}<br />
                          Fees: {userInfo.existingStudent.fees}
                        </div>
                      ) : (
                        <div>
                          <div className="alert alert-info">
                            <strong>Ready to Create Student Record</strong><br />
                            This will create a new student record with approved status.
                          </div>
                          
                          <button
                            className="btn-premium btn-premium-success"
                            onClick={createStudentRecord}
                            disabled={loading}
                          >
                            {loading ? 'Creating...' : ' Create Student Record'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-4">
                    <h6>Instructions</h6>
                    <div className="small text-muted">
                      <ol>
                        <li>Enter the email address of an existing user account</li>
                        <li>Click &quot;Search User&quot; to find their profile</li>
                        <li>If no student record exists, you can create one</li>
                        <li>The student will be created with &quot;approved&quot; status</li>
                        <li>They can then access exams immediately</li>
                      </ol>
                    </div>
                  </div>

                  <div className="mt-3">
                    <button 
                      className="btn-premium btn-premium-outline"
                      onClick={() => router.push('/admin/dashboard')}
                    >
                       Back to Dashboard
                    </button>
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