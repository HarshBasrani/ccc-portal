import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { legacyClient } from '../../lib/legacyClient';

interface StudentProfile {
  id: string;
  enrollment_no: string;
  first_name: string;
  last_name: string;
  father_name: string;
  mother_name: string;
  dob: string;
  gender: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  category: string;
  last_qualification: string;
  course_name: string;
  created_at: string;
  photo_url: string | null;
}

export default function StudentProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    checkAuthAndLoadProfile();
  }, []);

  const checkAuthAndLoadProfile = async () => {
    const { data: { user } } = await legacyClient.auth.getUser();
    
    if (!user) {
      router.push('/student/login');
      return;
    }

    const { data: profile } = await legacyClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'student') {
      router.push('/login');
      return;
    }

    const { data: studentData, error } = await legacyClient
      .from('students')
      .select(`
        id,
        enrollment_no,
        first_name,
        last_name,
        father_name,
        mother_name,
        dob,
        gender,
        email,
        phone,
        city,
        state,
        country,
        pincode,
        category,
        last_qualification,
        created_at,
        photo_url
      `)
      .eq('profile_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching student profile:', error);
      setErrorMsg(error.message);
    } else if (studentData) {
      setStudent({
        ...studentData,
        course_name: 'CCC (Course on Computer Concepts)',
        photo_url: studentData.photo_url || null
      });
    } else {
      setErrorMsg('No student record found for this user.');
    }

    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="container py-5">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="container py-5">
        <div className="alert-premium alert-danger">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>Unable to load profile information. {errorMsg && `Error: ${errorMsg}`}</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>My Profile - CCC Exam Portal</title>
      </Head>
      <div style={{ background: 'var(--light-bg)', minHeight: 'calc(100vh - 70px)', padding: '2rem 0' }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-10">
              {/* Profile Card */}
              <div className="premium-card fade-in" style={{ overflow: 'hidden' }}>
                {/* Profile Header */}
                <div className="profile-header">
                  {student.photo_url ? (
                    <img 
                      src={student.photo_url} 
                      alt="Profile Photo"
                      className="profile-avatar"
                    />
                  ) : (
                    <div className="profile-avatar-placeholder">
                      {student.first_name?.charAt(0)?.toUpperCase()}{student.last_name?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                  <h2 className="profile-name">{student.first_name} {student.last_name}</h2>
                  <p className="profile-enrollment">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.5rem', opacity: '0.8' }}>
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    Enrollment No: <strong>{student.enrollment_no}</strong>
                  </p>
                </div>

                {/* Profile Body */}
                <div style={{ padding: '2rem' }}>
                  <div className="row g-4">
                    {/* Personal Information */}
                    <div className="col-md-6">
                      <div className="profile-section fade-in stagger-1">
                        <div className="profile-section-header">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                          </svg>
                          Personal Information
                        </div>
                        <div className="profile-section-body">
                          <div className="profile-info-row">
                            <span className="profile-info-label">Full Name</span>
                            <span className="profile-info-value">{student.first_name} {student.last_name}</span>
                          </div>
                          <div className="profile-info-row">
                            <span className="profile-info-label">Father's Name</span>
                            <span className="profile-info-value">{student.father_name || 'N/A'}</span>
                          </div>
                          <div className="profile-info-row">
                            <span className="profile-info-label">Mother's Name</span>
                            <span className="profile-info-value">{student.mother_name || 'N/A'}</span>
                          </div>
                          <div className="profile-info-row">
                            <span className="profile-info-label">Date of Birth</span>
                            <span className="profile-info-value">{formatDate(student.dob)}</span>
                          </div>
                          <div className="profile-info-row">
                            <span className="profile-info-label">Gender</span>
                            <span className="profile-info-value">{student.gender || 'N/A'}</span>
                          </div>
                          <div className="profile-info-row">
                            <span className="profile-info-label">Category</span>
                            <span className="profile-info-value">
                              <span className="badge-premium badge-primary">{student.category || 'N/A'}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="col-md-6">
                      <div className="profile-section fade-in stagger-2">
                        <div className="profile-section-header">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                          </svg>
                          Contact Information
                        </div>
                        <div className="profile-section-body">
                          <div className="profile-info-row">
                            <span className="profile-info-label">Email</span>
                            <span className="profile-info-value">{student.email || 'N/A'}</span>
                          </div>
                          <div className="profile-info-row">
                            <span className="profile-info-label">Phone</span>
                            <span className="profile-info-value">{student.phone || 'N/A'}</span>
                          </div>
                          <div className="profile-info-row">
                            <span className="profile-info-label">City</span>
                            <span className="profile-info-value">{student.city || 'N/A'}</span>
                          </div>
                          <div className="profile-info-row">
                            <span className="profile-info-label">State</span>
                            <span className="profile-info-value">{student.state || 'N/A'}</span>
                          </div>
                          <div className="profile-info-row">
                            <span className="profile-info-label">Country</span>
                            <span className="profile-info-value">{student.country || 'N/A'}</span>
                          </div>
                          <div className="profile-info-row">
                            <span className="profile-info-label">Pincode</span>
                            <span className="profile-info-value">{student.pincode || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Academic Information */}
                    <div className="col-12">
                      <div className="profile-section fade-in stagger-3">
                        <div className="profile-section-header">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                            <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                          </svg>
                          Academic Information
                        </div>
                        <div className="profile-section-body">
                          <div className="row">
                            <div className="col-md-4">
                              <div style={{ textAlign: 'center', padding: '1rem' }}>
                                <div style={{
                                  width: '60px',
                                  height: '60px',
                                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                  borderRadius: '16px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  margin: '0 auto 1rem',
                                  boxShadow: '0 8px 25px rgba(102, 126, 234, 0.25)'
                                }}>
                                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                                  </svg>
                                </div>
                                <p className="text-muted small mb-1">Course Enrolled</p>
                                <p className="fw-bold mb-0">{student.course_name}</p>
                              </div>
                            </div>
                            <div className="col-md-4">
                              <div style={{ textAlign: 'center', padding: '1rem' }}>
                                <div style={{
                                  width: '60px',
                                  height: '60px',
                                  background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                                  borderRadius: '16px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  margin: '0 auto 1rem',
                                  boxShadow: '0 8px 25px rgba(56, 239, 125, 0.25)'
                                }}>
                                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                    <circle cx="12" cy="8" r="7"/>
                                    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
                                  </svg>
                                </div>
                                <p className="text-muted small mb-1">Last Qualification</p>
                                <p className="fw-bold mb-0">{student.last_qualification || 'N/A'}</p>
                              </div>
                            </div>
                            <div className="col-md-4">
                              <div style={{ textAlign: 'center', padding: '1rem' }}>
                                <div style={{
                                  width: '60px',
                                  height: '60px',
                                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                                  borderRadius: '16px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  margin: '0 auto 1rem',
                                  boxShadow: '0 8px 25px rgba(79, 172, 254, 0.25)'
                                }}>
                                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                    <line x1="16" y1="2" x2="16" y2="6"/>
                                    <line x1="8" y1="2" x2="8" y2="6"/>
                                    <line x1="3" y1="10" x2="21" y2="10"/>
                                  </svg>
                                </div>
                                <p className="text-muted small mb-1">Registration Date</p>
                                <p className="fw-bold mb-0">{formatDate(student.created_at)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
