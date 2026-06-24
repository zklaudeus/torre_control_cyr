import React from 'react';
import type { ZonaResumenPanelBackend } from '../../api/productividad.api';

interface Props {
  zonas: ZonaResumenPanelBackend[];
  loading: boolean;
  onSelectZona: (zona: string) => void;
}

const PRIORIDAD_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  ALTA: { label: 'Alta', color: '#B91C1C', bg: '#FEE2E2' },
  MEDIA: { label: 'Media', color: '#92400E', bg: '#FEF3C7' },
  NORMAL: { label: 'Normal', color: '#065F46', bg: '#D1FAE5' },
};

const ESTADO_COLORS: Record<string, string> = {
  criticos: '#DC2626',
  recuperacion: '#D97706',
  estables: '#2563EB',
  alto_desempeno: '#059669',
  sin_evaluacion: '#94A3B8',
};

const CARD_STYLE: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #E2E8F0',
  borderRadius: '12px',
  padding: '20px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '16px',
      }}>
        {zonas.map(zona => (
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
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
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

            {/* Total y evaluables */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', fontSize: '13px', color: '#475569' }}>
              <span>
                Total: <strong style={{ color: '#1E293B' }}>{zona.total_tecnicos}</strong>
              </span>
              <span>
                Evaluables hoy: <strong style={{ color: '#1E293B' }}>{zona.tecnicos_evaluables_hoy}</strong>
              </span>
            </div>

            {/* Estados */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
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
                    fontSize: '12px', fontWeight: 600,
                    color: ESTADO_COLORS[key] || '#475569',
                    background: `${ESTADO_COLORS[key] || '#F1F5F9'}15`,
                    padding: '2px 8px', borderRadius: '6px',
                  }}>
                    {label}: {value}
                  </span>
                );
              })}
            </div>

            {/* Fases y advertencias */}
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
        ))}
      </div>
    </div>
  );
};
