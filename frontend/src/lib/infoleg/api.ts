import { Norma, NormaSummary } from './types';
import { enrichNorma, enrichNormas } from './transform';

export type SearchParams = {
  tipo: string;
  numero?: number;
  texto?: string;
  dependencia?: string;
  publicacion_desde?: string;
  publicacion_hasta?: string;
  sancion?: string;
  limit?: number;
  offset?: number;
};

function buildQuery(params: Record<string, unknown>) {
  return Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(
      ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`,
    )
    .join('&');
}

export async function searchNormas(params: SearchParams): Promise<{
  results: NormaSummary[];
  metadata: { resultset: { count: number; limit: number; offset: number } };
}> {
  const { tipo, ...query } = params;
  const isServer = typeof window === 'undefined';

  if (isServer) {
    //  Server → fetch Infoleg API directly (faster)
    const queryString = buildQuery(query);
    const url = `https://servicios.infoleg.gob.ar/infolegInternet/api/v2.0/nacionales/normativos/${tipo}?${queryString}`;
    const res = await fetch(url, {
      headers: { 'Accept-Encoding': 'gzip' },
    });

    if (!res.ok) throw new Error('Error al buscar normas');
    const data = await res.json();

    return {
      results: enrichNormas(data.results ?? []),
      metadata: data.metadata ?? {
        resultset: { count: 0, offset: 0, limit: 0 },
      },
    };
  }

  //  Client → use local proxy to bypass CORS
  const res = await fetch('/api/infoleg/search', {
    method: 'POST',
    body: JSON.stringify({ tipo, ...query }),
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) throw new Error('Error al buscar normas');
  const data = await res.json();

  return {
    results: enrichNormas(data.results ?? []),
    metadata: data.metadata ?? { resultset: { count: 0, offset: 0, limit: 0 } },
  };
}

export async function getNormaDetalle(id: number): Promise<Norma> {
  if (typeof window === 'undefined') {
    // SSR/server
    const url = `https://servicios.infoleg.gob.ar/infolegInternet/api/v2.0/nacionales/normativos?id=${id}`;
    const res = await fetch(url, { headers: { 'Accept-Encoding': 'gzip' } });
    if (!res.ok) throw new Error('Norma no encontrada');
    const raw = await res.json();
    return enrichNorma(raw as Norma);
  }

  // Client
  const res = await fetch(`/api/infoleg/detail?id=${id}`);
  if (!res.ok) throw new Error('Norma no encontrada');
  const raw = await res.json();
  return enrichNorma(raw as Norma);
}
