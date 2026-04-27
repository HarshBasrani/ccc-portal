// pages/student/setup-profile.tsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { legacyClient } from '../../lib/legacyClient'

interface UserProfile {
  id: string
  full_name: string | null
  email: string | null
  role: string | null
}

export default function StudentProfileSetup() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [enrollmentNo, setEnrollmentNo] = useState('')

  useEffect(() => {
    const checkProfile = async () => {
      try {
        const { data: { user } } = await legacyClient.auth.getUser()

        if (!user) {
          router.replace('/login')
          return
        }

        // Get user profile
        const { data: profile, error: profileError } = await legacyClient
          .from('profiles')
          .select('id, full_name, email, role')
          .eq('id', user.id)
          .single()

        if (profileError) {
          setError('Failed to load profile: ' + profileError.message)
          setLoading(false)
          return
        }

        setUserProfile(profile)

        // Check if student record exists
        const { data: student } = await legacyClient
          .from('students')
          .select('id, enrollment_no')
          .eq('profile_id', user.id)
          .maybeSingle()

        if (student) {
          // Student record exists, redirect to exams
          router.push('/student/exams')
          return
        }

        // Generate enrollment number
        const year = new Date().getFullYear()
        const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
        setEnrollmentNo(`CCC${year}${randomNum}`)

        setLoading(false)
      } catch (error: any) {
        setError('An error occurred: ' + error.message)
        setLoading(false)
      }
    }

    checkProfile()
  }, [router])

  const createStudentRecord = async () => {
    if (!userProfile) return

    setCreating(true)
    setError(null)

    try {
      const { error: insertError } = await legacyClient
        .from('students')
        .insert({
          profile_id: userProfile.id,
          enrollment_no: enrollmentNo,
          first_name: userProfile.full_name?.split(' ')[0] || 'Student',
          last_name: userProfile.full_name?.split(' ').slice(1).join(' ') || '',
          email: userProfile.email,
          status: 'pending',
          fees: 500
        })

      if (insertError) {
        throw insertError
      }

      setSuccess('Student profile created successfully! Please wait for admin approval.')
      
      // Redirect after 3 seconds
      setTimeout(() => {
        router.push('/student/exams')
      }, 3000)

    } catch (error: any) {
      setError('Failed to create student record: ' + error.message)
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div style={{ background: 'var(--light-bg)', minHeight: 'calc(100vh - 70px)' }}>
        <div className="container py-5">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Checking profile...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Setup Student Profile  CCC Exam Portal</title>
      </Head>
      <div style={{ background: 'var(--light-bg)', minHeight: 'calc(100vh - 70px)', padding: '2rem 0' }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-6">
              <div className="premium-card">
                <div className="premium-card-header" style={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white'
                }}>
                  <h4 className="mb-0">Setup Student Profile</h4>
                </div>
                <div className="premium-card-body">
                  {error && (
                    <div className="alert alert-danger">{error}</div>
                  )}
                  
                  {success && (
                    <div className="alert alert-success">{success}</div>
                  )}

                  {userProfile && (
                    <div className="mb-4">
                      <h6>User Information</h6>
                      <div className="glass-card p-3">
                        <p><strong>Name:</strong> {userProfile.full_name || 'Not provided'}</p>
                        <p><strong>Email:</strong> {userProfile.email}</p>
                        <p><strong>Role:</strong> {userProfile.role}</p>
                      </div>
                    </div>
                  )}

                  <div className="alert alert-info">
                    <strong>Student Record Required</strong><br />
                    To access exams, you need a student record. This will create one for you with pending approval status.
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Enrollment Number</label>
                    <input
                      type="text"
                      className="form-control"
                      value={enrollmentNo}
                      onChange={(e) => setEnrollmentNo(e.target.value)}
                      placeholder="Auto-generated enrollment number"
                    />
                  </div>

                  <div className="d-flex gap-3">
                    <button
                      className="btn-premium btn-premium-success"
                      onClick={createStudentRecord}
                      disabled={creating || !enrollmentNo.trim()}
                    >
                      {creating ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Creating...
                        </>
                      ) : (
                        'Create Student Profile'
                      )}
                    </button>
                    
                    <Link href="/" className="btn-premium btn-premium-outline">
                      Cancel
                    </Link>
                  </div>

                  <div className="mt-4">
                    <small className="text-muted">
                      <strong>Note:</strong> After creating your student profile, an admin will need to approve it before you can take exams.
                    </small>
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