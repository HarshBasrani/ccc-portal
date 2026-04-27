import 'bootstrap/dist/css/bootstrap.min.css'
import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { useEffect } from 'react'
import { ConvexProvider } from 'convex/react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Head from 'next/head'
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
        <Navbar />
        <Component {...pageProps} />
        <Footer />
      </>
    </ConvexProvider>
  )
}
