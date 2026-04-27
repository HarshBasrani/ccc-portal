// pages/admin/questions/[id].tsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { db } from '../../../lib/dbClient'

export default function EditQuestion() {
  const router = useRouter()
  const { id } = router.query

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)

  const [formData, setFormData] = useState({
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_option: 'A',
    marks: 1
  })
  const [success, setSuccess] = useState<string | null>(null)

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

      await fetchQuestion()
      setLoading(false)
    }

    checkAdminAndFetch()
  }, [id, router])

  const fetchQuestion = async () => {
    const { data, error } = await db
      .from('questions')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      setNotFound(true)
      return
    }

    setFormData({
      question_text: data.question_text || '',
      option_a: data.option_a || '',
      option_b: data.option_b || '',
      option_c: data.option_c || '',
      option_d: data.option_d || '',
      correct_option: data.correct_option || 'A',
      marks: data.marks || 1
    })
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const { error: updateError } = await db
        .from('questions')
        .update({
          question_text: formData.question_text.trim(),
          option_a: formData.option_a.trim(),
          option_b: formData.option_b.trim(),
          option_c: formData.option_c.trim(),
          option_d: formData.option_d.trim(),
          correct_option: formData.correct_option,
          marks: formData.marks
        })
        .eq('id', id)

      if (updateError) {
        throw new Error(updateError.message)
      }

      setSuccess('Question updated successfully!')
      setTimeout(() => {
        router.push('/admin/questions')
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="container mt-4">
        <p>Loading question</p>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">Question not found.</div>
        <Link href="/admin/questions" className="btn btn-secondary">
          Back to Questions
        </Link>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Edit Question  CCC Exam Portal</title>
      </Head>
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h1 className="h4 mb-0">Edit Question</h1>
          <Link href="/admin/questions" className="btn btn-outline-secondary btn-sm">
            Back to Questions
          </Link>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success" role="alert">
            {success}
          </div>
        )}

        <div className="card">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="question_text" className="form-label">
                  Question Text <span className="text-danger">*</span>
                </label>
                <textarea
                  className="form-control"
                  id="question_text"
                  name="question_text"
                  rows={3}
                  value={formData.question_text}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="option_a" className="form-label">
                    Option A <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="option_a"
                    name="option_a"
                    value={formData.option_a}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="option_b" className="form-label">
                    Option B <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="option_b"
                    name="option_b"
                    value={formData.option_b}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="option_c" className="form-label">
                    Option C <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="option_c"
                    name="option_c"
                    value={formData.option_c}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="option_d" className="form-label">
                    Option D <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="option_d"
                    name="option_d"
                    value={formData.option_d}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="correct_option" className="form-label">
                    Correct Option <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    id="correct_option"
                    name="correct_option"
                    value={formData.correct_option}
                    onChange={handleChange}
                    required
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="marks" className="form-label">
                    Marks <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    id="marks"
                    name="marks"
                    min="1"
                    value={formData.marks}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="d-flex gap-2">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Saving' : 'Update Question'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => router.push('/admin/questions')}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
