import React, { useState } from 'react';

interface KpiCardProps {
  titulo: string;
  valor: string;
  detalle?: string;
  subtitulo?: string;
  color?: string;
  onClick?: () => void;
}

const KpiCard: React.FC<KpiCardProps> = ({ titulo, valor, detalle, subtitulo, color = 'var(--primary)', onClick }) => (
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
      height: '100%',
      boxSizing: 'border-box',
      transition: 'transform 0.15s, box-shadow 0.15s',
      cursor: onClick ? 'pointer' : 'default',
    }}
    onClick={onClick}
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
    onKeyDown={e => {
      if (onClick && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        onClick();
      }
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
      fontFamily: 'var(--mono)',
      fontVariantNumeric: 'tabular-nums',
    }}>
      {valor}
    </div>
    {detalle && (
      <div style={{
        fontSize: '13px',
        fontWeight: 600,
        color: 'var(--text-main)',
        fontFamily: 'var(--mono)',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {detalle}
      </div>
    )}
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

import type { RendimientoDiarioBackend, ResumenKpiTecnicoBackend } from '../../api/productividad.api';
import type { RendimientoTecnicoKpiData } from '../../types/rendimientoTecnico.types';
import { formatFecha } from '../../utils/formatFecha';

interface RendimientoTecnicoKpiCardsProps {
  kpiData?: RendimientoDiarioBackend;
  resumen?: ResumenKpiTecnicoBackend;
  loading?: boolean;
}

type ModalTipo =
  | 'productividad'
  | 'promedio'
  | 'mejor'
  | 'cumplimiento'
  | 'acumulado'
  | 'reconexiones_corte'
  | 'criticos'
  | 'fallidas'
  | null;

const TITULOS_MODAL: Record<Exclude<ModalTipo, null>, string> = {
  productividad: 'Detalle de productividad diaria',
  promedio: 'Detalle de productividad promedio',
  mejor: 'Detalle de mejor productividad',
  cumplimiento: 'Detalle de cumplimiento',
  acumulado: 'Detalle de cortes acumulados',
  reconexiones_corte: 'Detalle de Reconexión vs. Corte',
  criticos: 'Días críticos',
  fallidas: 'Detalle de fallidas / frustrados',
};

function formatNumero(valor: number): string {
  return new Intl.NumberFormat('es-CL', { maximumFractionDigits: 1 }).format(valor);
}

function formatValor(data: RendimientoTecnicoKpiData, campo: keyof RendimientoTecnicoKpiData, sufijo: string = ''): string {
  const v = data[campo] as number;
  if (v === -1) return '—';
  return `${formatNumero(v)}${sufijo}`;
}

function formatCantidadDiaria(valor: number, unidad: string): string {
  return valor === -1 ? 'Sin datos' : `${formatNumero(valor)} ${unidad}`;
}

function formatCausa(causa: string): string {
  const texto = causa.replaceAll('_', ' ').trim();
  return texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : 'Causa no informada';
}

function buildCards(
  data: RendimientoTecnicoKpiData,
  resumen: ResumenKpiTecnicoBackend | undefined,
  onOpen: (tipo: Exclude<ModalTipo, null>) => void,
) {
  const cumplimientoColor =
    data.cumplimientoPct === -1
      ? '#64748B'
      : data.cumplimientoPct >= 80
      ? '#1E6845'
      : data.cumplimientoPct >= 50
      ? '#78350F'
      : '#991B1B';

  let recColor = '#64748B';
  let recValor = 'N/A';
  let recSubtitulo = 'Brecha: 0';

  const cortes = data.productividadDiaria;
  const reconexiones = data.reconexionesEjecutadas;

  if (cortes !== -1 && reconexiones !== -1 && cortes > 0) {
    const recBrecha = cortes - reconexiones;
    const recPct = reconexiones >= cortes ? 100 : (reconexiones / cortes) * 100;

    if (reconexiones >= cortes) {
      recColor = '#1E6845';
    } else {
      if (recPct >= 90) {
        recColor = '#1E3A5F';
      } else if (recPct >= 70) {
        recColor = '#78350F';
      } else {
        recColor = '#991B1B';
      }
    }
    recValor = `${formatNumero(recPct)}%`;
    recSubtitulo = recBrecha === 0 ? 'Cumplimiento exacto' : (recBrecha > 0 ? `Faltan ${recBrecha} rec.` : `Exceden ${Math.abs(recBrecha)} rec.`);
  } else if (cortes === 0) {
    recValor = 'N/A';
    recSubtitulo = '0 cortes ejecutados';
  } else if (cortes === -1) {
    recValor = '—';
    recSubtitulo = 'Sin datos';
  }

  return [
    {
      titulo: 'Productividad diaria',
      valor: formatCantidadDiaria(data.productividadDiaria, 'cortes'),
      detalle: formatCantidadDiaria(data.reconexionesEjecutadas, 'reconexiones'),
      subtitulo: formatFecha(resumen?.fecha_hasta, 'Fecha seleccionada'),
      color: 'var(--primary)',
      onClick: () => onOpen('productividad'),
    },
    {
      titulo: 'Productividad promedio',
      valor: formatValor(data, 'productividadPromedio', ' cortes'),
      subtitulo: `${resumen?.dias_con_datos ?? 0} días del mes`,
      color: 'var(--primary)',
      onClick: () => onOpen('promedio'),
    },
    {
      titulo: 'Mejor productividad',
      valor: formatValor(data, 'mejorProductividad', ' cortes'),
      subtitulo: formatFecha(resumen?.fecha_mejor_productividad, 'Sin fecha registrada'),
      color: '#1E6845',
      onClick: () => onOpen('mejor'),
    },
    {
      titulo: 'Cumplimiento',
      valor: formatValor(data, 'cumplimientoPct', '%'),
      subtitulo: 'Vs. meta del día',
      color: cumplimientoColor,
      onClick: () => onOpen('cumplimiento'),
    },
    {
      titulo: 'Total cortes acumulados',
      valor: formatValor(data, 'totalCortesAcumulados'),
      subtitulo: 'Acumulado del mes',
      color: 'var(--primary)',
      onClick: () => onOpen('acumulado'),
    },
    {
      titulo: 'Cumplimiento Reconexión/Corte',
      valor: recValor,
      subtitulo: recSubtitulo,
      color: recColor,
      onClick: () => onOpen('reconexiones_corte'),
    },
    {
      titulo: 'Días críticos',
      valor: `${data.diasCriticos}`,
      subtitulo: 'Cumplimiento menor a 50%',
      color: '#991B1B',
      onClick: () => onOpen('criticos'),
    },
    {
      titulo: 'Fallidas / frustrados',
      valor: `${data.fallidasFrustrados}`,
      subtitulo: formatFecha(resumen?.fecha_hasta, 'Fecha seleccionada'),
      color: '#991B1B',
      onClick: () => onOpen('fallidas'),
    },
  ];
}

function mapRendimientoToKpi(
  r: RendimientoDiarioBackend | undefined,
  resumen: ResumenKpiTecnicoBackend | undefined,
): RendimientoTecnicoKpiData | null {
  if (resumen) {
    return {
      productividadDiaria: resumen.productividad_diaria ?? r?.cortes_productivos ?? -1,
      productividadPromedio: resumen.productividad_promedio ?? -1,
      mejorProductividad: resumen.mejor_productividad ?? -1,
      cumplimientoPct: resumen.cumplimiento_diario_pct ?? r?.cumplimiento_pct ?? -1,
      totalCortesAcumulados: resumen.total_cortes_acumulados,
      reconexionesEjecutadas: resumen.reconexiones_dia ?? r?.reconexiones ?? -1,
      diasCriticos: resumen.dias_criticos,
      fallidasFrustrados: resumen.fallidas_dia ?? r?.visita_fallida ?? 0,
    };
  }
  if (!r) return null;
  return {
    productividadDiaria: r.cortes_productivos,
    productividadPromedio: r.cortes_productivos,
    mejorProductividad: r.cortes_productivos,
    cumplimientoPct: r.cumplimiento_pct,
    totalCortesAcumulados: r.cortes_productivos,
    reconexionesEjecutadas: r.reconexiones,
    diasCriticos: 0,
    fallidasFrustrados: r.visita_fallida,
  };
}

export const RendimientoTecnicoKpiCards: React.FC<RendimientoTecnicoKpiCardsProps> = ({
  kpiData,
  resumen,
  loading,
}) => {
  const [modalTipo, setModalTipo] = useState<ModalTipo>(null);

  const data = mapRendimientoToKpi(kpiData, resumen);

  const causasFallidas = kpiData?.causas_fallidas ?? [];
  const totalCausasDetalladas = causasFallidas.reduce((total, causa) => total + causa.cantidad, 0);
  const fallidasSinDetalle = kpiData
    ? Math.max(0, kpiData.visita_fallida - totalCausasDetalladas)
    : 0;
  const diasCriticos = resumen?.dias.filter(dia => dia.cumplimiento_pct < 50) ?? [];

  const modalRow = (label: string, value: React.ReactNode) => (
    <div className="modal-row">
      <span className="modal-row-label">{label}</span>
      <span className="modal-row-value">{value}</span>
    </div>
  );

  const renderDias = (dias: ResumenKpiTecnicoBackend['dias'], emptyText: string) => {
    if (dias.length === 0) {
      return <div className="modal-detail-notice">{emptyText}</div>;
    }
    return (
      <div style={{ marginTop: '10px' }}>
        {dias.map(dia => (
          <div className="modal-row" key={dia.fecha_operacional}>
            <span className="modal-row-label">{formatFecha(dia.fecha_operacional)}</span>
            <span className="modal-row-value">
              {dia.cortes_productivos}/{dia.meta_aplicada} · {formatNumero(dia.cumplimiento_pct)}%
            </span>
          </div>
        ))}
      </div>
    );
  };

  const renderModalContent = () => {
    if (!modalTipo) return null;
    if (modalTipo === 'productividad') {
      if (!data) return <div className="modal-detail-notice">No hay datos para la fecha seleccionada.</div>;
      const tieneMetricasDiarias =
        data.productividadDiaria !== -1 ||
        data.reconexionesEjecutadas !== -1 ||
        Boolean(kpiData);
      if (!tieneMetricasDiarias) {
        return (
          <div className="modal-detail-notice">
            No hay registro diario contabilizable para la fecha seleccionada.
          </div>
        );
      }
      return (
        <>
          {modalRow('Fecha operacional', formatFecha(kpiData?.fecha_operacional ?? resumen?.fecha_hasta))}
          {kpiData ? (
            <>
              {modalRow('Cortes en poste', kpiData.corte_en_poste)}
              {modalRow('Cortes en empalme', kpiData.corte_en_empalme)}
              {modalRow('Cortes fuera de rango', kpiData.corte_fuera_de_rango)}
            </>
          ) : (
            <div className="modal-detail-notice">
              No hay desglose por tipo de corte para esta fecha; se muestran los totales disponibles.
            </div>
          )}
          {modalRow('Total cortes productivos', data.productividadDiaria !== -1 ? data.productividadDiaria : '—')}
          {modalRow('Reconexiones', data.reconexionesEjecutadas !== -1 ? data.reconexionesEjecutadas : '—')}
        </>
      );
    }
    if (!resumen) {
      return <div className="modal-detail-notice">No hay resumen disponible para este período.</div>;
    }
    if (modalTipo === 'promedio') {
      return (
        <>
          {modalRow('Período', `${formatFecha(resumen.fecha_desde)} → ${formatFecha(resumen.fecha_hasta)}`)}
          {modalRow('Días considerados', resumen.dias_con_datos)}
          {modalRow('Cortes acumulados', resumen.total_cortes_acumulados)}
          {modalRow('Promedio diario', resumen.productividad_promedio == null ? '—' : formatNumero(resumen.productividad_promedio))}
          <div className="modal-detail-notice">Promedio = cortes acumulados ÷ días operacionales con datos.</div>
        </>
      );
    }
    if (modalTipo === 'mejor') {
      return (
        <>
          {modalRow('Mejor productividad', resumen.mejor_productividad ?? '—')}
          {modalRow('Fecha del máximo', formatFecha(resumen.fecha_mejor_productividad))}
          {modalRow('Días comparados', resumen.dias_con_datos)}
        </>
      );
    }
    if (modalTipo === 'cumplimiento') {
      return (
        <>
          {modalRow('Cortes del día', resumen.productividad_diaria ?? '—')}
          {modalRow('Meta del día', resumen.meta_diaria ?? '—')}
          {modalRow('Cumplimiento diario', resumen.cumplimiento_diario_pct == null ? '—' : `${formatNumero(resumen.cumplimiento_diario_pct)}%`)}
          {modalRow('Cumplimiento mensual', resumen.cumplimiento_acumulado_pct == null ? '—' : `${formatNumero(resumen.cumplimiento_acumulado_pct)}%`)}
          <div className="modal-detail-notice">Las visitas fallidas no descuentan productividad ni cumplimiento.</div>
        </>
      );
    }
    if (modalTipo === 'acumulado') {
      return (
        <>
          {modalRow('Período', `${formatFecha(resumen.fecha_desde)} → ${formatFecha(resumen.fecha_hasta)}`)}
          {modalRow('Cortes en poste', resumen.corte_en_poste_acumulado)}
          {modalRow('Cortes en empalme', resumen.corte_en_empalme_acumulado)}
          {modalRow('Cortes fuera de rango', resumen.corte_fuera_de_rango_acumulado)}
          {modalRow('Total cortes productivos', resumen.total_cortes_acumulados)}
          {modalRow('Meta acumulada', resumen.total_meta_acumulada)}
        </>
      );
    }
    if (modalTipo === 'reconexiones_corte') {
      if (!data) {
        return <div className="modal-detail-notice">No hay datos para la fecha seleccionada.</div>;
      }
      const cortes = data.productividadDiaria;
      const reconexiones = data.reconexionesEjecutadas;
      const brecha = cortes !== -1 && reconexiones !== -1 ? cortes - reconexiones : 0;
      let pctStr = 'N/A';
      if (cortes !== -1 && reconexiones !== -1 && cortes > 0) {
        pctStr = reconexiones >= cortes ? '100%' : `${formatNumero((reconexiones / cortes) * 100)}%`;
      }
      return (
        <>
          {modalRow('Cortes ejecutados (día)', cortes !== -1 ? cortes : '—')}
          {modalRow('Reconexiones ejecutadas (día)', reconexiones !== -1 ? reconexiones : '—')}
          {modalRow('Cumplimiento', pctStr)}
          {modalRow('Brecha', cortes !== -1 && reconexiones !== -1 ? (brecha > 0 ? `Faltan ${brecha}` : (brecha < 0 ? `Excedente de ${Math.abs(brecha)}` : '0')) : '—')}
          <div className="modal-detail-notice">
            Se espera una relación 1 a 1 entre cortes y reconexiones. 
            El porcentaje visible está limitado a un máximo del 100%, pero la brecha muestra el excedente.
          </div>
        </>
      );
    }
    if (modalTipo === 'criticos') {
      return (
        <>
          {modalRow('Total de días críticos', resumen.dias_criticos)}
          {renderDias(diasCriticos, 'No existen días con cumplimiento menor a 50%.')}
        </>
      );
    }

    const variacion = resumen.fallidas_variacion_abs == null
      ? 'Sin base comparativa'
      : `${resumen.fallidas_variacion_abs > 0 ? '+' : ''}${resumen.fallidas_variacion_abs}${
          resumen.fallidas_variacion_pct == null ? '' : ` · ${formatNumero(resumen.fallidas_variacion_pct)}%`
        }`;
    return (
      <>
        {modalRow('Fecha operacional', formatFecha(resumen.fecha_hasta))}
        {modalRow('Fallidas del día', resumen.fallidas_dia)}
        {modalRow('Variación vs. día anterior', variacion)}
        {modalRow('Acumulado últimos 7 días', resumen.fallidas_ultimos_7_dias)}
        {modalRow('Acumulado últimos 14 días', resumen.fallidas_ultimos_14_dias)}
        {modalRow('Acumulado del mes', resumen.fallidas_acumuladas)}
        {causasFallidas.length > 0 && (
          <div style={{ marginTop: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>
              Causas del día
            </div>
            {causasFallidas.map(c => {
              const porcentaje = resumen.fallidas_dia > 0
                ? Math.round((c.cantidad / resumen.fallidas_dia) * 100)
                : 0;
              return (
                <div className="modal-row" key={c.causa_fallida}>
                  <div>
                    <span className="modal-row-label">{formatCausa(c.causa_fallida)}</span>
                    {c.observacion && <div className="modal-cause-observation">{c.observacion}</div>}
                  </div>
                  <span className="modal-row-value">{c.cantidad} · {porcentaje}%</span>
                </div>
              );
            })}
          </div>
        )}
        {resumen.fallidas_dia > 0 && causasFallidas.length === 0 && (
          <div className="modal-detail-notice">
            El total existe, pero la fuente histórica no conserva el desglose de causas para esta fecha.
          </div>
        )}
        {causasFallidas.length > 0 && fallidasSinDetalle > 0 && (
          <div className="modal-detail-notice">
            Hay {fallidasSinDetalle} {fallidasSinDetalle === 1 ? 'visita' : 'visitas'} sin una causa asociada.
          </div>
        )}
      </>
    );
  };

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
          color: var(--text-main);
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
          color: var(--text-main);
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
          background: var(--bg-main);
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
          KPIs de la brigada
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
            resumen,
            setModalTipo,
          ).map(card => (
            <KpiCard key={card.titulo} {...card} />
          ))}
        </div>
      )}

      {modalTipo && data && (
        <div className="modal-overlay" onClick={() => setModalTipo(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-title">{TITULOS_MODAL[modalTipo]}</div>
            {renderModalContent()}
            <button className="modal-close" onClick={() => setModalTipo(null)}>Cerrar</button>
          </div>
        </div>
      )}

    </div>
  );
};
