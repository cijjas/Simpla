// src/app/api/infoleg/norma/[id]/route.ts
import { NextResponse } from 'next/server';

const BASE =
  'https://servicios.infoleg.gob.ar/infolegInternet/api/v2.0/nacionales/normativos';

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  const { id } = params;

  const query = new URL(req.url).searchParams;
  const resumen = query.get('resumen') === 'true' ? '&resumen=true' : '';

  const url = `${BASE}?id=${id}${resumen}`;
  const res = await fetch(url, {
    headers: { 'Accept-Encoding': 'gzip' },
  });

  const data = await res.json();
  return NextResponse.json(data);
}
