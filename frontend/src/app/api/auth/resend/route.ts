import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.redirect(
      new URL('/verificar?error=invalid', request.url)
    );
  }

  try {
    // Call backend resend endpoint
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    const response = await fetch(
      `${backendUrl}/api/auth/resend?email=${encodeURIComponent(email)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      // Resend successful
      return NextResponse.redirect(
        new URL('/verificar?email=' + encodeURIComponent(email) + '&resent=true', request.url)
      );
    } else {
      // Resend failed
      const error = data.detail || 'unknown';
      return NextResponse.redirect(
        new URL(`/verificar?error=${error}&email=${encodeURIComponent(email)}`, request.url)
      );
    }
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.redirect(
      new URL(`/verificar?error=network&email=${encodeURIComponent(email)}`, request.url)
    );
  }
}
