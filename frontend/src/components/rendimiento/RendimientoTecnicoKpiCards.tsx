import React, { useState } from 'react';

interface KpiCardProps {
  titulo: string;
  valor: string;
  subtitulo?: string;
  color?: string;
  onClick?: () => void;
}

const KpiCard: React.FC<KpiCardProps> = ({ titulo, valor, subtitulo, color = 'var(--primary)', onClick }) => (
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
      cursor: onClick ? 'pointer' : 'default',
    }}
    onClick={onClick}
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
      fontFamily: 'var(--mono)',
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

type ModalTipo = 'productividad' | 'fallidas' | null;

function formatValor(data: RendimientoTecnicoKpiData, campo: keyof RendimientoTecnicoKpiData, sufijo: string = ''): string {
  const v = data[campo] as number;
  if (v === -1) return '—';
  return `${v}${sufijo}`;
}

function formatCausa(causa: string): string {
  const texto = causa.replaceAll('_', ' ').trim();
  return texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : 'Causa no informada';
}

function buildCards(data: RendimientoTecnicoKpiData, onProductividad: () => void, onFallidas: () => void) {
  const cumplimientoColor =
    data.cumplimientoPct === -1
      ? '#6b7280'
      : data.cumplimientoPct >= 80
      ? '#22c55e'
      : data.cumplimientoPct >= 50
      ? '#f59e0b'
      : '#ef4444';

  return [
    {
      titulo: 'Productividad diaria',
      valor: formatValor(data, 'productividadDiaria', ' cortes'),
      subtitulo: 'Último día registrado',
      color: 'var(--primary)',
      onClick: onProductividad,
    },
    {
      titulo: 'Productividad promedio',
      valor: formatValor(data, 'productividadPromedio', ' cortes'),
      subtitulo: 'Período actual',
      color: 'var(--primary)',
    },
    {
      titulo: 'Mejor productividad',
      valor: formatValor(data, 'mejorProductividad', ' cortes'),
      subtitulo: 'Máximo registrado',
      color: '#22c55e',
    },
    {
      titulo: 'Cumplimiento',
      valor: formatValor(data, 'cumplimientoPct', '%'),
      subtitulo: 'Vs. meta diaria',
      color: cumplimientoColor,
    },
    {
      titulo: 'Total cortes acumulados',
      valor: formatValor(data, 'totalCortesAcumulados'),
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
      onClick: onFallidas,
    },
  ];
}

function mapRendimientoToKpi(r: RendimientoDiarioBackend): RendimientoTecnicoKpiData {
  const sinDatos = r.cortes_productivos === 0 && r.cumplimiento_pct === 0;
  return {
    productividadDiaria: sinDatos ? -1 : r.cortes_productivos,
    productividadPromedio: sinDatos ? -1 : r.cortes_productivos,
    mejorProductividad: sinDatos ? -1 : r.cortes_productivos,
    cumplimientoPct: sinDatos ? -1 : Math.round(r.cumplimiento_pct),
    totalCortesAcumulados: sinDatos ? -1 : r.cortes_productivos,
    diasBajoMeta: 0,
    diasCriticos: 0,
    fallidasFrustrados: r.visita_fallida,
  };
}

export const RendimientoTecnicoKpiCards: React.FC<RendimientoTecnicoKpiCardsProps> = ({
  kpiData,
  loading,
}) => {
  const [modalTipo, setModalTipo] = useState<ModalTipo>(null);

  const data: RendimientoTecnicoKpiData | null = kpiData
    ? mapRendimientoToKpi(kpiData)
    : null;

  const cerrado = kpiData && data && data.productividadDiaria !== -1;
  const causasFallidas = kpiData?.causas_fallidas ?? [];
  const totalCausasDetalladas = causasFallidas.reduce((total, causa) => total + causa.cantidad, 0);
  const fallidasSinDetalle = kpiData
    ? Math.max(0, kpiData.visita_fallida - totalCausasDetalladas)
    : 0;

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
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-content {
          background: var(--bg-panel);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 28px 32px;
          min-width: 340px;
          width: min(520px, calc(100vw - 32px));
          max-height: calc(100vh - 48px);
          overflow-y: auto;
          box-sizing: border-box;
          box-shadow: 0 12px 40px rgba(0,0,0,0.4);
        }
        .modal-title {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 20px;
          color: var(--text);
        }
        .modal-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid var(--border);
          font-size: 14px;
        }
        .modal-row:last-child {
          border-bottom: none;
        }
        .modal-row-label {
          color: var(--text-muted);
        }
        .modal-row-value {
          color: var(--text);
          font-weight: 600;
          font-family: var(--mono);
          font-variant-numeric: tabular-nums;
        }
        .modal-cause-observation {
          margin-top: 3px;
          color: var(--text-muted);
          font-size: 11px;
          line-height: 1.35;
        }
        .modal-detail-notice {
          margin-top: 12px;
          padding: 10px 12px;
          border: 1px solid rgba(245, 158, 11, 0.4);
          border-radius: 8px;
          background: rgba(245, 158, 11, 0.08);
          color: var(--text-muted);
          font-size: 12px;
          line-height: 1.45;
        }
        .modal-close {
          margin-top: 20px;
          width: 100%;
          padding: 10px;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 8px;
          color: var(--text-muted);
          font-size: 13px;
          cursor: pointer;
        }
        .modal-close:hover {
          background: var(--border);
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
          {buildCards(
            data,
            () => setModalTipo('productividad'),
            () => setModalTipo('fallidas'),
          ).map(card => (
            <KpiCard key={card.titulo} {...card} />
          ))}
        </div>
      )}

      {modalTipo === 'productividad' && cerrado && kpiData && (
        <div className="modal-overlay" onClick={() => setModalTipo(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Detalle de productividad diaria</div>
            <div className="modal-row">
              <span className="modal-row-label">Cortes en poste</span>
              <span className="modal-row-value">{kpiData.corte_en_poste}</span>
            </div>
            <div className="modal-row">
              <span className="modal-row-label">Cortes en empalme</span>
              <span className="modal-row-value">{kpiData.corte_en_empalme}</span>
            </div>
            <div className="modal-row">
              <span className="modal-row-label">Cortes fuera de rango</span>
              <span className="modal-row-value">{kpiData.corte_fuera_de_rango}</span>
            </div>
            <div className="modal-row" style={{ fontWeight: 700 }}>
              <span className="modal-row-label">Total cortes productivos</span>
              <span className="modal-row-value">{kpiData.cortes_productivos}</span>
            </div>
            <div className="modal-row" style={{ color: 'var(--text-muted)', fontSize: '13px', borderBottom: 'none', marginTop: '4px' }}>
              <span>Reconexiones</span>
              <span>{kpiData.reconexiones}</span>
            </div>
            <button className="modal-close" onClick={() => setModalTipo(null)}>Cerrar</button>
          </div>
        </div>
      )}

      {modalTipo === 'fallidas' && kpiData && (
        <div className="modal-overlay" onClick={() => setModalTipo(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Detalle de fallidas / frustrados</div>
            <div className="modal-row">
              <span className="modal-row-label">Fecha operacional</span>
              <span className="modal-row-value">{kpiData.fecha_operacional}</span>
            </div>
            <div className="modal-row">
              <span className="modal-row-label">Total visitas fallidas</span>
              <span className="modal-row-value">{kpiData.visita_fallida}</span>
            </div>
            {causasFallidas.length > 0 && (
              <div style={{ marginTop: '4px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Por causa
                </div>
                {causasFallidas.map(c => {
                  const porcentaje = kpiData.visita_fallida > 0
                    ? Math.round((c.cantidad / kpiData.visita_fallida) * 100)
                    : 0;
                  return (
                  <div className="modal-row" key={c.causa_fallida}>
                    <div>
                      <span className="modal-row-label">{formatCausa(c.causa_fallida)}</span>
                      {c.observacion && (
                        <div className="modal-cause-observation">{c.observacion}</div>
                      )}
                    </div>
                    <span className="modal-row-value">{c.cantidad} · {porcentaje}%</span>
                  </div>
                  );
                })}
              </div>
            )}
            {kpiData.visita_fallida > 0 && causasFallidas.length === 0 && (
              <div className="modal-detail-notice">
                Este registro fue cargado sin el desglose de causas. Para recuperarlo es necesario
                volver a procesar el archivo operacional del {kpiData.fecha_operacional}.
              </div>
            )}
            {causasFallidas.length > 0 && fallidasSinDetalle > 0 && (
              <div className="modal-detail-notice">
                Hay {fallidasSinDetalle} {fallidasSinDetalle === 1 ? 'visita' : 'visitas'} sin una causa asociada.
              </div>
            )}
            {kpiData.visita_fallida === 0 && (
              <div style={{ padding: '14px 0 2px', color: 'var(--text-muted)', fontSize: '13px' }}>
                No se registraron visitas fallidas en esta fecha.
              </div>
            )}
            <button className="modal-close" onClick={() => setModalTipo(null)}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
};
