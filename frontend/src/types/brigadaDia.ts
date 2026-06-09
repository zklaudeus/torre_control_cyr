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
