import { NextResponse } from 'next/server';
import { enrichNorma } from '@/lib/infoleg/transform';

const BASE =
  'https://servicios.infoleg.gob.ar/infolegInternet/api/v2.0/nacionales/normativos';

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id requerido' }, { status: 400 });
  }
  const url = `${BASE}?id=${id}`;
  const res = await fetch(url, { headers: { 'Accept-Encoding': 'gzip' } });
  const data = await res.json();
  return NextResponse.json(enrichNorma(data), { status: res.status });
}
