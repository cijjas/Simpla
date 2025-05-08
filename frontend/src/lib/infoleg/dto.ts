// dto.ts

export type IdNormaDto = {
  numero?: string;
  dependencia?: string;
  ramaDigesto?: string;
};

export type SearchParamsDto = {
  tipo: string;
  numero?: number;
  sancion?: string;
  texto?: string;
  dependencia?: string;
  publicacion_desde?: string;
  publicacion_hasta?: string;
  limit?: number;
  offset?: number;
};

export type NormaItemDto = {
  id: number;
  jurisdiccion?: string;
  claseNorma?: string;
  idNormas?: IdNormaDto[];
  tipoNorma?: string;
  numeroBoletin?: number;
  numeroPagina?: number;
  publicacion?: string;
  sancion?: string;
  tituloSumario?: string;
  tituloResumido?: string;
  textoResumido?: string;
  estado?: string;
};

export type NormaDetalladaDto = {
  id: number;
  jurisdiccion?: string;
  claseNorma?: string;
  tipoNorma?: string;
  sancion?: string;
  idNormas?: IdNormaDto[];
  publicacion?: string;
  tituloSumario?: string;
  tituloResumido?: string;
  textoResumido?: string;
  observaciones?: string;
  nroBoletin?: string;
  pagBoletin?: string;
  textoNorma?: string;
  textoNormaAct?: string;
  listaNormasQueComplementa?: number[];
  listaNormasQueLaComplementan?: number[];
};

export type NormaDetalladaResumenDto = Omit<
  NormaDetalladaDto,
  'textoNorma' | 'textoNormaAct'
>;

export type ListadoNormasDto = {
  metadata: {
    resultset: {
      count: number;
      offset: number;
      limit: number;
    };
  };
  results: NormaItemDto[];
};

export type TipoNormaDto = {
  detalle: string;
  route: string;
};

export type DependenciaDto = string;

export type ResourceHtmlDto = {
  'content-type': 'text/html';
  data: string;
};

export type InfolegErrorDto = {
  status: number;
  developerMessage: string;
  userMessage: string;
  errorCode: number;
  moreInfo?: string;
};

export enum InfolegErrorCode {
  INTERNAL_ERROR = 1001,
  INVALID_PARAMS = 1002,
  NOT_FOUND = 1003,
  INVALID_PARAM = 1004,
  LIMIT_TOO_HIGH = 1005,
  NUMBER_AND_YEAR_NOT_ALLOWED = 1006,
  NON_NUMERIC_NUMBER = 1007,
  INVALID_DATE_FROM = 1008,
  INVALID_DATE_TO = 1009,
  NON_NUMERIC_YEAR = 1010,
  NON_NUMERIC_LIMIT = 1011,
  NON_NUMERIC_OFFSET = 1012,
  MISSING_DATE_TO = 1013,
  MISSING_DATE_FROM = 1014,
  NO_VALID_PARAM = 1015,
  INVALID_LIMIT_OR_OFFSET = 1016,
  INVALID_DEPENDENCY = 1017,
  SUMMARY_FETCH_ERROR = 1018,
  INVALID_TYPE_NORMA = 1019,
  INVALID_RESOURCE_ID = 1020,
  NULL_PUBLICATION = 1021,
  INVALID_PUBLICATION = 1022,
}
