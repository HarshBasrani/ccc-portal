// lib/security.ts
import { legacyClient } from './legacyClient'
import crypto from 'crypto'

// Input validation and sanitization
export const sanitizeInput = (input: string): string => {
  if (!input) return ''
  
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/[<>'"&]/g, (char) => {
      const entities: { [key: string]: string } = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      }
      return entities[char]
    })
    .trim()
}

// Password strength validation
export const validatePasswordStrength = (password: string): { valid: boolean; message: string } => {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' }
  }
  
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' }
  }
  
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' }
  }
  
  if (!/\d/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' }
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character' }
  }
  
  return { valid: true, message: 'Password is strong' }
}

// SQL injection protection for dynamic queries
export const escapeSQL = (value: string): string => {
  if (!value) return ''
  return value.replace(/['";\\]/g, '\\$&')
}

// Generate secure random tokens
export const generateSecureToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex')
}

// Hash sensitive data (for additional security)
export const hashData = (data: string): string => {
  return crypto.createHash('sha256').update(data).digest('hex')
}

// Email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 254
}

// Phone number validation (Indian format)
export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[6-9]\d{9}$/
  return phoneRegex.test(phone.replace(/\D/g, ''))
}

// File upload validation
export const validateFileUpload = (file: File, allowedTypes: string[], maxSize: number): { valid: boolean; message: string } => {
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, message: 'File type not allowed' }
  }
  
  if (file.size > maxSize) {
    return { valid: false, message: 'File size too large' }
  }
  
  return { valid: true, message: 'File is valid' }
}

// Session validation
export const validateSession = async (userId: string): Promise<boolean> => {
  try {
    const { data: { user } } = await legacyClient.auth.getUser()
    return user?.id === userId
  } catch {
    return false
  }
}

// Audit logging
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const auditLog = async (action: string, userId: string, details: any = {}) => {
  try {
    await legacyClient.from('audit_logs').insert({
      action,
      user_id: userId,
      details: JSON.stringify(details),
      ip_address: 'server', // Will be updated by middleware
      user_agent: 'server',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to create audit log:', error)
  }
}

// CSRF token validation
export const generateCSRFToken = (): string => {
  return generateSecureToken(32)
}

export const validateCSRFToken = (token: string, sessionToken: string): boolean => {
  return token === sessionToken && token.length === 64
}