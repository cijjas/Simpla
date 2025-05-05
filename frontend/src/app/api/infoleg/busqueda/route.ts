import { NextResponse } from 'next/server';
import { enrichNormas } from '@/lib/infoleg/transform';
import { SearchParams } from '@/lib/infoleg/api';

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

  const url = `https://servicios.infoleg.gob.ar/infolegInternet/api/v2.0/nacionales/normativos/${tipo}?${buildQuery(
    rest,
  )}`;
  const res = await fetch(url, { headers: { 'Accept-Encoding': 'gzip' } });
  const data = await res.json();

  return NextResponse.json({
    ...data,
    results: enrichNormas(data.results),
  });
}
