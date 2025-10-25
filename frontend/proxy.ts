import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow all auth routes (login, signup, etc.)
  if (
    pathname.startsWith('/iniciar-sesion') ||
    pathname.startsWith('/registrarse') ||
    pathname.startsWith('/recuperar-contrasena') ||
    pathname.startsWith('/restablecer-contrasena') ||
    pathname.startsWith('/verificar')
  ) {
    return NextResponse.next();
  }

  // Allow public routes (landing page, etc.)
  if (pathname === '/' || pathname.startsWith('/publico')) {
    return NextResponse.next();
  }

  // Check for access token in cookies or headers
  const accessToken = request.cookies.get('access_token')?.value || 
                     request.headers.get('authorization')?.replace('Bearer ', '');

  // If no access token, redirect to login
  if (!accessToken) {
    const loginUrl = new URL('/iniciar-sesion', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Continue to the requested page
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images|fonts|svgs|ico).*)',
  ],
};
