// Simple HTML sanitization utility that works on both client and server
// This avoids the jsdom dependency issue with isomorphic-dompurify

// Basic HTML sanitization for server-side rendering
function basicSanitize(html: string): string {
  if (!html) return '';
  
  // Remove potentially dangerous tags and attributes
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/<link\b[^<]*(?:(?!<\/link>)<[^<]*)*<\/link>/gi, '')
    .replace(/<meta\b[^<]*(?:(?!<\/meta>)<[^<]*)*<\/meta>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '') // Remove event handlers
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/vbscript:/gi, '') // Remove vbscript: URLs
    .replace(/data:/gi, '') // Remove data: URLs
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ''); // Remove style tags
}

// Client-side sanitization using DOMPurify
function clientSanitize(html: string): string {
  if (typeof window === 'undefined') {
    return basicSanitize(html);
  }
  
  try {
    // Dynamic import to avoid server-side issues
    const DOMPurify = require('dompurify');
    return DOMPurify.sanitize(html);
  } catch (error) {
    console.warn('DOMPurify not available, using basic sanitization:', error);
    return basicSanitize(html);
  }
}

// Main sanitization function
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  
  // Use basic sanitization for server-side rendering
  if (typeof window === 'undefined') {
    return basicSanitize(html);
  }
  
  // Use client-side sanitization when available
  return clientSanitize(html);
}
