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

const isServer = typeof window === 'undefined';

function buildQuery(params: Record<string, unknown>) {
  return Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== '')
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
    )
    .join('&');
}

async function fetchNormaFromAPI(id: number, resumen = false): Promise<Norma> {
  const suffix = resumen ? '&resumen=true' : '';
  const url = `https://servicios.infoleg.gob.ar/infolegInternet/api/v2.0/nacionales/normativos?id=${id}${suffix}`;
  const res = await fetch(url, { headers: { 'Accept-Encoding': 'gzip' } });

  if (!res.ok) throw new Error('Norma no encontrada');
  const raw = await res.json();
  return enrichNorma(raw as Norma);
}

async function fetchNormaFromClient(id: number): Promise<Norma> {
  const res = await fetch(`/api/infoleg/detail?id=${id}`);
  if (!res.ok) throw new Error('Norma no encontrada');
  const raw = await res.json();
  return enrichNorma(raw as Norma);
}

export async function getNormaDetalle(id: number): Promise<Norma> {
  return isServer ? fetchNormaFromAPI(id, false) : fetchNormaFromClient(id);
}

export async function getNormaDetalleResumen(id: number): Promise<Norma> {
  return isServer ? fetchNormaFromAPI(id, true) : fetchNormaFromClient(id);
}

export async function searchNormas(params: SearchParams): Promise<{
  results: NormaSummary[];
  metadata: { resultset: { count: number; limit: number; offset: number } };
}> {
  const { tipo, ...query } = params;

  if (isServer) {
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

  // Client: use local proxy to bypass CORS
  const res = await fetch('/api/infoleg/busqueda', {
    method: 'POST',
    body: JSON.stringify({ tipo, ...query }),
    headers: { 'Content-Type': 'application/json' },
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
