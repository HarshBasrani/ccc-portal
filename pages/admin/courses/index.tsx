// pages/admin/courses/index.tsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Link from 'next/link'
import { legacyClient } from '../../../lib/legacyClient'

interface Course {
  id: string
  _id: string
  name: string
  description?: string
  created_at: string
}

export default function AdminCourses() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [courses, setCourses] = useState<Course[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Add course form
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Edit course
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')

  useEffect(() => {
    const checkAdminAccess = async () => {
      const { data: { user } } = await legacyClient.auth.getUser()

      if (!user) {
        router.replace('/login')
        return
      }

      const { data: profile } = await legacyClient
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin') {
        router.replace('/student/dashboard')
        return
      }

      await fetchCourses()
      setLoading(false)
    }

    checkAdminAccess()
  }, [router])

  const fetchCourses = async () => {
    const { data, error: fetchError } = await legacyClient
      .from('courses')
      .select('*')
      .order('name', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
      return
    }

    if (data) {
      setCourses(data)
    }
  }

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return

    setSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const { error: insertError } = await legacyClient
        .from('courses')
        .insert({
          name: newName.trim(),
          description: newDesc.trim() || undefined,
        })

      if (insertError) throw new Error(insertError.message)

      setSuccess(`Course "${newName.trim()}" added successfully!`)
      setNewName('')
      setNewDesc('')
      setShowAddForm(false)
      await fetchCourses()
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : String(err)) || 'Failed to add course')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditCourse = async (courseId: string) => {
    if (!editName.trim()) return

    setSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const { error: updateError } = await legacyClient
        .from('courses')
        .update({
          name: editName.trim(),
          description: editDesc.trim() || undefined,
        })
        .eq('id', courseId)

      if (updateError) throw new Error(updateError.message)

      setSuccess(`Course updated successfully!`)
      setEditId(null)
      await fetchCourses()
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : String(err)) || 'Failed to update course')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteCourse = async (courseId: string, courseName: string) => {
    if (!confirm(`Are you sure you want to delete "${courseName}"? This cannot be undone.`)) return

    setError(null)
    setSuccess(null)

    try {
      const { error: deleteError } = await legacyClient
        .from('courses')
        .delete()
        .eq('id', courseId)

      if (deleteError) throw new Error(deleteError.message)

      setSuccess(`Course "${courseName}" deleted.`)
      await fetchCourses()
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : String(err)) || 'Failed to delete course')
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div style={{ background: 'var(--light-bg)', minHeight: 'calc(100vh - 70px)' }}>
        <div className="container py-5">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading courses...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Manage Courses | CCC Exam Portal</title>
      </Head>
      <div style={{ background: 'var(--light-bg)', minHeight: 'calc(100vh - 70px)', padding: '2rem 0' }}>
        <div className="container">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4 fade-in">
            <div>
              <h1 className="page-title">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="url(#courseGrad)" strokeWidth="2" style={{ marginRight: '0.5rem' }}>
                  <defs>
                    <linearGradient id="courseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#667eea" />
                      <stop offset="100%" stopColor="#764ba2" />
                    </linearGradient>
                  </defs>
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
                Manage Courses
              </h1>
              <p className="page-subtitle">Add courses before creating questions &amp; exams</p>
            </div>
            <button
              className="btn-premium btn-premium-primary"
              onClick={() => { setShowAddForm(!showAddForm); setEditId(null) }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Course
            </button>
          </div>

          {/* Alerts */}
          {error && (
            <div className="alert alert-danger d-flex align-items-center fade-in" role="alert">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="me-2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              {error}
            </div>
          )}
          {success && (
            <div className="alert alert-success d-flex align-items-center fade-in" role="alert">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="me-2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              {success}
            </div>
          )}

          {/* Add Course Form */}
          {showAddForm && (
            <div className="premium-card mb-4 fade-in">
              <div className="premium-card-header">
                <h5 className="mb-0">Add New Course</h5>
              </div>
              <div className="premium-card-body">
                <form onSubmit={handleAddCourse}>
                  <div className="row">
                    <div className="col-md-5 mb-3">
                      <label className="form-label fw-bold">Course Name <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. CCC, Tally, DCA"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-md-5 mb-3">
                      <label className="form-label fw-bold">Description</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Optional description"
                        value={newDesc}
                        onChange={e => setNewDesc(e.target.value)}
                      />
                    </div>
                    <div className="col-md-2 mb-3 d-flex align-items-end gap-2">
                      <button type="submit" className="btn btn-success w-100" disabled={submitting}>
                        {submitting ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <div className="glass-card p-3 text-center fade-in stagger-1">
                <div className="d-flex align-items-center justify-content-center gap-3">
                  <div style={{
                    width: '45px', height: '45px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    </svg>
                  </div>
                  <div className="text-start">
                    <div className="fw-bold" style={{ fontSize: '1.5rem', color: 'var(--dark-text)' }}>{courses.length}</div>
                    <div className="text-muted small">Total Courses</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Course List */}
          <div className="premium-card fade-in">
            <div className="premium-card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0 d-flex align-items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
                Course List
              </h5>
              <span className="badge" style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.85rem'
              }}>
                {courses.length} course{courses.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="premium-card-body p-0">
              {courses.length === 0 ? (
                <div className="text-center py-5">
                  <div style={{
                    width: '80px', height: '80px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '50%', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', margin: '0 auto 1rem', opacity: 0.6
                  }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    </svg>
                  </div>
                  <p className="text-muted mb-3">No courses added yet. Add a course to start creating questions &amp; exams.</p>
                  <button
                    className="btn-premium btn-premium-primary"
                    onClick={() => setShowAddForm(true)}
                  >
                    Add Your First Course
                  </button>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-premium mb-0">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Course Name</th>
                        <th>Description</th>
                        <th>Created</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courses.map((course, index) => (
                        <tr key={course.id || course._id} className="fade-in" style={{ animationDelay: `${index * 0.03}s` }}>
                          <td>
                            <div style={{
                              width: '36px', height: '36px',
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              borderRadius: '10px', display: 'flex', alignItems: 'center',
                              justifyContent: 'center', color: 'white', fontWeight: '600', fontSize: '0.85rem'
                            }}>
                              {index + 1}
                            </div>
                          </td>
                          <td>
                            {editId === (course.id || course._id) ? (
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                              />
                            ) : (
                              <span className="fw-semibold" style={{ color: 'var(--dark-text)' }}>{course.name}</span>
                            )}
                          </td>
                          <td>
                            {editId === (course.id || course._id) ? (
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                value={editDesc}
                                onChange={e => setEditDesc(e.target.value)}
                                placeholder="Optional"
                              />
                            ) : (
                              <span className="text-muted">{course.description || '-'}</span>
                            )}
                          </td>
                          <td>
                            <span style={{ color: 'var(--text-muted)' }}>{formatDate(course.created_at)}</span>
                          </td>
                          <td className="text-center">
                            {editId === (course.id || course._id) ? (
                              <div className="d-flex gap-2 justify-content-center">
                                <button
                                  className="btn btn-sm btn-success"
                                  onClick={() => handleEditCourse(course.id || course._id)}
                                  disabled={submitting}
                                >
                                  Save
                                </button>
                                <button
                                  className="btn btn-sm btn-secondary"
                                  onClick={() => setEditId(null)}
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="d-flex gap-2 justify-content-center">
                                <button
                                  className="btn-premium btn-premium-outline btn-premium-sm"
                                  onClick={() => {
                                    setEditId(course.id || course._id)
                                    setEditName(course.name)
                                    setEditDesc(course.description || '')
                                    setShowAddForm(false)
                                  }}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                  </svg>
                                  Edit
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => handleDeleteCourse(course.id || course._id, course.name)}
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Help info */}
          <div className="mt-4 fade-in">
            <div className="alert alert-info d-flex align-items-start gap-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 mt-1">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <div>
                <strong>Workflow tip:</strong> Add courses first, then create questions for each course, and finally create exams linked to a course.
                <div className="mt-2 d-flex gap-2 flex-wrap">
                  <span className="badge bg-primary">Step 1: Add Courses</span>
                  <span className="badge bg-warning text-dark">Step 2: Add Questions</span>
                  <span className="badge bg-success">Step 3: Create Exams</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
