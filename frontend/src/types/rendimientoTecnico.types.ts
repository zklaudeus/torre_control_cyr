// -----------------------------------------------------------------------------
// Tipos Globales para el Módulo de Rendimiento Técnico
// -----------------------------------------------------------------------------

// -- Selector de Técnicos
export type EstadoTecnico = 'Sin evaluación' | 'Crítico' | 'En recuperación' | 'Estable' | 'Alto desempeño';

export type TecnicoResumen = {
  id: string;
  nombre: string;
  codigoSap: string;
  zona: string;
  supervisor: string;
  estado: EstadoTecnico;
  fase: number;
  tipoBrigada: string;
  advertenciasActivas: number;
  productividadPromedio: number;
};

// -- KPIs
export type RendimientoTecnicoKpiData = {
  productividadDiaria: number;
  productividadPromedio: number;
  mejorProductividad: number;
  cumplimientoPct: number;
  totalCortesAcumulados: number;
  reconexionesEjecutadas: number;
  diasCriticos: number;
  fallidasFrustrados: number;
};

// -- Semáforos Operacionales
export type EstadoSemaforo = 'SIN_EVALUACION' | 'CRITICO' | 'ESTABLE' | 'ALTO_DESEMPENO';

export type SemaforoTecnico = {
  categoria: string;
  estado: EstadoSemaforo;
  descripcion: string | null;
  updated_at: string | null;
  usuario_actualiza_id: number | null;
};

// -- Fase de Seguimiento
export type FaseSeguimiento = 1 | 2 | 3;
export type EstadoFase = 'Crítico' | 'En recuperación' | 'Estable' | 'Alto desempeño' | 'Crítico - Nivel 2';

export type RendimientoTecnicoFaseData = {
  faseActual: FaseSeguimiento;
  estadoActual: EstadoFase;
  motivoFase: string;
  fechaInicioFase: string;
  proximaRevision: string;
  responsableSeguimiento: string;
  accionSugerida: string;
};

// -- Cursos Realizados
export type EstadoCurso = 'Completado' | 'Pendiente' | 'Vencido';

export type CursoTecnico = {
  id: string;
  nombre: string;
  estado: EstadoCurso;
  fecha?: string;
  resultado?: string;
  vencimiento?: string;
};

// -- Hallazgos Recurrentes
export type NivelHallazgo = 'Crítico' | 'Advertencia' | 'Observación' | 'Normal';

export type HallazgoTecnico = {
  id: string;
  titulo: string;
  nivel: NivelHallazgo;
  frecuencia: string;
  detalle: string;
  accionSugerida: string;
};

// -- Recomendación del Supervisor
export type PrioridadRecomendacion = 'Baja' | 'Media' | 'Alta' | 'Crítica';
export type EstadoAccion = 'Pendiente' | 'En seguimiento' | 'Cerrada';

export type RecomendacionSupervisorData = {
  responsable: string;
  fecha: string;
  prioridad: PrioridadRecomendacion;
  estadoAccion: EstadoAccion;
  recomendacion: string;
};
