import { NextRequest, NextResponse } from 'next/server';

const backendBaseUrl = process.env.BACKEND_URL || 'http://localhost:8000';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    // Forward request to backend API
    const backendUrl = `${backendBaseUrl}/api/norma/${id}/`;
    
    const backendRes = await fetch(backendUrl, { 
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!backendRes.ok) {
      const errorText = await backendRes.text();
      console.error(`Backend error: ${backendRes.status} - ${errorText}`);
      
      return NextResponse.json(
        { 
          error: 'Error del servidor backend',
          details: errorText,
          status: backendRes.status 
        }, 
        { status: backendRes.status }
      );
    }

    const data = await backendRes.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error fetching norma from backend:', error);
    
    return NextResponse.json(
      { 
        error: 'Error de conexión con el servidor backend',
        details: error instanceof Error ? error.message : 'Error desconocido'
      }, 
      { status: 500 }
    );
  }
}
