export interface BrigadaDiaria {
  id: number;
  fecha_operacional: string;
  zona: string;
  codigo_sap: string;
  patente: string;
  usuario: string;
  tipo_brigada: string;
  estado_brigada: string;
  hora_primer_movimiento: string | null;
  observacion_brigada: string | null;
  // Nuevos campos de resultados por brigada (Ajuste 5.1)
  reconexiones_ejecutadas: number;
  primer_corte: string | null;
  ultimo_corte: string | null;
  acum_09: number;
  acum_10: number;
  acum_11: number;
  acum_12: number;
  acum_13: number;
  acum_14: number;
  corte_en_poste: number;
  corte_en_empalme: number;
  visita_fallida: number;
}

export interface BrigadaDiariaCreate {
  fecha_operacional: string;
  zona: string;
  codigo_sap: string;
  patente: string;
  usuario: string;
  tipo_brigada: string;
  estado_brigada: string;
  hora_primer_movimiento: string | null;
  observacion_brigada: string | null;
  // Nuevos campos
  reconexiones_ejecutadas: number;
  primer_corte: string | null;
  ultimo_corte: string | null;
  acum_09: number;
  acum_10: number;
  acum_11: number;
  acum_12: number;
  acum_13: number;
  acum_14: number;
  corte_en_poste: number;
  corte_en_empalme: number;
  visita_fallida: number;
}

export interface ResumenBrigadasZona {
  zona: string;
  brigadas_pxq: number;
  brigadas_cf: number;
  brigadas_convenio: number;
  total_brigadas_reportadas: number;
  brigadas_operativas: number;
  brigadas_inactivas: number;
  observacion_automatica: string;
}
