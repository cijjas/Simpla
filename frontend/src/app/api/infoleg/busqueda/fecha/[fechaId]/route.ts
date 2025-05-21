import { NextRequest, NextResponse } from 'next/server';
const upstreamBase = process.env.INFOLEG_BASE_URL!;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ fechaId: string }> },
) {
  const { fechaId } = await params;

  const upstreamUrl = `${upstreamBase}/api/v2.0/nacionales/normativos/publicaciones/${fechaId}`;
  const res = await fetch(upstreamUrl, {
    cache: 'no-store',
    headers: { 'Accept-Encoding': 'gzip' },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({
      error: 'Respuesta no válida del servidor Infoleg',
    }));
    return NextResponse.json(err, { status: res.status });
  }

  return NextResponse.json(await res.json());
}
