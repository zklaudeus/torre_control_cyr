import React from 'react';

type FaseSeguimiento = 1 | 2 | 3;

type EstadoFase =
  | 'Crítico'
  | 'En recuperación'
  | 'Estable'
  | 'Alto desempeño'
  | 'Crítico - Fase 2';

export type RendimientoTecnicoFaseData = {
  faseActual: FaseSeguimiento;
  estadoActual: EstadoFase;
  motivoFase: string;
  fechaInicioFase: string;
  proximaRevision: string;
  responsableSeguimiento: string;
  accionSugerida: string;
};

const MOCK_FASE: RendimientoTecnicoFaseData = {
  faseActual: 2,
  estadoActual: 'En recuperación',
  motivoFase: 'Técnico con productividad bajo meta durante los últimos días evaluados.',
  fechaInicioFase: '22/06/2026',
  proximaRevision: '25/06/2026',
  responsableSeguimiento: 'Juan Muñoz',
  accionSugerida: 'Mantener seguimiento diario y reforzar cumplimiento de meta mínima.',
};

const FASES = [
  { num: 1 as FaseSeguimiento, label: 'Inicial',    descripcion: 'Seguimiento preventivo' },
  { num: 2 as FaseSeguimiento, label: 'Reforzado',  descripcion: 'Intervención supervisora' },
  { num: 3 as FaseSeguimiento, label: 'Crítico',    descripcion: 'Intervención mayor' },
];

const ESTADO_COLOR: Record<EstadoFase, string> = {
  'Crítico':          '#ef4444',
  'En recuperación':  '#f97316',
  'Estable':          '#60a5fa',
  'Alto desempeño':   '#22c55e',
  'Crítico - Fase 2': '#ef4444',
};

interface StepperProps {
  faseActual: FaseSeguimiento;
}

const Stepper: React.FC<StepperProps> = ({ faseActual }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: 0,
    overflowX: 'auto',
    paddingBottom: '4px',
  }}>
    {FASES.map((fase, idx) => {
      const completada = fase.num < faseActual;
      const activa    = fase.num === faseActual;

      const circleColor = completada ? '#22c55e' : activa ? '#f97316' : '#4b5563';
      const labelColor  = completada ? '#22c55e' : activa ? '#f97316' : '#6b7280';
      const lineColor   = completada ? '#22c55e' : '#374151';

      return (
        <React.Fragment key={fase.num}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '72px' }}>
            {/* Círculo */}
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: `2px solid ${circleColor}`,
              background: activa ? 'rgba(249,115,22,0.12)' : completada ? 'rgba(34,197,94,0.12)' : 'rgba(75,85,99,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: activa ? '0 0 12px rgba(249,115,22,0.5)' : completada ? '0 0 8px rgba(34,197,94,0.3)' : 'none',
              transition: 'all 0.2s',
              flexShrink: 0,
            }}>
              {completada ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <span style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: circleColor,
                }}>
                  {fase.num}
                </span>
              )}
            </div>
            {/* Etiqueta */}
            <div style={{ marginTop: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: labelColor, letterSpacing: '0.3px' }}>
                Fase {fase.num}
              </div>
              <div style={{ fontSize: '10px', color: '#6b7280', lineHeight: 1.3 }}>
                {fase.label}
              </div>
            </div>
          </div>

          {/* Línea conectora */}
          {idx < FASES.length - 1 && (
            <div style={{
              flex: 1,
              height: '2px',
              background: lineColor,
              marginBottom: '22px',
              minWidth: '24px',
              transition: 'background 0.3s',
            }} />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

interface InfoRowProps {
  label: string;
  value: string;
  color?: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value, color }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
    <span style={{ fontSize: '10px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
      {label}
    </span>
    <span style={{ fontSize: '13px', color: color || 'var(--text-main)', fontWeight: 500, lineHeight: 1.4 }}>
      {value}
    </span>
  </div>
);

interface RendimientoTecnicoFaseSeguimientoProps {
  data?: RendimientoTecnicoFaseData;
}

export const RendimientoTecnicoFaseSeguimiento: React.FC<RendimientoTecnicoFaseSeguimientoProps> = ({
  data = MOCK_FASE,
}) => {
  const estadoColor = ESTADO_COLOR[data.estadoActual];

  return (
    <div style={{
      background: 'var(--bg-panel)',
      border: '1px solid var(--border)',
      borderRadius: '10px',
      padding: '20px 22px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            width: '3px', height: '18px', borderRadius: '2px',
            background: 'var(--primary)', display: 'inline-block', flexShrink: 0,
          }} />
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Fase de Seguimiento
          </span>
          <span style={{
            fontSize: '10px', padding: '2px 8px', borderRadius: '20px',
            background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)',
            color: 'var(--secondary)', fontWeight: 600, letterSpacing: '0.5px',
          }}>MOCK</span>
        </div>
        <div style={{
          fontSize: '12px', fontWeight: 700,
          color: estadoColor,
          padding: '3px 10px',
          borderRadius: '20px',
          background: `${estadoColor}15`,
          border: `1px solid ${estadoColor}40`,
        }}>
          {data.estadoActual}
        </div>
      </div>

      {/* Stepper */}
      <Stepper faseActual={data.faseActual} />

      {/* Separador */}
      <div style={{ borderTop: '1px solid var(--border)' }} />

      {/* Detalles en grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: '14px',
      }}>
        <InfoRow label="Fase actual"         value={`Fase ${data.faseActual}`}           color={estadoColor} />
        <InfoRow label="Inicio de fase"       value={data.fechaInicioFase} />
        <InfoRow label="Próxima revisión"     value={data.proximaRevision} />
        <InfoRow label="Responsable"          value={data.responsableSeguimiento} />
      </div>

      {/* Motivo */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span style={{ fontSize: '10px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          Motivo
        </span>
        <span style={{ fontSize: '13px', color: 'var(--text-main)', lineHeight: 1.5 }}>
          {data.motivoFase}
        </span>
      </div>

      {/* Acción sugerida */}
      <div style={{
        background: 'rgba(249,115,22,0.06)',
        border: '1px solid rgba(249,115,22,0.2)',
        borderRadius: '8px',
        padding: '12px 14px',
        display: 'flex',
        gap: '10px',
        alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: '14px', flexShrink: 0 }}>💡</span>
        <div>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#f97316', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '4px' }}>
            Acción sugerida
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-main)', lineHeight: 1.5 }}>
            {data.accionSugerida}
          </div>
        </div>
      </div>
    </div>
  );
};
