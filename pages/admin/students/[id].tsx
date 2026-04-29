// pages/admin/students/[id].tsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { db } from '../../../lib/dbClient'

interface StudentDetail {
  id: string
  profile_id: string
  full_name: string | null
  email: string | null
  enrollment_no: string | null
  dob: string | null
  phone: string | null
  address: string | null
  status: string
  created_at: string
  photo_url: string | null
  certificate_url: string | null
  father_name: string | null
  mother_name: string | null
  gender: string | null
  category: string | null
  last_qualification: string | null
}

export default function StudentDetailPage() {
  const router = useRouter()
  const { id } = router.query

  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [student, setStudent] = useState<StudentDetail | null>(null)

  useEffect(() => {
    if (!id) return

    const checkAdminAndFetch = async () => {
      const { data: { user } } = await db.auth.getUser()

      if (!user) {
        router.replace('/login')
        return
      }

      const { data: profile } = await db
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin') {
        router.replace('/student/dashboard')
        return
      }

      await fetchStudent()
      setLoading(false)
    }

    checkAdminAndFetch()
  }, [id, router])

  const fetchStudent = async () => {
    const { data, error: fetchError } = await db
      .from('students')
      .select(`
        id,
        profile_id,
        enrollment_no,
        dob,
        phone,
        address,
        status,
        created_at,
        profiles:profile_id ( full_name, email )
      `)
      .eq('id', id)
      .single()

    if (fetchError) {
      setError(fetchError.message)
      return
    }

    if (data) {
      const profile = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles
      setStudent({
        id: data.id,
        profile_id: data.profile_id,
        full_name: profile?.full_name || null,
        email: profile?.email || null,
        enrollment_no: data.enrollment_no,
        dob: data.dob,
        phone: data.phone,
        address: data.address,
        status: data.status,
        created_at: data.created_at,
        photo_url: data.photo_url || null,
        certificate_url: data.certificate_url || null,
        father_name: data.father_name || null,
        mother_name: data.mother_name || null,
        gender: data.gender || null,
        category: data.category || null,
        last_qualification: data.last_qualification || null
      })
    }
  }

  const updateStatus = async (newStatus: string) => {
    if (!student) return

    setUpdating(true)
    setError(null)

    const { error: updateError } = await db
      .from('students')
      .update({ status: newStatus })
      .eq('id', student.id)

    if (updateError) {
      setError(updateError.message)
    } else {
      setStudent((prev) => prev ? { ...prev, status: newStatus } : null)
    }

    setUpdating(false)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    const finalDate = dateString.includes('T') ? dateString : `${dateString}T00:00:00`
    return new Date(finalDate).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
      case 'active':
        return 'bg-success'
      case 'rejected':
      case 'inactive':
        return 'bg-danger'
      default:
        return 'bg-warning text-dark'
    }
  }

  if (loading) {
    return (
      <div className="container mt-4">
        <p>Loading student</p>
      </div>
    )
  }

  if (error && !student) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
        <Link href="/admin/students" className="btn btn-secondary">
          Back to Students
        </Link>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="container mt-4">
        <p>Student not found.</p>
        <Link href="/admin/students" className="btn btn-secondary">
          Back to Students
        </Link>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Student Details  CCC Exam Portal</title>
      </Head>
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h1 className="h4 mb-0">Student Details</h1>
          <Link href="/admin/students" className="btn btn-outline-secondary btn-sm">
            Back to Students
          </Link>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        <div className="card mb-4">
          <div className="card-header d-flex justify-content-between align-items-center">
            <span className="fw-bold">{student.full_name || '-'}</span>
            <span className={`badge ${getStatusBadge(student.status)}`}>
              {student.status}
            </span>
          </div>
          <div className="card-body">
            <div className="row align-items-center mb-4">
              <div className="col-md-3 text-center mb-3 mb-md-0">
                {student.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={student.photo_url} 
                    alt="Profile Photo"
                    className="img-thumbnail"
                    style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '10px' }}
                  />
                ) : (
                  <div 
                    className="bg-secondary text-white d-flex align-items-center justify-content-center mx-auto"
                    style={{ width: '150px', height: '150px', fontSize: '3rem', borderRadius: '10px' }}
                  >
                    {student.full_name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
              </div>
              <div className="col-md-9">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label text-muted small mb-0">Full Name</label>
                    <p className="mb-0 fw-bold">{student.full_name || '-'}</p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label text-muted small mb-0">Email</label>
                    <p className="mb-0">{student.email || '-'}</p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label text-muted small mb-0">Enrollment No</label>
                    <p className="mb-0 fw-semibold">{student.enrollment_no || '-'}</p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label text-muted small mb-0">Date of Birth</label>
                    <p className="mb-0">{formatDate(student.dob)}</p>
                  </div>
                </div>
              </div>
            </div>

            <hr />

            <div className="row">
              <div className="col-md-4 mb-3">
                <label className="form-label text-muted small mb-0">Father's Name</label>
                <p className="mb-0">{student.father_name || '-'}</p>
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label text-muted small mb-0">Mother's Name</label>
                <p className="mb-0">{student.mother_name || '-'}</p>
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label text-muted small mb-0">Gender</label>
                <p className="mb-0">{student.gender || '-'}</p>
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label text-muted small mb-0">Phone</label>
                <p className="mb-0">{student.phone || '-'}</p>
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label text-muted small mb-0">Category</label>
                <p className="mb-0">
                  {student.category ? (
                    <span className="badge bg-primary">{student.category}</span>
                  ) : '-'}
                </p>
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label text-muted small mb-0">Last Qualification</label>
                <p className="mb-0">{student.last_qualification || '-'}</p>
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label text-muted small mb-0">Registered On</label>
                <p className="mb-0">{formatDate(student.created_at)}</p>
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label text-muted small mb-0">Certificate</label>
                <p className="mb-0">
                  {student.certificate_url ? (
                    <a 
                      href={student.certificate_url} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="btn btn-sm btn-outline-primary"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="me-1">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      View Certificate
                    </a>
                  ) : 'No certificate uploaded'}
                </p>
              </div>
              <div className="col-12 mb-3">
                <label className="form-label text-muted small mb-0">Address</label>
                <p className="mb-0">{student.address || '-'}</p>
              </div>
            </div>
          </div>
          <div className="card-footer">
            <div className="d-flex gap-2">
              <button
                className="btn btn-success"
                onClick={() => updateStatus('approved')}
                disabled={updating || student.status === 'approved'}
              >
                {updating ? 'Updating' : 'Approve'}
              </button>
              <button
                className="btn btn-danger"
                onClick={() => updateStatus('rejected')}
                disabled={updating || student.status === 'rejected'}
              >
                {updating ? 'Updating' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
