// Librería de utilidades para consultar la API de Infoleg
'tuse client'; // sólo compila en ambos entornos

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

const API_BASE =
  'https://servicios.infoleg.gob.ar/infolegInternet/api/v2.0/nacionales/normativos';

function buildQuery(params: Record<string, unknown>) {
  return Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(
      ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`,
    )
    .join('&');
}

/**
 * Búsqueda paginada de normas
 */
export async function searchNormas(params: SearchParams) {
  // En cliente usamos nuestro proxy para evitar CORS
  if (typeof window !== 'undefined') {
    const res = await fetch('/api/infoleg/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Error al buscar normas');
    return res.json();
  }

  const { tipo, ...rest } = params;
  const url = `${API_BASE}/${tipo}?${buildQuery(rest)}`;
  const res = await fetch(url, {
    headers: { 'Accept-Encoding': 'gzip' },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Error al buscar normas');
  return res.json();
}

/**
 * Detalle de una norma por ID
 */
export async function getNormaDetalle(id: number) {
  if (typeof window !== 'undefined') {
    const res = await fetch(`/api/infoleg/detail?id=${id}`);
    if (!res.ok) throw new Error('Norma no encontrada');
    return res.json();
  }
  const url = `${API_BASE}?id=${id}`;
  const res = await fetch(url, {
    headers: { 'Accept-Encoding': 'gzip' },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Norma no encontrada');
  return res.json();
}
