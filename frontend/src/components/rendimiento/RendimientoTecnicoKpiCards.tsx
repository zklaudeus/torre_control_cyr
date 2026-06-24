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

import type { RendimientoDiarioBackend } from '../../api/productividad.api';
import type { RendimientoTecnicoKpiData } from '../../types/rendimientoTecnico.types';

interface RendimientoTecnicoKpiCardsProps {
  kpiData?: RendimientoDiarioBackend;
  loading?: boolean;
}

function buildCards(data: RendimientoTecnicoKpiData) {
  const cumplimientoColor =
    data.cumplimientoPct >= 80
      ? '#22c55e'
      : data.cumplimientoPct >= 50
      ? '#f59e0b'
      : '#ef4444';

  return [
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
}

function mapRendimientoToKpi(r: RendimientoDiarioBackend): RendimientoTecnicoKpiData {
  return {
    productividadDiaria: r.cortes_productivos,
    productividadPromedio: r.cortes_productivos,
    mejorProductividad: r.cortes_productivos,
    cumplimientoPct: Math.round(r.cumplimiento_pct),
    totalCortesAcumulados: r.cortes_productivos,
    diasBajoMeta: 0,
    diasCriticos: 0,
    fallidasFrustrados: r.visita_fallida,
  };
}

export const RendimientoTecnicoKpiCards: React.FC<RendimientoTecnicoKpiCardsProps> = ({
  kpiData,
  loading,
}) => {
  const data: RendimientoTecnicoKpiData | null = kpiData
    ? mapRendimientoToKpi(kpiData)
    : null;

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
      </div>

      {loading ? (
        <div style={{
          padding: '40px 20px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '13px',
          background: 'var(--bg-panel)',
          border: '1px dashed var(--border)',
          borderRadius: '8px',
        }}>
          Cargando KPIs…
        </div>
      ) : !data ? (
        <div style={{
          padding: '40px 20px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '13px',
          background: 'var(--bg-panel)',
          border: '1px dashed var(--border)',
          borderRadius: '8px',
        }}>
          Sin datos de rendimiento disponibles.
        </div>
      ) : (
        <div className="kpi-grid">
          {buildCards(data).map(card => (
            <KpiCard key={card.titulo} {...card} />
          ))}
        </div>
      )}
    </div>
  );
};
