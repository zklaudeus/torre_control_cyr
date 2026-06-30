import type {
  EstadoTecnico,
  EstadoSemaforo,
  EstadoFase,
  EstadoCurso,
  NivelHallazgo,
  PrioridadRecomendacion,
  EstadoAccion,
} from '../types/rendimientoTecnico.types';

export const COLOR_ESTADO_TECNICO: Record<EstadoTecnico, string> = {
  'Sin evaluación': '#64748B',
  'Crítico':        '#991B1B',
  'En recuperación':'#78350F',
  'Estable':        '#1E3A5F',
  'Alto desempeño': '#1E6845',
};

export const CONFIG_SEMAFOROS: Record<EstadoSemaforo, { color: string; bg: string; border: string; glow: string; label: string }> = {
  'SIN_EVALUACION': {
    color: '#64748B',
    bg: 'rgba(100, 116, 139, 0.06)',
    border: 'rgba(100, 116, 139, 0.2)',
    glow: 'none',
    label: 'Sin evaluación',
  },
  'CRITICO': {
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.08)',
    border: 'rgba(239, 68, 68, 0.25)',
    glow: '0 0 12px rgba(239, 68, 68, 0.4)',
    label: 'Crítico',
  },
  'ESTABLE': {
    color: '#eab308',
    bg: 'rgba(234, 179, 8, 0.08)',
    border: 'rgba(234, 179, 8, 0.28)',
    glow: '0 0 12px rgba(234, 179, 8, 0.35)',
    label: 'Estable',
  },
  'ALTO_DESEMPENO': {
    color: '#22c55e',
    bg: 'rgba(34, 197, 94, 0.08)',
    border: 'rgba(34, 197, 94, 0.25)',
    glow: '0 0 12px rgba(34, 197, 94, 0.4)',
    label: 'Alto desempeño',
  },
};

export const COLOR_ESTADO_FASE: Record<EstadoFase, string> = {
  'Crítico':           '#991B1B',
  'En recuperación':   '#78350F',
  'Estable':           '#1E3A5F',
  'Alto desempeño':    '#1E6845',
  'Crítico - Nivel 2': '#991B1B',
};

export const CONFIG_ESTADO_CURSO: Record<EstadoCurso, { color: string; bg: string; border: string }> = {
  Completado: { color: '#1E6845', bg: 'rgba(30,104,69,0.08)',   border: 'rgba(30,104,69,0.22)' },
  Pendiente:  { color: '#78350F', bg: 'rgba(120,53,15,0.08)',   border: 'rgba(120,53,15,0.22)' },
  Vencido:    { color: '#991B1B', bg: 'rgba(153,27,27,0.08)',   border: 'rgba(153,27,27,0.22)' },
};

export const CONFIG_NIVEL_HALLAZGO: Record<NivelHallazgo, { color: string; bg: string; border: string }> = {
  'Crítico':     { color: '#991B1B', bg: 'rgba(153, 27, 27, 0.07)',   border: 'rgba(153, 27, 27, 0.22)' },
  'Advertencia': { color: '#78350F', bg: 'rgba(120, 53, 15, 0.07)',   border: 'rgba(120, 53, 15, 0.22)' },
  'Observación': { color: '#1E3A5F', bg: 'rgba(30, 58, 95, 0.07)',    border: 'rgba(30, 58, 95, 0.22)' },
  'Normal':      { color: '#1E6845', bg: 'rgba(30, 104, 69, 0.07)',   border: 'rgba(30, 104, 69, 0.22)' },
};

export const CONFIG_PRIORIDAD_RECOMENDACION: Record<PrioridadRecomendacion, { color: string; bg: string; border: string }> = {
  'Baja':    { color: '#1E3A5F', bg: 'rgba(30, 58, 95, 0.07)',    border: 'rgba(30, 58, 95, 0.22)' },
  'Media':   { color: '#78350F', bg: 'rgba(120, 53, 15, 0.07)',   border: 'rgba(120, 53, 15, 0.22)' },
  'Alta':    { color: '#78350F', bg: 'rgba(120, 53, 15, 0.09)',   border: 'rgba(120, 53, 15, 0.25)' },
  'Crítica': { color: '#991B1B', bg: 'rgba(153, 27, 27, 0.07)',   border: 'rgba(153, 27, 27, 0.22)' },
};

export const CONFIG_ESTADO_ACCION: Record<EstadoAccion, { color: string; bg: string; border: string }> = {
  'Pendiente':      { color: '#78350F', bg: 'rgba(120, 53, 15, 0.07)',  border: 'rgba(120, 53, 15, 0.22)' },
  'En seguimiento': { color: '#1E3A5F', bg: 'rgba(30, 58, 95, 0.07)',   border: 'rgba(30, 58, 95, 0.22)' },
  'Cerrada':        { color: '#1E6845', bg: 'rgba(30, 104, 69, 0.07)',  border: 'rgba(30, 104, 69, 0.22)' },
};
