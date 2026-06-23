import React from 'react';

import type { HallazgoTecnico } from '../../types/rendimientoTecnico.types';
import { MOCK_HALLAZGOS, CONFIG_NIVEL_HALLAZGO } from '../../data/rendimientoTecnico.mock';

const HallazgoCard: React.FC<{ hallazgo: HallazgoTecnico }> = ({ hallazgo }) => {
  const cfg = CONFIG_NIVEL_HALLAZGO[hallazgo.nivel];

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
