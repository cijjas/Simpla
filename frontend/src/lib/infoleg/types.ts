// src/lib/infoleg/types.ts

import type {
  NormaItemDto,
  NormaDetalladaDto,
  NormaDetalladaResumenDto,
} from './dto';

/**
 * App model: Norma item shown in a search result.
 */
export type NormaItem = NormaItemDto & {
  esNumerada: boolean;
  nombreNorma: string;
  nroBoletin?: string;
  pagBoletin?: string;
};

/**
 * App model: Norma detallada con texto y resumen.
 */
export type NormaDetallada = NormaDetalladaDto & {
  esNumerada: boolean;
  nombreNorma: string;
  copyTextoNorma?: string;
};

/**
 * App model: Norma resumen sin texto (for linked references).
 */
export type NormaDetalladaResumen = NormaDetalladaResumenDto & {
  esNumerada: boolean;
  nombreNorma: string;
};

export type ListadoNormas = {
  metadata: {
    resultset: {
      count: number;
      offset: number;
      limit: number;
    };
  };
  results: NormaItem[];
};
