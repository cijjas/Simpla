/* Custom NextAuth configuration that integrates with FastAPI backend. */

import { type DefaultSession, type NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';

/* ----------  Module Augmentation  ---------- */
declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: { 
      id: string; 
      role?: 'ADMIN' | 'USER';
      accessToken?: string;
    } & DefaultSession['user'];
  }
  interface User {
    id: string;
    role?: 'ADMIN' | 'USER';
    accessToken?: string;
    provider?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    provider?: string;
  }
}

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

/* ----------  Backend Integration Functions  ---------- */
async function loginWithCredentials(email: string, password: string) {
  try {
    const response = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      credentials: 'include', // Important for cookies
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Backend login error:', error);
    throw error;
  }
}

async function loginWithGoogle(idToken: string) {
  try {
    const response = await fetch(`${BACKEND_URL}/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id_token: idToken }),
      credentials: 'include', // Important for cookies
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Google login failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Backend Google login error:', error);
    throw error;
  }
}

async function refreshAccessToken(token: any) {
  try {
    const response = await fetch(`${BACKEND_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include', // Important for cookies
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const refreshedTokens = await response.json();
    
    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      // Keep the refresh token from cookie
    };
  } catch (error) {
    console.error('Token refresh error:', error);
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}

/* ----------  NextAuth Options  ---------- */
export const backendAuthOptions: NextAuthOptions = {
  providers: [
    /* Google OAuth */
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    /* Credentials (email + password) */
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const result = await loginWithCredentials(credentials.email, credentials.password);
          
          return {
            id: result.user.id,
            email: result.user.email,
            name: result.user.name,
            accessToken: result.access_token,
            provider: result.user.provider,
          };
        } catch (error) {
          console.error('Credentials authorization error:', error);
          return null;
        }
      },
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: '/iniciar-sesion',
    error: '/iniciar-sesion',
  },

  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          // Send Google ID token to backend
          const result = await loginWithGoogle(account.id_token!);
          
          // Store backend tokens in user object
          user.accessToken = result.access_token;
          user.provider = 'google';
          
          return true;
        } catch (error) {
          console.error('Google sign-in error:', error);
          return false;
        }
      }
      
      return true;
    },

    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        return {
          ...token,
          accessToken: user.accessToken,
          provider: user.provider || account.provider,
        };
      }

      // Return previous token if the access token has not expired yet
      // Access tokens from our backend expire in 15 minutes
      const now = Math.floor(Date.now() / 1000);
      const tokenExp = token.exp || 0;
      
      // If token expires in less than 5 minutes, refresh it
      if (tokenExp - now < 5 * 60) {
        return refreshAccessToken(token);
      }

      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.accessToken = token.accessToken as string;
        
        // Handle token refresh errors
        if (token.error === 'RefreshAccessTokenError') {
          // Force user to re-authenticate
          session.error = 'RefreshAccessTokenError';
        }
      }
      
      return session;
    },
  },

  events: {
    async signOut({ token }) {
      // Call backend logout endpoint to revoke refresh token
      try {
        await fetch(`${BACKEND_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token.accessToken}`,
          },
          credentials: 'include',
        });
      } catch (error) {
        console.error('Backend logout error:', error);
      }
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};
