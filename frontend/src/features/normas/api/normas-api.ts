/**
 * API service for normas functionality
 */

export interface NormaReferencia {
  id: number;
  norma_id: number;
  numero: number;
  dependencia?: string;
  rama_digesto?: string;
  created_at: string;
}

export interface NormaSummary {
  id: number;
  infoleg_id: number;
  jurisdiccion?: string;
  clase_norma?: string;
  tipo_norma?: string;
  sancion?: string;
  publicacion?: string;
  titulo_sumario?: string;
  titulo_resumido?: string;
  texto_resumido?: string;
  observaciones?: string;
  nro_boletin?: string;
  pag_boletin?: string;
  estado?: string;
  created_at: string;
  updated_at: string;
  referencia?: NormaReferencia;
}

export interface NormaDetail extends NormaSummary {
  id_normas?: Record<string, unknown>;
  texto_norma?: string;
  texto_norma_actualizado?: string;
  lista_normas_que_complementa?: Record<string, unknown>;
  lista_normas_que_la_complementan?: Record<string, unknown>;
  purified_texto_norma?: string;
  purified_texto_norma_actualizado?: string;
  embedding_model?: string;
  embedding_source?: string;
  embedded_at?: string;
  embedding_type?: string;
  llm_model_used?: string;
  llm_models_used?: Record<string, unknown>;
  llm_tokens_used?: number;
  llm_processing_time?: number;
  llm_similarity_score?: number;
  inserted_at: string;
  divisions: Division[];
  referencia?: NormaReferencia;
}

export interface Division {
  id: number;
  name?: string;
  ordinal?: string;
  title?: string;
  body?: string;
  order_index?: number;
  created_at: string;
  articles: Article[];
  child_divisions: Division[];
}

export interface Article {
  id: number;
  ordinal?: string;
  body: string;
  order_index?: number;
  created_at: string;
  child_articles: Article[];
}

export interface NormaSearchResponse {
  normas: NormaSummary[];
  total_count: number;
  has_more: boolean;
  limit: number;
  offset: number;
}

export interface NormaFilterOptions {
  tipos_norma: string[];
  dependencias: string[];
  titulos_sumario: string[];
}

export interface NormaStats {
  total_normas: number;
  total_divisions: number;
  total_articles: number;
  normas_by_jurisdiction: Record<string, number>;
  normas_by_type: Record<string, number>;
  normas_by_status: Record<string, number>;
}

export interface NormaBatchRequest {
  infoleg_ids: number[];
}

export interface NormaBatchResponse {
  normas: NormaSummary[];
  not_found_ids: number[];
}

export interface NormaFilters {
  search_term?: string;
  numero?: number;
  dependencia?: string;
  titulo_sumario?: string;
  jurisdiccion?: string;
  tipo_norma?: string;
  clase_norma?: string;
  estado?: string;
  año_sancion?: number;
  sancion_desde?: string;
  sancion_hasta?: string;
  publicacion_desde?: string;
  publicacion_hasta?: string;
  nro_boletin?: string;
  pag_boletin?: string;
  limit?: number;
  offset?: number;
}

export interface NormaRelacionNode {
  infoleg_id: number;
  titulo: string | null;
  titulo_resumido: string | null;
  tipo_norma: string | null;
  numero: number | null;
  sancion: string | null;
}

export interface NormaRelacionLink {
  source_infoleg_id: number;
  target_infoleg_id: number;
  tipo_relacion: string;
}

export interface NormaRelacionesResponse {
  current_norma: NormaRelacionNode;
  nodes: NormaRelacionNode[];
  links: NormaRelacionLink[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

class NormasAPI {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  private buildQueryString(filters: NormaFilters): string {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    return params.toString();
  }

  /**
   * List normas with optional filters (bulk operation - returns summaries)
   */
  async listNormas(filters: NormaFilters = {}): Promise<NormaSearchResponse> {
    const queryString = this.buildQueryString(filters);
    return this.request<NormaSearchResponse>(`/normas/?${queryString}`);
  }

  /**
   * Get a complete norma with full hierarchical structure by infoleg_id
   */
  async getNorma(infolegId: number): Promise<NormaDetail> {
    return this.request<NormaDetail>(`/normas/${infolegId}/`);
  }

  /**
   * Get a norma summary (lightweight) by infoleg_id
   */
  async getNormaSummary(infolegId: number): Promise<NormaSummary> {
    return this.request<NormaSummary>(`/normas/${infolegId}/summary/`);
  }

  /**
   * Get available filter options
   */
  async getFilterOptions(): Promise<NormaFilterOptions> {
    return this.request<NormaFilterOptions>('/normas/filter-options/');
  }

  /**
   * Get normas statistics
   */
  async getStats(): Promise<NormaStats> {
    return this.request<NormaStats>('/normas/stats/');
  }

  /**
   * Get multiple norma summaries in a single batch request
   */
  async getNormasBatch(infolegIds: number[]): Promise<NormaBatchResponse> {
    return this.request<NormaBatchResponse>('/normas/batch/', {
      method: 'POST',
      body: JSON.stringify({ infoleg_ids: infolegIds }),
    });
  }

  /**
   * Get norma relationships (modifica/modificada_por) as graph data
   */
  async getNormaRelaciones(infolegId: number): Promise<NormaRelacionesResponse> {
    return this.request<NormaRelacionesResponse>(`/normas/${infolegId}/relaciones/`);
  }
}

export const normasAPI = new NormasAPI();
