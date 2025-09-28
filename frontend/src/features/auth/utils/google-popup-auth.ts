'use client';

/**
 * Alternative Google OAuth implementation using popup window
 * This bypasses FedCM issues and provides a more reliable sign-in experience
 */

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
}

export class GooglePopupAuth {
  private clientId: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
    this.redirectUri = typeof window !== 'undefined' 
      ? `${window.location.origin}/auth/google/callback`
      : '/auth/google/callback';
  }

  async signIn(): Promise<GoogleUser | null> {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    
    if (typeof window === 'undefined') {
      console.error(`${timestamp} | AUTH | ERROR | Window is not available (server-side rendering)`);
      return null;
    }
    
    if (!this.clientId) {
      console.error(`${timestamp} | AUTH | ERROR | Google Client ID not configured`);
      return null;
    }

    console.log(`${timestamp} | AUTH | INFO | Starting Google OAuth popup flow`);
    console.log(`${timestamp} | AUTH | INFO | Client ID: ${this.clientId.substring(0, 20)}...`);
    console.log(`${timestamp} | AUTH | INFO | Redirect URI: ${this.redirectUri}`);

    // Create OAuth URL
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', this.clientId);
    authUrl.searchParams.set('redirect_uri', this.redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'openid email profile');
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'select_account');

    console.log(`${timestamp} | AUTH | INFO | Opening popup window with Google OAuth URL`);

    // Open popup window
    const popup = window.open(
      authUrl.toString(),
      'google-auth',
      'width=500,height=600,scrollbars=yes,resizable=yes'
    );

    if (!popup) {
      console.error(`${timestamp} | AUTH | ERROR | Failed to open popup window (popup blocked?)`);
      return null;
    }

    console.log(`${timestamp} | AUTH | INFO | Popup window opened successfully`);

    // Wait for popup to close or receive message
    return new Promise((resolve) => {
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          const closeTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
          console.log(`${closeTimestamp} | AUTH | WARN | Popup closed without authentication`);
          clearInterval(checkClosed);
          resolve(null);
        }
      }, 1000);

      // Listen for messages from popup
      const messageHandler = (event: MessageEvent) => {
        const msgTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
        console.log(`${msgTimestamp} | AUTH | DEBUG | Received message from popup`);
        console.log(`${msgTimestamp} | AUTH | DEBUG | Message type: ${event.data?.type || 'unknown'}`);
        console.log(`${msgTimestamp} | AUTH | DEBUG | Message origin: ${event.origin}`);
        
        if (event.origin !== window.location.origin) {
          console.log(`${msgTimestamp} | AUTH | WARN | Ignoring message from different origin: ${event.origin}`);
          return;
        }
        
        if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
          console.log(`${msgTimestamp} | AUTH | SUCCESS | Google authentication successful`);
          console.log(`${msgTimestamp} | AUTH | INFO | User data received:`, event.data.user);
          clearInterval(checkClosed);
          window.removeEventListener('message', messageHandler);
          popup.close();
          resolve(event.data.user);
        } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
          console.error(`${msgTimestamp} | AUTH | ERROR | Google authentication failed`);
          console.error(`${msgTimestamp} | AUTH | ERROR | Error details: ${event.data.error}`);
          clearInterval(checkClosed);
          window.removeEventListener('message', messageHandler);
          popup.close();
          resolve(null);
        }
      };

      console.log(`${timestamp} | AUTH | INFO | Listening for messages from popup window`);
      window.addEventListener('message', messageHandler);
    });
  }
}

export const googlePopupAuth = new GooglePopupAuth();
