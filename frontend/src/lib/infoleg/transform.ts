import { Norma, NormaSummary } from './types';
import { TIPOS_CON_NUMERO, TIPOS_CON_NUMERO_Y_ANIO } from './constants';

type PossiblyIncompleteNorma = Partial<Norma> & Partial<NormaSummary>;

export function enrichNorma<T extends PossiblyIncompleteNorma>(n: T): T {
  const numero = n.idNormas?.[0]?.numero ?? n.id;
  const year =
    n.sancion || n.publicacion
      ? new Date(n.sancion ?? n.publicacion!).getFullYear()
      : null;

  const tipo = n.tipoNorma?.trim() ?? '';
  const esNumerada = TIPOS_CON_NUMERO.has(tipo);
  const usaAnio = TIPOS_CON_NUMERO_Y_ANIO.has(tipo);

  const nombreNorma =
    esNumerada && numero
      ? usaAnio && year
        ? `${tipo} ${numero}/${year}`
        : `${tipo} ${numero}`
      : tipo;

  return {
    ...n,
    esNumerada,
    nombreNorma,
    copyText:
      'textoNorma' in n
        ? (n.textoNorma ?? '').replace(/<[^>]+>/g, '')
        : undefined,

    // 🚫 No `any` — check both formats safely
    nroBoletin:
      'nroBoletin' in n
        ? n.nroBoletin
        : 'numeroBoletin' in n
        ? String((n as { numeroBoletin?: number }).numeroBoletin)
        : undefined,

    pagBoletin:
      'pagBoletin' in n
        ? n.pagBoletin
        : 'numeroPagina' in n
        ? String((n as { numeroPagina?: number }).numeroPagina)
        : undefined,
  } as T;
}

export function enrichNormas<T extends PossiblyIncompleteNorma>(
  list: T[],
): T[] {
  return list.map(enrichNorma);
}
