import { NextResponse } from 'next/server';
import { enrichNormas } from '@/lib/infoleg/parseNorma';

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

  if (!tipo) {
    return NextResponse.json({ error: 'tipo requerido' }, { status: 400 });
  }

  const url = `${BASE}/${tipo}?${buildQuery(rest)}`;
  const res = await fetch(url, { headers: { 'Accept-Encoding': 'gzip' } });
  const data = await res.json();

  // Enriquecés los resultados antes de devolverlos
  const enriched = {
    ...data,
    results: enrichNormas(data.results),
  };

  return NextResponse.json(enriched, { status: res.status });
}
