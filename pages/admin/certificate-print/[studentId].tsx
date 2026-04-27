import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { db } from '../../../lib/dbClient'

interface Student {
  id: string
  full_name: string
  first_name: string
  last_name: string
  father_name: string
  mother_name: string
  enrollment_no: string
  username: string
  photo_url?: string
}

interface ExamAttempt {
  id: string
  percentage: number
  score: number
  submitted_at: string
}

export default function CertificatePrint() {
  const router = useRouter()
  const { studentId } = router.query
  
  const [student, setStudent] = useState<Student | null>(null)
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null)
  const [loading, setLoading] = useState(true)

  // Calculate grade from percentage
  const getGrade = (percentage: number) => {
    if (percentage >= 85) return 'S'
    if (percentage >= 75) return 'A'
    if (percentage >= 65) return 'B'
    if (percentage >= 55) return 'C'
    if (percentage >= 45) return 'D'
    return 'F'
  }
  const [error, setError] = useState<string | null>(null)
  const [showGuides, setShowGuides] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showPositioning, setShowPositioning] = useState(false)
  const [scale, setScale] = useState(1)
  const [fieldSizes, setFieldSizes] = useState({
    photo: { width: 25, height: 30 }, // in mm
    serial: { fontSize: 16 },
    studentName: { fontSize: 16 },
    fatherName: { fontSize: 16 },
    motherName: { fontSize: 16 },
    completionDate: { fontSize: 16 },
    issueDate: { fontSize: 16 },
    grade: { fontSize: 16 }
  })
  const [isDragging, setIsDragging] = useState<string | null>(null)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [cssInput, setCssInput] = useState('')
  
  // Field positioning state
  const [positions, setPositions] = useState({
    serial: { top: 15, left: 160 },
    studentName: { top: 88, left: 45 },
    fatherName: { top: 115, left: 45 },
    motherName: { top: 105, left: 45 },
    completionDate: { top: 145, left: 45 },
    issueDate: { top: 200, left: 25 },
    grade: { top: 200, left: 160 },
    photo: { top: 20, right: 25 }
  })

  // Pre-compute stable random fallback serial (avoids impure Math.random in render)
  const fallbackSerial = useMemo(() => {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `CCC/${year}/${month}/${random}`
  }, [])

  // Generate serial number from username (SI.No)
  const generateSerial = () => {
    if (student?.username) {
      return student.username
    }
    return fallbackSerial
  }

  // Construct full student name from database fields
  const getFullStudentName = () => {
    if (!student) return 'Student Name'
    
    const parts = []
    if (student.last_name) parts.push(student.last_name)
    if (student.first_name) parts.push(student.first_name)
    if (student.father_name) parts.push(student.father_name)
    
    const fullName = parts.length > 0 ? parts.join(' ') : student.full_name || 'Student Name'
    return fullName
  }

  // Handle drag start
  const handleMouseDown = (e: React.MouseEvent, fieldName: string) => {
    if (!showPositioning) return
    
    e.preventDefault()
    setIsDragging(fieldName)
    setDragStart({
      x: e.clientX,
      y: e.clientY
    })
  }

  // Handle drag move
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !showPositioning) return

    const deltaX = e.clientX - dragStart.x
    const deltaY = e.clientY - dragStart.y
    
    // Convert pixels to mm (rough conversion for A4: 1mm  3.78px)
    const deltaXmm = deltaX / 3.78
    const deltaYmm = deltaY / 3.78

    setPositions(prev => ({
      ...prev,
      [isDragging]: isDragging === 'photo' 
        ? {
            top: Math.max(0, Math.min(290, prev.photo.top + deltaYmm)),
            right: Math.max(0, Math.min(200, prev.photo.right - deltaXmm))
          }
        : {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            top: Math.max(0, Math.min(290, (prev[isDragging as keyof typeof prev] as any).top + deltaYmm)),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            left: Math.max(0, Math.min(200, (prev[isDragging as keyof typeof prev] as any).left + deltaXmm))
          }
    }))

    setDragStart({
      x: e.clientX,
      y: e.clientY
    })
  }

  // Handle drag end
  const handleMouseUp = () => {
    setIsDragging(null)
  }

  // Update field position
  const updatePosition = (field: string, property: string, value: number) => {
    setPositions(prev => ({
      ...prev,
      [field]: {
        ...prev[field as keyof typeof prev],
        [property]: value
      }
    }))
  }

  // Update field size
  const updateFieldSize = (field: string, property: string, value: number) => {
    setFieldSizes(prev => ({
      ...prev,
      [field]: {
        ...prev[field as keyof typeof prev],
        [property]: value
      }
    }))
  }

  // Apply CSS from editor
  const applyCssFromEditor = () => {
    try {
      // Parse CSS and extract values
      const cssLines = cssInput.split('\n')
      const newPositions = {...positions}
      const newFieldSizes = {...fieldSizes}
      
      cssLines.forEach(line => {
        if (line.includes('field-')) {
          const match = line.match(/\.field-([\w-]+)\s*{([^}]+)}/)
          if (match) {
            const fieldName = match[1].replace(/-([a-z])/g, (g) => g[1].toUpperCase())
            const styles = match[2]
            
            // Handle photo field separately (has top/right structure)
            if (fieldName === 'photo') {
              const topMatch = styles.match(/top:\s*([0-9.]+)mm/)
              if (topMatch) {
                newPositions.photo = { ...newPositions.photo, top: parseFloat(topMatch[1]) }
              }
              
              const rightMatch = styles.match(/right:\s*([0-9.]+)mm/)
              if (rightMatch) {
                newPositions.photo = { ...newPositions.photo, right: parseFloat(rightMatch[1]) }
              }
              
              const widthMatch = styles.match(/width:\s*([0-9.]+)mm/)
              if (widthMatch) {
                newFieldSizes.photo = { ...newFieldSizes.photo, width: parseFloat(widthMatch[1]) }
              }
              
              const heightMatch = styles.match(/height:\s*([0-9.]+)mm/)
              if (heightMatch) {
                newFieldSizes.photo = { ...newFieldSizes.photo, height: parseFloat(heightMatch[1]) }
              }
            } else {
              // Handle text fields (have top/left structure)
              const topMatch = styles.match(/top:\s*([0-9.]+)mm/)
              const leftMatch = styles.match(/left:\s*([0-9.]+)mm/)
              const fontMatch = styles.match(/font-size:\s*([0-9.]+)px/)
              
              if (fieldName in newPositions) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const currentPos = newPositions[fieldName as keyof typeof positions] as any
                if (topMatch) currentPos.top = parseFloat(topMatch[1])
                if (leftMatch) currentPos.left = parseFloat(leftMatch[1])
              }
              
              if (fontMatch && fieldName in newFieldSizes) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const currentSize = newFieldSizes[fieldName as keyof typeof fieldSizes] as any
                if ('fontSize' in currentSize) {
                  currentSize.fontSize = parseFloat(fontMatch[1])
                }
              }
            }
          }
        }
      })
      
      setPositions(newPositions)
      setFieldSizes(newFieldSizes)
      alert(' CSS applied successfully!')
    } catch (_error) {
      alert(' Error parsing CSS. Please check the format.')
    }
  }

  // Reset to default positions
  const resetToDefaults = () => {
    setPositions({
      serial: { top: 15, left: 160 },
      studentName: { top: 88, left: 45 },
      fatherName: { top: 115, left: 45 },
      motherName: { top: 105, left: 45 },
      completionDate: { top: 145, left: 45 },
      issueDate: { top: 200, left: 25 },
      grade: { top: 200, left: 160 },
      photo: { top: 20, right: 25 }
    })
    setFieldSizes({
      photo: { width: 25, height: 30 },
      serial: { fontSize: 16 },
      studentName: { fontSize: 16 },
      fatherName: { fontSize: 16 },
      motherName: { fontSize: 16 },
      completionDate: { fontSize: 16 },
      issueDate: { fontSize: 16 },
      grade: { fontSize: 16 }
    })
    setCssInput(generateCSS())
  }

  // Load exact positioning values from image
  const loadExactValues = () => {
    setPositions({
      serial: { top: 22.67, left: 14.29 },
      studentName: { top: 141.26, left: 94.21 },
      fatherName: { top: 161.09, left: 39.71 },
      motherName: { top: 152.41, left: 73.58 },
      completionDate: { top: 215.42, left: 125.69 },
      issueDate: { top: 235.77, left: 49.87 },
      grade: { top: 233.65, left: 176.4 },
      photo: { top: 20.56, right: 14.35 }
    })
    setFieldSizes({
      photo: { width: 32, height: 39 },
      serial: { fontSize: 17 },
      studentName: { fontSize: 20 },
      fatherName: { fontSize: 21 },
      motherName: { fontSize: 21 },
      completionDate: { fontSize: 17 },
      issueDate: { fontSize: 18 },
      grade: { fontSize: 20 }
    })
    setCssInput(generateCSS())
    alert(' Loaded exact positioning values!')
  }

  // Generate CSS output for copy-paste
  const generateCSS = () => {
    return `
/* Copy this CSS to make changes permanent */
.field-serial { top: ${positions.serial.top}mm; left: ${positions.serial.left}mm; font-size: ${fieldSizes.serial.fontSize}px; font-weight: bold; }
.field-student-name { top: ${positions.studentName.top}mm; left: ${positions.studentName.left}mm; font-size: ${fieldSizes.studentName.fontSize}px; font-weight: 900; }
.field-father-name { top: ${positions.fatherName.top}mm; left: ${positions.fatherName.left}mm; font-size: ${fieldSizes.fatherName.fontSize}px; font-weight: 900; }
.field-mother-name { top: ${positions.motherName.top}mm; left: ${positions.motherName.left}mm; font-size: ${fieldSizes.motherName.fontSize}px; font-weight: 900; }
.field-completion-date { top: ${positions.completionDate.top}mm; left: ${positions.completionDate.left}mm; font-size: ${fieldSizes.completionDate.fontSize}px; font-weight: 900; }
.field-issue-date { top: ${positions.issueDate.top}mm; left: ${positions.issueDate.left}mm; font-size: ${fieldSizes.issueDate.fontSize}px; font-weight: 900; }
.field-grade { top: ${positions.grade.top}mm; left: ${positions.grade.left}mm; font-size: ${fieldSizes.grade.fontSize}px; font-weight: 900; }
.field-photo { top: ${positions.photo.top}mm; right: ${positions.photo.right}mm; width: ${fieldSizes.photo.width}mm; height: ${fieldSizes.photo.height}mm; }
    `.trim()
  }

  // Format issue date (current date)
  const issueDate = new Date().toLocaleDateString('en-GB')
  
  // Format completion date (exam completion date)
  const completionDate = attempt?.submitted_at 
    ? new Date(attempt.submitted_at).toLocaleDateString('en-GB')
    : issueDate // fallback to issue date if no exam data

  useEffect(() => {
    const fetchData = async () => {
      if (!studentId) return

      try {
        // Fetch student data
        const { data: studentData, error: studentError } = await db
          .from('students')
          .select('id, full_name, first_name, last_name, father_name, mother_name, enrollment_no, username, photo_url')
          .eq('id', studentId)
          .single()

        if (studentError) {
          setError('Student not found')
          setLoading(false)
          return
        }

        setStudent(studentData)

        // Fetch latest submitted exam attempt
        const { data: attempts, error: attemptError } = await db
          .from('exam_attempts')
          .select('*')
          .eq('student_id', studentId)
          .eq('status', 'submitted')
          .order('submitted_at', { ascending: false })
          .limit(1)

        if (!attemptError && attempts && attempts.length > 0) {
          setAttempt(attempts[0])
        }

        setLoading(false)
      } catch (_err) {
        setError('Failed to load data')
        setLoading(false)
      }
    }

    fetchData()
  }, [studentId])

  // Initialize CSS input when positions change
  useEffect(() => {
    if (cssInput === '') {
      setCssInput(generateCSS())
    }
  }, [positions, fieldSizes])

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading certificate data...</p>
      </div>
    )
  }

  if (error || !student) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Error: {error || 'Student not found'}</p>
        <button onClick={() => router.back()}>Go Back</button>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Print Certificate - {student.full_name}</title>
        <style>{`
          @media print {
            @page {
              size: A4;
              margin: 0;
            }
            
            body * {
              visibility: hidden;
            }
            
            .cert-page,
            .cert-page *,
            .cert-a4,
            .cert-a4 * {
              visibility: visible !important;
            }
            
            .cert-page {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 210mm !important;
              height: 297mm !important;
              background: white !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            
            .cert-a4 {
              width: 210mm !important;
              height: 297mm !important;
              position: relative !important;
              background: white !important;
              transform: none !important;
            }
          }
        `}</style>
      </Head>

      <div className="cert-page">
        <div className="toolbar no-print">
          <button onClick={() => router.back()}> Back</button>
          <button onClick={() => setShowGuides(!showGuides)}>
            {showGuides ? 'Hide' : 'Show'} Grid
          </button>
          <button onClick={() => setShowPreview(!showPreview)}>
            {showPreview ? 'Hide' : 'Show'} Preview
          </button>
          <button onClick={() => setShowPositioning(!showPositioning)}>
            {showPositioning ? 'Hide' : 'Show'} Position Editor
          </button>
          <button onClick={() => setScale(Math.max(0.5, scale - 0.1))}> Size</button>
          <button onClick={() => setScale(Math.min(2, scale + 0.1))}>+ Size</button>
          <span style={{margin: '0 10px', fontWeight: 'bold'}}>{Math.round(scale * 100)}%</span>
          <button onClick={() => window.print()}> Print Certificate</button>
          {showPositioning && (
            <span style={{color: '#007bff', fontWeight: 'bold', marginLeft: '10px'}}>
               DRAG MODE: Click and drag any field to reposition
            </span>
          )}
        </div>

        {/* Main Content Area */}
        <div className="main-content">
          {/* Position Editor Panel */}
          {showPositioning && (
            <div className="position-panel no-print">
              <div className="position-header">
                <h3> Position Editor</h3>
                <p>Drag sliders to adjust field positions in real-time</p>
              </div>
            
            <div className="position-controls">
              {/* Serial Number */}
              <div className="field-control">
                <label> Serial Number</label>
                <div className="sliders">
                  <div>Top: <input type="range" min="5" max="50" value={positions.serial.top} onChange={(e) => updatePosition('serial', 'top', +e.target.value)} /> {positions.serial.top}mm</div>
                  <div>Left: <input type="range" min="100" max="200" value={positions.serial.left} onChange={(e) => updatePosition('serial', 'left', +e.target.value)} /> {positions.serial.left}mm</div>
                  <div>Font Size: <input type="range" min="8" max="24" value={fieldSizes.serial.fontSize} onChange={(e) => updateFieldSize('serial', 'fontSize', +e.target.value)} /> {fieldSizes.serial.fontSize}px</div>
                </div>
              </div>

              {/* Student Name */}
              <div className="field-control">
                <label> Student Name</label>
                <div className="sliders">
                  <div>Top: <input type="range" min="60" max="120" value={positions.studentName.top} onChange={(e) => updatePosition('studentName', 'top', +e.target.value)} /> {positions.studentName.top}mm</div>
                  <div>Left: <input type="range" min="20" max="100" value={positions.studentName.left} onChange={(e) => updatePosition('studentName', 'left', +e.target.value)} /> {positions.studentName.left}mm</div>
                  <div>Font Size: <input type="range" min="10" max="28" value={fieldSizes.studentName.fontSize} onChange={(e) => updateFieldSize('studentName', 'fontSize', +e.target.value)} /> {fieldSizes.studentName.fontSize}px</div>
                </div>
              </div>

              {/* Father Name */}
              <div className="field-control">
                <label> Father Name</label>
                <div className="sliders">
                  <div>Top: <input type="range" min="80" max="140" value={positions.fatherName.top} onChange={(e) => updatePosition('fatherName', 'top', +e.target.value)} /> {positions.fatherName.top}mm</div>
                  <div>Left: <input type="range" min="20" max="100" value={positions.fatherName.left} onChange={(e) => updatePosition('fatherName', 'left', +e.target.value)} /> {positions.fatherName.left}mm</div>
                  <div>Font Size: <input type="range" min="8" max="24" value={fieldSizes.fatherName.fontSize} onChange={(e) => updateFieldSize('fatherName', 'fontSize', +e.target.value)} /> {fieldSizes.fatherName.fontSize}px</div>
                </div>
              </div>

              {/* Mother Name */}
              <div className="field-control">
                <label> Mother Name</label>
                <div className="sliders">
                  <div>Top: <input type="range" min="90" max="150" value={positions.motherName.top} onChange={(e) => updatePosition('motherName', 'top', +e.target.value)} /> {positions.motherName.top}mm</div>
                  <div>Left: <input type="range" min="20" max="100" value={positions.motherName.left} onChange={(e) => updatePosition('motherName', 'left', +e.target.value)} /> {positions.motherName.left}mm</div>
                  <div>Font Size: <input type="range" min="8" max="24" value={fieldSizes.motherName.fontSize} onChange={(e) => updateFieldSize('motherName', 'fontSize', +e.target.value)} /> {fieldSizes.motherName.fontSize}px</div>
                </div>
              </div>

              {/* Grade */}
              <div className="field-control">
                <label> Grade</label>
                <div className="sliders">
                  <div>Top: <input type="range" min="180" max="250" value={positions.grade.top} onChange={(e) => updatePosition('grade', 'top', +e.target.value)} /> {positions.grade.top}mm</div>
                  <div>Left: <input type="range" min="120" max="190" value={positions.grade.left} onChange={(e) => updatePosition('grade', 'left', +e.target.value)} /> {positions.grade.left}mm</div>
                  <div>Font Size: <input type="range" min="10" max="32" value={fieldSizes.grade.fontSize} onChange={(e) => updateFieldSize('grade', 'fontSize', +e.target.value)} /> {fieldSizes.grade.fontSize}px</div>
                </div>
              </div>

              {/* Issue Date */}
              <div className="field-control">
                <label> Issue Date</label>
                <div className="sliders">
                  <div>Top: <input type="range" min="180" max="250" value={positions.issueDate.top} onChange={(e) => updatePosition('issueDate', 'top', +e.target.value)} /> {positions.issueDate.top}mm</div>
                  <div>Left: <input type="range" min="20" max="80" value={positions.issueDate.left} onChange={(e) => updatePosition('issueDate', 'left', +e.target.value)} /> {positions.issueDate.left}mm</div>
                  <div>Font Size: <input type="range" min="8" max="20" value={fieldSizes.issueDate.fontSize} onChange={(e) => updateFieldSize('issueDate', 'fontSize', +e.target.value)} /> {fieldSizes.issueDate.fontSize}px</div>
                </div>
              </div>

              {/* Completion Date */}
              <div className="field-control">
                <label> Completion Date</label>
                <div className="sliders">
                  <div>Top: <input type="range" min="120" max="180" value={positions.completionDate.top} onChange={(e) => updatePosition('completionDate', 'top', +e.target.value)} /> {positions.completionDate.top}mm</div>
                  <div>Left: <input type="range" min="20" max="100" value={positions.completionDate.left} onChange={(e) => updatePosition('completionDate', 'left', +e.target.value)} /> {positions.completionDate.left}mm</div>
                  <div>Font Size: <input type="range" min="8" max="20" value={fieldSizes.completionDate.fontSize} onChange={(e) => updateFieldSize('completionDate', 'fontSize', +e.target.value)} /> {fieldSizes.completionDate.fontSize}px</div>
                </div>
              </div>

              {/* Photo */}
              <div className="field-control">
                <label> Photo</label>
                <div className="sliders">
                  <div>Top: <input type="range" min="10" max="60" value={positions.photo.top} onChange={(e) => updatePosition('photo', 'top', +e.target.value)} /> {positions.photo.top}mm</div>
                  <div>Right: <input type="range" min="15" max="50" value={positions.photo.right || 25} onChange={(e) => updatePosition('photo', 'right', +e.target.value)} /> {positions.photo.right || 25}mm</div>
                  <div>Width: <input type="range" min="15" max="40" value={fieldSizes.photo.width} onChange={(e) => updateFieldSize('photo', 'width', +e.target.value)} /> {fieldSizes.photo.width}mm</div>
                  <div>Height: <input type="range" min="20" max="50" value={fieldSizes.photo.height} onChange={(e) => updateFieldSize('photo', 'height', +e.target.value)} /> {fieldSizes.photo.height}mm</div>
                </div>
              </div>
            </div>

            <div className="css-editor">
              <h4> CSS Editor</h4>
              <p>Edit CSS directly or paste your perfect CSS here:</p>
              <textarea 
                value={cssInput} 
                onChange={(e) => setCssInput(e.target.value)}
                rows={12} 
                placeholder="Paste your CSS here or edit the generated CSS..."
                style={{
                  width: '100%',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  padding: '10px'
                }}
              />
              <div style={{marginTop: '10px', display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
                <button onClick={applyCssFromEditor} style={{background: '#28a745', color: 'white'}}>
                   Apply CSS to Certificate
                </button>
                <button onClick={() => setCssInput(generateCSS())} style={{background: '#17a2b8', color: 'white'}}>
                   Load Current Positions
                </button>
                <button onClick={loadExactValues} style={{background: '#fd7e14', color: 'white'}}>
                   Load Exact Values
                </button>
                <button onClick={() => navigator.clipboard.writeText(cssInput)} style={{background: '#6c757d', color: 'white'}}>
                   Copy CSS
                </button>
                <button onClick={resetToDefaults} style={{background: '#dc3545', color: 'white'}}>
                   Reset to Defaults
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Certificate Preview Area */}
        <div className="certificate-area">
        <div 
          className={`cert-a4 ${showPreview ? 'with-preview' : ''}`}
          style={{transform: `scale(${scale})`, transformOrigin: 'top center'}}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Alignment Guides */}
          {showGuides && (
            <>
              {/* Horizontal guides every 10mm */}
              {Array.from({length: 30}, (_, i) => (
                <div key={`h-${i}`} className="guide-horizontal" style={{top: `${i * 10}mm`}} />
              ))}
              {/* Vertical guides every 10mm */}
              {Array.from({length: 22}, (_, i) => (
                <div key={`v-${i}`} className="guide-vertical" style={{left: `${i * 10}mm`}} />
              ))}
              {/* Corner markers */}
              <div className="corner-marker" style={{top: '10mm', left: '10mm'}}>10,10</div>
              <div className="corner-marker" style={{top: '10mm', right: '10mm'}}>200,10</div>
              <div className="corner-marker" style={{bottom: '10mm', left: '10mm'}}>10,287</div>
              <div className="corner-marker" style={{bottom: '10mm', right: '10mm'}}>200,287</div>
            </>
          )}

          {/* Student Photo */}
          {student.photo_url && (
            <img 
              src={student.photo_url} 
              alt="Student Photo"
              className={`cert-photo field-photo ${showPositioning ? 'draggable' : ''} ${isDragging === 'photo' ? 'dragging' : ''}`}
              style={{
                top: `${positions.photo.top}mm`, 
                right: `${positions.photo.right}mm`,
                width: `${fieldSizes.photo.width}mm`,
                height: `${fieldSizes.photo.height}mm`
              }}
              onMouseDown={(e) => handleMouseDown(e, 'photo')}
              draggable={false}
            />
          )}
          
          {/* Text Fields */}
          <span 
            className={`cert-text field-serial ${showPositioning ? 'draggable' : ''} ${isDragging === 'serial' ? 'dragging' : ''}`} 
            style={{
              top: `${positions.serial.top}mm`, 
              left: `${positions.serial.left}mm`,
              fontSize: `${fieldSizes.serial.fontSize}px`
            }}
            onMouseDown={(e) => handleMouseDown(e, 'serial')}
          >
            {generateSerial()}
          </span>
          
          <span 
            className={`cert-text field-student-name ${showPositioning ? 'draggable' : ''} ${isDragging === 'studentName' ? 'dragging' : ''}`} 
            style={{
              top: `${positions.studentName.top}mm`, 
              left: `${positions.studentName.left}mm`,
              fontSize: `${fieldSizes.studentName.fontSize}px`
            }}
            onMouseDown={(e) => handleMouseDown(e, 'studentName')}
          >
            {getFullStudentName()}
          </span>
          
          <span 
            className={`cert-text field-father-name ${showPositioning ? 'draggable' : ''} ${isDragging === 'fatherName' ? 'dragging' : ''}`} 
            style={{
              top: `${positions.fatherName.top}mm`, 
              left: `${positions.fatherName.left}mm`,
              fontSize: `${fieldSizes.fatherName.fontSize}px`
            }}
            onMouseDown={(e) => handleMouseDown(e, 'fatherName')}
          >
            {student.father_name}
          </span>
          
          <span 
            className={`cert-text field-mother-name ${showPositioning ? 'draggable' : ''} ${isDragging === 'motherName' ? 'dragging' : ''}`} 
            style={{
              top: `${positions.motherName.top}mm`, 
              left: `${positions.motherName.left}mm`,
              fontSize: `${fieldSizes.motherName.fontSize}px`
            }}
            onMouseDown={(e) => handleMouseDown(e, 'motherName')}
          >
            {student.mother_name}
          </span>
          
          <span 
            className={`cert-text field-issue-date ${showPositioning ? 'draggable' : ''} ${isDragging === 'issueDate' ? 'dragging' : ''}`} 
            style={{
              top: `${positions.issueDate.top}mm`, 
              left: `${positions.issueDate.left}mm`,
              fontSize: `${fieldSizes.issueDate.fontSize}px`
            }}
            onMouseDown={(e) => handleMouseDown(e, 'issueDate')}
          >
            {issueDate}
          </span>
          
          <span 
            className={`cert-text field-grade ${showPositioning ? 'draggable' : ''} ${isDragging === 'grade' ? 'dragging' : ''}`} 
            style={{
              top: `${positions.grade.top}mm`, 
              left: `${positions.grade.left}mm`,
              fontSize: `${fieldSizes.grade.fontSize}px`
            }}
            onMouseDown={(e) => handleMouseDown(e, 'grade')}
          >
            {attempt?.percentage ? getGrade(attempt.percentage) : 'A'}
          </span>
          
          <span 
            className={`cert-text field-completion-date ${showPositioning ? 'draggable' : ''} ${isDragging === 'completionDate' ? 'dragging' : ''}`} 
            style={{
              top: `${positions.completionDate.top}mm`, 
              left: `${positions.completionDate.left}mm`,
              fontSize: `${fieldSizes.completionDate.fontSize}px`
            }}
            onMouseDown={(e) => handleMouseDown(e, 'completionDate')}
          >
            {completionDate}
          </span>
        </div>
        </div>
        </div>

        <style jsx>{`
        .cert-page {
          padding: 16px;
          background: #eee;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .main-content {
          display: flex;
          gap: 20px;
          width: 100%;
          max-width: 1400px;
          align-items: flex-start;
        }

        .certificate-area {
          flex: 1;
          display: flex;
          justify-content: center;
          min-width: 0;
        }

        .toolbar {
          width: 100%;
          max-width: 1400px;
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
        }

        .toolbar button {
          padding: 8px 16px;
          border: 1px solid #ccc;
          background: #fff;
          cursor: pointer;
          border-radius: 4px;
        }

        .toolbar button:hover {
          background: #f0f0f0;
        }

        .position-panel {
          width: 400px;
          background: #f8f9fa;
          border: 2px solid #dee2e6;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          max-height: 80vh;
          overflow-y: auto;
        }

        .position-header {
          text-align: center;
          margin-bottom: 20px;
          border-bottom: 2px solid #dee2e6;
          padding-bottom: 15px;
        }

        .position-header h3 {
          margin: 0;
          color: #495057;
          font-size: 1.5rem;
        }

        .position-controls {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }

        .field-control {
          background: white;
          padding: 15px;
          border-radius: 6px;
          border: 1px solid #dee2e6;
        }

        .field-control label {
          display: block;
          font-weight: bold;
          margin-bottom: 10px;
          color: #495057;
          font-size: 0.9rem;
        }

        .sliders div {
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .sliders input[type="range"] {
          flex: 1;
          height: 6px;
          background: #ddd;
          outline: none;
          border-radius: 3px;
        }

        .sliders input[type="range"]::-webkit-slider-thumb {
          width: 18px;
          height: 18px;
          background: #007bff;
          cursor: pointer;
          border-radius: 50%;
          -webkit-appearance: none;
        }

        .css-output {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 6px;
          border: 1px solid #dee2e6;
        }

        .css-output h4 {
          margin: 0 0 10px 0;
          color: #495057;
        }

        .css-output textarea {
          width: 100%;
          font-family: 'Courier New', monospace;
          font-size: 12px;
          border: 1px solid #ccc;
          border-radius: 4px;
          padding: 10px;
          resize: vertical;
        }

        .css-output button {
          margin-top: 10px;
          padding: 8px 16px;
          background: #28a745;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .css-output button:hover {
          background: #218838;
        }

        .cert-a4 {
          width: 210mm;
          height: 297mm;
          background: #fff;
          position: relative;
          box-shadow: 0 0 4px rgba(0,0,0,0.2);
        }

        .cert-text {
          position: absolute;
          font-family: 'Times New Roman', serif;
          font-size: 12pt;
          color: #000;
          white-space: nowrap;
          font-weight: 900;
        }

        .cert-photo {
          position: absolute;
          width: 25mm;
          height: 32mm;
          object-fit: cover;
          border: 1px solid #000;
        }

        /* Positioning - Adjust these coordinates based on your certificate */
        .field-serial { 
          top: 15mm; 
          left: 160mm; 
          font-size: 10pt;
          font-weight: bold;
        }

        .field-student-name { 
          top: 88mm; 
          left: 45mm; 
          font-size: 14pt;
          text-transform: uppercase;
        }

        .field-father-name { 
          top: 105mm; 
          left: 45mm; 
          font-size: 12pt;
        }

        .field-mother-name { 
          top: 115mm; 
          left: 45mm; 
          font-size: 12pt;
        }

        .field-course { 
          top: 125mm; 
          left: 45mm; 
          font-size: 11pt;
          font-style: italic;
        }

        .field-completion-date { 
          top: 145mm; 
          left: 45mm; 
          font-size: 11pt;
        }

        .field-issue-date { 
          top: 200mm; 
          left: 25mm; 
          font-size: 11pt;
        }

        .field-grade { 
          top: 200mm; 
          left: 160mm; 
          font-size: 14pt;
        }

        .field-photo { 
          top: 20mm; 
          right: 25mm; 
        }

        /* Alignment Guides */
        .guide-horizontal {
          position: absolute;
          left: 0;
          right: 0;
          height: 1px;
          background: #ff0000;
          opacity: 0.3;
          pointer-events: none;
        }

        .guide-vertical {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 1px;
          background: #ff0000;
          opacity: 0.3;
          pointer-events: none;
        }

        .corner-marker {
          position: absolute;
          background: #ff0000;
          color: white;
          padding: 2px 4px;
          font-size: 8pt;
          font-family: Arial, sans-serif;
          border-radius: 2px;
          pointer-events: none;
        }

        /* Drag and Drop Styles */
        .draggable {
          cursor: grab !important;
          border: 2px dashed rgba(0, 123, 255, 0.3) !important;
          background: rgba(0, 123, 255, 0.05) !important;
          transition: all 0.2s ease !important;
        }
        
        .dragging {
          cursor: grabbing !important;
          border: 2px solid #007bff !important;
          background: rgba(0, 123, 255, 0.1) !important;
          z-index: 20 !important;
          transform: scale(1.05) !important;
          box-shadow: 0 4px 8px rgba(0, 123, 255, 0.3) !important;
        }
        
        .draggable:hover {
          border: 2px solid rgba(0, 123, 255, 0.5) !important;
          background: rgba(0, 123, 255, 0.1) !important;
        }
        
        .drag-mode-indicator {
          font-weight: bold;
          color: #007bff;
          font-size: 14px;
        }

        /* Background Preview */
        .cert-a4.with-preview {
          background: url('/certificates/ccc-template.jpg') center/cover no-repeat;
          background-color: #fff;
        }

        @media print {
          @page { 
            size: A4; 
            margin: 0; 
          }
          
          body { 
            margin: 0; 
          }
          
          .no-print, nav, header, footer, .navbar, [role="navigation"] { 
            display: none !important; 
          }
          
          /* Hide any top-level navigation or menu elements */
          body > div:first-child:not(.cert-page),
          body > nav,
          body > header,
          [class*="nav"],
          [class*="menu"],
          [class*="header"] {
            display: none !important;
          }
          
          .cert-page { 
            padding: 0; 
            background: #fff; 
          }
          
          .cert-a4 { 
            box-shadow: none; 
          }
        }
      `}</style>
      </div>
    </>
  )
}