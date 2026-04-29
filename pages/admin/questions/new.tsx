// pages/admin/questions/new.tsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { legacyClient } from '../../../lib/legacyClient'
import * as XLSX from 'xlsx'

interface Course {
  id: string
  name: string
}

export default function NewQuestion() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [courses, setCourses] = useState<Course[]>([])

  const [formData, setFormData] = useState({
    course_id: '',
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

  // State for bulk Excel upload
  const [previewQuestions, setPreviewQuestions] = useState<any[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [uploadSummary, setUploadSummary] = useState<{
    total: number
    success: number
    failed: number
    details: string[]
  } | null>(null)
  const [bulkSubmitting, setBulkSubmitting] = useState(false)

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

      // Fetch courses for dropdown
      const { data: coursesData } = await legacyClient
        .from('courses')
        .select('id, name')
        .order('name', { ascending: true })

      if (coursesData) {
        setCourses(coursesData)
      }

      setLoading(false)
    }

    checkAdminAccess()
  }, [router])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Manual submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setSuccess(null)

    // Validate required fields
    if (!formData.course_id) {
      setError('Please select a course. Add courses first from Manage Courses page.')
      setSubmitting(false)
      return
    }

    if (!formData.question_en.trim() && !formData.question_gu.trim()) {
      setError('Please enter either an English or Gujarati question.')
      setSubmitting(false)
      return
    }

    try {
      const { error: insertError } = await legacyClient
        .from('questions')
        .insert({
          course_id: formData.course_id,
          // Backwards compatibility
          question_text: formData.question_en.trim() || formData.question_gu.trim(),
          option_a: formData.optionA_en.trim() || formData.optionA_gu.trim(),
          option_b: formData.optionB_en.trim() || formData.optionB_gu.trim(),
          option_c: formData.optionC_en.trim() || formData.optionC_gu.trim(),
          option_d: formData.optionD_en.trim() || formData.optionD_gu.trim(),

          // Bilingual fields
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

      if (insertError) {
        setError('Insert error: ' + insertError.message)
        setSubmitting(false)
        return
      }

      setSuccess('Question created successfully!')
      setFormData({
        course_id: formData.course_id,
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
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  // Bulk Upload Functions
  const downloadTemplate = () => {
    const templateData = [
      {
        course: 'CCC',
        question_en: 'What does CPU stand for?',
        question_gu: 'CPU નું પૂરું નામ શું છે?',
        optionA_en: 'Central Processing Unit',
        optionA_gu: 'સેન્ટ્રલ પ્રોસેસિંગ યુનિટ',
        optionB_en: 'Central Program Unit',
        optionB_gu: 'સેન્ટ્રલ પ્રોગ્રામ યુનિટ',
        optionC_en: 'Computer Processing Unit',
        optionC_gu: 'કમ્પ્યુટર પ્રોસેસિંગ યુનિટ',
        optionD_en: 'Control Processing Unit',
        optionD_gu: 'કંટ્રોલ પ્રોસેસિંગ યુનિટ',
        correct: 'A',
        marks: 1
      }
    ]
    const worksheet = XLSX.utils.json_to_sheet(templateData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Questions')
    XLSX.writeFile(workbook, 'bilingual_question_template.xlsx')
  }

  const validateExcelRow = (row: any, coursesMap: Record<string, string>) => {
    const errors: string[] = []
    if (!row.course || !row.course.toString().trim()) errors.push('Course required')
    
    const qEn = row.question_en ? row.question_en.toString().trim() : ''
    const qGu = row.question_gu ? row.question_gu.toString().trim() : ''
    
    if (!qEn && !qGu) {
      errors.push('Question required in English or Gujarati')
    }
    
    const correct = row.correct ? row.correct.toString().trim().toUpperCase() : ''
    if (!['A', 'B', 'C', 'D'].includes(correct)) {
      errors.push('Correct option must be A/B/C/D')
    }

    if (row.marks === undefined || row.marks === null || isNaN(Number(row.marks))) {
      errors.push('Marks must be numeric')
    }

    const courseName = row.course ? row.course.toString().trim().toLowerCase() : ''
    if (courseName && !coursesMap[courseName]) {
      errors.push(`Course "${row.course}" not found`)
    }

    const clean = (v: any) => v ? v.toString().trim() : ''

    return {
      isValid: errors.length === 0,
      errors,
      cleanData: {
        course_id: coursesMap[courseName] || '',
        // Backwards compatibility
        question_text: qEn || qGu,
        option_a: clean(row.optionA_en) || clean(row.optionA_gu),
        option_b: clean(row.optionB_en) || clean(row.optionB_gu),
        option_c: clean(row.optionC_en) || clean(row.optionC_gu),
        option_d: clean(row.optionD_en) || clean(row.optionD_gu),
        
        // Bilingual fields
        question_en: qEn,
        question_gu: qGu,
        optionA_en: clean(row.optionA_en),
        optionA_gu: clean(row.optionA_gu),
        optionB_en: clean(row.optionB_en),
        optionB_gu: clean(row.optionB_gu),
        optionC_en: clean(row.optionC_en),
        optionC_gu: clean(row.optionC_gu),
        optionD_en: clean(row.optionD_en),
        optionD_gu: clean(row.optionD_gu),

        correct_option: correct,
        marks: Number(row.marks) || 1
      }
    }
  }

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet)

        const coursesMap: Record<string, string> = {}
        courses.forEach(c => {
          coursesMap[c.name.toLowerCase()] = c.id
        })

        const validatedRows = jsonData.map((row, idx) => {
          const validation = validateExcelRow(row, coursesMap)
          return {
            rowNumber: idx + 2,
            isValid: validation.isValid,
            errors: validation.errors,
            rawData: row,
            cleanData: validation.cleanData
          }
        })

        setPreviewQuestions(validatedRows)
        setShowPreview(true)
      } catch (err: any) {
        setError('Failed to parse Excel file: ' + err.message)
      }
    }
    reader.readAsArrayBuffer(file)
    e.target.value = ''
  }

  const handleConfirmBulkUpload = async () => {
    setBulkSubmitting(true)
    let successCount = 0
    let failedCount = 0
    const details: string[] = []

    const validQuestions = previewQuestions.filter(q => q.isValid)

    for (const item of validQuestions) {
      try {
        const { error: insertError } = await legacyClient
          .from('questions')
          .insert(item.cleanData)

        if (insertError) {
          failedCount++
          details.push(`Row ${item.rowNumber}: ${insertError.message}`)
        } else {
          successCount++
        }
      } catch (err: any) {
        failedCount++
        details.push(`Row ${item.rowNumber}: ${err.message || 'Unknown error'}`)
      }
    }

    const invalidRows = previewQuestions.filter(q => !q.isValid)
    failedCount += invalidRows.length
    invalidRows.forEach(row => {
      details.push(`Row ${row.rowNumber}: ${row.errors.join(', ')}`)
    })

    setUploadSummary({
      total: previewQuestions.length,
      success: successCount,
      failed: failedCount,
      details
    })
    setBulkSubmitting(false)
    setShowPreview(false)
    setPreviewQuestions([])
  }

  if (loading) {
    return <div className="container py-5 text-center"><div className="spinner-border"></div></div>
  }

  return (
    <>
      <Head>
        <title>Add Bilingual Question - CCC Exam Portal</title>
      </Head>
      <div className="container py-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2>Add Bilingual Question</h2>
            <p className="text-muted">Create a single question or use bulk upload</p>
          </div>
          <div>
            <button className="btn btn-outline-primary btn-sm" onClick={downloadTemplate}>
              Download Sample Template
            </button>
          </div>
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

        {courses.length === 0 && (
          <div className="alert alert-warning d-flex align-items-center gap-2" role="alert">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <div>
              <strong>No courses found!</strong> You need to{' '}
              <Link href="/admin/courses" className="alert-link">add courses first</Link>{' '}
              before creating questions.
            </div>
          </div>
        )}

        <div className="card mb-4">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              {/* Course selector */}
              <div className="mb-3">
                <label htmlFor="course_id" className="form-label">
                  Course <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select"
                  id="course_id"
                  name="course_id"
                  value={formData.course_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Select Course --</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </div>

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

              <div className="d-flex gap-2 align-items-center">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting || courses.length === 0}
                >
                  {submitting ? 'Saving...' : 'Save Question'}
                </button>
                
                <input
                  type="file"
                  id="excel-upload-input"
                  accept=".xlsx"
                  style={{ display: 'none' }}
                  onChange={handleExcelUpload}
                />
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={() => document.getElementById('excel-upload-input')?.click()}
                  disabled={courses.length === 0}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="me-1">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  Upload Excel
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

        {/* Upload Summary */}
        {uploadSummary && (
          <div className="card mb-4 border-success">
            <div className="card-header bg-success text-white">
              <h5 className="mb-0">Upload Summary</h5>
            </div>
            <div className="card-body">
              <p><strong>Total Rows:</strong> {uploadSummary.total}</p>
              <p className="text-success"><strong>સફળ (Success):</strong> {uploadSummary.success}</p>
              <p className="text-danger"><strong>Failed:</strong> {uploadSummary.failed}</p>
              
              {uploadSummary.details.length > 0 && (
                <div className="mt-3">
                  <h6>Failure Details:</h6>
                  <div className="bg-light p-3 rounded overflow-auto" style={{ maxHeight: '200px' }}>
                    {uploadSummary.details.map((detail, index) => (
                      <div key={index} className="text-danger mb-1 small">
                        {detail}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Preview Section */}
        {showPreview && (
          <div className="card mb-4">
            <div className="card-header bg-light d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Excel Preview ({previewQuestions.length} rows)</h5>
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleConfirmBulkUpload}
                  disabled={bulkSubmitting || previewQuestions.filter(q => q.isValid).length === 0}
                >
                  {bulkSubmitting ? 'Uploading...' : 'Confirm Upload'}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => { setShowPreview(false); setPreviewQuestions([]); setUploadSummary(null) }}
                >
                  Clear Preview
                </button>
              </div>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive" style={{ maxHeight: '400px' }}>
                <table className="table table-sm table-bordered align-middle mb-0">
                  <thead className="table-dark sticky-top">
                    <tr>
                      <th>Row</th>
                      <th>Course</th>
                      <th>Question (EN)</th>
                      <th>Question (GU)</th>
                      <th>Correct</th>
                      <th>Marks</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewQuestions.map((row, index) => (
                      <tr key={index} className={row.isValid ? '' : 'table-danger'}>
                        <td>{row.rowNumber}</td>
                        <td>{row.rawData.course || <span className="text-muted">Empty</span>}</td>
                        <td>{row.rawData.question_en || <span className="text-muted">Empty</span>}</td>
                        <td>{row.rawData.question_gu || <span className="text-muted">Empty</span>}</td>
                        <td>{row.rawData.correct || <span className="text-muted">Empty</span>}</td>
                        <td>{row.rawData.marks !== undefined ? row.rawData.marks : <span className="text-muted">Empty</span>}</td>
                        <td>
                          {row.isValid ? (
                            <span className="badge bg-success">Valid</span>
                          ) : (
                            <span className="badge bg-danger" title={row.errors.join(', ')}>
                              Invalid
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
