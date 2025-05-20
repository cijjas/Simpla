// src/lib/auth/index.ts
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth';

export async function auth() {
  return getServerSession(authOptions);
}
