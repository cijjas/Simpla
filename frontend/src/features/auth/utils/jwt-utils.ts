/**
 * JWT token utilities for client-side token validation
 */

export interface JWTPayload {
  exp: number;
  iat: number;
  sub: string;
  email?: string;
  [key: string]: any;
}

/**
 * Decodes a JWT token without verification (client-side only)
 * Note: This is for expiration checking only, not for security validation
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (error) {
    console.warn('Failed to decode JWT token:', error);
    return null;
  }
}

/**
 * Checks if a JWT token is expired
 * @param token - The JWT token to check
 * @param bufferSeconds - Buffer time in seconds before actual expiration (default: 60 seconds)
 * @returns true if token is expired or invalid, false if still valid
 */
export function isTokenExpired(token: string, bufferSeconds: number = 60): boolean {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    return true; // Consider invalid tokens as expired
  }
  
  const now = Math.floor(Date.now() / 1000);
  const expirationTime = payload.exp;
  
  // Token is expired if current time is within bufferSeconds of expiration
  return now >= (expirationTime - bufferSeconds);
}

/**
 * Gets the expiration time of a JWT token in milliseconds
 * @param token - The JWT token
 * @returns expiration time in milliseconds, or null if invalid
 */
export function getTokenExpiration(token: string): number | null {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    return null;
  }
  
  return payload.exp * 1000; // Convert to milliseconds
}

/**
 * Gets the time until token expiration in milliseconds
 * @param token - The JWT token
 * @returns milliseconds until expiration, or null if invalid/expired
 */
export function getTimeUntilExpiration(token: string): number | null {
  const expiration = getTokenExpiration(token);
  if (!expiration) {
    return null;
  }
  
  const now = Date.now();
  const timeUntilExpiration = expiration - now;
  
  return timeUntilExpiration > 0 ? timeUntilExpiration : null;
}

/**
 * Checks if a token needs refresh (expires within the next buffer time)
 * @param token - The JWT token to check
 * @param bufferMinutes - Buffer time in minutes before expiration (default: 5 minutes)
 * @returns true if token needs refresh, false if still valid
 */
export function needsRefresh(token: string, bufferMinutes: number = 5): boolean {
  const timeUntilExpiration = getTimeUntilExpiration(token);
  if (!timeUntilExpiration) {
    return true; // Invalid or expired token needs refresh
  }
  
  const bufferMs = bufferMinutes * 60 * 1000;
  return timeUntilExpiration <= bufferMs;
}
