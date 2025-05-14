// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  throw new Error('MIDDLEWARE IS RUNNING');
}

export const config = {
  matcher: ['/', '/login', '/dashboard/:path*'],
};
