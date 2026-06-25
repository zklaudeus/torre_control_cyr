import React, { useState } from 'react';
import type { SemaforoTecnico, EstadoSemaforo } from '../../types/rendimientoTecnico.types';
import { CONFIG_SEMAFOROS } from '../../data/rendimientoTecnico.config';
import { updateSemaforoTecnico } from '../../api/productividad.api';

// ─── Mapeo de categorías backend → título amigable ─────────────────────────────

const CATEGORIA_LABELS: Record<string, string> = {
  SEGURIDAD: 'Seguridad',
  CALIDAD_CORTE: 'Calidad del corte',
  CUMPLIMIENTO_PROTOCOLOS: 'Cumplimiento de protocolos',
  COMUNICACION_CLIENTE: 'Comunicación con cliente',
  DISCIPLINA_OPERACIONAL: 'Disciplina operacional',
  ATENCION_CLIENTE: 'Atención al cliente',
};

const ESTADOS_OPTIONS: EstadoSemaforo[] = [
  'SIN_EVALUACION', 'CRITICO', 'ESTABLE', 'ALTO_DESEMPENO'
];

// ─── Modal de Edición ──────────────────────────────────────────────────────────

interface EditModalProps {
  semaforo: SemaforoTecnico;
  codigoSap: string;
  onClose: () => void;
  onSaved: (updated: SemaforoTecnico) => void;
}

const EditModal: React.FC<EditModalProps> = ({ semaforo, codigoSap, onClose, onSaved }) => {
  const [estado, setEstado] = useState<EstadoSemaforo>(semaforo.estado);
  const [descripcion, setDescripcion] = useState(semaforo.descripcion ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const updated = await updateSemaforoTecnico(codigoSap, semaforo.categoria, {
        estado,
        descripcion: descripcion.trim() || null,
      });
      onSaved({
        categoria: updated.categoria,
        estado: updated.estado as EstadoSemaforo,
        descripcion: updated.descripcion,
        updated_at: updated.updated_at,
        usuario_actualiza_id: updated.usuario_actualiza_id,
      });
    } catch {
      setError('Error al guardar. Inténtelo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const titulo = CATEGORIA_LABELS[semaforo.categoria] ?? semaforo.categoria;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.5)', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(4px)',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: 'var(--bg-panel)',
        border: '1px solid var(--border)',
        borderRadius: '14px',
        padding: '28px',
        width: '100%',
        maxWidth: '440px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
              Editar semáforo
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {titulo}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', color: 'var(--text-muted)',
              cursor: 'pointer', fontSize: '20px', lineHeight: 1,
              padding: '4px 8px', borderRadius: '6px',
            }}
          >✕</button>
        </div>

        {/* Estado */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.7px', display: 'block', marginBottom: '8px' }}>
            Estado
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {ESTADOS_OPTIONS.map(e => {
              const cfg = CONFIG_SEMAFOROS[e];
              const selected = estado === e;
              return (
                <button
                  key={e}
                  onClick={() => setEstado(e)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: `1.5px solid ${selected ? cfg.color : 'var(--border)'}`,
                    background: selected ? cfg.bg : 'transparent',
                    color: selected ? cfg.color : 'var(--text-muted)',
                    fontSize: '12px',
                    fontWeight: selected ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    textAlign: 'center',
                  }}
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Descripción */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.7px', display: 'block', marginBottom: '8px' }}>
            Descripción (opcional)
          </label>
          <textarea
            value={descripcion}
            onChange={e => setDescripcion(e.target.value)}
            placeholder="Observaciones de Torre de Control..."
            rows={3}
            style={{
              width: '100%',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontSize: '13px',
              padding: '10px 12px',
              resize: 'vertical',
              boxSizing: 'border-box',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
        </div>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '6px', padding: '8px 12px', marginBottom: '12px',
            color: '#ef4444', fontSize: '12px',
          }}>
            {error}
          </div>
        )}

        {/* Botones */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: '1px solid var(--border)',
              color: 'var(--text-muted)', borderRadius: '8px',
              padding: '8px 18px', cursor: 'pointer', fontSize: '13px',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: 'var(--primary)', border: 'none',
              color: '#fff', borderRadius: '8px',
              padding: '8px 20px', cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '13px', fontWeight: 700,
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Tarjeta de Semáforo ───────────────────────────────────────────────────────

interface SemaforoCardProps {
  semaforo: SemaforoTecnico;
  canEdit: boolean;
  codigoSap: string;
  onUpdated: (updated: SemaforoTecnico) => void;
}

const SemaforoCard: React.FC<SemaforoCardProps> = ({ semaforo, canEdit, codigoSap, onUpdated }) => {
  const [showModal, setShowModal] = useState(false);
  const cfg = CONFIG_SEMAFOROS[semaforo.estado] ?? CONFIG_SEMAFOROS['SIN_EVALUACION'];
  const titulo = CATEGORIA_LABELS[semaforo.categoria] ?? semaforo.categoria;
  const sinEvaluacion = semaforo.estado === 'SIN_EVALUACION';

  const formatDate = (iso: string | null) => {
    if (!iso) return null;
    try {
      return new Date(iso).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return iso;
    }
  };

  return (
    <>
      <div
        style={{
          background: 'var(--bg-panel)',
          border: `1px solid ${cfg.border}`,
          borderRadius: '10px',
          padding: '18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          transition: 'transform 0.15s, box-shadow 0.15s',
          position: 'relative',
          opacity: sinEvaluacion ? 0.75 : 1,
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
          (e.currentTarget as HTMLDivElement).style.boxShadow = `0 6px 20px rgba(0,0,0,0.2)${cfg.glow !== 'none' ? ', ' + cfg.glow : ''}`;
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.12)';
        }}
      >
        {/* Encabezado: título + botón editar */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{
            fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.7px', lineHeight: 1.3,
          }}>
            {titulo}
          </div>
          {canEdit && (
            <button
              onClick={() => setShowModal(true)}
              title="Editar semáforo"
              style={{
                background: 'none', border: '1px solid var(--border)',
                borderRadius: '6px', color: 'var(--text-muted)',
                cursor: 'pointer', fontSize: '12px', padding: '2px 8px',
                flexShrink: 0, transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--primary)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--primary)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
              }}
            >
              ✎ Editar
            </button>
          )}
        </div>

        {/* Indicador circular + estado */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '50%',
            background: cfg.bg, border: `2px solid ${cfg.color}`,
            boxShadow: cfg.glow !== 'none' ? cfg.glow : undefined,
            flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: cfg.color, opacity: 0.9 }} />
          </div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: cfg.color, lineHeight: 1.2 }}>
            {cfg.label}
          </div>
        </div>

        {/* Descripción */}
        {semaforo.descripcion && (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            {semaforo.descripcion}
          </div>
        )}

        {/* Última evaluación */}
        {semaforo.updated_at && (
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', opacity: 0.6, marginTop: 'auto' }}>
            Última eval.: {formatDate(semaforo.updated_at)}
          </div>
        )}
      </div>

      {showModal && (
        <EditModal
          semaforo={semaforo}
          codigoSap={codigoSap}
          onClose={() => setShowModal(false)}
          onSaved={updated => {
            onUpdated(updated);
            setShowModal(false);
          }}
        />
      )}
    </>
  );
};

// ─── Componente Principal ──────────────────────────────────────────────────────

interface RendimientoTecnicoSemaforosProps {
  semaforos: SemaforoTecnico[];
  codigoSap: string;
  canEdit: boolean;
  loading?: boolean;
  onUpdated: (updated: SemaforoTecnico) => void;
}

export const RendimientoTecnicoSemaforos: React.FC<RendimientoTecnicoSemaforosProps> = ({
  semaforos,
  codigoSap,
  canEdit,
  loading = false,
  onUpdated,
}) => {
  return (
    <div>
      <style>{`
        .semaforos-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }
        @media (max-width: 1100px) {
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

      {/* Encabezado */}
      <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ width: '3px', height: '18px', borderRadius: '2px', background: 'var(--primary)', display: 'inline-block', flexShrink: 0 }} />
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Semáforos Operacionales
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', paddingLeft: '11px' }}>
            Evaluación cualitativa asignada por Torre de Control.
          </p>
        </div>
        {canEdit && (
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', opacity: 0.7 }}>
            Modo edición activo
          </span>
        )}
      </div>

      {/* Grid de tarjetas */}
      {loading ? (
        <div style={{
          padding: '40px 20px', textAlign: 'center',
          color: 'var(--text-muted)', fontSize: '13px',
          background: 'var(--bg-panel)', border: '1px dashed var(--border)', borderRadius: '8px',
        }}>
          Cargando semáforos…
        </div>
      ) : (
        <div className="semaforos-grid">
          {semaforos.map(s => (
            <SemaforoCard
              key={s.categoria}
              semaforo={s}
              canEdit={canEdit}
              codigoSap={codigoSap}
              onUpdated={onUpdated}
            />
          ))}
        </div>
      )}
    </div>
  );
};
