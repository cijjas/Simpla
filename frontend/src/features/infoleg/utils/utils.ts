import { formatDatePretty } from '@/lib/utils';
import { TIPOS_CON_NUMERO, TIPOS_CON_NUMERO_Y_ANIO } from './constants';
import { IdNormaDto } from './dto';

export function getApiUrl(path: string): string {
  if (typeof window === 'undefined') {
    const base =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.NODE_ENV === 'production'
        ? 'https://www.simplar.com.ar'
        : 'http://localhost:3000');
    return `${base}${path}`;
  }

  return path;
}

export const getNumero = (id: number, arr?: IdNormaDto[]) =>
  arr?.[0]?.numero ?? String(id);

export const getYear = (s?: string, p?: string) =>
  s || p ? new Date(s ?? p!).getFullYear() : undefined;

export const buildNombre = (
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

type NormaCompatible = {
  id: number;
  tipoNorma?: string;
  idNormas?: IdNormaDto[];
  sancion?: string;
  publicacion?: string;
  tituloSumario?: string;
  tituloResumido?: string;
  textoResumido?: string;
  numeroBoletin?: number;
  nroBoletin?: string;
  numeroPagina?: number;
  pagBoletin?: string;
  jurisdiccion?: string;
};

export function buildCopyTexto(norma: NormaCompatible): string {
  const numero = norma.idNormas?.[0]?.numero ?? String(norma.id);
  const year =
    norma.sancion || norma.publicacion
      ? new Date(norma.sancion ?? norma.publicacion!).getFullYear()
      : undefined;
  const nombreNorma = buildNombre(norma.tipoNorma ?? '', numero, year);

  return [
    nombreNorma,
    recaseUpperTitle(norma.tituloSumario) ||
      recaseUpperTitle(norma.tituloResumido) ||
      '(Sin título)',
    `\nResumen: ${recaseUpperText(norma.textoResumido?.trim())}\n`,
    `Publicado en el Boletín Oficial${
      norma.numeroBoletin || norma.nroBoletin
        ? ` N° ${norma.numeroBoletin ?? norma.nroBoletin}`
        : ''
    }${
      norma.numeroPagina || norma.pagBoletin
        ? `, página ${norma.numeroPagina ?? norma.pagBoletin}`
        : ''
    }${norma.publicacion ? ` el ${formatDatePretty(norma.publicacion)}` : ''}${
      norma.sancion ? ` – Sancionada el ${formatDatePretty(norma.sancion)}` : ''
    }${norma.jurisdiccion ? ` – Jurisdicción: ${norma.jurisdiccion}` : ''}`,
    '',
    `Fuente: https://www.simplar.com.ar/norma/${norma.id}`,
  ]
    .filter(Boolean)
    .join('\n');
}

export function recaseUpperTitle(
  text?: string | null,
  _knownAcronyms: string[] = [],
): string | undefined {
  return text ?? undefined;
}

// utils/text.ts
export const STOP_WORDS = [
  'EL',
  'LA',
  'LOS',
  'LAS',
  'UN',
  'UNA',
  'UNOS',
  'UNAS',
  'DE',
  'DEL',
  'AL',
  'Y',
  'O',
  'EN',
  'POR',
  'PARA',
  'CON',
  'SIN',
] as const;

const _ROMAN = /^[IVXLCDM]{2,}$/;

/**
 * Re‑cases text that is (mostly) SHOUT‑CASE.
 * @param text  Original text in UPPERCASE (optionally mixed)
 * @param knownAcronyms  Extra acronyms you want forced to UPPERCASE
 */
export function recaseUpperText(
  text?: string | null,
  _knownAcronyms: string[] = [],
): string | undefined {
  return text ?? undefined;

  // if (!text) return;

  // const STOP = new Set(STOP_WORDS);
  // const ACR = new Set(knownAcronyms.map(a => a.toUpperCase()));

  // // 1️⃣ normalise whitespace and split by sentence punctuation (keeps the delimiters)
  // const chunks = text.trim().split(/([.?!¡¿]\s*)/);

  // const rebuilt = chunks.map(chunk => {
  //   if (/^[.?!¡¿]/.test(chunk)) return chunk; // keep punctuation separators without change

  //   // Work word‑by‑word inside the sentence chunk
  //   return chunk
  //     .toLowerCase()
  //     .split(/\s+/)
  //     .map((word, idx) => {
  //       const raw = word.replace(/[“”"()[\],;:]/g, ''); // strip simple punctuation for tests
  //       const upper = raw.toUpperCase();

  //       if (ACR.has(upper)) return upper; // custom acronyms
  //       if (ROMAN.test(upper)) return upper; // Roman numerals
  //       if (STOP.has(upper as (typeof STOP_WORDS)[number]) && idx) return raw; // stop‑word not at sentence start → lower‑case

  //       // default: Title‑case
  //       return raw.charAt(0).toUpperCase() + raw.slice(1);
  //     })
  //     .join(' ');
  // });

  // return rebuilt.join('');
}
