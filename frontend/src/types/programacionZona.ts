export interface ProgramacionZona {
  id: number | null;
  fecha_operacional: string;
  zona: string;
  reconexiones_programadas: number;
  asignacion_carga: number;
  corte_programado: number;
}

export interface ProgramacionZonaBase {
  zona: string;
  reconexiones_programadas: number;
  asignacion_carga: number;
  corte_programado: number;
}

export interface ProgramacionZonaBulkCreate {
  fecha_operacional: string;
  items: ProgramacionZonaBase[];
}

export interface ParametroZona {
  id: number;
  zona: string;
  brigadas_contrato: number;
  activo: boolean;
}
