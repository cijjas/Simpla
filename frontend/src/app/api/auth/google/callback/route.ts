import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  
  try {
    console.log(`${timestamp} | API-CALLBACK | INFO | Google OAuth callback API route called`);
    const { code } = await request.json();
    console.log(`${timestamp} | API-CALLBACK | DEBUG | Authorization code received: ${code ? code.substring(0, 20) + '...' : 'null'}`);

    if (!code) {
      console.error(`${timestamp} | API-CALLBACK | ERROR | No authorization code provided`);
      return NextResponse.json(
        { error: 'Authorization code is required' },
        { status: 400 }
      );
    }

    // Exchange code for tokens with Google
    console.log(`${timestamp} | API-CALLBACK | INFO | Exchanging authorization code for tokens with Google`);
    console.log(`${timestamp} | API-CALLBACK | DEBUG | Redirect URI: ${request.nextUrl.origin}/auth/google/callback`);
    
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${request.nextUrl.origin}/auth/google/callback`,
      }),
    });

    const tokenTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    console.log(`${tokenTimestamp} | API-CALLBACK | DEBUG | Google token response status: ${tokenResponse.status}`);

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error(`${tokenTimestamp} | API-CALLBACK | ERROR | Failed to exchange code for tokens`);
      console.error(`${tokenTimestamp} | API-CALLBACK | ERROR | Google API error: ${errorText}`);
      throw new Error(`Failed to exchange code for tokens: ${tokenResponse.status} - ${errorText}`);
    }

    const tokens = await tokenResponse.json();
    console.log(`${tokenTimestamp} | API-CALLBACK | SUCCESS | Successfully received tokens from Google`);
    console.log(`${tokenTimestamp} | API-CALLBACK | DEBUG | Token type: ${tokens.token_type}, expires in: ${tokens.expires_in}s`);

    // Get user info from Google
    console.log(`${tokenTimestamp} | API-CALLBACK | INFO | Fetching user info from Google`);
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    const userTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    console.log(`${userTimestamp} | API-CALLBACK | DEBUG | Google user info response status: ${userResponse.status}`);

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error(`${userTimestamp} | API-CALLBACK | ERROR | Failed to get user info from Google`);
      console.error(`${userTimestamp} | API-CALLBACK | ERROR | Google user info error: ${errorText}`);
      throw new Error(`Failed to get user info: ${userResponse.status} - ${errorText}`);
    }

    const _googleUser = await userResponse.json();
    console.log(`${userTimestamp} | API-CALLBACK | SUCCESS | User info retrieved from Google: ${_googleUser.email}`);

    // Send to backend for authentication
    console.log(`${userTimestamp} | API-CALLBACK | INFO | Authenticating with backend`);
    console.log(`${userTimestamp} | API-CALLBACK | DEBUG | Backend URL: ${BACKEND_URL}/api/auth/google`);
    
    const backendResponse = await fetch(`${BACKEND_URL}/api/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id_token: tokens.id_token,
      }),
    });

    const backendTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    console.log(`${backendTimestamp} | API-CALLBACK | DEBUG | Backend response status: ${backendResponse.status}`);

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error(`${backendTimestamp} | API-CALLBACK | ERROR | Backend authentication failed`);
      console.error(`${backendTimestamp} | API-CALLBACK | ERROR | Backend error: ${errorText}`);
      throw new Error(`Backend authentication failed: ${backendResponse.status} - ${errorText}`);
    }

    const authData = await backendResponse.json();
    console.log(`${backendTimestamp} | API-CALLBACK | SUCCESS | Backend authentication successful`);
    console.log(`${backendTimestamp} | API-CALLBACK | INFO | User authenticated: ${authData.user.email}`);

    return NextResponse.json({
      user: authData.user,
      access_token: authData.access_token,
    });
  } catch (error) {
    const errorTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    console.error(`${errorTimestamp} | API-CALLBACK | ERROR | Google callback API route failed`);
    console.error(`${errorTimestamp} | API-CALLBACK | ERROR | Error details:`, error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
