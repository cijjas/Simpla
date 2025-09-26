import { type DefaultSession, type NextAuthOptions } from 'next-auth';

// Import backend auth configuration
import { backendAuthOptions } from './backend-auth';

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

/* ----------  Auth Options (Backend-integrated)  ---------- */
// Always use backend integration - no more Prisma!
export const authOptions: NextAuthOptions = backendAuthOptions;