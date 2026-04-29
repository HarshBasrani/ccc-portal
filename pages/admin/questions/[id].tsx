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
    question_en: '',
    question_gu: '',
    optionA_en: '',
    optionA_gu: '',
    optionB_en: '',
    optionB_gu: '',
    optionC_en: '',
    optionC_gu: '',
    optionD_en: '',
    optionD_gu: '',
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
      question_en: data.question_en || data.question_text || '',
      question_gu: data.question_gu || '',
      optionA_en: data.optionA_en || data.option_a || '',
      optionA_gu: data.optionA_gu || '',
      optionB_en: data.optionB_en || data.option_b || '',
      optionB_gu: data.optionB_gu || '',
      optionC_en: data.optionC_en || data.option_c || '',
      optionC_gu: data.optionC_gu || '',
      optionD_en: data.optionD_en || data.option_d || '',
      optionD_gu: data.optionD_gu || '',
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
          question_text: formData.question_en.trim() || formData.question_text.trim() || formData.question_gu.trim(),
          option_a: formData.optionA_en.trim() || formData.option_a.trim() || formData.optionA_gu.trim(),
          option_b: formData.optionB_en.trim() || formData.option_b.trim() || formData.optionB_gu.trim(),
          option_c: formData.optionC_en.trim() || formData.option_c.trim() || formData.optionC_gu.trim(),
          option_d: formData.optionD_en.trim() || formData.option_d.trim() || formData.optionD_gu.trim(),
          
          question_en: formData.question_en.trim(),
          question_gu: formData.question_gu.trim(),
          optionA_en: formData.optionA_en.trim(),
          optionA_gu: formData.optionA_gu.trim(),
          optionB_en: formData.optionB_en.trim(),
          optionB_gu: formData.optionB_gu.trim(),
          optionC_en: formData.optionC_en.trim(),
          optionC_gu: formData.optionC_gu.trim(),
          optionD_en: formData.optionD_en.trim(),
          optionD_gu: formData.optionD_gu.trim(),

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
              {/* Question Texts Side-by-Side */}
              <div className="row mb-3">
                <div className="col-md-6">
                  <label htmlFor="question_en" className="form-label">
                    Question (English)
                  </label>
                  <textarea
                    className="form-control"
                    id="question_en"
                    name="question_en"
                    rows={3}
                    value={formData.question_en}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="question_gu" className="form-label">
                    Question (Gujarati)
                  </label>
                  <textarea
                    className="form-control"
                    id="question_gu"
                    name="question_gu"
                    rows={3}
                    value={formData.question_gu}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Option A */}
              <div className="row mb-3">
                <div className="col-md-6">
                  <label htmlFor="optionA_en" className="form-label">
                    Option A (English)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="optionA_en"
                    name="optionA_en"
                    value={formData.optionA_en}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="optionA_gu" className="form-label">
                    Option A (Gujarati)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="optionA_gu"
                    name="optionA_gu"
                    value={formData.optionA_gu}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Option B */}
              <div className="row mb-3">
                <div className="col-md-6">
                  <label htmlFor="optionB_en" className="form-label">
                    Option B (English)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="optionB_en"
                    name="optionB_en"
                    value={formData.optionB_en}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="optionB_gu" className="form-label">
                    Option B (Gujarati)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="optionB_gu"
                    name="optionB_gu"
                    value={formData.optionB_gu}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Option C */}
              <div className="row mb-3">
                <div className="col-md-6">
                  <label htmlFor="optionC_en" className="form-label">
                    Option C (English)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="optionC_en"
                    name="optionC_en"
                    value={formData.optionC_en}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="optionC_gu" className="form-label">
                    Option C (Gujarati)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="optionC_gu"
                    name="optionC_gu"
                    value={formData.optionC_gu}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Option D */}
              <div className="row mb-3">
                <div className="col-md-6">
                  <label htmlFor="optionD_en" className="form-label">
                    Option D (English)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="optionD_en"
                    name="optionD_en"
                    value={formData.optionD_en}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="optionD_gu" className="form-label">
                    Option D (Gujarati)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="optionD_gu"
                    name="optionD_gu"
                    value={formData.optionD_gu}
                    onChange={handleChange}
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
