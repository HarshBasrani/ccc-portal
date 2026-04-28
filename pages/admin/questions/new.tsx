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

  // Form Data for manual entry
  const [formData, setFormData] = useState({
    course_id: '',
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
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

    if (!formData.question_text.trim() || !formData.option_a.trim() || !formData.option_b.trim() || !formData.option_c.trim() || !formData.option_d.trim()) {
      setError('Please fill in all required fields.')
      setSubmitting(false)
      return
    }

    try {
      const { error: insertError } = await legacyClient
        .from('questions')
        .insert({
          course_id: formData.course_id,
          question_text: formData.question_text.trim(),
          option_a: formData.option_a.trim(),
          option_b: formData.option_b.trim(),
          option_c: formData.option_c.trim(),
          option_d: formData.option_d.trim(),
          correct_option: formData.correct_option,
          marks: formData.marks
        })

      if (insertError) {
        throw new Error(insertError.message)
      }

      setSuccess('Question created successfully!')
      setTimeout(() => {
        router.push('/admin/questions')
      }, 1500)
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
        question: 'What does CPU stand for?',
        optionA: 'Central Processing Unit',
        optionB: 'Central Program Unit',
        optionC: 'Computer Processing Unit',
        optionD: 'Control Processing Unit',
        correct: 'A',
        marks: 1
      }
    ]
    const worksheet = XLSX.utils.json_to_sheet(templateData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Questions')
    XLSX.writeFile(workbook, 'question_template.xlsx')
  }

  const validateExcelRow = (row: any, coursesMap: Record<string, string>) => {
    const errors: string[] = []
    if (!row.course || !row.course.toString().trim()) errors.push('Course required')
    if (!row.question || !row.question.toString().trim()) errors.push('Question required')
    if (!row.optionA || !row.optionA.toString().trim()) errors.push('Option A required')
    if (!row.optionB || !row.optionB.toString().trim()) errors.push('Option B required')
    if (!row.optionC || !row.optionC.toString().trim()) errors.push('Option C required')
    if (!row.optionD || !row.optionD.toString().trim()) errors.push('Option D required')
    
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

    return {
      isValid: errors.length === 0,
      errors,
      cleanData: {
        course_id: coursesMap[courseName] || '',
        question_text: row.question ? row.question.toString().trim() : '',
        option_a: row.optionA ? row.optionA.toString().trim() : '',
        option_b: row.optionB ? row.optionB.toString().trim() : '',
        option_c: row.optionC ? row.optionC.toString().trim() : '',
        option_d: row.optionD ? row.optionD.toString().trim() : '',
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

        if (jsonData.length === 0) {
          setError('The uploaded Excel file is empty.')
          return
        }

        const coursesMap: Record<string, string> = {}
        courses.forEach(c => {
          coursesMap[c.name.toLowerCase().trim()] = c.id
        })

        const validatedData = jsonData.map((row, index) => {
          const validation = validateExcelRow(row, coursesMap)
          return {
            rowNumber: index + 2, // Excel row number (1-indexed + header)
            rawData: row,
            ...validation
          }
        })

        setPreviewQuestions(validatedData)
        setShowPreview(true)
        setUploadSummary(null)
        setError(null)
      } catch (err: any) {
        setError(`Failed to parse Excel file: ${err.message}`)
      }
    }
    reader.readAsArrayBuffer(file)
    e.target.value = '' // Reset file input
  }

  const handleConfirmBulkUpload = async () => {
    setBulkSubmitting(true)
    setError(null)
    setSuccess(null)

    let successCount = 0
    let failedCount = 0
    const failedDetails: string[] = []

    const validRows = previewQuestions.filter(q => q.isValid)

    for (const row of validRows) {
      try {
        const { error: insertError } = await legacyClient
          .from('questions')
          .insert(row.cleanData)

        if (insertError) {
          throw new Error(insertError.message)
        }
        successCount++
      } catch (err: any) {
        failedCount++
        failedDetails.push(`Row ${row.rowNumber}: ${err.message}`)
      }
    }

    previewQuestions.forEach(row => {
      if (!row.isValid) {
        failedCount++
        failedDetails.push(`Row ${row.rowNumber}: ${row.errors.join(', ')}`)
      }
    })

    setUploadSummary({
      total: previewQuestions.length,
      success: successCount,
      failed: failedCount,
      details: failedDetails
    })

    setBulkSubmitting(false)

    if (successCount > 0) {
      setSuccess(`सफल: ${successCount} questions uploaded successfully!`)
    }
  }

  if (loading) {
    return (
      <div className="container mt-4">
        <p>Checking admin access</p>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Add New Question | CCC Exam Portal</title>
      </Head>
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h1 className="h4 mb-0">Add New Question</h1>
          <div className="d-flex gap-2">
            <button 
              type="button" 
              className="btn btn-outline-success btn-sm"
              onClick={downloadTemplate}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="me-1">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download Sample Excel
            </button>
            <Link href="/admin/questions" className="btn btn-outline-secondary btn-sm">
              Back to Questions
            </Link>
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
                {courses.length === 0 && (
                  <div className="form-text text-danger">
                    No courses available.{' '}
                    <Link href="/admin/courses">Create one here</Link>.
                  </div>
                )}
              </div>

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
              <p className="text-success"><strong>सफल (Success):</strong> {uploadSummary.success}</p>
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
                      <th>Question</th>
                      <th>Option A</th>
                      <th>Option B</th>
                      <th>Option C</th>
                      <th>Option D</th>
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
                        <td>{row.rawData.question || <span className="text-muted">Empty</span>}</td>
                        <td>{row.rawData.optionA || <span className="text-muted">Empty</span>}</td>
                        <td>{row.rawData.optionB || <span className="text-muted">Empty</span>}</td>
                        <td>{row.rawData.optionC || <span className="text-muted">Empty</span>}</td>
                        <td>{row.rawData.optionD || <span className="text-muted">Empty</span>}</td>
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
