import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  if (!token || !email) {
    return NextResponse.redirect(
      new URL('/verificar?error=invalid', request.url)
    );
  }

  try {
    // Call backend verification endpoint
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    const response = await fetch(
      `${backendUrl}/api/auth/verify?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      // Verification successful
      return NextResponse.redirect(
        new URL('/verificar?success=true&email=' + encodeURIComponent(email), request.url)
      );
    } else {
      // Verification failed
      const error = data.detail || 'unknown';
      let errorType = 'invalid';
      
      if (error.includes('expired')) {
        errorType = 'expired';
      }
      
      return NextResponse.redirect(
        new URL(`/verificar?error=${errorType}&email=${encodeURIComponent(email)}`, request.url)
      );
    }
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.redirect(
      new URL('/verificar?error=invalid', request.url)
    );
  }
}
