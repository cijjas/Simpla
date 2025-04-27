import { NextResponse } from 'next/server';

const BASE =
  'https://servicios.infoleg.gob.ar/infolegInternet/api/v2.0/nacionales/normativos';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id requerido' }, { status: 400 });
  }
  const url = `${BASE}?id=${id}`;
  const res = await fetch(url, { headers: { 'Accept-Encoding': 'gzip' } });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
