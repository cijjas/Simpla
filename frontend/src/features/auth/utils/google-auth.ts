'use client';

declare global {
  interface Window {
    google: any;
  }
}

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
}

export interface GoogleAuthResponse {
  credential: string; // JWT ID token
}

class GoogleAuthService {
  private isInitialized = false;
  private clientId: string;

  constructor() {
    this.clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
    if (!this.clientId) {
      console.warn('Google Client ID not found in environment variables');
    }
  }

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;
    if (!this.clientId) return false;

    return new Promise((resolve) => {
      if (window.google) {
        this.setupGoogleAuth();
        resolve(true);
        return;
      }

      // Load Google Identity Services script
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        this.setupGoogleAuth();
        resolve(true);
      };
      script.onerror = () => {
        console.error('Failed to load Google Identity Services');
        resolve(false);
      };
      document.head.appendChild(script);
    });
  }

  private setupGoogleAuth() {
    if (!window.google) return;

    window.google.accounts.id.initialize({
      client_id: this.clientId,
      callback: this.handleCredentialResponse.bind(this),
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    this.isInitialized = true;
  }

  private handleCredentialResponse(response: GoogleAuthResponse) {
    // This will be overridden by the component that uses this service
    console.log('Google credential received:', response.credential);
  }

  async signIn(): Promise<string | null> {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) return null;
    }

    return new Promise((resolve) => {
      // Override the callback for this specific sign-in attempt
      const originalCallback = window.google.accounts.id.callback;
      
      window.google.accounts.id.callback = (response: GoogleAuthResponse) => {
        // Restore original callback
        window.google.accounts.id.callback = originalCallback;
        resolve(response.credential);
      };

      // Trigger the sign-in popup
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // Restore original callback
          window.google.accounts.id.callback = originalCallback;
          resolve(null);
        }
      });
    });
  }

  async signInWithPopup(): Promise<string | null> {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) return null;
    }

    return new Promise((resolve) => {
      // Override the callback for this specific sign-in attempt
      const originalCallback = window.google.accounts.id.callback;
      
      window.google.accounts.id.callback = (response: GoogleAuthResponse) => {
        // Restore original callback
        window.google.accounts.id.callback = originalCallback;
        resolve(response.credential);
      };

      // Use popup mode
      window.google.accounts.id.renderButton(
        document.createElement('div'),
        {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          shape: 'rectangular',
          text: 'signin_with',
          locale: 'es',
        }
      );

      // Trigger popup
      window.google.accounts.id.prompt();
    });
  }

  signOut() {
    if (window.google && this.isInitialized) {
      window.google.accounts.id.disableAutoSelect();
    }
  }
}

// Export singleton instance
export const googleAuthService = new GoogleAuthService();
