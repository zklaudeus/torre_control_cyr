import React from 'react';

type PrioridadRecomendacion = 'Baja' | 'Media' | 'Alta' | 'Crítica';
type EstadoAccion = 'Pendiente' | 'En seguimiento' | 'Cerrada';

export type RecomendacionSupervisorData = {
  responsable: string;
  fecha: string;
  prioridad: PrioridadRecomendacion;
  estadoAccion: EstadoAccion;
  recomendacion: string;
};

const MOCK_RECOMENDACION: RecomendacionSupervisorData = {
  responsable: 'Juan Muñoz',
  fecha: '22/06/2026',
  prioridad: 'Alta',
  estadoAccion: 'Pendiente',
  recomendacion: 'Reforzar cumplimiento de protocolo de intervención, revisar causas de visitas fallidas y mantener seguimiento diario durante los próximos 3 días.',
};

const PRIORIDAD_COLOR: Record<PrioridadRecomendacion, { color: string; bg: string; border: string }> = {
  'Baja':    { color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.1)',   border: 'rgba(96, 165, 250, 0.3)' },
  'Media':   { color: '#eab308', bg: 'rgba(234, 179, 8, 0.1)',    border: 'rgba(234, 179, 8, 0.3)' },
  'Alta':    { color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)',   border: 'rgba(249, 115, 22, 0.3)' },
  'Crítica': { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)',    border: 'rgba(239, 68, 68, 0.3)' },
};

const ESTADO_COLOR: Record<EstadoAccion, { color: string; bg: string; border: string }> = {
  'Pendiente':      { color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)',  border: 'rgba(249, 115, 22, 0.3)' },
  'En seguimiento': { color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.1)',  border: 'rgba(96, 165, 250, 0.3)' },
  'Cerrada':        { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)',   border: 'rgba(34, 197, 94, 0.3)' },
};

interface RendimientoTecnicoRecomendacionProps {
  data?: RecomendacionSupervisorData;
}

export const RendimientoTecnicoRecomendacion: React.FC<RendimientoTecnicoRecomendacionProps> = ({
  data = MOCK_RECOMENDACION,
}) => {
  const prioCfg = PRIORIDAD_COLOR[data.prioridad];
  const estadoCfg = ESTADO_COLOR[data.estadoAccion];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Encabezado */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{
            width: '3px', height: '18px', borderRadius: '2px',
            background: 'var(--primary)', display: 'inline-block', flexShrink: 0,
          }} />
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Recomendación del Supervisor
          </span>
          <span style={{
            fontSize: '10px', padding: '2px 8px', borderRadius: '20px',
            background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)',
            color: 'var(--secondary)', fontWeight: 600, letterSpacing: '0.5px',
          }}>MOCK</span>
        </div>
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', paddingLeft: '11px' }}>
          Acción sugerida para mejorar o estabilizar el desempeño del técnico.
        </p>
      </div>

      {/* Card */}
      <div style={{
        background: 'var(--bg-panel-sec)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        flexGrow: 1,
      }}>
        {/* Header con Badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
              Por: {data.responsable}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Fecha: {data.fecha}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{
              fontSize: '10px', fontWeight: 700, padding: '4px 10px', borderRadius: '12px',
              color: prioCfg.color, background: prioCfg.bg, border: `1px solid ${prioCfg.border}`, whiteSpace: 'nowrap',
            }}>
              Prioridad {data.prioridad}
            </span>
            <span style={{
              fontSize: '10px', fontWeight: 700, padding: '4px 10px', borderRadius: '12px',
              color: estadoCfg.color, background: estadoCfg.bg, border: `1px solid ${estadoCfg.border}`, whiteSpace: 'nowrap',
            }}>
              {data.estadoAccion}
            </span>
          </div>
        </div>

        {/* Separador */}
        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)', margin: 0 }} />

        {/* Recomendación (Protagonista) */}
        <div>
          <span style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>
            Recomendación
          </span>
          <p style={{
            margin: 0,
            fontSize: '15px',
            color: 'var(--text-main)',
            lineHeight: 1.6,
            background: 'rgba(255,255,255,0.02)',
            padding: '16px',
            borderRadius: '6px',
            borderLeft: '3px solid var(--secondary)'
          }}>
            {data.recomendacion}
          </p>
        </div>

      </div>
    </div>
  );
};
