import React, { useState } from 'react';

import type { FaseSeguimiento } from '../../types/rendimientoTecnico.types';
import type { SeguimientoTecnicoBackend } from '../../api/productividad.api';
import { formatFecha } from '../../utils/formatFecha';

const FASES = [
  { num: 1 as FaseSeguimiento, label: 'Inicial',    descripcion: 'Seguimiento preventivo' },
  { num: 2 as FaseSeguimiento, label: 'Reforzado',  descripcion: 'Intervención supervisora' },
  { num: 3 as FaseSeguimiento, label: 'Crítico',    descripcion: 'Intervención mayor' },
];

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
                Nivel {fase.num}
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
  seguimiento: SeguimientoTecnicoBackend | null;
  codigoSap: string;
  userRol: string;
  onRegistrarAdvertencia: (motivo: string) => Promise<void>;
  registrandoAdvertencia: boolean;
  onCambiarFase: (faseNueva: number, motivo: string) => Promise<void>;
  cambiandoFase: boolean;
  onAnularAdvertencia: (advertenciaId: number, motivo: string) => Promise<void>;
  anulandoAdvertencia: boolean;
}

const ESTADO_COLOR_MAP: Record<string, string> = {
  'SIN_EVALUACION': '#6b7280',
  'CRITICO': '#ef4444',
  'RECUPERACION': '#f97316',
  'ESTABLE': '#60a5fa',
  'ALTO_DESEMPENO': '#22c55e',
};

const ESTADO_LABEL_MAP: Record<string, string> = {
  'SIN_EVALUACION': 'Sin evaluación',
  'CRITICO': 'Crítico',
  'RECUPERACION': 'En recuperación',
  'ESTABLE': 'Estable',
  'ALTO_DESEMPENO': 'Alto desempeño',
};

export const RendimientoTecnicoFaseSeguimiento: React.FC<RendimientoTecnicoFaseSeguimientoProps> = ({
  seguimiento,
  codigoSap,
  userRol,
  onRegistrarAdvertencia,
  registrandoAdvertencia,
  onCambiarFase,
  cambiandoFase,
  onAnularAdvertencia,
  anulandoAdvertencia,
}) => {
  const [showModal, setShowModal] = useState<'advertencia' | 'fase' | 'anular' | null>(null);
  const [anularAdvertenciaId, setAnularAdvertenciaId] = useState<number | null>(null);
  const [motivo, setMotivo] = useState('');
  const [modalError, setModalError] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [faseNueva, setFaseNueva] = useState(1);

  if (!seguimiento) {
    return (
      <div style={{
        background: 'var(--bg-panel)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        padding: '20px 22px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{
            width: '3px', height: '18px', borderRadius: '2px',
            background: 'var(--primary)', display: 'inline-block', flexShrink: 0,
          }} />
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Nivel de Seguimiento
          </span>
        </div>
        <div style={{
          padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)',
          fontSize: '13px',
        }}>
          Cargando seguimiento…
        </div>
      </div>
    );
  }

  const fase: FaseSeguimiento = seguimiento.fase_actual as FaseSeguimiento;
  const estadoStr = seguimiento.estado_productivo_actual;
  const estColor = ESTADO_COLOR_MAP[estadoStr] || '#6b7280';
  const estLabel = ESTADO_LABEL_MAP[estadoStr] || estadoStr;
  const puedeRegistrar = userRol === 'torre_control' || userRol === 'admin' || userRol === 'superadmin';
  const ultimoHistorial = seguimiento.historial_reciente.length > 0 ? seguimiento.historial_reciente[0] : null;

  const handleAbrirModalAdvertencia = () => {
    setMotivo('');
    setModalError('');
    setShowModal('advertencia');
  };

  const handleAbrirModalFase = () => {
    setMotivo('');
    setModalError('');
    setFaseNueva(1);
    setShowModal('fase');
  };

  const handleAbrirModalAnular = (advertenciaId: number) => {
    setMotivo('');
    setModalError('');
    setAnularAdvertenciaId(advertenciaId);
    setShowModal('anular');
  };

  const handleConfirmar = async () => {
    if (!motivo.trim()) {
      setModalError('El motivo es obligatorio.');
      return;
    }
    setModalError('');
    try {
      if (showModal === 'advertencia') {
        await onRegistrarAdvertencia(motivo.trim());
        setShowModal(null);
        setMotivo('');
        setSuccessMsg('Advertencia registrada correctamente.');

        if (seguimiento.fase_actual === 2 && seguimiento.advertencias_fase2 + 1 >= 3) {
          setSuccessMsg(`El técnico ${codigoSap} pasó a Nivel 3 por acumular 3 advertencias activas en Nivel 2.`);
        }
      } else if (showModal === 'fase') {
        await onCambiarFase(faseNueva, motivo.trim());
        setShowModal(null);
        setMotivo('');
        setFaseNueva(1);
        setSuccessMsg(`Nivel cambiado a ${faseNueva} correctamente.`);
      } else if (showModal === 'anular' && anularAdvertenciaId !== null) {
        await onAnularAdvertencia(anularAdvertenciaId, motivo.trim());
        setShowModal(null);
        setMotivo('');
        setAnularAdvertenciaId(null);
        setSuccessMsg('Advertencia anulada correctamente.');
      }

      setTimeout(() => setSuccessMsg(null), 6000);
    } catch {
      setModalError('Error al realizar la operación.');
    }
  };

  const estadoDisplay = `${estLabel}${fase >= 2 ? ` - Nivel ${fase}` : ''}`;

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
            Nivel de Seguimiento
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {successMsg && (
            <span style={{ fontSize: '11px', color: '#22c55e', fontWeight: 600 }}>
              {successMsg}
            </span>
          )}
          <div style={{
            fontSize: '12px', fontWeight: 700,
            color: estColor,
            padding: '3px 10px',
            borderRadius: '20px',
            background: `${estColor}15`,
            border: `1px solid ${estColor}40`,
          }}>
            {estadoDisplay}
          </div>
        </div>
      </div>

      {/* Stepper */}
      <Stepper faseActual={fase} />

      {/* Separador */}
      <div style={{ borderTop: '1px solid var(--border)' }} />

      {/* Resumen de seguimiento */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: '12px',
      }}>
        <InfoRow label="Nivel actual" value={`Nivel ${fase}`} color={estColor} />
        <InfoRow label="Estado productivo" value={estLabel} color={estColor} />
        <InfoRow label="Días bajo 50%" value={String(seguimiento.dias_consecutivos_bajo_50)} />
        <InfoRow label="Días alto desempeño" value={String(seguimiento.dias_consecutivos_alto_desempeno)} />
        <InfoRow label="Advertencias Nivel 2" value={`${seguimiento.advertencias_fase2}/3`} />
        <InfoRow label="Última evaluación" value={formatFecha(seguimiento.fecha_ultima_evaluacion)} />
      </div>

      {/* Motivo actual */}
      {ultimoHistorial && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '10px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            Último cambio ({formatFecha(ultimoHistorial.fecha_cambio)})
          </span>
          <span style={{ fontSize: '13px', color: 'var(--text-main)', lineHeight: 1.5 }}>
            {ultimoHistorial.motivo || ultimoHistorial.regla_disparadora}
          </span>
        </div>
      )}

      {/* Advertencias activas */}
      {seguimiento.advertencias_activas.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '10px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            Advertencias activas ({seguimiento.advertencias_activas.length})
          </span>
          {seguimiento.advertencias_activas.map(a => (
            <div key={a.id} style={{
              background: 'rgba(239,68,68,0.06)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: '6px',
              padding: '8px 12px',
              fontSize: '12px',
              color: 'var(--text-main)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600 }}>{a.motivo}</span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', color: '#6b7280' }}>
                    #{a.numero_advertencia || '-'} · {formatFecha(a.fecha_registro)}
                  </span>
                  {puedeRegistrar && (
                    <button
                      type="button"
                      onClick={() => handleAbrirModalAnular(a.id)}
                      disabled={anulandoAdvertencia}
                      style={{
                        padding: '2px 8px', fontSize: '10px', fontWeight: 600,
                        background: 'transparent', color: '#ef4444',
                        border: '1px solid #ef4444', borderRadius: '4px',
                        cursor: anulandoAdvertencia ? 'not-allowed' : 'pointer',
                      }}
                    >
                      Anular
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Botones de acción */}
      {puedeRegistrar && (
        <div style={{ marginTop: '4px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleAbrirModalAdvertencia}
            disabled={registrandoAdvertencia}
            style={{
              padding: '8px 16px',
              background: registrandoAdvertencia ? '#6b7280' : '#ef4444',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: registrandoAdvertencia ? 'not-allowed' : 'pointer',
            }}
          >
            {registrandoAdvertencia ? 'Registrando…' : 'Registrar advertencia'}
          </button>
          <button
            type="button"
            onClick={handleAbrirModalFase}
            disabled={cambiandoFase}
            style={{
              padding: '8px 16px',
              background: cambiandoFase ? '#6b7280' : '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: cambiandoFase ? 'not-allowed' : 'pointer',
            }}
          >
            {cambiandoFase ? 'Cambiando…' : 'Cambiar nivel'}
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal === 'advertencia' && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setShowModal(null)}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '480px',
            width: '90%',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            fontFamily: 'var(--sans)',
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 700, color: '#1E293B' }}>
              Registrar advertencia
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#64748B' }}>
              Técnico: <strong>{seguimiento.usuario}</strong> ({codigoSap})<br />
              Nivel actual: <strong>Nivel {fase}</strong> · Advertencias activas: <strong>{seguimiento.advertencias_fase2}/3</strong>
            </p>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                Motivo *
              </label>
              <textarea
                value={motivo}
                onChange={e => { setMotivo(e.target.value); setModalError(''); }}
                placeholder="Describa el motivo de la advertencia…"
                rows={3}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: '6px',
                  border: `1px solid ${modalError ? '#ef4444' : '#E2E8F0'}`,
                  fontSize: '13px', outline: 'none', resize: 'vertical',
                  boxSizing: 'border-box', fontFamily: 'var(--sans)',
                }}
              />
              {modalError && <span style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>{modalError}</span>}
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowModal(null)}
                style={{
                  padding: '8px 16px', borderRadius: '6px',
                  border: '1px solid #E2E8F0', background: '#fff',
                  color: '#475569', fontSize: '13px', cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmar}
                disabled={registrandoAdvertencia}
                style={{
                  padding: '8px 16px', borderRadius: '6px',
                  border: 'none', background: registrandoAdvertencia ? '#6b7280' : '#ef4444',
                  color: '#fff', fontSize: '13px', fontWeight: 600,
                  cursor: registrandoAdvertencia ? 'not-allowed' : 'pointer',
                }}
              >
                {registrandoAdvertencia ? 'Registrando…' : 'Confirmar advertencia'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal anular advertencia */}
      {showModal === 'anular' && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setShowModal(null)}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '480px',
            width: '90%',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            fontFamily: 'var(--sans)',
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 700, color: '#1E293B' }}>
              Anular advertencia
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#64748B' }}>
              Técnico: <strong>{seguimiento.usuario}</strong> ({codigoSap})<br />
              Esta acción no se puede deshacer.
            </p>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                Motivo de anulación *
              </label>
              <textarea
                value={motivo}
                onChange={e => { setMotivo(e.target.value); setModalError(''); }}
                placeholder="Indique el motivo de la anulación…"
                rows={3}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: '6px',
                  border: `1px solid ${modalError ? '#ef4444' : '#E2E8F0'}`,
                  fontSize: '13px', outline: 'none', resize: 'vertical',
                  boxSizing: 'border-box', fontFamily: 'var(--sans)',
                }}
              />
              {modalError && <span style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>{modalError}</span>}
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowModal(null)}
                style={{
                  padding: '8px 16px', borderRadius: '6px',
                  border: '1px solid #E2E8F0', background: '#fff',
                  color: '#475569', fontSize: '13px', cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmar}
                disabled={anulandoAdvertencia}
                style={{
                  padding: '8px 16px', borderRadius: '6px',
                  border: 'none', background: anulandoAdvertencia ? '#6b7280' : '#ef4444',
                  color: '#fff', fontSize: '13px', fontWeight: 600,
                  cursor: anulandoAdvertencia ? 'not-allowed' : 'pointer',
                }}
              >
                {anulandoAdvertencia ? 'Anulando…' : 'Confirmar anulación'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal cambio de fase */}
      {showModal === 'fase' && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setShowModal(null)}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '480px',
            width: '90%',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            fontFamily: 'var(--sans)',
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 700, color: '#1E293B' }}>
              Cambiar nivel manualmente
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#64748B' }}>
              Técnico: <strong>{seguimiento.usuario}</strong> ({codigoSap})<br />
              Nivel actual: <strong>Nivel {fase}</strong>
            </p>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                Nuevo nivel *
              </label>
              <select
                value={faseNueva}
                onChange={e => setFaseNueva(Number(e.target.value))}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: '6px',
                  border: '1px solid #E2E8F0', fontSize: '13px', outline: 'none',
                  boxSizing: 'border-box',
                }}
              >
                <option value={1}>Nivel 1 – Preventivo</option>
                <option value={2}>Nivel 2 – Reforzado</option>
                <option value={3}>Nivel 3 – Crítico</option>
              </select>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                Motivo *
              </label>
              <textarea
                value={motivo}
                onChange={e => { setMotivo(e.target.value); setModalError(''); }}
                placeholder="Indique el motivo del cambio de nivel…"
                rows={3}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: '6px',
                  border: `1px solid ${modalError ? '#ef4444' : '#E2E8F0'}`,
                  fontSize: '13px', outline: 'none', resize: 'vertical',
                  boxSizing: 'border-box', fontFamily: 'var(--sans)',
                }}
              />
              {modalError && <span style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>{modalError}</span>}
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowModal(null)}
                style={{
                  padding: '8px 16px', borderRadius: '6px',
                  border: '1px solid #E2E8F0', background: '#fff',
                  color: '#475569', fontSize: '13px', cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmar}
                disabled={cambiandoFase}
                style={{
                  padding: '8px 16px', borderRadius: '6px',
                  border: 'none', background: cambiandoFase ? '#6b7280' : '#3b82f6',
                  color: '#fff', fontSize: '13px', fontWeight: 600,
                  cursor: cambiandoFase ? 'not-allowed' : 'pointer',
                }}
              >
                {cambiandoFase ? 'Cambiando…' : 'Confirmar cambio'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
