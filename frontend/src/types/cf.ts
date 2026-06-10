export interface ProgramacionCFZona {
  id?: number;
  fecha_operacional: string;
  zona: string;
  reconexiones_programadas: number;
  total_reconexiones_ejecutadas: number;
  cortes_programados: number;
}

export interface ProgramacionCFZonaResponse {
  fecha_operacional: string;
  zonas: ProgramacionCFZona[];
}

export interface ProgramacionCFZonaBulkCreate {
  fecha_operacional: string;
  items: ProgramacionCFZona[];
}

export interface ResultadoRealCFZonaCalculado {
  zona: string;
  fecha_operacional: string;
  total_cortes_cf: number;
  corte_en_poste_cf: number;
  corte_en_empalme_cf: number;
  visita_fallida_cf: number;
  primer_corte_cf: string | null;
  ultimo_corte_cf: string | null;
  acum_09: number;
  acum_10: number;
  acum_11: number;
  acum_12: number;
  acum_13: number;
  acum_14: number;
  tiene_brigadas_cf: boolean;
}

export interface ResultadosRealesCFZonaResponse {
  fecha_operacional: string;
  zonas: ResultadoRealCFZonaCalculado[];
  alertas: string[];
}
