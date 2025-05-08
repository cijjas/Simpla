import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const query = req.nextUrl.searchParams;
  const resumen = query.get('resumen') === 'true' ? '&resumen=true' : '';

  const url = `https://servicios.infoleg.gob.ar/infolegInternet/api/v2.0/nacionales/normativos?id=${id}${resumen}`;
  const res = await fetch(url, {
    headers: { 'Accept-Encoding': 'gzip' },
  });

  const data = await res.json();
  return NextResponse.json(data);
}
