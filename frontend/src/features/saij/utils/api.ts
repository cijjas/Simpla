/**
 * Minimal, typed client for SAIJ’s undocumented JSON endpoints.
 * They answer in Latin‑1, so we always decode by hand before JSON.parse.
 */
import 'server-only';

/* ---------- Types (trimmed from your quicktype dump) ---------- */

export interface SaijResponse {
  queryObjectData: QueryObjectData;
  searchResults: SearchResults;
}
export interface QueryObjectData {
  facets: string;
  offset: number;
  pageSize: number;
  query: string;
  rawQuery: string;
  sortBy: string;
  viewType: string;
}
export interface SearchResults {
  iterationToken: string;
  categoriesResultList: Facet[];
  searchResults: Facet[];
  totalSearchResults: number;
  expandedQuery: string;
  documentResultList: DocumentResult[];
  inputQuery: string;
}
export interface Facet {
  facetChildren: Facet[];
  facetName: string;
  currentDepth: number;
  facetHits: number;
  hasMoreChildren: boolean;
}
export interface DocumentResult {
  documentScore: number;
  uuid: string;
  explain: string;
  documentAbstract: string;
}

async function fetchSaij<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
      Accept: 'application/json',
      'Accept-Language': 'es-ES,es;q=0.9',
    },
  });

  const buffer = await res.arrayBuffer();
  const contentType = res.headers.get('content-type') ?? '';
  const charsetMatch = contentType.match(/charset=([^;]+)/i);
  // if server really says ISO‑8859‑1, decode latin1; otherwise assume utf‑8
  const encoding =
    charsetMatch?.[1].trim().toLowerCase() === 'iso-8859-1'
      ? 'latin1'
      : 'utf-8';

  const text = new TextDecoder(encoding).decode(buffer);
  return JSON.parse(text) as T;
}

/* ---------- Public helpers ---------- */

/** Main search endpoint (`/busqueda`). */
export async function saijSearch(
  params: URLSearchParams,
): Promise<SaijResponse> {
  const url = `https://www.saij.gob.ar/busqueda?${params.toString()}`;
  return fetchSaij<SaijResponse>(url);
}

/** Autocomplete endpoint (`/suggest`). */
export async function saijSuggest(params: URLSearchParams): Promise<unknown[]> {
  const url = `https://www.saij.gob.ar/suggest?${params.toString()}`;
  return fetchSaij<unknown[]>(url);
}
