import { NextRequest, NextResponse } from 'next/server';

const backendBaseUrl = process.env.BACKEND_URL || 'http://localhost:8000';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const backendUrl = `${backendBaseUrl}/api/folders/${params.id}/move/`;
    
    // Get authorization header from request
    const authHeader = req.headers.get('authorization');
    
    const backendRes = await fetch(backendUrl, { 
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { 'Authorization': authHeader }),
      },
      body: JSON.stringify(body)
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
    console.error('Error moving folder:', error);
    
    return NextResponse.json(
      { 
        error: 'Error de conexión con el servidor backend',
        details: error instanceof Error ? error.message : 'Error desconocido'
      }, 
      { status: 500 }
    );
  }
}
