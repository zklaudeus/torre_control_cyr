export interface ResultadoRealZonaCalculado {
  zona: string;
  fecha_operacional: string;
  total_reconexiones_ejecutadas: number;
  total_cortes: number;
  corte_en_poste: number;
  corte_en_empalme: number;
  visita_fallida: number;
  primer_corte: string | null;
  ultimo_corte: string | null;
  acum_09: number;
  acum_10: number;
  acum_11: number;
  acum_12: number;
  acum_13: number;
  acum_14: number;
  tiene_brigadas: boolean;
}

export interface ResultadosRealesZonaResponse {
  fecha_operacional: string;
  zonas: ResultadoRealZonaCalculado[];
  alertas: string[];
}
