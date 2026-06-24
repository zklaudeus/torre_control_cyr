import React, { useState } from 'react';

import type { HallazgoTecnico, NivelHallazgo } from '../../types/rendimientoTecnico.types';
import { CONFIG_NIVEL_HALLAZGO } from '../../data/rendimientoTecnico.config';
import type { AlertaItemBackend } from '../../api/productividad.api';
import { formatFecha } from '../../utils/formatFecha';

const HallazgoCard: React.FC<{
  hallazgo: HallazgoTecnico;
  alerta?: AlertaItemBackend;
  puedeGestionar?: boolean;
  onAnular?: (id: number) => void;
  onEliminar?: (id: number) => void;
}> = ({ hallazgo, alerta, puedeGestionar, onAnular, onEliminar }) => {
  const cfg = CONFIG_NIVEL_HALLAZGO[hallazgo.nivel];
  const esActiva = alerta?.estado === 'ACTIVA';
  const esAnulada = alerta?.estado === 'ANULADA';

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
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
          <span style={{
            fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px',
            color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`, whiteSpace: 'nowrap',
          }}>
            {hallazgo.nivel}
          </span>
          {puedeGestionar && esActiva && alerta && (
            <button
              type="button"
              onClick={() => onAnular?.(alerta.id)}
              style={{
                padding: '2px 8px', fontSize: '10px', fontWeight: 600,
                background: 'transparent', color: '#ef4444',
                border: '1px solid #ef4444', borderRadius: '4px',
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              Anular
            </button>
          )}
          {puedeGestionar && esAnulada && alerta && (
            <button
              type="button"
              onClick={() => onEliminar?.(alerta.id)}
              style={{
                padding: '2px 8px', fontSize: '10px', fontWeight: 600,
                background: 'transparent', color: '#6b7280',
                border: '1px solid #6b7280', borderRadius: '4px',
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              Eliminar
            </button>
          )}
        </div>
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
    frecuencia: `${a.numero_advertencia ? `${a.numero_advertencia}ª advertencia` : 'Registrado'} - ${formatFecha(a.fecha_registro)}`,
    detalle: a.motivo,
    accionSugerida: a.motivo_anulacion ?? 'Revisar causas y realizar seguimiento.',
  };
}

interface RendimientoTecnicoHallazgosProps {
  alertas?: AlertaItemBackend[];
  puedeGestionar?: boolean;
  onAnularAdvertencia?: (advertenciaId: number, motivo: string) => Promise<void>;
  anulandoAdvertencia?: boolean;
  onEliminarAdvertencia?: (advertenciaId: number) => Promise<void>;
  eliminandoAdvertencia?: boolean;
}

export const RendimientoTecnicoHallazgos: React.FC<RendimientoTecnicoHallazgosProps> = ({
  alertas,
  puedeGestionar,
  onAnularAdvertencia,
  anulandoAdvertencia,
  onEliminarAdvertencia,
  eliminandoAdvertencia,
}) => {
  const [anularId, setAnularId] = useState<number | null>(null);
  const [eliminarId, setEliminarId] = useState<number | null>(null);
  const [motivo, setMotivo] = useState('');
  const [modalError, setModalError] = useState('');

  // Build a map of alerta id → raw data
  const alertaMap = new Map<number, AlertaItemBackend>();
  if (alertas) {
    for (const a of alertas) {
      alertaMap.set(a.id, a);
    }
  }

  const hallazgos: HallazgoTecnico[] | null = alertas && alertas.length > 0
    ? alertas.map(mapAlertaAHallazgo)
    : null;

  const handleConfirmarAnular = async () => {
    if (!motivo.trim()) {
      setModalError('El motivo es obligatorio.');
      return;
    }
    if (anularId === null || !onAnularAdvertencia) return;
    setModalError('');
    try {
      await onAnularAdvertencia(anularId, motivo.trim());
      setAnularId(null);
      setMotivo('');
    } catch {
      setModalError('Error al anular la advertencia.');
    }
  };

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
            <HallazgoCard
              key={h.id}
              hallazgo={h}
              alerta={alertaMap.get(Number(h.id))}
              puedeGestionar={puedeGestionar}
              onAnular={setAnularId}
              onEliminar={setEliminarId}
            />
          ))}
        </div>
      )}

      {/* Modal eliminar */}
      {eliminarId !== null && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => { setEliminarId(null); }}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            fontFamily: 'var(--sans)',
            textAlign: 'center',
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 700, color: '#1E293B' }}>
              Eliminar hallazgo
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#64748B' }}>
              ¿Estás seguro de eliminar permanentemente este hallazgo?<br />
              Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setEliminarId(null)}
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
                onClick={async () => {
                  if (eliminarId === null || !onEliminarAdvertencia) return;
                  try {
                    await onEliminarAdvertencia(eliminarId);
                    setEliminarId(null);
                  } catch {}
                }}
                disabled={eliminandoAdvertencia}
                style={{
                  padding: '8px 16px', borderRadius: '6px',
                  border: 'none', background: eliminandoAdvertencia ? '#6b7280' : '#6b7280',
                  color: '#fff', fontSize: '13px', fontWeight: 600,
                  cursor: eliminandoAdvertencia ? 'not-allowed' : 'pointer',
                }}
              >
                {eliminandoAdvertencia ? 'Eliminando…' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal anular */}
      {anularId !== null && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => { setAnularId(null); setModalError(''); }}>
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
              Anular hallazgo
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#64748B' }}>
              Esta acción no se puede deshacer. Indique el motivo de la anulación.
            </p>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                Motivo *
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
                onClick={() => { setAnularId(null); setModalError(''); }}
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
                onClick={handleConfirmarAnular}
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
    </div>
  );
};
