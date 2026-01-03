/**
 * Security utilities for API routes
 */

import { NextRequest } from 'next/server'

// Allowed file types for uploads
export const ALLOWED_FILE_TYPES = {
  images: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  videos: ['video/mp4', 'video/webm', 'video/ogg'],
  documents: ['application/pdf']
}

export const ALLOWED_EXTENSIONS = {
  images: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  videos: ['.mp4', '.webm', '.ogg'],
  documents: ['.pdf']
}

// File size limits (in bytes)
export const MAX_FILE_SIZES = {
  image: 10 * 1024 * 1024, // 10MB
  video: 100 * 1024 * 1024, // 100MB
  document: 5 * 1024 * 1024, // 5MB
}

// Rate limiting store (in-memory, use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

/**
 * Validate file type
 */
export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type)
}

/**
 * Validate file size
 */
export function validateFileSize(file: File, maxSize: number): boolean {
  return file.size <= maxSize
}

/**
 * Validate file extension
 */
export function validateFileExtension(fileName: string, allowedExtensions: string[]): boolean {
  const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'))
  return allowedExtensions.includes(ext)
}

/**
 * Sanitize filename
 */
export function sanitizeFileName(fileName: string): string {
  // Remove path traversal attempts
  const sanitized = fileName.replace(/\.\./g, '').replace(/\//g, '').replace(/\\/g, '')
  // Remove special characters except dots, hyphens, underscores
  return sanitized.replace(/[^a-zA-Z0-9._-]/g, '')
}

/**
 * Simple rate limiting (use Redis in production)
 */
export function rateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000 // 1 minute
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const key = identifier
  const record = rateLimitStore.get(key)

  if (!record || now > record.resetTime) {
    // Create new record
    const resetTime = now + windowMs
    rateLimitStore.set(key, { count: 1, resetTime })
    
    // Clean up old records
    if (rateLimitStore.size > 10000) {
      for (const [k, v] of rateLimitStore.entries()) {
        if (now > v.resetTime) {
          rateLimitStore.delete(k)
        }
      }
    }

    return { allowed: true, remaining: maxRequests - 1, resetTime }
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime }
  }

  record.count++
  return { allowed: true, remaining: maxRequests - record.count, resetTime: record.resetTime }
}

/**
 * Get client IP for rate limiting
 */
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0] || realIP || 'unknown'
  return ip.trim()
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: string, maxLength: number = 1000): string {
  if (!input || typeof input !== 'string') return ''
  
  // Trim and limit length
  let sanitized = input.trim().substring(0, maxLength)
  
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '')
  
  // Remove script tags
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  
  return sanitized
}

/**
 * Validate and sanitize file upload
 */
export function validateFileUpload(
  file: File,
  allowedTypes: string[],
  maxSize: number,
  allowedExtensions: string[]
): { valid: boolean; error?: string } {
  // Check file exists
  if (!file || !file.name) {
    return { valid: false, error: 'No file provided' }
  }

  // Check file type
  if (!validateFileType(file, allowedTypes)) {
    return { valid: false, error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}` }
  }

  // Check file extension
  if (!validateFileExtension(file.name, allowedExtensions)) {
    return { valid: false, error: `File extension not allowed. Allowed extensions: ${allowedExtensions.join(', ')}` }
  }

  // Check file size
  if (!validateFileSize(file, maxSize)) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2)
    return { valid: false, error: `File size exceeds maximum of ${maxSizeMB}MB` }
  }

  return { valid: true }
}
