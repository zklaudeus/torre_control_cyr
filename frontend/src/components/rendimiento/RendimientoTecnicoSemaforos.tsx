import React from 'react';

import type { SemaforoTecnico } from '../../types/rendimientoTecnico.types';
import { CONFIG_SEMAFOROS } from '../../data/rendimientoTecnico.config';


interface SemaforoCardProps {
  semaforo: SemaforoTecnico;
}

const SemaforoCard: React.FC<SemaforoCardProps> = ({ semaforo }) => {
  const cfg = CONFIG_SEMAFOROS[semaforo.estado];

  return (
    <div
      style={{
        background: 'var(--bg-panel)',
        border: `1px solid ${cfg.border}`,
        borderRadius: '10px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
        transition: 'transform 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 6px 20px rgba(0,0,0,0.2), ${cfg.glow}`;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.15)';
      }}
    >
      {/* Título */}
      <div style={{
        fontSize: '12px',
        fontWeight: 700,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.8px',
      }}>
        {semaforo.titulo}
      </div>

      {/* Círculo indicador + estado */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: cfg.bg,
          border: `2px solid ${cfg.color}`,
          boxShadow: cfg.glow,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: cfg.color,
            opacity: 0.9,
          }} />
        </div>
        <div style={{
          fontSize: '16px',
          fontWeight: 700,
          color: cfg.color,
          lineHeight: 1.2,
        }}>
          {semaforo.estado}
        </div>
      </div>

      {/* Descripción */}
      <div style={{
        fontSize: '12px',
        color: 'var(--text-muted)',
        lineHeight: 1.5,
      }}>
        {semaforo.descripcion}
      </div>

      {/* Última evaluación */}
      {semaforo.ultimaEvaluacion && (
        <div style={{
          fontSize: '10px',
          color: 'var(--text-muted)',
          opacity: 0.6,
          marginTop: 'auto',
        }}>
          Última evaluación: {semaforo.ultimaEvaluacion}
        </div>
      )}
    </div>
  );
};

interface RendimientoTecnicoSemaforosProps {
  semaforos?: SemaforoTecnico[];
}

export const RendimientoTecnicoSemaforos: React.FC<RendimientoTecnicoSemaforosProps> = ({
  semaforos,
}) => {
  return (
    <div>
      <style>{`
        .semaforos-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }
        @media (max-width: 1024px) {
          .semaforos-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 600px) {
          .semaforos-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Encabezado de sección */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '4px',
        }}>
          <span style={{
            width: '3px',
            height: '18px',
            borderRadius: '2px',
            background: 'var(--primary)',
            display: 'inline-block',
            flexShrink: 0,
          }} />
          <span style={{
            fontSize: '12px',
            fontWeight: 700,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}>
            Semáforos Operacionales
          </span>
        </div>
        <p style={{
          margin: 0,
          fontSize: '12px',
          color: 'var(--text-muted)',
          paddingLeft: '11px',
        }}>
          Evaluación visual del estado actual del técnico por categoría.
        </p>
      </div>

      {!semaforos || semaforos.length === 0 ? (
        <div style={{
          padding: '40px 20px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '13px',
          background: 'var(--bg-panel)',
          border: '1px dashed var(--border)',
          borderRadius: '8px',
        }}>
          Sin semáforos disponibles.
        </div>
      ) : (
        <div className="semaforos-grid">
          {semaforos.map(s => (
            <SemaforoCard key={s.id} semaforo={s} />
          ))}
        </div>
      )}
    </div>
  );
};
