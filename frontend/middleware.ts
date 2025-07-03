import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // Additional middleware logic can go here
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Allow all auth routes (login, signup, etc.)
        if (
          pathname.startsWith('/iniciar-sesion') ||
          pathname.startsWith('/registrarse') ||
          pathname.startsWith('/recuperar-contrasena') ||
          pathname.startsWith('/restablecer-contrasena') ||
          pathname.startsWith('/verificar')
        ) {
          return true;
        }

        // Allow public routes (landing page, etc.)
        if (pathname === '/' || pathname.startsWith('/publico')) {
          return true;
        }

        // All other routes require authentication (this covers your entire (app) group)
        return !!token;
      },
    },
    pages: {
      signIn: '/iniciar-sesion',
    },
  },
);

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
