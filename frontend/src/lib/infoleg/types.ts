/**
 * Common shape for both “summary” and “detail” responses.
 * All optional because the summary doesn’t include every field.
 */

// lib/infoleg/types.ts
export type NormaResumen = Omit<
  Norma,
  'textoNorma' | 'listaNormasQueComplementa' | 'listaNormasQueLaComplementan'
>;

export interface NormaSummary {
  id: number;
  tipoNorma?: string;
  claseNorma?: string;
  jurisdiccion?: string;
  idNormas?: {
    numero: string;
    dependencia?: string;
    ramaDigesto?: string;
  }[];
  publicacion?: string;
  sancion?: string;
  tituloSumario?: string;
  tituloResumido?: string;
  textoResumido?: string;
  estado?: string;

  // Unified naming (comes from numeroBoletin or nroBoletin)
  nroBoletin?: string;
  pagBoletin?: string;

  esNumerada?: boolean;
  nombreNorma?: string;
}

export interface Norma extends NormaSummary {
  textoNorma?: string;
  observaciones?: string;
  listaNormasQueComplementa?: number[];
  listaNormasQueLaComplementan?: number[];
  copyText?: string;
  textoNormaAct?: string;
}
