import 'bootstrap/dist/css/bootstrap.min.css'
import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { useEffect } from 'react'
import { ConvexProvider } from 'convex/react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Head from 'next/head'
import Script from 'next/script'
import { convex } from '../lib/convexClient'

export default function App({ Component, pageProps }: AppProps) {
  // Handle global errors, especially browser extension errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      // Suppress MetaMask and other browser extension errors
      if (
        event.error?.stack?.includes('chrome-extension://') ||
        event.error?.stack?.includes('moz-extension://') ||
        event.error?.stack?.includes('safari-web-extension://') ||
        event.message?.includes('MetaMask') ||
        event.message?.includes('Failed to connect to MetaMask') ||
        event.filename?.includes('extension')
      ) {
        console.warn('Browser extension error suppressed:', event.error?.message || event.message)
        event.preventDefault()
        return false
      }
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Suppress MetaMask promise rejections
      if (
        event.reason?.message?.includes('MetaMask') ||
        event.reason?.message?.includes('chrome-extension') ||
        event.reason?.stack?.includes('chrome-extension://') ||
        event.reason?.code === 4001 // MetaMask user rejection
      ) {
        console.warn('Browser extension promise rejection suppressed:', event.reason?.message)
        event.preventDefault()
        return false
      }
    }

    // Add error listeners
    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    // Cleanup
    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  return (
    <ConvexProvider client={convex}>
      <>
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
          <meta name="description" content="CCC Exam Portal by Infonix Computers - Computer Course Certificate Exam System" />
          <meta name="keywords" content="CCC, computer course, certificate, exam, Infonix Computers" />
          
          {/* Prevent browser extensions from detecting crypto-related content */}
          <meta name="web3" content="disabled" />
          <meta name="ethereum" content="disabled" />
          <meta name="metamask" content="disabled" />
        </Head>
        
        {/* Adsterra Scripts */}
        <Script src="https://pl29730920.effectivecpmnetwork.com/2c/c4/ce/2cc4ce2f9f461c4cb37595081856cb1e.js" strategy="afterInteractive" />
        <Script async data-cfasync="false" src="https://pl29730921.effectivecpmnetwork.com/e57657bc4fdd9ba3459eb7ac681d8b4b/invoke.js" strategy="afterInteractive" />
        <Script src="https://pl29730923.effectivecpmnetwork.com/15/ba/58/15ba5877867cd345865c3ca6d1b25b9e.js" strategy="afterInteractive" />

        <Navbar />
        <Component {...pageProps} />
        
        {/* Adsterra Banner Container */}
        <div id="container-e57657bc4fdd9ba3459eb7ac681d8b4b" className="d-flex justify-content-center my-3"></div>
        
        {/* Adsterra Direct Link */}
        <div className="text-center pb-3" style={{ background: 'var(--light-bg)' }}>
          <a href="https://www.effectivecpmnetwork.com/swfezf2k7u?key=d464c326b5e861de22f54a3f944d0d0a" target="_blank" rel="noopener noreferrer" className="text-muted small text-decoration-none">
            Sponsored Link
          </a>
        </div>
        
        <Footer />
      </>
    </ConvexProvider>
  )
}
