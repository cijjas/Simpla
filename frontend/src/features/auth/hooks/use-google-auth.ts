'use client';

import { useState, useCallback } from 'react';
import { googleAuthService } from '../utils/google-auth';
import { useAuth } from './use-auth';

export function useGoogleAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const { loginWithGoogle } = useAuth();

  const signIn = useCallback(async () => {
    setIsLoading(true);
    try {
      const idToken = await googleAuthService.signIn();
      if (idToken) {
        const result = await loginWithGoogle(idToken);
        return result;
      } else {
        return { success: false, error: 'Google sign-in was cancelled' };
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      return { success: false, error: 'Google sign-in failed' };
    } finally {
      setIsLoading(false);
    }
  }, [loginWithGoogle]);

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
