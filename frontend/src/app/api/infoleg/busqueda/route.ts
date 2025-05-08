import { NextResponse } from 'next/server';

const BASE =
  'https://servicios.infoleg.gob.ar/infolegInternet/api/v2.0/nacionales/normativos';

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
  const res = await fetch(url, { headers: { 'Accept-Encoding': 'gzip' } });

  return NextResponse.json(await res.json());
}
