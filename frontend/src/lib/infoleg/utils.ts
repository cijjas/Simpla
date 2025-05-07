import { TIPOS_CON_NUMERO, TIPOS_CON_NUMERO_Y_ANIO } from './constants';

export function enrichNormas(rawResults: any[]) {
  return rawResults.map(norma => {
    const numero = norma.idNormas?.[0]?.numero || norma.id;
    const año =
      norma.sancion || norma.publicacion
        ? new Date(norma.sancion || norma.publicacion).getFullYear()
        : null;

    const esNumerada = TIPOS_CON_NUMERO.has(norma.tipoNorma);
    const usaAnio = TIPOS_CON_NUMERO_Y_ANIO.has(norma.tipoNorma);

    const nombreNorma =
      esNumerada && numero
        ? usaAnio && año
          ? `${norma.tipoNorma} ${numero}/${año}`
          : `${norma.tipoNorma} ${numero}`
        : norma.tipoNorma;

    return {
      ...norma,
      textoNorma: norma.textoNorma ?? norma.textoNormaAct ?? '', // added fallback
      esNumerada,
      nombreNorma,
    };
  });
}
