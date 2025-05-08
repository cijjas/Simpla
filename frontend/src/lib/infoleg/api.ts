// src/lib/infoleg/api.ts

import {
  NormaItemDto,
  NormaDetalladaDto,
  NormaDetalladaResumenDto,
  IdNormaDto,
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

import {
  TIPOS_CON_NUMERO,
  TIPOS_CON_NUMERO_Y_ANIO,
  infolegErrorMessages,
} from './constants';
import { getApiUrl } from './utils';
import { formatDatePretty } from '../utils';

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

const getNumero = (id: number, arr?: IdNormaDto[]) =>
  arr?.[0]?.numero ?? String(id);

const getYear = (s?: string, p?: string) =>
  s || p ? new Date(s ?? p!).getFullYear() : undefined;

const buildNombre = (
  tipo: string,
  numero?: string | number,
  year?: number,
): string => {
  const t = tipo.trim();
  if (!TIPOS_CON_NUMERO.has(t)) return t;
  if (numero == null) return t;
  return TIPOS_CON_NUMERO_Y_ANIO.has(t) && year
    ? `${t} ${numero}/${year}`
    : `${t} ${numero}`;
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
  };
};

const enrichDetallada = (d: NormaDetalladaDto): NormaDetallada => {
  const numero = getNumero(d.id, d.idNormas);
  const year = getYear(d.sancion, d.publicacion);
  return {
    ...d,
    esNumerada: TIPOS_CON_NUMERO.has(d.tipoNorma?.trim() ?? ''),
    nombreNorma: buildNombre(d.tipoNorma ?? '', numero, year),
    copyTextoNorma: [
      buildNombre(d.tipoNorma ?? '', numero, year),
      d.tituloSumario || d.tituloResumido || '(Sin título)',
      d.textoResumido?.trim(),
      '',
      `Publicado en el Boletín Oficial${
        d.nroBoletin ? ` N° ${d.nroBoletin}` : ''
      }${d.pagBoletin ? `, página ${d.pagBoletin}` : ''}${
        d.publicacion ? ` el ${formatDatePretty(d.publicacion)}` : ''
      }${d.sancion ? ` – Sancionada el ${formatDatePretty(d.sancion)}` : ''}${
        d.jurisdiccion ? ` – Jurisdicción: ${d.jurisdiccion}` : ''
      }`,
      '',
      `Fuente: https://www.simplar.com.ar/norma/${d.id}`,
    ]
      .filter(Boolean)
      .join('\n'),
  };
};

const enrichResumen = (d: NormaDetalladaResumenDto): NormaDetalladaResumen => {
  const numero = getNumero(d.id, d.idNormas);
  const year = getYear(d.sancion, d.publicacion);
  return {
    ...d,
    esNumerada: TIPOS_CON_NUMERO.has(d.tipoNorma?.trim() ?? ''),
    nombreNorma: buildNombre(d.tipoNorma ?? '', numero, year),
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
