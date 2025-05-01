export async function parseNormaViaApi(norma: any): Promise<any> {
  const baseUrl = 'http://host.docker.internal:8000';
  const response = await fetch(`${baseUrl}/api/parse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(norma),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Error parsing norma:', errorText);
    throw new Error(`Failed to parse norma: ${errorText}`);
  }

  return response.json();
}

const tiposConNumero = new Set([
  'Ley',
  'Decreto',
  'Decreto/Ley',
  'Decisión Administrativa',
  'Decisión',
  'Resolución',
  'Disposición',
  'Acordada',
  'Acta',
  'Nota Externa',
  'Circular',
  'Providencia',
  'Directiva',
  'Interpretación',
  'Instrucción',
  'Protocolo',
]);

const tiposConNumeroYAnio = new Set([
  'Decreto',
  'Decreto/Ley',
  'Decisión Administrativa',
  'Decisión',
  'Resolución',
  'Disposición',
  'Providencia',
  'Directiva',
  'Instrucción',
  'Interpretación',
  'Protocolo',
]);

export function enrichNormas(rawResults: any[]) {
  return rawResults.map(norma => {
    const numero = norma.idNormas?.[0]?.numero || norma.id;
    const año =
      norma.sancion || norma.publicacion
        ? new Date(norma.sancion || norma.publicacion).getFullYear()
        : null;

    const esNumerada = tiposConNumero.has(norma.tipoNorma);
    const usaAnio = tiposConNumeroYAnio.has(norma.tipoNorma);

    const nombreNorma =
      esNumerada && numero
        ? usaAnio && año
          ? `${norma.tipoNorma} ${numero}/${año}`
          : `${norma.tipoNorma} ${numero}`
        : norma.tipoNorma;

    return {
      ...norma,
      esNumerada,
      nombreNorma,
    };
  });
}
