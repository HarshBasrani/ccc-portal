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
        created_at: data.created_at
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
    return new Date(dateString).toLocaleDateString('en-IN', {
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
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label text-muted small mb-0">Full Name</label>
                <p className="mb-0">{student.full_name || '-'}</p>
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label text-muted small mb-0">Email</label>
                <p className="mb-0">{student.email || '-'}</p>
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label text-muted small mb-0">Enrollment No</label>
                <p className="mb-0">{student.enrollment_no || '-'}</p>
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label text-muted small mb-0">Date of Birth</label>
                <p className="mb-0">{formatDate(student.dob)}</p>
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label text-muted small mb-0">Phone</label>
                <p className="mb-0">{student.phone || '-'}</p>
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label text-muted small mb-0">Registered On</label>
                <p className="mb-0">{formatDate(student.created_at)}</p>
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
