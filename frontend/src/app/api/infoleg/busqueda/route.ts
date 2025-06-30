import { NextResponse } from 'next/server';

const BASE = `${process.env.INFOLEG_BASE_URL}/api/v2.0/nacionales/normativos`;

function buildQuery(params: Record<string, unknown>) {
  return Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(
      ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`,
    )
    .join('&');
}

export async function POST(req: Request) {
  const body = await req.json();
  const { tipo, ...rest } = body;

  const url = `${BASE}/${tipo}?${buildQuery(rest)}`;
  
  try {
    // Configure fetch options with proper error handling
    const fetchOptions: RequestInit = {
      headers: { 
        'Accept-Encoding': 'gzip',
        'User-Agent': 'Mozilla/5.0 (compatible; SIMPLA/1.0)',
      },
    };
    
    const res = await fetch(url, fetchOptions);

    if (!res.ok) {
      const err = await res.json().catch(() => ({
        error: 'Respuesta no válida del servidor Infoleg',
      }));
      return NextResponse.json(err, { status: res.status });
    }

    return NextResponse.json(await res.json());
  } catch (error) {
    console.error('Error fetching from Infoleg API:', error);
    
    // Handle SSL certificate errors specifically
    if (error instanceof Error && error.message.includes('certificate')) {
      return NextResponse.json(
        { 
          error: 'Error de certificado SSL al conectar con el servidor externo',
          details: 'Problema de verificación de certificado'
        }, 
        { status: 503 }
      );
    }
    
    // Handle other fetch errors
    return NextResponse.json(
      { 
        error: 'Error de conexión con el servidor externo',
        details: error instanceof Error ? error.message : 'Error desconocido'
      }, 
      { status: 503 }
    );
  }
}
