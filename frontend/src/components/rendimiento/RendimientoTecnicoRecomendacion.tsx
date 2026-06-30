import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { apiClient } from '../../api/client';

interface Recomendacion {
  id: number;
  codigo_sap: string;
  comentario: string;
  usuario_id: number;
  autor_nombre: string | null;
  created_at: string;
  updated_at: string;
}

interface RendimientoTecnicoRecomendacionProps {
  codigoSap: string | null;
}

function formatFecha(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

async function apiRequest<T>(path: string, opts?: { method?: string; body?: unknown }): Promise<T> {
  const res = await apiClient.request<T>({
    url: path,
    method: opts?.method ?? 'GET',
    data: opts?.body,
  });
  return res.data;
}

function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const err = error as { response?: { data?: { detail?: unknown } }; message?: unknown };
    if (typeof err.response?.data?.detail === 'string') return err.response.data.detail;
    if (typeof err.message === 'string') return err.message;
  }
  return 'Error inesperado';
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
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const canEdit = user?.rol === 'supervisor' || user?.rol === 'torre_control' || user?.rol === 'admin' || user?.rol === 'superadmin';

  const cargar = useCallback(async () => {
    if (!codigoSap) { setRecomendaciones([]); return; }
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<Recomendacion[]>(`/api/productividad/tecnicos/${encodeURIComponent(codigoSap)}/recomendaciones`);
      setRecomendaciones(data || []);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [codigoSap]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => { void cargar(); }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [cargar]);

  const abrirFormNuevo = () => {
    setEditando(null);
    setComentario('');
    setShowForm(true);
  };

  const abrirFormEditar = (r: Recomendacion) => {
    setEditando(r);
    setComentario(r.comentario);
    setShowForm(true);
  };

  const cerrarForm = () => { setShowForm(false); setEditando(null); };

  const guardar = async () => {
    if (!comentario.trim() || !codigoSap) return;
    setSaving(true);
    try {
      if (editando) {
        await apiRequest(`/api/productividad/tecnicos/recomendaciones/${editando.id}`, {
          method: 'PUT',
          body: { comentario },
        });
      } else {
        await apiRequest(`/api/productividad/tecnicos/${encodeURIComponent(codigoSap)}/recomendaciones`, {
          method: 'POST',
          body: { comentario },
        });
      }
      cerrarForm();
      await cargar();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const eliminar = async (id: number) => {
    if (!window.confirm('¿Eliminar esta recomendación?')) return;
    setDeletingId(id);
    try {
      await apiRequest(`/api/productividad/tecnicos/recomendaciones/${id}`, { method: 'DELETE' });
      await cargar();
    } catch (e) {
      setError(getErrorMessage(e));
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
        const esAutor = String(r.usuario_id) === String(user?.id);
        const puedeEditar = canEdit && (esAutor || user?.rol === 'admin' || user?.rol === 'superadmin' || user?.rol === 'torre_control');

        return (
          <div key={r.id} style={{ background: 'var(--bg-panel-sec)', border: '1px solid var(--border)', borderRadius: '8px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {puedeEditar && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                <button onClick={() => abrirFormEditar(r)} style={{ ...btnStyle('ghost'), padding: '3px 8px', fontSize: '11px', border: '1px solid var(--border)', borderRadius: '4px' }}>
                  Editar
                </button>
                <button onClick={() => eliminar(r.id)} disabled={deletingId === r.id} style={{ ...btnStyle('danger'), padding: '3px 8px', fontSize: '11px', opacity: deletingId === r.id ? 0.5 : 1 }}>
                  {deletingId === r.id ? '…' : 'Eliminar'}
                </button>
              </div>
            )}

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
