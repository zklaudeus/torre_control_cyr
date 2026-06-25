import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || '';

interface Recomendacion {
  id: number;
  codigo_sap: string;
  comentario: string;
  prioridad: 'ALTA' | 'MEDIA' | 'BAJA';
  estado_accion: 'PENDIENTE' | 'EN_CURSO' | 'COMPLETADO' | 'CANCELADO';
  usuario_id: number;
  autor_nombre: string | null;
  created_at: string;
  updated_at: string;
}

interface RendimientoTecnicoRecomendacionProps {
  codigoSap: string | null;
}

const PRIORIDAD_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  ALTA:  { label: 'Alta',  color: '#DC2626', bg: '#FEE2E2', border: '#FECACA' },
  MEDIA: { label: 'Media', color: '#D97706', bg: '#FEF3C7', border: '#FDE68A' },
  BAJA:  { label: 'Baja',  color: '#2563EB', bg: '#DBEAFE', border: '#BFDBFE' },
};

const ESTADO_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PENDIENTE:  { label: 'Pendiente',  color: '#6B7280', bg: '#F3F4F6' },
  EN_CURSO:   { label: 'En Curso',   color: '#D97706', bg: '#FEF3C7' },
  COMPLETADO: { label: 'Completado', color: '#059669', bg: '#D1FAE5' },
  CANCELADO:  { label: 'Cancelado',  color: '#9CA3AF', bg: '#F9FAFB' },
};

function formatFecha(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

async function apiFetch(path: string, opts?: RequestInit) {
  const token = localStorage.getItem('access_token');
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(opts?.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Error ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const RendimientoTecnicoRecomendacion: React.FC<RendimientoTecnicoRecomendacionProps> = ({ codigoSap }) => {
  const { user } = useAuth();
  const [recomendaciones, setRecomendaciones] = useState<Recomendacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form nueva / edición
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Recomendacion | null>(null);
  const [comentario, setComentario] = useState('');
  const [prioridad, setPrioridad] = useState<'ALTA' | 'MEDIA' | 'BAJA'>('MEDIA');
  const [estadoAccion, setEstadoAccion] = useState<'PENDIENTE' | 'EN_CURSO' | 'COMPLETADO' | 'CANCELADO'>('PENDIENTE');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const canEdit = user?.rol === 'supervisor' || user?.rol === 'torre_control' || user?.rol === 'admin' || user?.rol === 'superadmin';

  const cargar = useCallback(async () => {
    if (!codigoSap) { setRecomendaciones([]); return; }
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch(`/api/productividad/tecnicos/${codigoSap}/recomendaciones`);
      setRecomendaciones(data || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [codigoSap]);

  useEffect(() => { cargar(); }, [cargar]);

  const abrirFormNuevo = () => {
    setEditando(null);
    setComentario('');
    setPrioridad('MEDIA');
    setEstadoAccion('PENDIENTE');
    setShowForm(true);
  };

  const abrirFormEditar = (r: Recomendacion) => {
    setEditando(r);
    setComentario(r.comentario);
    setPrioridad(r.prioridad);
    setEstadoAccion(r.estado_accion);
    setShowForm(true);
  };

  const cerrarForm = () => { setShowForm(false); setEditando(null); };

  const guardar = async () => {
    if (!comentario.trim() || !codigoSap) return;
    setSaving(true);
    try {
      if (editando) {
        await apiFetch(`/api/productividad/tecnicos/recomendaciones/${editando.id}`, {
          method: 'PUT',
          body: JSON.stringify({ comentario, prioridad, estado_accion: estadoAccion }),
        });
      } else {
        await apiFetch(`/api/productividad/tecnicos/${codigoSap}/recomendaciones`, {
          method: 'POST',
          body: JSON.stringify({ comentario, prioridad, estado_accion: estadoAccion }),
        });
      }
      cerrarForm();
      await cargar();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const eliminar = async (id: number) => {
    if (!window.confirm('¿Eliminar esta recomendación?')) return;
    setDeletingId(id);
    try {
      await apiFetch(`/api/productividad/tecnicos/recomendaciones/${id}`, { method: 'DELETE' });
      await cargar();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setDeletingId(null);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 10px', background: 'var(--bg-panel)',
    border: '1px solid var(--border)', borderRadius: '6px',
    color: 'var(--text-main)', fontSize: '13px', fontFamily: 'var(--sans)',
    outline: 'none', boxSizing: 'border-box',
  };
  const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' };
  const btnStyle = (variant: 'primary' | 'danger' | 'ghost'): React.CSSProperties => ({
    padding: '6px 14px', borderRadius: '5px', border: 'none',
    fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)',
    background: variant === 'primary' ? 'var(--primary)' : variant === 'danger' ? '#DC2626' : 'transparent',
    color: variant === 'ghost' ? 'var(--text-muted)' : '#fff',
    transition: 'opacity 0.15s',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '12px' }}>
      {/* Encabezado */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '3px', height: '18px', borderRadius: '2px', background: 'var(--primary)', display: 'inline-block' }} />
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Recomendaciones del Supervisor
          </span>
        </div>
        {canEdit && codigoSap && !showForm && (
          <button onClick={abrirFormNuevo} style={btnStyle('primary')}>
            + Agregar
          </button>
        )}
      </div>

      {/* Formulario crear / editar */}
      {showForm && (
        <div style={{ background: 'var(--bg-panel-sec)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '2px' }}>
            {editando ? 'Editar recomendación' : 'Nueva recomendación'}
          </div>
          <textarea
            value={comentario}
            onChange={e => setComentario(e.target.value)}
            rows={3}
            placeholder="Escribe la recomendación o comentario..."
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
          />
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 140px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Prioridad</label>
              <select value={prioridad} onChange={e => setPrioridad(e.target.value as any)} style={selectStyle}>
                <option value="ALTA">Alta</option>
                <option value="MEDIA">Media</option>
                <option value="BAJA">Baja</option>
              </select>
            </div>
            <div style={{ flex: '1 1 160px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Estado</label>
              <select value={estadoAccion} onChange={e => setEstadoAccion(e.target.value as any)} style={selectStyle}>
                <option value="PENDIENTE">Pendiente</option>
                <option value="EN_CURSO">En Curso</option>
                <option value="COMPLETADO">Completado</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button onClick={cerrarForm} style={btnStyle('ghost')}>Cancelar</button>
            <button onClick={guardar} disabled={saving || !comentario.trim()} style={{ ...btnStyle('primary'), opacity: saving || !comentario.trim() ? 0.5 : 1 }}>
              {saving ? 'Guardando…' : editando ? 'Guardar cambios' : 'Crear'}
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ padding: '8px 12px', background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: '6px', color: '#DC2626', fontSize: '12px' }}>
          {error}
        </div>
      )}

      {/* Sin técnico seleccionado */}
      {!codigoSap && (
        <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', border: '1px dashed var(--border)', borderRadius: '8px' }}>
          Selecciona un técnico para ver sus recomendaciones.
        </div>
      )}

      {/* Cargando */}
      {loading && (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>Cargando…</div>
      )}

      {/* Lista vacía */}
      {!loading && codigoSap && recomendaciones.length === 0 && !showForm && (
        <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', border: '1px dashed var(--border)', borderRadius: '8px' }}>
          Sin recomendaciones registradas.{canEdit ? ' Usa "+ Agregar" para crear la primera.' : ''}
        </div>
      )}

      {/* Lista de recomendaciones */}
      {!loading && recomendaciones.map(r => {
        const pCfg = PRIORIDAD_CONFIG[r.prioridad] || PRIORIDAD_CONFIG.MEDIA;
        const eCfg = ESTADO_CONFIG[r.estado_accion] || ESTADO_CONFIG.PENDIENTE;
        const esAutor = r.usuario_id === (user as any)?.id;
        const puedeEditar = canEdit && (esAutor || user?.rol === 'admin' || user?.rol === 'superadmin' || user?.rol === 'torre_control');

        return (
          <div key={r.id} style={{ background: 'var(--bg-panel-sec)', border: '1px solid var(--border)', borderRadius: '8px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '10px', color: pCfg.color, background: pCfg.bg, border: `1px solid ${pCfg.border}` }}>
                  {pCfg.label}
                </span>
                <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '10px', color: eCfg.color, background: eCfg.bg }}>
                  {eCfg.label}
                </span>
              </div>
              {puedeEditar && (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => abrirFormEditar(r)} style={{ ...btnStyle('ghost'), padding: '3px 8px', fontSize: '11px', border: '1px solid var(--border)', borderRadius: '4px' }}>
                    Editar
                  </button>
                  <button onClick={() => eliminar(r.id)} disabled={deletingId === r.id} style={{ ...btnStyle('danger'), padding: '3px 8px', fontSize: '11px', opacity: deletingId === r.id ? 0.5 : 1 }}>
                    {deletingId === r.id ? '…' : 'Eliminar'}
                  </button>
                </div>
              )}
            </div>

            {/* Texto */}
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-main)', lineHeight: 1.6, borderLeft: '3px solid var(--secondary)', paddingLeft: '12px' }}>
              {r.comentario}
            </p>

            {/* Meta */}
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <span>Por: <strong style={{ color: 'var(--text-main)' }}>{r.autor_nombre || `#${r.usuario_id}`}</strong></span>
              <span>•</span>
              <span>{formatFecha(r.created_at)}</span>
              {r.created_at !== r.updated_at && <span style={{ fontStyle: 'italic' }}>(editado)</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
};
