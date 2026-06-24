import React from 'react';

import type { RecomendacionSupervisorData } from '../../types/rendimientoTecnico.types';
import { CONFIG_PRIORIDAD_RECOMENDACION, CONFIG_ESTADO_ACCION } from '../../data/rendimientoTecnico.config';


interface RendimientoTecnicoRecomendacionProps {
  data?: RecomendacionSupervisorData;
}

export const RendimientoTecnicoRecomendacion: React.FC<RendimientoTecnicoRecomendacionProps> = ({
  data,
}) => {
  if (!data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{
              width: '3px', height: '18px', borderRadius: '2px',
              background: 'var(--primary)', display: 'inline-block', flexShrink: 0,
            }} />
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Recomendación del Supervisor
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', paddingLeft: '11px' }}>
            Acción sugerida para mejorar o estabilizar el desempeño del técnico.
          </p>
        </div>
        <div style={{
          padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)',
          fontSize: '13px', background: 'var(--bg-panel)',
          border: '1px dashed var(--border)', borderRadius: '8px',
        }}>
          Sin recomendación disponible.
        </div>
      </div>
    );
  }

  const prioCfg = CONFIG_PRIORIDAD_RECOMENDACION[data.prioridad];
  const estadoCfg = CONFIG_ESTADO_ACCION[data.estadoAccion];

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

        {/* Recomendación */}
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
