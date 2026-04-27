import { FormEvent, useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Id } from '../../../convex/_generated/dataModel'
import { getSession } from '../../../lib/session'

export default function AdminAddStudentPage() {
  const router = useRouter()

  // ── Session-based admin guard ──────────────────────────────────
  const [sessionProfileId, setSessionProfileId] = useState<Id<"profiles"> | null>(null)

  useEffect(() => {
    const session = getSession()
    if (!session) {
      router.push('/login')
      return
    }
    if (session.role !== 'admin') {
      router.push('/student/dashboard')
      return
    }
    setSessionProfileId(session.profileId as Id<"profiles">)
  }, [router])

  // Reactive profile lookup
  const currentUser = useQuery(
    api.profiles.getMe,
    sessionProfileId ? { profileId: sessionProfileId } : "skip"
  )

  // ── Convex mutations ──────────────────────────────────────────
  const generateUploadUrl = useMutation(api.students.generateUploadUrl)
  const createStudent = useMutation(api.students.createStudent)

  // ── Form fields ───────────────────────────────────────────────
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [fatherName, setFatherName] = useState('')
  const [motherName, setMotherName] = useState('')
  const [gender, setGender] = useState('Male')
  const [address, setAddress] = useState('')
  const [mobileNo, setMobileNo] = useState('')
  const [country, setCountry] = useState('India')
  const [state, setState] = useState('')
  const [city, setCity] = useState('')
  const [pincode, setPincode] = useState('')
  const [category, setCategory] = useState('')
  const [email, setEmail] = useState('')
  const [lastQualification, setLastQualification] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [fees, setFees] = useState('500')
  const [paymentMode, setPaymentMode] = useState('')
  const [dob, setDob] = useState('')
  const [enrollmentNo, setEnrollmentNo] = useState('')

  const [photo, setPhoto] = useState<File | null>(null)
  const [certificate, setCertificate] = useState<File | null>(null)

  const [acceptTerms, setAcceptTerms] = useState(false)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // ── Auto-generated IDs ────────────────────────────────────────
  useEffect(() => {
    const now = new Date()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const year = now.getFullYear()
    const randomNum = Math.floor(100 + Math.random() * 900)
    setUsername(`IC/${month}/${year}/2/${randomNum}`)
    setEnrollmentNo(`CCC${year}${Math.floor(1000 + Math.random() * 9000)}`)
  }, [])

  // ── Submit handler with dual-upload flow ──────────────────────
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      setError('Required fields are missing.')
      return
    }

    if (!acceptTerms) {
      setError('You must accept the Terms & Conditions.')
      return
    }

    setSaving(true)

    try {
      let photoStorageId: string | null = null
      let certStorageId: string | null = null

      // Upload Photo
      if (photo) {
        const postUrl = await generateUploadUrl()
        const result = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": photo.type },
          body: photo,
        })
        const json = await result.json()
        photoStorageId = json.storageId
      }

      // Upload Certificate
      if (certificate) {
        const postUrl = await generateUploadUrl()
        const result = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": certificate.type },
          body: certificate,
        })
        const json = await result.json()
        certStorageId = json.storageId
      }

      // Save to Convex
      await createStudent({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        fatherName: fatherName.trim(),
        motherName: motherName.trim(),
        gender,
        dob,
        phone: mobileNo.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        country,
        pincode: pincode.trim(),
        category,
        email: email.trim(),
        lastQualification: lastQualification.trim(),
        username,
        password,
        enrollmentNo,
        fees: parseFloat(fees) || 500,
        paymentMode,
        photoStorageId,
        certStorageId,
      })

      setSuccess('Student created successfully!')
      setTimeout(() => router.push('/admin/students'), 2000)

    } catch (err: any) {
      setError(err.message || 'Error saving to database.')
    } finally {
      setSaving(false)
    }
  }

  // ── Loading state ─────────────────────────────────────────────
  if (!sessionProfileId || currentUser === undefined) {
    return <div className="container mt-5">Verifying Admin Status...</div>
  }

  return (
    <>
      <Head><title>New Student | CCC Portal</title></Head>
      <div className="container mt-4 mb-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="h3">Student Registration</h1>
          <Link href="/admin/students" className="btn btn-outline-secondary">Back</Link>
        </div>

        <div className="card shadow-sm">
          {/* Header */}
          <div
            className="card-header"
            style={{
              background: 'linear-gradient(135deg, #5b9bd5 0%, #4a8cc7 100%)',
              color: '#fff',
              padding: '12px 20px',
            }}
          >
            <h5 className="mb-0" style={{ fontWeight: 600 }}>Student Registration Form</h5>
          </div>

          {/* Body */}
          <div className="card-body" style={{ backgroundColor: '#fdfdfd' }}>
            <form onSubmit={handleSubmit}>

              {/* Row 1 – First Name / Last Name */}
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold">First Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">Last Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Row 2 – Father Name / Mother Name */}
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold">Father Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={fatherName}
                    onChange={e => setFatherName(e.target.value)}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">Mother Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={motherName}
                    onChange={e => setMotherName(e.target.value)}
                  />
                </div>
              </div>

              {/* Row 3 – Gender (radio buttons) */}
              <div className="mb-3">
                <label className="form-label fw-bold me-3">Gender</label>
                <div className="form-check form-check-inline">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="gender"
                    id="genderMale"
                    value="Male"
                    checked={gender === 'Male'}
                    onChange={() => setGender('Male')}
                  />
                  <label className="form-check-label" htmlFor="genderMale">Male</label>
                </div>
                <div className="form-check form-check-inline">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="gender"
                    id="genderFemale"
                    value="Female"
                    checked={gender === 'Female'}
                    onChange={() => setGender('Female')}
                  />
                  <label className="form-check-label" htmlFor="genderFemale">Female</label>
                </div>
              </div>

              {/* Row 4 – Address (full-width textarea) */}
              <div className="mb-3">
                <label className="form-label fw-bold">Address</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                />
              </div>

              {/* Row 5 – Mobile No / Country */}
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold">Mobile No</label>
                  <input
                    type="tel"
                    className="form-control"
                    value={mobileNo}
                    onChange={e => setMobileNo(e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">Country</label>
                  <input
                    type="text"
                    className="form-control"
                    value={country}
                    onChange={e => setCountry(e.target.value)}
                  />
                </div>
              </div>

              {/* Row 6 – State / City */}
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold">State</label>
                  <input
                    type="text"
                    className="form-control"
                    value={state}
                    onChange={e => setState(e.target.value)}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">City</label>
                  <input
                    type="text"
                    className="form-control"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                  />
                </div>
              </div>

              {/* Row 7 – Pincode / Select Category */}
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold">Pincode</label>
                  <input
                    type="text"
                    className="form-control"
                    value={pincode}
                    onChange={e => setPincode(e.target.value)}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">Select Category</label>
                  <select
                    className="form-select"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                  >
                    <option value="">Select Category</option>
                    <option value="General">General</option>
                    <option value="OBC">OBC</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                    <option value="EWS">EWS</option>
                  </select>
                </div>
              </div>

              {/* Row 8 – Email Address / Last Qualification */}
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold">Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">Last Qualification</label>
                  <input
                    type="text"
                    className="form-control"
                    value={lastQualification}
                    onChange={e => setLastQualification(e.target.value)}
                  />
                </div>
              </div>

              {/* Row 9 – Attach Photo / Attach Certificate */}
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold">Attach Photo</label>
                  <input
                    type="file"
                    className="form-control"
                    accept="image/*"
                    onChange={e => setPhoto(e.target.files?.[0] || null)}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">Attach last Qualification Certificate</label>
                  <input
                    type="file"
                    className="form-control"
                    accept="image/*,.pdf"
                    onChange={e => setCertificate(e.target.files?.[0] || null)}
                  />
                </div>
              </div>

              {/* Row 10 – User Name (auto) / Password */}
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold">User Name</label>
                  <input
                    type="text"
                    className="form-control bg-light"
                    value={username}
                    readOnly
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">Password</label>
                  <input
                    type="password"
                    title="password"
                    className="form-control"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Row 11 – Fees / Select Payment Mode */}
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold">Fees</label>
                  <input
                    type="text"
                    className="form-control bg-light"
                    value={fees}
                    readOnly
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">Select Payment Mode</label>
                  <select
                    className="form-select"
                    value={paymentMode}
                    onChange={e => setPaymentMode(e.target.value)}
                  >
                    <option value="">Select Payment Mode</option>
                    <option value="Cash">Cash</option>
                    <option value="Online">Online</option>
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>

              {/* Terms & Conditions checkbox */}
              <div className="mb-4">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="acceptTerms"
                    checked={acceptTerms}
                    onChange={e => setAcceptTerms(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="acceptTerms">
                    I Accept The{' '}
                    <Link href="/student-terms" style={{ color: '#5b9bd5' }}>
                      Terms &amp; Conditions
                    </Link>
                  </label>
                </div>
              </div>

              {/* Alerts */}
              {error && <div className="alert alert-danger">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}

              {/* Submit button */}
              <button
                type="submit"
                className="btn text-white px-4 py-2"
                style={{ backgroundColor: '#5b9bd5', border: 'none' }}
                disabled={saving}
              >
                {saving ? 'Processing...' : 'Submit'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}