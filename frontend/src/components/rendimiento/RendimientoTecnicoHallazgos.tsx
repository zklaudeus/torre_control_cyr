import React from 'react';

import type { HallazgoTecnico, NivelHallazgo } from '../../types/rendimientoTecnico.types';
import { CONFIG_NIVEL_HALLAZGO } from '../../data/rendimientoTecnico.config';
import type { AlertaItemBackend } from '../../api/productividad.api';

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

function mapAlertaAHallazgo(a: AlertaItemBackend): HallazgoTecnico {
  const nivel: NivelHallazgo = a.estado === 'ACTIVA'
    ? (a.fase_al_momento >= 3 ? 'Crítico' : a.fase_al_momento === 2 ? 'Advertencia' : 'Observación')
    : 'Normal';
  return {
    id: String(a.id),
    titulo: a.motivo,
    nivel,
    frecuencia: `${a.numero_advertencia ? `${a.numero_advertencia}ª advertencia` : 'Registrado'} - ${new Date(a.fecha_registro).toLocaleDateString('es-CL')}`,
    detalle: a.motivo,
    accionSugerida: a.motivo_anulacion ?? 'Revisar causas y realizar seguimiento.',
  };
}

interface RendimientoTecnicoHallazgosProps {
  alertas?: AlertaItemBackend[];
}

export const RendimientoTecnicoHallazgos: React.FC<RendimientoTecnicoHallazgosProps> = ({
  alertas,
}) => {
  const hallazgos: HallazgoTecnico[] | null = alertas && alertas.length > 0
    ? alertas.map(mapAlertaAHallazgo)
    : null;

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
        </div>
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', paddingLeft: '11px' }}>
          Desviaciones operativas detectadas en el seguimiento del técnico.
        </p>
      </div>

      {!hallazgos ? (
        <div style={{
          padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)',
          fontSize: '13px', background: 'var(--bg-panel)',
          border: '1px dashed var(--border)', borderRadius: '8px',
        }}>
          Sin hallazgos registrados.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {hallazgos.map(h => (
            <HallazgoCard key={h.id} hallazgo={h} />
          ))}
        </div>
      )}
    </div>
  );
};
