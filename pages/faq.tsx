// pages/faq.tsx
import { useState } from 'react'
import Head from 'next/head'

interface FAQ {
  id: string
  question: string
  answer: string
  category: 'student' | 'admin'
}

const faqData: FAQ[] = [
  // Student FAQs
  {
    id: 'student-1',
    question: 'How do I start my exam?',
    answer: 'To start your exam, log in to the student portal using your enrollment number and password. Navigate to "My Exams" and click on the exam you want to take. Read the instructions carefully, then click "Start Exam" when you are ready to begin.',
    category: 'student'
  },
  {
    id: 'student-2',
    question: 'What happens if my internet disconnects during the exam?',
    answer: 'If your internet disconnects during the exam, don\'t panic. The system automatically saves your answers as you progress. Once your connection is restored, you can continue from where you left off. However, the timer will continue to run, so ensure you have a stable internet connection.',
    category: 'student'
  },
  {
    id: 'student-3',
    question: 'How do I view my exam results?',
    answer: 'After completing your exam, results will be available in the "My Results" section of your student dashboard. Results are typically published after administrative review. You will see your score, percentage, pass/fail status, and detailed question-wise analysis.',
    category: 'student'
  },
  {
    id: 'student-4',
    question: 'Can I change my answer after selecting an option?',
    answer: 'Yes, you can change your answer at any time before submitting the exam. Simply click on a different option for that question. The system automatically saves your latest selection. You can also use the question navigator to review and modify answers.',
    category: 'student'
  },
  {
    id: 'student-5',
    question: 'What is the minimum passing percentage for CCC exam?',
    answer: 'The minimum passing percentage for the CCC exam is 40%. However, administrators may manually pass students who score below this threshold based on special circumstances or overall performance evaluation.',
    category: 'student'
  },
  {
    id: 'student-6',
    question: 'Can I take the exam on my mobile phone?',
    answer: 'While the exam portal is responsive and works on mobile devices, we strongly recommend using a desktop or laptop computer for the best experience. Mobile devices may have limitations with certain features and provide a smaller screen for reading questions.',
    category: 'student'
  },
  {
    id: 'student-7',
    question: 'What should I do if I encounter technical issues during the exam?',
    answer: 'If you face any technical issues during the exam, immediately contact our support team using the provided contact numbers. Do not refresh the browser or close the exam window. Our technical support will help resolve the issue while preserving your exam progress.',
    category: 'student'
  },
  {
    id: 'student-8',
    question: 'How much time do I have to complete the exam?',
    answer: 'The exam duration varies by exam type but is typically 60-90 minutes for CCC exams. The exact duration is displayed on the exam information page and during the exam. A timer will show your remaining time, and the exam will auto-submit when time expires.',
    category: 'student'
  },

  // Admin FAQs
  {
    id: 'admin-1',
    question: 'How do I create a new exam?',
    answer: 'To create a new exam, go to the Admin Dashboard and click on "Exams" then "Create New Exam". Fill in the exam details including name, date, time, duration, and course. After creating the exam, you can assign it to students and add questions from the question bank.',
    category: 'admin'
  },
  {
    id: 'admin-2',
    question: 'How do I assign students to an exam?',
    answer: 'Navigate to the specific exam page and click on "Assign Students". You can select individual students or assign all students from a particular batch. Students will be able to see and take the exam only after being assigned to it.',
    category: 'admin'
  },
  {
    id: 'admin-3',
    question: 'How do I export exam results?',
    answer: 'In the exam report section, you have three export options: Export to PDF (for formal reports), Export to Excel (for data analysis), and Print (for physical copies). Each option includes comprehensive student performance data and statistics.',
    category: 'admin'
  },
  {
    id: 'admin-4',
    question: 'Can I manually pass a student who failed the exam?',
    answer: 'Yes, administrators can manually pass students who failed the automatic scoring. Go to "Completed Exams", find the failed student, and click "Mark as Pass". This will override the automatic result and mark the student as passed.',
    category: 'admin'
  },
  {
    id: 'admin-5',
    question: 'How do I add questions to the question bank?',
    answer: 'Go to "Question Bank" and click "Add New Question". Enter the question text, four options (A, B, C, D), select the correct answer, and assign marks. Questions are automatically available for all exams in the same course category.',
    category: 'admin'
  },
  {
    id: 'admin-6',
    question: 'How do I register new students?',
    answer: 'Navigate to "Students" section and click "Add New Student". Fill in the student details including name, email, enrollment number, and upload a photo. Students will receive login credentials via email and can access their portal immediately.',
    category: 'admin'
  },
  {
    id: 'admin-7',
    question: 'Can I monitor students during the exam?',
    answer: 'Yes, you can monitor exam progress in real-time through the "Completed Exams" section. You can see which students are currently taking exams, their progress, and any students who might need assistance.',
    category: 'admin'
  },
  {
    id: 'admin-8',
    question: 'How do I generate exam reports for analysis?',
    answer: 'Go to the specific exam and click "View Report". This provides comprehensive analytics including completion rates, average scores, pass/fail statistics, and individual student performance. Reports can be exported for further analysis or record-keeping.',
    category: 'admin'
  }
]

export default function FAQ() {
  const [activeAccordions, setActiveAccordions] = useState<string[]>([])
  const [activeCategory, setActiveCategory] = useState<'student' | 'admin'>('student')

  const toggleAccordion = (id: string) => {
    setActiveAccordions(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    )
  }

  const categoryFAQs = faqData.filter(faq => faq.category === activeCategory)

  return (
    <>
      <Head>
        <title>Frequently Asked Questions  CCC Exam Portal</title>
        <meta name="description" content="Find answers to common questions about using the CCC Exam Portal for students and administrators." />
      </Head>
      
      <div style={{ background: 'var(--light-bg)', minHeight: 'calc(100vh - 70px)', padding: '2rem 0' }}>
        <div className="container">
          {/* Page Header */}
          <div className="text-center mb-5 fade-in">
            <div style={{
              width: '100px',
              height: '100px',
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: '0 15px 35px rgba(79, 172, 254, 0.3)'
            }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <h1 className="page-title">Frequently Asked Questions</h1>
            <p className="page-subtitle">Find quick answers to common questions about the CCC Exam Portal</p>
          </div>

          {/* Category Toggle */}
          <div className="d-flex justify-content-center mb-5 fade-in stagger-1">
            <div className="btn-group" role="group" style={{ boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)', borderRadius: '12px' }}>
              <button
                type="button"
                className={`btn ${activeCategory === 'student' ? 'btn-primary' : 'btn-outline-primary'}`}
                style={{
                  padding: '0.875rem 2rem',
                  borderRadius: '12px 0 0 12px',
                  fontWeight: '600',
                  background: activeCategory === 'student' 
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                    : 'transparent',
                  border: activeCategory === 'student' ? 'none' : '2px solid #667eea'
                }}
                onClick={() => setActiveCategory('student')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.5rem' }}>
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                Student FAQs
              </button>
              <button
                type="button"
                className={`btn ${activeCategory === 'admin' ? 'btn-primary' : 'btn-outline-primary'}`}
                style={{
                  padding: '0.875rem 2rem',
                  borderRadius: '0 12px 12px 0',
                  fontWeight: '600',
                  background: activeCategory === 'admin' 
                    ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' 
                    : 'transparent',
                  border: activeCategory === 'admin' ? 'none' : '2px solid #11998e'
                }}
                onClick={() => setActiveCategory('admin')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.5rem' }}>
                  <path d="M12 20h9"/>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
                Admin FAQs
              </button>
            </div>
          </div>

          {/* FAQ Content */}
          <div className="row justify-content-center">
            <div className="col-lg-10">
              <div className="premium-card fade-in stagger-2">
                <div className="premium-card-header">
                  <h4 className="mb-0 d-flex align-items-center gap-2">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      {activeCategory === 'student' ? (
                        <>
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                          <circle cx="12" cy="7" r="4"/>
                        </>
                      ) : (
                        <>
                          <path d="M12 20h9"/>
                          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                        </>
                      )}
                    </svg>
                    {activeCategory === 'student' ? 'Student Questions' : 'Administrator Questions'}
                  </h4>
                  <p className="mb-0 text-muted">
                    {activeCategory === 'student' 
                      ? 'Common questions and troubleshooting for students using the exam portal'
                      : 'Administrative guidance for managing exams, students, and system features'
                    }
                  </p>
                </div>
                <div className="premium-card-body p-0">
                  <div className="accordion accordion-flush">
                    {categoryFAQs.map((faq, index) => {
                      const isOpen = activeAccordions.includes(faq.id)
                      
                      return (
                        <div key={faq.id} className="accordion-item border-0">
                          <div 
                            className="accordion-header"
                            style={{ 
                              borderBottom: index < categoryFAQs.length - 1 ? '1px solid #e9ecef' : 'none'
                            }}
                          >
                            <button
                              className={`accordion-button ${isOpen ? '' : 'collapsed'}`}
                              type="button"
                              onClick={() => toggleAccordion(faq.id)}
                              style={{
                                padding: '1.5rem',
                                backgroundColor: 'transparent',
                                border: 'none',
                                boxShadow: 'none',
                                fontWeight: '600',
                                fontSize: '1.05rem',
                                color: isOpen ? (activeCategory === 'student' ? '#667eea' : '#11998e') : 'var(--dark-text)'
                              }}
                            >
                              <div className="d-flex align-items-start gap-3 w-100">
                                <div style={{
                                  width: '36px',
                                  height: '36px',
                                  background: isOpen 
                                    ? (activeCategory === 'student' 
                                        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                        : 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)')
                                    : '#f8f9fa',
                                  borderRadius: '10px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                  transition: 'all 0.3s ease'
                                }}>
                                  <svg 
                                    width="18" 
                                    height="18" 
                                    viewBox="0 0 24 24" 
                                    fill="none" 
                                    stroke={isOpen ? 'white' : '#6c757d'} 
                                    strokeWidth="2"
                                  >
                                    <circle cx="12" cy="12" r="10"/>
                                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                                  </svg>
                                </div>
                                <span className="text-start">{faq.question}</span>
                              </div>
                            </button>
                          </div>
                          
                          {isOpen && (
                            <div className="accordion-collapse">
                              <div className="accordion-body" style={{ 
                                padding: '0 1.5rem 1.5rem 4.5rem',
                                color: 'var(--text-muted)',
                                lineHeight: '1.7'
                              }}>
                                <div style={{
                                  padding: '1.25rem',
                                  background: activeCategory === 'student'
                                    ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)'
                                    : 'linear-gradient(135deg, rgba(17, 153, 142, 0.05) 0%, rgba(56, 239, 125, 0.05) 100%)',
                                  borderRadius: '12px',
                                  border: `1px solid ${activeCategory === 'student' ? 'rgba(102, 126, 234, 0.1)' : 'rgba(17, 153, 142, 0.1)'}`
                                }}>
                                  {faq.answer}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Help Section */}
          <div className="row justify-content-center mt-5">
            <div className="col-lg-8">
              <div className="glass-card p-4 text-center fade-in stagger-3">
                <div className="d-flex align-items-center justify-content-center gap-3 mb-3">
                  <div style={{
                    width: '56px',
                    height: '56px',
                    background: 'linear-gradient(135deg, #F2994A 0%, #F2C94C 100%)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                  </div>
                  <div className="text-start">
                    <h5 className="fw-bold mb-1" style={{ color: 'var(--dark-text)' }}>Still Need Help?</h5>
                    <p className="text-muted mb-0">Can't find what you're looking for? Get in touch with our support team.</p>
                  </div>
                </div>
                
                <div className="row g-3">
                  <div className="col-md-4">
                    <div className="d-flex align-items-center gap-2 justify-content-center">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#11998e" strokeWidth="2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                      </svg>
                      <span className="small fw-semibold">+91 9876543210</span>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="d-flex align-items-center gap-2 justify-content-center">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22 6 12 13 2 6"/>
                      </svg>
                      <span className="small fw-semibold">support@excellencecomputer.edu</span>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="d-flex align-items-center gap-2 justify-content-center">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F2994A" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                      </svg>
                      <span className="small fw-semibold">WhatsApp: +91 7654321098</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}