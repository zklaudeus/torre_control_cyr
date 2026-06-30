import React from 'react';
import type { ZonaResumenPanelBackend } from '../../api/productividad.api';

interface Props {
  zonas: ZonaResumenPanelBackend[];
  loading: boolean;
  onSelectZona: (zona: string) => void;
}

const PRIORIDAD_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  ALTA: { label: 'Alta', color: '#991B1B', bg: '#FEE2E2' },
  MEDIA: { label: 'Media', color: '#78350F', bg: '#FEF9C3' },
  NORMAL: { label: 'Normal', color: '#1E3A5F', bg: '#E8EFF7' },
};

const ESTADO_COLORS: Record<string, string> = {
  criticos:      '#B91C1C',
  recuperacion:  '#92400E',
  estables:      '#1E3A5F',
  alto_desempeno:'#065F46',
  sin_evaluacion:'#475569',
};

// Paleta corporativa neutra — todos los tonos de azul pizarra
const ZONA_PALETTE = [
  '#1E3A5F', '#2C4A70', '#1B4B82', '#243B55',
  '#1A3651', '#2D4B6E', '#1F3C6B', '#26415E',
];

const zonaColor = (zona: string): string => {
  let hash = 0;
  for (let i = 0; i < zona.length; i++) hash = zona.charCodeAt(i) + ((hash << 5) - hash);
  return ZONA_PALETTE[Math.abs(hash) % ZONA_PALETTE.length];
};

const initials = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();

const CARD_STYLE: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #E2E8F0',
  borderRadius: '12px',
  padding: 0,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  display: 'flex',
  overflow: 'hidden',
};

export const RendimientoTecnicoPanelZonas: React.FC<Props> = ({ zonas, loading, onSelectZona }) => {
  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Cargando zonas...
      </div>
    );
  }

  if (!zonas.length) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        No hay zonas con técnicos activos.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header de la vista */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: 'var(--text-main)' }}>
            Rendimiento Brigada
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
            Selecciona una zona para ver el detalle de sus brigadas
          </p>
        </div>
        <div style={{
          background: 'var(--bg-panel)', border: '1px solid var(--border)',
          borderRadius: '8px', padding: '6px 14px',
          fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500,
        }}>
          {zonas.length} zona{zonas.length !== 1 ? 's' : ''} activa{zonas.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
        gap: '16px',
      }}>
        {zonas.map(zona => {
          const zColor = zonaColor(zona.zona);
          const ini = initials(zona.zona);
          return (
          <div
            key={zona.zona}
            style={CARD_STYLE}
            onClick={() => onSelectZona(zona.zona)}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
            }}
          >
            {/* ── Franja izquierda: corporativa azul pizarra ── */}
            <div
              style={{
                width: '72px',
                flexShrink: 0,
                background: zColor,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '12px 8px',
              }}
            >
              <div
                style={{
                  width: '40px', height: '40px',
                  borderRadius: '4px',
                  background: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.95)',
                  letterSpacing: '0.5px',
                }}
              >
                {ini}
              </div>
              <div
                style={{
                  writingMode: 'vertical-lr',
                  transform: 'rotate(180deg)',
                  fontSize: '9px',
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.7)',
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  whiteSpace: 'nowrap',
                }}
              >
                {zona.zona}
              </div>
            </div>

            {/* ── Contenido derecho ── */}
            <div style={{ flex: 1, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px', minWidth: 0 }}>

              {/* Fila 1: Header nombre + badge prioridad */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1E293B' }}>
                  {zona.zona}
                </h3>
                <span style={{
                  fontSize: '11px', fontWeight: 600, padding: '2px 10px', borderRadius: '999px',
                  color: PRIORIDAD_CONFIG[zona.prioridad]?.color || '#475569',
                  background: PRIORIDAD_CONFIG[zona.prioridad]?.bg || '#F1F5F9',
                }}>
                  {PRIORIDAD_CONFIG[zona.prioridad]?.label || zona.prioridad}
                </span>
              </div>

              {/* Fila 2: Hero numbers total + evaluables */}
              <div style={{ display: 'flex', gap: '24px' }}>
                <div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>
                    {zona.total_tecnicos}
                  </div>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>
                    Total Brigadas
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>
                    {zona.tecnicos_evaluables_hoy}
                  </div>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>
                    Evaluables hoy
                  </div>
                </div>
              </div>

              {/* Fila 3: Estados */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[
                  { key: 'criticos', label: 'Críticos' },
                  { key: 'recuperacion', label: 'Recuperación' },
                  { key: 'estables', label: 'Estables' },
                  { key: 'alto_desempeno', label: 'Alto desempeño' },
                  { key: 'sin_evaluacion', label: 'Sin eval.' },
                ].map(({ key, label }) => {
                  const value = (zona as any)[key] as number;
                  if (value === 0) return null;
                  return (
                    <span key={key} style={{
                      fontSize: '11px', fontWeight: 500,
                      color: ESTADO_COLORS[key] || '#475569',
                      background: `${ESTADO_COLORS[key]}12`,
                      border: `1px solid ${ESTADO_COLORS[key]}25`,
                      padding: '1px 7px', borderRadius: '4px',
                    }}>
                      {label}: {value}
                    </span>
                  );
                })}
              </div>

              {/* Fila 4: Fases y advertencias */}
              <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#64748B' }}>
                <span>Nivel 1: <strong>{zona.fase_1}</strong></span>
                {zona.fase_2 > 0 && (
                  <span style={{ color: '#D97706' }}>Nivel 2: <strong>{zona.fase_2}</strong></span>
                )}
                {zona.fase_3 > 0 && (
                  <span style={{ color: '#DC2626' }}>Nivel 3: <strong>{zona.fase_3}</strong></span>
                )}
                {zona.advertencias_activas > 0 && (
                  <span style={{ color: '#DC2626' }}>
                    Adv. activas: <strong>{zona.advertencias_activas}</strong>
                  </span>
                )}
              </div>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
};
