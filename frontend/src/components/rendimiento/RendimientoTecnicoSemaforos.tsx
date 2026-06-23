import React from 'react';

type EstadoSemaforo =
  | 'Crítico'
  | 'En recuperación'
  | 'Estable'
  | 'Alto desempeño';

type SemaforoTecnico = {
  id: string;
  titulo: string;
  estado: EstadoSemaforo;
  descripcion: string;
  ultimaEvaluacion?: string;
};

const ESTADO_CONFIG: Record<EstadoSemaforo, { color: string; bg: string; border: string; glow: string }> = {
  'Crítico': {
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.08)',
    border: 'rgba(239, 68, 68, 0.25)',
    glow: '0 0 12px rgba(239, 68, 68, 0.4)',
  },
  'En recuperación': {
    color: '#f97316',
    bg: 'rgba(249, 115, 22, 0.08)',
    border: 'rgba(249, 115, 22, 0.25)',
    glow: '0 0 12px rgba(249, 115, 22, 0.4)',
  },
  'Estable': {
    color: '#60a5fa',
    bg: 'rgba(96, 165, 250, 0.08)',
    border: 'rgba(96, 165, 250, 0.25)',
    glow: '0 0 12px rgba(96, 165, 250, 0.35)',
  },
  'Alto desempeño': {
    color: '#22c55e',
    bg: 'rgba(34, 197, 94, 0.08)',
    border: 'rgba(34, 197, 94, 0.25)',
    glow: '0 0 12px rgba(34, 197, 94, 0.4)',
  },
};

const MOCK_SEMAFOROS: SemaforoTecnico[] = [
  {
    id: 'productividad',
    titulo: 'Productividad',
    estado: 'En recuperación',
    descripcion: 'Bajo meta diaria, requiere seguimiento.',
    ultimaEvaluacion: '2026-06-23',
  },
  {
    id: 'seguridad',
    titulo: 'Seguridad',
    estado: 'Estable',
    descripcion: 'Cumple protocolos de seguridad establecidos.',
    ultimaEvaluacion: '2026-06-23',
  },
  {
    id: 'calidad-corte',
    titulo: 'Calidad del corte',
    estado: 'Crítico',
    descripcion: 'Alta tasa de reclamos asociados al técnico.',
    ultimaEvaluacion: '2026-06-22',
  },
  {
    id: 'cumplimiento-protocolos',
    titulo: 'Cumplimiento de protocolos',
    estado: 'Alto desempeño',
    descripcion: 'Sigue todos los pasos del proceso operacional.',
    ultimaEvaluacion: '2026-06-23',
  },
  {
    id: 'comunicacion-cliente',
    titulo: 'Comunicación con cliente',
    estado: 'Estable',
    descripcion: 'Reportes de atención dentro del rango esperado.',
    ultimaEvaluacion: '2026-06-21',
  },
  {
    id: 'disciplina-operacional',
    titulo: 'Disciplina operacional',
    estado: 'En recuperación',
    descripcion: 'Algunas irregularidades en horarios reportados.',
    ultimaEvaluacion: '2026-06-23',
  },
];

interface SemaforoCardProps {
  semaforo: SemaforoTecnico;
}

const SemaforoCard: React.FC<SemaforoCardProps> = ({ semaforo }) => {
  const cfg = ESTADO_CONFIG[semaforo.estado];

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
  semaforos = MOCK_SEMAFOROS,
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
          <span style={{
            marginLeft: '4px',
            fontSize: '10px',
            padding: '2px 8px',
            borderRadius: '20px',
            background: 'rgba(0,229,255,0.08)',
            border: '1px solid rgba(0,229,255,0.2)',
            color: 'var(--secondary)',
            fontWeight: 600,
            letterSpacing: '0.5px',
          }}>
            MOCK
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

      {/* Grid de semáforos */}
      <div className="semaforos-grid">
        {semaforos.map(s => (
          <SemaforoCard key={s.id} semaforo={s} />
        ))}
      </div>
    </div>
  );
};
