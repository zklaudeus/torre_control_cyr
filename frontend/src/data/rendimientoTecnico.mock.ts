import type {
  TecnicoResumen,
  RendimientoTecnicoKpiData,
  SemaforoTecnico,
  RendimientoTecnicoFaseData,
  CursoTecnico,
  HallazgoTecnico,
  RecomendacionSupervisorData,
  EstadoTecnico,
  EstadoSemaforo,
  EstadoFase,
  EstadoCurso,
  NivelHallazgo,
  PrioridadRecomendacion,
  EstadoAccion
} from '../types/rendimientoTecnico.types';

// -----------------------------------------------------------------------------
// Configuraciones Visuales (Colores y Estilos)
// -----------------------------------------------------------------------------

export const COLOR_ESTADO_TECNICO: Record<EstadoTecnico, string> = {
  'Crítico': '#ef4444',
  'En recuperación': '#f97316',
  'Estable': '#60a5fa',
  'Alto desempeño': '#22c55e',
};

export const CONFIG_SEMAFOROS: Record<EstadoSemaforo, { color: string; bg: string; border: string; glow: string }> = {
  'Crítico': {
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.08)',
    border: 'rgba(239, 68, 68, 0.25)',
    glow: '0 0 12px rgba(239, 68, 68, 0.4)',
  },
  'En recuperación': {
    color: '#f97316',
    bg: 'rgba(249, 115, 22, 0.08)',
    border: 'rgba(249, 115, 22, 0.25)',
    glow: '0 0 12px rgba(249, 115, 22, 0.4)',
  },
  'Estable': {
    color: '#60a5fa',
    bg: 'rgba(96, 165, 250, 0.08)',
    border: 'rgba(96, 165, 250, 0.25)',
    glow: '0 0 12px rgba(96, 165, 250, 0.35)',
  },
  'Alto desempeño': {
    color: '#22c55e',
    bg: 'rgba(34, 197, 94, 0.08)',
    border: 'rgba(34, 197, 94, 0.25)',
    glow: '0 0 12px rgba(34, 197, 94, 0.4)',
  },
};

export const COLOR_ESTADO_FASE: Record<EstadoFase, string> = {
  'Crítico':          '#ef4444',
  'En recuperación':  '#f97316',
  'Estable':          '#60a5fa',
  'Alto desempeño':   '#22c55e',
  'Crítico - Fase 2': '#ef4444',
};

export const CONFIG_ESTADO_CURSO: Record<EstadoCurso, { color: string; bg: string; border: string }> = {
  Completado: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)',    border: 'rgba(34,197,94,0.3)'  },
  Pendiente:  { color: '#f97316', bg: 'rgba(249,115,22,0.1)',   border: 'rgba(249,115,22,0.3)' },
  Vencido:    { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',    border: 'rgba(239,68,68,0.3)'  },
};

export const CONFIG_NIVEL_HALLAZGO: Record<NivelHallazgo, { color: string; bg: string; border: string }> = {
  'Crítico':     { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.08)',    border: 'rgba(239, 68, 68, 0.25)' },
  'Advertencia': { color: '#f97316', bg: 'rgba(249, 115, 22, 0.08)',   border: 'rgba(249, 115, 22, 0.25)' },
  'Observación': { color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.08)',   border: 'rgba(96, 165, 250, 0.25)' },
  'Normal':      { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.08)',    border: 'rgba(34, 197, 94, 0.25)' },
};

export const CONFIG_PRIORIDAD_RECOMENDACION: Record<PrioridadRecomendacion, { color: string; bg: string; border: string }> = {
  'Baja':    { color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.1)',   border: 'rgba(96, 165, 250, 0.3)' },
  'Media':   { color: '#eab308', bg: 'rgba(234, 179, 8, 0.1)',    border: 'rgba(234, 179, 8, 0.3)' },
  'Alta':    { color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)',   border: 'rgba(249, 115, 22, 0.3)' },
  'Crítica': { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)',    border: 'rgba(239, 68, 68, 0.3)' },
};

export const CONFIG_ESTADO_ACCION: Record<EstadoAccion, { color: string; bg: string; border: string }> = {
  'Pendiente':      { color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)',  border: 'rgba(249, 115, 22, 0.3)' },
  'En seguimiento': { color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.1)',  border: 'rgba(96, 165, 250, 0.3)' },
  'Cerrada':        { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)',   border: 'rgba(34, 197, 94, 0.3)' },
};

// -----------------------------------------------------------------------------
// Datos Mock
// -----------------------------------------------------------------------------

export const MOCK_TECNICOS: TecnicoResumen[] = [
  { id: '1', nombre: 'Andrés Gatica', codigoSap: 'P003014', zona: 'Chillán', supervisor: 'Juan Muñoz', estado: 'Crítico', fase: 2, productividadPromedio: 11.2 },
  { id: '2', nombre: 'Cristian Ulloa', codigoSap: 'P002754', zona: 'Chillán', supervisor: 'Juan Muñoz', estado: 'En recuperación', fase: 1, productividadPromedio: 18.5 },
  { id: '3', nombre: 'José Bravo', codigoSap: 'P003457', zona: 'Concepción', supervisor: 'Juan Muñoz', estado: 'Estable', fase: 1, productividadPromedio: 26.4 },
  { id: '4', nombre: 'Juan Pérez', codigoSap: 'P003863', zona: 'Coquimbo', supervisor: 'Nicolás Farías', estado: 'En recuperación', fase: 2, productividadPromedio: 14.0 },
  { id: '5', nombre: 'Carlos Ruiz', codigoSap: 'P004122', zona: 'Talca', supervisor: 'Jose Masso', estado: 'Alto desempeño', fase: 1, productividadPromedio: 31.0 },
];

export const MOCK_KPIS: RendimientoTecnicoKpiData = {
  productividadDiaria: 14,
  productividadPromedio: 18.6,
  mejorProductividad: 31,
  cumplimientoPct: 56,
  totalCortesAcumulados: 186,
  diasBajoMeta: 3,
  diasCriticos: 2,
  fallidasFrustrados: 8,
};

export const MOCK_SEMAFOROS: SemaforoTecnico[] = [
  {
    id: 'productividad',
    titulo: 'Productividad',
    estado: 'En recuperación',
    descripcion: 'Bajo meta diaria, requiere seguimiento.',
    ultimaEvaluacion: '2026-06-23',
  },
  {
    id: 'seguridad',
    titulo: 'Seguridad',
    estado: 'Estable',
    descripcion: 'Cumple protocolos de seguridad establecidos.',
    ultimaEvaluacion: '2026-06-23',
  },
  {
    id: 'calidad-corte',
    titulo: 'Calidad del corte',
    estado: 'Crítico',
    descripcion: 'Alta tasa de reclamos asociados al técnico.',
    ultimaEvaluacion: '2026-06-22',
  },
  {
    id: 'cumplimiento-protocolos',
    titulo: 'Cumplimiento de protocolos',
    estado: 'Alto desempeño',
    descripcion: 'Sigue todos los pasos del proceso operacional.',
    ultimaEvaluacion: '2026-06-23',
  },
  {
    id: 'comunicacion-cliente',
    titulo: 'Comunicación con cliente',
    estado: 'Estable',
    descripcion: 'Reportes de atención dentro del rango esperado.',
    ultimaEvaluacion: '2026-06-21',
  },
  {
    id: 'disciplina-operacional',
    titulo: 'Disciplina operacional',
    estado: 'En recuperación',
    descripcion: 'Algunas irregularidades en horarios reportados.',
    ultimaEvaluacion: '2026-06-23',
  },
];

export const MOCK_FASE: RendimientoTecnicoFaseData = {
  faseActual: 2,
  estadoActual: 'En recuperación',
  motivoFase: 'Técnico con productividad bajo meta durante los últimos días evaluados.',
  fechaInicioFase: '22/06/2026',
  proximaRevision: '25/06/2026',
  responsableSeguimiento: 'Juan Muñoz',
  accionSugerida: 'Mantener seguimiento diario y reforzar cumplimiento de meta mínima.',
};

export const MOCK_CURSOS: CursoTecnico[] = [
  { id: '1', nombre: 'Protocolo de corte', estado: 'Completado', fecha: '10/06/2026', resultado: 'Aprobado', vencimiento: '10/06/2027' },
  { id: '2', nombre: 'Seguridad operacional', estado: 'Completado', fecha: '15/06/2026', resultado: 'Aprobado', vencimiento: '15/06/2027' },
  { id: '3', nombre: 'Atención y comunicación con cliente', estado: 'Pendiente', fecha: undefined, resultado: undefined, vencimiento: undefined },
  { id: '4', nombre: 'Calidad de corte y evidencia', estado: 'Completado', fecha: '18/06/2026', resultado: 'Aprobado', vencimiento: '18/06/2027' },
  { id: '5', nombre: 'Disciplina operacional', estado: 'Vencido', fecha: '01/05/2025', resultado: 'Aprobado', vencimiento: '01/05/2026' },
];

export const MOCK_HALLAZGOS: HallazgoTecnico[] = [
  { id: 'h1', titulo: 'Técnico bajo el 50% de la meta', nivel: 'Crítico', frecuencia: '3 días consecutivos', detalle: 'Productividad igual o menor a 12 cortes diarios.', accionSugerida: 'Mantener seguimiento diario y revisar causas operativas.' },
  { id: 'h2', titulo: 'Aumento de fallidas / frustrados', nivel: 'Advertencia', frecuencia: 'Últimos 2 días', detalle: 'Incremento de visitas fallidas respecto al día anterior.', accionSugerida: 'Revisar causas de fallida y validar comunicación con cliente.' },
  { id: 'h3', titulo: 'Último corte temprano', nivel: 'Observación', frecuencia: '1 evento reciente', detalle: 'Último corte registrado antes del cierre esperado.', accionSugerida: 'Verificar continuidad operacional durante la jornada.' },
];

export const MOCK_RECOMENDACION: RecomendacionSupervisorData = {
  responsable: 'Juan Muñoz',
  fecha: '22/06/2026',
  prioridad: 'Alta',
  estadoAccion: 'Pendiente',
  recomendacion: 'Reforzar cumplimiento de protocolo de intervención, revisar causas de visitas fallidas y mantener seguimiento diario durante los próximos 3 días.',
};
