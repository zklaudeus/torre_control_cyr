import React from 'react';

type NivelHallazgo = 'Crítico' | 'Advertencia' | 'Observación' | 'Normal';

type HallazgoTecnico = {
  id: string;
  titulo: string;
  nivel: NivelHallazgo;
  frecuencia: string;
  detalle: string;
  accionSugerida: string;
};

const NIVEL_COLOR: Record<NivelHallazgo, { color: string; bg: string; border: string }> = {
  'Crítico':     { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.08)',    border: 'rgba(239, 68, 68, 0.25)' },
  'Advertencia': { color: '#f97316', bg: 'rgba(249, 115, 22, 0.08)',   border: 'rgba(249, 115, 22, 0.25)' },
  'Observación': { color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.08)',   border: 'rgba(96, 165, 250, 0.25)' },
  'Normal':      { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.08)',    border: 'rgba(34, 197, 94, 0.25)' },
};

const MOCK_HALLAZGOS: HallazgoTecnico[] = [
  {
    id: 'h1',
    titulo: 'Técnico bajo el 50% de la meta',
    nivel: 'Crítico',
    frecuencia: '3 días consecutivos',
    detalle: 'Productividad igual o menor a 12 cortes diarios.',
    accionSugerida: 'Mantener seguimiento diario y revisar causas operativas.',
  },
  {
    id: 'h2',
    titulo: 'Aumento de fallidas / frustrados',
    nivel: 'Advertencia',
    frecuencia: 'Últimos 2 días',
    detalle: 'Incremento de visitas fallidas respecto al día anterior.',
    accionSugerida: 'Revisar causas de fallida y validar comunicación con cliente.',
  },
  {
    id: 'h3',
    titulo: 'Último corte temprano',
    nivel: 'Observación',
    frecuencia: '1 evento reciente',
    detalle: 'Último corte registrado antes del cierre esperado.',
    accionSugerida: 'Verificar continuidad operacional durante la jornada.',
  },
];

const HallazgoCard: React.FC<{ hallazgo: HallazgoTecnico }> = ({ hallazgo }) => {
  const cfg = NIVEL_COLOR[hallazgo.nivel];

  return (
    <div style={{
      background: 'var(--bg-panel-sec)',
      border: `1px solid ${cfg.border}`,
      borderRadius: '8px',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%', background: cfg.color, flexShrink: 0,
            boxShadow: `0 0 6px ${cfg.color}`,
          }} />
          <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.3 }}>
            {hallazgo.titulo}
          </h4>
        </div>
        <span style={{
          fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px',
          color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`, whiteSpace: 'nowrap',
        }}>
          {hallazgo.nivel}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <span style={{ fontSize: '10px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          Frecuencia
        </span>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {hallazgo.frecuencia}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <span style={{ fontSize: '10px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          Detalle
        </span>
        <span style={{ fontSize: '12px', color: 'var(--text-main)', lineHeight: 1.4 }}>
          {hallazgo.detalle}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
        <span style={{ fontSize: '10px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          Acción Sugerida
        </span>
        <span style={{ fontSize: '12px', color: 'var(--text-main)', lineHeight: 1.4 }}>
          💡 {hallazgo.accionSugerida}
        </span>
      </div>
    </div>
  );
};

export const RendimientoTecnicoHallazgos: React.FC = () => {
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
            Hallazgos Recurrentes
          </span>
          <span style={{
            fontSize: '10px', padding: '2px 8px', borderRadius: '20px',
            background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)',
            color: 'var(--secondary)', fontWeight: 600, letterSpacing: '0.5px',
          }}>MOCK</span>
        </div>
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', paddingLeft: '11px' }}>
          Desviaciones operativas detectadas en el seguimiento del técnico.
        </p>
      </div>

      {/* Lista de Hallazgos */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {MOCK_HALLAZGOS.map(h => (
          <HallazgoCard key={h.id} hallazgo={h} />
        ))}
      </div>
    </div>
  );
};
