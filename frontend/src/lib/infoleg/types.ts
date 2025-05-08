// src/lib/infoleg/types.ts

import type {
  NormaItemDto,
  NormaDetalladaDto,
  NormaDetalladaResumenDto,
} from './dto';

export type NormaItem = NormaItemDto & {
  esNumerada: boolean;
  nombreNorma: string;
  nroBoletin?: string;
  pagBoletin?: string;
  copyTexto: string;
  textoResumidoFormateado?: string;
  tituloResumidoFormateado?: string;
  tituloSumarioFormateado?: string;
};

export type NormaDetallada = NormaDetalladaDto & {
  esNumerada: boolean;
  nombreNorma: string;
  copyTexto: string;
  textoResumidoFormateado?: string;
  tituloResumidoFormateado?: string;
  tituloSumarioFormateado?: string;
};

export type NormaDetalladaResumen = NormaDetalladaResumenDto & {
  esNumerada: boolean;
  nombreNorma: string;
  copyTexto: string;
  textoResumidoFormateado?: string;
  tituloResumidoFormateado?: string;
  tituloSumarioFormateado?: string;
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
