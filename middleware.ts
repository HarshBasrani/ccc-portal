import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rate limiting store (in production, use Redis or database)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

function buildCsp(): string {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || ''
  let convexConnect = ''

  try {
    if (convexUrl) {
      const convexHost = new URL(convexUrl).host
      convexConnect = ` https://${convexHost} wss://${convexHost}`
    }
  } catch {
    convexConnect = ''
  }

  return `default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src 'self' fonts.gstatic.com; img-src 'self' data: blob: *.convex.site *.convex.cloud *.eu-west-1.convex.site *.eu-west-1.convex.cloud; connect-src 'self' *.convex.cloud *.convex.site${convexConnect}; frame-src 'self' www.google.com; object-src 'none'; base-uri 'self';`
}

// Security headers
const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': buildCsp()
}

// Rate limiting function
function rateLimit(ip: string, limit: number = 100, windowMs: number = 900000): boolean {
  const now = Date.now()
  const userLimit = rateLimitStore.get(ip)
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (userLimit.count >= limit) {
    return false
  }
  
  userLimit.count++
  return true
}

// Suspicious pattern detection
function detectSuspiciousPatterns(url: string): boolean {
  const suspiciousPatterns = [
    /\.\./,  // Directory traversal
    /<script/i,  // XSS attempts
    /union.*select/i,  // SQL injection
    /javascript:/i,  // JavaScript injection
    /eval\(/i,  // Code evaluation
    /exec\(/i,  // Command execution
    /system\(/i,  // System commands
    /%00/,  // Null byte injection
    /\bor\b.*\b1=1\b/i,  // SQL injection
    /\band\b.*\b1=1\b/i  // SQL injection
  ]
  
  return suspiciousPatterns.some(pattern => pattern.test(url))
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const ipHeader = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || ''
  const ip = ipHeader.split(',')[0].trim() || 'unknown'
  const url = request.url
  const userAgent = request.headers.get('user-agent') || ''
  
  // Apply security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  // Rate limiting (stricter for API routes)
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/')
  const limit = isApiRoute ? 50 : 200  // API: 50 req/15min, Pages: 200 req/15min
  
  if (!rateLimit(ip, limit)) {
    console.warn(`Rate limit exceeded for IP: ${ip}, URL: ${url}`)
    return new NextResponse('Rate limit exceeded', { 
      status: 429,
      headers: {
        'Retry-After': '900'  // 15 minutes
      }
    })
  }
  
  // Block suspicious patterns
  if (detectSuspiciousPatterns(url)) {
    console.warn(`Suspicious request blocked - IP: ${ip}, URL: ${url}, UA: ${userAgent}`)
    return new NextResponse('Forbidden', { status: 403 })
  }
  
  // Block suspicious user agents
  const suspiciousUAs = [
    /sqlmap/i,
    /nikto/i,
    /nessus/i,
    /burp/i,
    /nmap/i,
    /masscan/i,
    /zap/i
  ]
  
  if (suspiciousUAs.some(pattern => pattern.test(userAgent))) {
    console.warn(`Suspicious user agent blocked - IP: ${ip}, UA: ${userAgent}`)
    return new NextResponse('Forbidden', { status: 403 })
  }
  
  // Protect admin routes
  if (request.nextUrl.pathname.startsWith('/admin/') && 
      !request.nextUrl.pathname.includes('/login')) {
    // Additional logging for admin access
    console.log(`Admin access attempt - IP: ${ip}, Path: ${request.nextUrl.pathname}`)
  }
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}