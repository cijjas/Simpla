'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function GoogleCallbackContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    console.log(`${timestamp} | CALLBACK | INFO | Google OAuth callback received`);
    console.log(`${timestamp} | CALLBACK | DEBUG | URL search params:`, Object.fromEntries(searchParams.entries()));

    if (error) {
      console.error(`${timestamp} | CALLBACK | ERROR | Google OAuth error: ${error}`);
      // Send error to parent window
      if (window.opener) {
        console.log(`${timestamp} | CALLBACK | INFO | Sending error message to parent window`);
        window.opener.postMessage({
          type: 'GOOGLE_AUTH_ERROR',
          error: error,
        }, window.location.origin);
      } else {
        console.error(`${timestamp} | CALLBACK | ERROR | No window.opener found to send error message`);
      }
      return;
    }

    if (code) {
      console.log(`${timestamp} | CALLBACK | INFO | Authorization code received: ${code.substring(0, 20)}...`);
      // Exchange code for user info
      exchangeCodeForUserInfo(code);
    } else {
      console.warn(`${timestamp} | CALLBACK | WARN | No authorization code found in URL`);
    }
  }, [searchParams]);

  const exchangeCodeForUserInfo = async (code: string) => {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    
    try {
      console.log(`${timestamp} | CALLBACK | INFO | Starting code exchange with backend`);
      console.log(`${timestamp} | CALLBACK | DEBUG | Making POST request to /api/auth/google/callback`);
      
      // Call backend to exchange code for user info
      const response = await fetch('/api/auth/google/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const responseTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
      console.log(`${responseTimestamp} | CALLBACK | INFO | API response received`);
      console.log(`${responseTimestamp} | CALLBACK | DEBUG | Response status: ${response.status}`);
      console.log(`${responseTimestamp} | CALLBACK | DEBUG | Response headers:`, Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const userData = await response.json();
        console.log(`${responseTimestamp} | CALLBACK | SUCCESS | User authentication successful`);
        console.log(`${responseTimestamp} | CALLBACK | INFO | User data:`, userData);
        
        // Send success to parent window
        if (window.opener) {
          console.log(`${responseTimestamp} | CALLBACK | INFO | Sending success message to parent window`);
          window.opener.postMessage({
            type: 'GOOGLE_AUTH_SUCCESS',
            user: userData.user,
          }, window.location.origin);
          console.log(`${responseTimestamp} | CALLBACK | SUCCESS | Success message sent to parent window`);
        } else {
          console.error(`${responseTimestamp} | CALLBACK | ERROR | No window.opener found to send success message`);
        }
      } else {
        const errorText = await response.text();
        console.error(`${responseTimestamp} | CALLBACK | ERROR | API request failed`);
        console.error(`${responseTimestamp} | CALLBACK | ERROR | Response status: ${response.status}`);
        console.error(`${responseTimestamp} | CALLBACK | ERROR | Error response: ${errorText}`);
        throw new Error(`Failed to exchange code: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      const errorTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
      console.error(`${errorTimestamp} | CALLBACK | ERROR | Code exchange failed`);
      console.error(`${errorTimestamp} | CALLBACK | ERROR | Error details:`, error);
      
      if (window.opener) {
        console.log(`${errorTimestamp} | CALLBACK | INFO | Sending error message to parent window`);
        window.opener.postMessage({
          type: 'GOOGLE_AUTH_ERROR',
          error: 'Failed to exchange authorization code',
        }, window.location.origin);
      } else {
        console.error(`${errorTimestamp} | CALLBACK | ERROR | No window.opener found to send error message`);
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p>Completing Google sign-in...</p>
      </div>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    }>
      <GoogleCallbackContent />
    </Suspense>
  );
}
