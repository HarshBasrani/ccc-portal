import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to login page
    router.replace('/login')
  }, [router])

  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div className="text-center text-white">
        <div className="loading-container">
          <div className="loading-spinner" style={{ 
            borderColor: 'rgba(255,255,255,0.2)',
            borderTopColor: 'white'
          }}></div>
          <h2 className="mt-4 mb-2" style={{ fontWeight: '700' }}>CCC Exam Portal</h2>
          <p style={{ opacity: 0.9 }}>Redirecting to login...</p>
        </div>
      </div>
    </div>
  )
}
