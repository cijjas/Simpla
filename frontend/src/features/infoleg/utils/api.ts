// src/lib/infoleg/api.ts

import {
  NormaItemDto,
  NormaDetalladaDto,
  NormaDetalladaResumenDto,
  ListadoNormasDto,
  InfolegErrorDto,
  SearchParamsDto,
} from './dto';

import {
  NormaDetallada,
  NormaItem,
  NormaDetalladaResumen,
  ListadoNormas,
} from './types';

import { TIPOS_CON_NUMERO, infolegErrorMessages } from './constants';
import {
  buildCopyTexto,
  buildNombre,
  getApiUrl,
  getNumero,
  getYear,
  recaseUpperText,
  recaseUpperTitle,
} from './utils';

const handle = async <T>(res: Response): Promise<T> => {
  if (!res.ok) {
    try {
      const err: InfolegErrorDto = await res.json();
      const message =
        infolegErrorMessages[err.errorCode] ||
        err.userMessage ||
        'Ocurrió un error inesperado.';
      throw new Error(message);
    } catch {
      throw new Error('No se pudo procesar la respuesta del servidor.');
    }
  }
  return res.json();
};

/* ---------------------------- enrichment ---------------------------- */

const dtoToListadoNormas = (dto: ListadoNormasDto): ListadoNormas => ({
  metadata: dto.metadata,
  results: dto.results.map(enrichItem),
});

const enrichItem = (d: NormaItemDto): NormaItem => {
  const numero = getNumero(d.id, d.idNormas);
  const year = getYear(d.sancion, d.publicacion);
  return {
    ...d,
    esNumerada: TIPOS_CON_NUMERO.has(d.tipoNorma?.trim() ?? ''),
    nombreNorma: buildNombre(d.tipoNorma ?? '', numero, year),
    nroBoletin: d.numeroBoletin?.toString(),
    pagBoletin: d.numeroPagina?.toString(),
    copyTexto: buildCopyTexto(d),
    textoResumidoFormateado: recaseUpperText(d.textoResumido),
    tituloResumidoFormateado: recaseUpperTitle(d.tituloResumido),
    tituloSumarioFormateado: recaseUpperTitle(d.tituloSumario),
  };
};

const enrichDetallada = (d: NormaDetalladaDto): NormaDetallada => {
  const numero = getNumero(d.id, d.idNormas);
  const year = getYear(d.sancion, d.publicacion);
  return {
    ...d,
    esNumerada: TIPOS_CON_NUMERO.has(d.tipoNorma?.trim() ?? ''),
    nombreNorma: buildNombre(d.tipoNorma ?? '', numero, year),
    copyTexto: buildCopyTexto(d),
    textoResumidoFormateado: recaseUpperText(d.textoResumido),
    tituloResumidoFormateado: recaseUpperTitle(d.tituloResumido),
    tituloSumarioFormateado: recaseUpperTitle(d.tituloSumario),
  };
};

const enrichResumen = (d: NormaDetalladaResumenDto): NormaDetalladaResumen => {
  const numero = getNumero(d.id, d.idNormas);
  const year = getYear(d.sancion, d.publicacion);
  return {
    ...d,
    esNumerada: TIPOS_CON_NUMERO.has(d.tipoNorma?.trim() ?? ''),
    nombreNorma: buildNombre(d.tipoNorma ?? '', numero, year),
    copyTexto: buildCopyTexto(d),
    textoResumidoFormateado: recaseUpperText(d.textoResumido),
    tituloResumidoFormateado: recaseUpperTitle(d.tituloResumido),
    tituloSumarioFormateado: recaseUpperTitle(d.tituloSumario),
  };
};

/* ---------------------- public API ---------------------- */

// src/lib/infoleg/api.ts

export const getNormas = async (
  params: SearchParamsDto,
): Promise<ListadoNormas> => {
  const res = await fetch(getApiUrl(`/api/infoleg/busqueda`), {
    method: 'POST',
    body: JSON.stringify(params),
    headers: { 'Content-Type': 'application/json' },
  });

  const dto = await handle<ListadoNormasDto>(res);

  return dtoToListadoNormas(dto);
};

export const getNormasPorFecha = async (
  fecha: string,
): Promise<ListadoNormas> => {
  const res = await fetch(getApiUrl(`/api/infoleg/busqueda/fecha/${fecha}`));

  const dto = await handle<ListadoNormasDto>(res);
  return dtoToListadoNormas(dto);
};

export const getNormaDetallada = async (
  id: number,
): Promise<NormaDetallada> => {
  const res = await fetch(getApiUrl(`/api/infoleg/norma/${id}`));
  const dto = await handle<NormaDetalladaDto>(res);
  return enrichDetallada(dto);
};

export const getNormaDetalladaResumen = async (
  id: number,
): Promise<NormaDetalladaResumen> => {
  const res = await fetch(getApiUrl(`/api/infoleg/norma/${id}?resumen=true`));
  const dto = await handle<NormaDetalladaResumenDto>(res);
  return enrichResumen(dto);
};

export const getUltimasNNormas = async (n: number): Promise<NormaItem[]> => {
  const results: NormaItem[] = [];
  const maxLookbackDays = 7;

  for (
    let offset = 0;
    offset < maxLookbackDays && results.length < n;
    offset++
  ) {
    const date = new Date();
    date.setDate(date.getDate() - offset);
    const fecha = date.toISOString().split('T')[0];

    try {
      const list = await getNormasPorFecha(fecha);

      if (list?.results && Array.isArray(list.results)) {
        results.push(...list.results);
      } else {
        console.warn(`Normas inválidas para ${fecha}:`, list);
      }
    } catch (err) {
      console.warn(`Error fetching normas para ${fecha}:`, err);
    }
  }

  return results.slice(0, n);
};
