export interface Norma {
  id: number;
  tipoNorma: string;
  claseNorma?: string;
  idNormas?: {
    numero: string;
    dependencia: string;
    ramaDigesto: string;
  }[];
  numeroBoletin?: number;
  numeroPagina?: number;
  publicacion?: string;
  sancion?: string;
  tituloSumario?: string;
  tituloResumido?: string;
  textoResumido?: string;
  estado?: string;
  jurisdiccion?: string;
  nombreNorma: string;
  esNumerada: boolean;
}
