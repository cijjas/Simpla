/**
 * Utility functions for norma operations
 */

interface NormaLike {
  tipo_norma?: string | null;
  sancion?: string | null;
  referencia?: {
    numero?: number;
  } | null;
}

/**
 * Generate display name from tipo_norma and referencia.numero
 * This represents the norma identifier (e.g., "LEY 25.326/2000")
 * 
 * @param norma - Norma object with tipo_norma, referencia, and sancion
 * @returns Formatted norma name identifier
 */
export function getNombreNorma(norma: NormaLike): string {
  if (norma.tipo_norma && norma.referencia?.numero) {
    const year = norma.sancion?.split('-')[0];
    return `${norma.tipo_norma} ${norma.referencia.numero}${year ? `/${year}` : ''}`;
  }
  if (norma.tipo_norma) {
    return norma.tipo_norma;
  }
  return 'NORMA';
}

