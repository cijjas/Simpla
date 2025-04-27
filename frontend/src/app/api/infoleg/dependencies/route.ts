import { NextResponse } from 'next/server';

const URL =
  'https://servicios.infoleg.gob.ar/infolegInternet/api/v2.0/nacionales/normativos/dependencias';

export async function GET() {
  const res = await fetch(URL, { headers: { 'Accept-Encoding': 'gzip' } });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
