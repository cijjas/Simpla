// src/lib/auth.ts
import NextAuth, { type DefaultSession, type NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import EmailProvider from 'next-auth/providers/email';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';

import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '../prisma';

/* ----------  Module Augmentation  ---------- */
declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: { id: string; role?: 'ADMIN' | 'USER' } & DefaultSession['user'];
  }
  interface User {
    id: string;
    role?: 'ADMIN' | 'USER';
  }
}

/* ----------  Options  ---------- */
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  providers: [
    /* OAuth */
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    /* Magic‑link email */
    EmailProvider({
      server: process.env.EMAIL_SERVER!,
      from: process.env.EMAIL_FROM!,
    }),

    /* Credentials (email + password) */
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Correo', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        /* Fetch only what we need */
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          select: { id: true, email: true, name: true, hashedPassword: true },
        });
        if (!user?.hashedPassword) return null;

        const ok = await bcrypt.compare(
          credentials.password,
          user.hashedPassword,
        );
        if (!ok) return null;

        /* Return only safe fields */
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],

  /* Sessions live in the DB for 30 days (change if you like) */
  session: {
    strategy: 'jwt', // <‑‑ change this line (or just delete the entire `session` block; JWT is the default)
  },

  pages: {
    signIn: '/login',
    error: '/login',
    verifyRequest: '/verify',
    newUser: '/dashboard', // first login (OAuth or email)
  },

  callbacks: {
    async session({ session, token }) {
      if (session.user && token?.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};
