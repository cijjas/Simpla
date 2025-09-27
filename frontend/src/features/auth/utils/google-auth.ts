'use client';

interface GoogleAuthConfig {
  client_id: string;
  callback: (response: GoogleAuthResponse) => void;
  auto_select: boolean;
  cancel_on_tap_outside: boolean;
  use_fedcm_for_prompt: boolean;
}

interface GoogleButtonConfig {
  theme: string;
  size: string;
  type: string;
  shape: string;
  text: string;
  locale: string;
}

interface GooglePromptNotification {
  isNotDisplayed(): boolean;
  isSkippedMoment(): boolean;
}

declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: GoogleAuthConfig) => void;
          callback: (response: GoogleAuthResponse) => void;
          renderButton: (element: HTMLElement, config: GoogleButtonConfig) => void;
          prompt: (callback?: (notification: GooglePromptNotification) => void) => void;
          disableAutoSelect: () => void;
        };
      };
    };
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
    if (!this.clientId || this.clientId === 'your_google_client_id_here') {
      console.warn('Google Client ID not properly configured. Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID in your .env.local file');
      return false;
    }

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

    try {
      window.google.accounts.id.initialize({
        client_id: this.clientId,
        callback: this.handleCredentialResponse.bind(this),
        auto_select: false,
        cancel_on_tap_outside: true,
        use_fedcm_for_prompt: false, // Disable FedCM to avoid the error
      });

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Google Auth:', error);
      this.isInitialized = false;
    }
  }

  private handleCredentialResponse(response: GoogleAuthResponse) {
    // This will be overridden by the component that uses this service
    console.log('Google credential received:', response.credential);
  }

  async signIn(): Promise<string | null> {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) {
        console.error('Google Auth initialization failed');
        return null;
      }
    }

    if (!window.google || !window.google.accounts) {
      console.error('Google Identity Services not loaded');
      return null;
    }

    return new Promise((resolve) => {
      try {
        // Override the callback for this specific sign-in attempt
        const originalCallback = window.google.accounts.id.callback;
        
        window.google.accounts.id.callback = (response: GoogleAuthResponse) => {
          // Restore original callback
          window.google.accounts.id.callback = originalCallback;
          resolve(response.credential);
        };

        // Use renderButton to trigger sign-in
        const buttonDiv = document.createElement('div');
        buttonDiv.style.display = 'none';
        document.body.appendChild(buttonDiv);

        window.google.accounts.id.renderButton(buttonDiv, {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          shape: 'rectangular',
          text: 'signin_with',
          locale: 'es',
        });

        // Simulate button click
        const button = buttonDiv.querySelector('div[role="button"]') as HTMLElement;
        if (button) {
          button.click();
        } else {
          // Fallback to prompt
          window.google.accounts.id.prompt((notification: GooglePromptNotification) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
              window.google.accounts.id.callback = originalCallback;
              resolve(null);
            }
          });
        }

        // Clean up
        setTimeout(() => {
          if (document.body.contains(buttonDiv)) {
            document.body.removeChild(buttonDiv);
          }
        }, 1000);
      } catch (error) {
        console.error('Google sign-in error:', error);
        resolve(null);
      }
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
      window.google.accounts.id.prompt((notification: GooglePromptNotification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          window.google.accounts.id.callback = originalCallback;
          resolve(null);
        }
      });
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
