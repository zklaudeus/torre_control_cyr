import React from 'react';

interface KpiCardProps {
  titulo: string;
  valor: string;
  subtitulo?: string;
  color?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ titulo, valor, subtitulo, color = 'var(--primary)' }) => (
  <div
    style={{
      background: 'var(--bg-panel)',
      border: '1px solid var(--border)',
      borderRadius: '10px',
      padding: '20px 22px',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
      minWidth: 0,
      transition: 'transform 0.15s, box-shadow 0.15s',
    }}
    onMouseEnter={e => {
      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
      (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.25)';
    }}
    onMouseLeave={e => {
      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
      (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.15)';
    }}
  >
    <div style={{
      fontSize: '11px',
      fontWeight: 600,
      color: 'var(--text-muted)',
      textTransform: 'uppercase',
      letterSpacing: '0.8px',
    }}>
      {titulo}
    </div>
    <div style={{
      fontSize: '28px',
      fontWeight: 800,
      color: color,
      lineHeight: 1.1,
      fontVariantNumeric: 'tabular-nums',
    }}>
      {valor}
    </div>
    {subtitulo && (
      <div style={{
        fontSize: '12px',
        color: 'var(--text-muted)',
        lineHeight: 1.3,
      }}>
        {subtitulo}
      </div>
    )}
  </div>
);

export interface RendimientoTecnicoKpiData {
  productividadDiaria: number;
  productividadPromedio: number;
  mejorProductividad: number;
  cumplimientoPct: number;
  totalCortesAcumulados: number;
  diasBajoMeta: number;
  diasCriticos: number;
  fallidasFrustrados: number;
}

const MOCK_DATA: RendimientoTecnicoKpiData = {
  productividadDiaria: 14,
  productividadPromedio: 18.6,
  mejorProductividad: 31,
  cumplimientoPct: 56,
  totalCortesAcumulados: 186,
  diasBajoMeta: 3,
  diasCriticos: 2,
  fallidasFrustrados: 8,
};

interface RendimientoTecnicoKpiCardsProps {
  data?: RendimientoTecnicoKpiData;
}

export const RendimientoTecnicoKpiCards: React.FC<RendimientoTecnicoKpiCardsProps> = ({
  data = MOCK_DATA,
}) => {
  const cumplimientoColor =
    data.cumplimientoPct >= 80
      ? '#22c55e'
      : data.cumplimientoPct >= 50
      ? '#f59e0b'
      : '#ef4444';

  const cards = [
    {
      titulo: 'Productividad diaria',
      valor: `${data.productividadDiaria} cortes`,
      subtitulo: 'Último día registrado',
      color: 'var(--primary)',
    },
    {
      titulo: 'Productividad promedio',
      valor: `${data.productividadPromedio} cortes`,
      subtitulo: 'Período actual',
      color: 'var(--primary)',
    },
    {
      titulo: 'Mejor productividad',
      valor: `${data.mejorProductividad} cortes`,
      subtitulo: 'Máximo registrado',
      color: '#22c55e',
    },
    {
      titulo: 'Cumplimiento',
      valor: `${data.cumplimientoPct}%`,
      subtitulo: 'Vs. meta diaria',
      color: cumplimientoColor,
    },
    {
      titulo: 'Total cortes acumulados',
      valor: `${data.totalCortesAcumulados}`,
      subtitulo: 'Período actual',
      color: 'var(--secondary)',
    },
    {
      titulo: 'Días bajo meta',
      valor: `${data.diasBajoMeta}`,
      subtitulo: 'Días con productividad baja',
      color: '#f59e0b',
    },
    {
      titulo: 'Días críticos',
      valor: `${data.diasCriticos}`,
      subtitulo: 'Días con 0 o 1 corte',
      color: '#ef4444',
    },
    {
      titulo: 'Fallidas / frustrados',
      valor: `${data.fallidasFrustrados}`,
      subtitulo: 'Visitas no concretadas',
      color: '#ef4444',
    },
  ];

  return (
    <div>
      <style>{`
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }
        @media (max-width: 1024px) {
          .kpi-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 600px) {
          .kpi-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div style={{
        marginBottom: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
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
          KPIs del técnico
        </span>
        <span style={{
          marginLeft: '6px',
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

      <div className="kpi-grid">
        {cards.map(card => (
          <KpiCard key={card.titulo} {...card} />
        ))}
      </div>
    </div>
  );
};
