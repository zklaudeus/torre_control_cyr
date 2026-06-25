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
  'Sin evaluación': '#94A3B8',
  'Crítico': '#ef4444',
  'En recuperación': '#f97316',
  'Estable': '#60a5fa',
  'Alto desempeño': '#22c55e',
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
  'Crítico':          '#ef4444',
  'En recuperación':  '#f97316',
  'Estable':          '#60a5fa',
  'Alto desempeño':   '#22c55e',
  'Crítico - Nivel 2': '#ef4444',
};

export const CONFIG_ESTADO_CURSO: Record<EstadoCurso, { color: string; bg: string; border: string }> = {
  Completado: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)',    border: 'rgba(34,197,94,0.3)' },
  Pendiente:  { color: '#f97316', bg: 'rgba(249,115,22,0.1)',   border: 'rgba(249,115,22,0.3)' },
  Vencido:    { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',    border: 'rgba(239,68,68,0.3)' },
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
