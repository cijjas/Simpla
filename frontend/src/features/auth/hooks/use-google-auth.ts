'use client';

import { useState, useCallback } from 'react';
import { googleAuthService } from '../utils/google-auth';
import { googlePopupAuth } from '../utils/google-popup-auth';
import { useAuth } from './use-auth';

export function useGoogleAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const { loginWithGoogle, refreshToken } = useAuth();

  const signIn = useCallback(async () => {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    
    setIsLoading(true);
    console.log(`${timestamp} | GOOGLE-AUTH | INFO | Starting Google authentication flow`);
    
    try {
      // Use popup method for more reliable Google auth
      console.log(`${timestamp} | GOOGLE-AUTH | INFO | Initiating popup authentication`);
      const user = await googlePopupAuth.signIn();
      
      const resultTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
      
      if (user) {
        console.log(`${resultTimestamp} | GOOGLE-AUTH | SUCCESS | Popup authentication completed successfully`);
        console.log(`${resultTimestamp} | GOOGLE-AUTH | INFO | User data received:`, user);
        
        // The popup auth already handles the backend authentication
        // We need to refresh the auth state to pick up the new tokens
        console.log(`${resultTimestamp} | GOOGLE-AUTH | INFO | Refreshing authentication state`);
        
        // Try to refresh the auth state from the auth context
        const refreshResult = await refreshToken();
        const refreshTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
        
        if (refreshResult) {
          console.log(`${refreshTimestamp} | GOOGLE-AUTH | SUCCESS | Authentication state refreshed successfully`);
          return { success: true };
        } else {
          console.warn(`${refreshTimestamp} | GOOGLE-AUTH | WARN | Token refresh failed, falling back to page reload`);
          // Fallback to page reload if refresh fails
          window.location.reload();
          return { success: true };
        }
      } else {
        console.warn(`${resultTimestamp} | GOOGLE-AUTH | WARN | Popup authentication was cancelled or failed`);
        return { success: false, error: 'Google sign-in was cancelled' };
      }
    } catch (error) {
      const errorTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
      console.error(`${errorTimestamp} | GOOGLE-AUTH | ERROR | Google sign-in failed`);
      console.error(`${errorTimestamp} | GOOGLE-AUTH | ERROR | Error details:`, error);
      return { success: false, error: 'Google sign-in failed' };
    } finally {
      const finalTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
      console.log(`${finalTimestamp} | GOOGLE-AUTH | INFO | Authentication flow completed`);
      setIsLoading(false);
    }
  }, [refreshToken]);

  const signInWithPopup = useCallback(async () => {
    setIsLoading(true);
    try {
      const idToken = await googleAuthService.signInWithPopup();
      if (idToken) {
        const result = await loginWithGoogle(idToken);
        return result;
      } else {
        return { success: false, error: 'Google sign-in was cancelled' };
      }
    } catch (error) {
      console.error('Google popup sign-in error:', error);
      return { success: false, error: 'Google sign-in failed' };
    } finally {
      setIsLoading(false);
    }
  }, [loginWithGoogle]);

  const signOut = useCallback(() => {
    googleAuthService.signOut();
  }, []);

  return {
    signIn,
    signInWithPopup,
    signOut,
    isLoading,
  };
}
