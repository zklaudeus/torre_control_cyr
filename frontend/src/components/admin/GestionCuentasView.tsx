import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { DashboardLayout } from '../dashboard/DashboardLayout';
import type { UserRole } from '../../auth/AuthContext';
import {
  createAdminUser,
  getAdminUsers,
  getAdminZones,
  updateAdminUser,
  updateAdminUserStatus,
  type AdminUser,
  type AdminUserPayload,
} from '../../api/adminUsers.api';

const ROLES: UserRole[] = ['admin', 'superadmin', 'torre_control', 'supervisor', 'gerencia'];

type FormState = {
  id?: number;
  nombre: string;
  usuario: string;
  email: string;
  password_temporal: string;
  rol: UserRole;
  activo: boolean;
  zonas_asignadas: string[];
};

const emptyForm: FormState = {
  nombre: '',
  usuario: '',
  email: '',
  password_temporal: '',
  rol: 'supervisor',
  activo: true,
  zonas_asignadas: [],
};

interface GestionCuentasViewProps {
  activeSection: string;
  onChangeSection: (section: string) => void;
}

export const GestionCuentasView = ({ activeSection, onChangeSection }: GestionCuentasViewProps) => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [zones, setZones] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isEditing = form.id !== undefined;

  const sortedUsers = useMemo(
    () => [...users].sort((a, b) => a.usuario.localeCompare(b.usuario, 'es')),
    [users],
  );

  const load = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const [usersData, zonesData] = await Promise.all([getAdminUsers(), getAdminZones()]);
      setUsers(usersData);
      setZones(zonesData);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'No se pudo cargar la gestion de cuentas.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setForm(emptyForm);
    setMessage(null);
    setModalOpen(true);
  };

  const openEdit = (user: AdminUser) => {
    setForm({
      id: user.id,
      nombre: user.nombre,
      usuario: user.usuario,
      email: user.email ?? '',
      password_temporal: '',
      rol: user.rol,
      activo: user.activo,
      zonas_asignadas: user.zonas_asignadas.includes('TODAS') ? [] : user.zonas_asignadas,
    });
    setMessage(null);
    setModalOpen(true);
  };

  const setField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const toggleZone = (zone: string) => {
    setForm(prev => {
      const exists = prev.zonas_asignadas.includes(zone);
      return {
        ...prev,
        zonas_asignadas: exists
          ? prev.zonas_asignadas.filter(z => z !== zone)
          : [...prev.zonas_asignadas, zone].sort((a, b) => a.localeCompare(b, 'es')),
      };
    });
  };

  const validateForm = () => {
    if (!form.nombre.trim()) return 'Debe ingresar nombre.';
    if (!form.usuario.trim()) return 'Debe ingresar usuario o email de acceso.';
    if (!form.rol) return 'Debe seleccionar rol.';
    if (!isEditing && !form.password_temporal.trim()) return 'Debe ingresar contrasena temporal.';
    if (form.password_temporal.trim() && form.password_temporal.trim().length < 6) {
      return 'La contrasena temporal debe tener al menos 6 caracteres.';
    }
    if (form.rol === 'supervisor' && form.zonas_asignadas.length === 0) {
      return 'El supervisor debe tener al menos una zona asignada.';
    }
    return null;
  };

  const buildPayload = (): AdminUserPayload => ({
    nombre: form.nombre.trim(),
    usuario: form.usuario.trim(),
    email: form.email.trim() || null,
    rol: form.rol,
    activo: form.activo,
    zonas_asignadas: form.zonas_asignadas,
    ...(form.password_temporal.trim() ? { password_temporal: form.password_temporal.trim() } : {}),
  });

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const validation = validateForm();
    if (validation) {
      setMessage({ type: 'error', text: validation });
      return;
    }
    setSaving(true);
    try {
      if (isEditing && form.id !== undefined) {
        await updateAdminUser(form.id, buildPayload());
        setMessage({ type: 'success', text: 'Usuario actualizado correctamente.' });
      } else {
        await createAdminUser(buildPayload());
        setMessage({ type: 'success', text: 'Usuario creado correctamente.' });
      }
      setModalOpen(false);
      await load();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'No se pudo guardar el usuario.' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (user: AdminUser) => {
    setMessage(null);
    try {
      const updated = await updateAdminUserStatus(user.id, !user.activo);
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
      setMessage({ type: 'success', text: updated.activo ? 'Usuario activado.' : 'Usuario desactivado.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'No se pudo cambiar el estado.' });
    }
  };

  const badgeStyle = (active: boolean): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: '999px',
    padding: '3px 9px',
    fontSize: '12px',
    fontWeight: 700,
    color: active ? '#166534' : '#991B1B',
    background: active ? '#DCFCE7' : '#FEE2E2',
  });

  return (
    <DashboardLayout activeSection={activeSection} onChangeSection={onChangeSection}>
      <style>{`
        .accounts-page {
          display: flex;
          flex-direction: column;
          gap: 16px;
          min-width: 0;
        }
        .accounts-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .accounts-table-wrap {
          overflow-x: auto;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--bg-panel);
        }
        .accounts-table {
          width: 100%;
          min-width: 920px;
          border-collapse: collapse;
        }
        .accounts-table th,
        .accounts-table td {
          padding: 12px 14px;
          border-bottom: 1px solid var(--border);
          text-align: left;
          vertical-align: top;
          font-size: 13px;
        }
        .accounts-table th {
          color: var(--text-muted);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.7px;
          background: var(--bg-panel-sec);
        }
        .accounts-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .accounts-btn {
          border: 1px solid var(--border);
          border-radius: 7px;
          background: var(--bg-main);
          color: var(--text-main);
          padding: 7px 11px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }
        .accounts-btn.primary {
          background: var(--primary);
          border-color: var(--primary);
          color: white;
        }
        .accounts-message {
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 13px;
          border: 1px solid;
        }
        .accounts-message.success {
          border-color: #86EFAC;
          background: #F0FDF4;
          color: #166534;
        }
        .accounts-message.error {
          border-color: #FCA5A5;
          background: #FEF2F2;
          color: #991B1B;
        }
        .accounts-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(15, 23, 42, 0.55);
        }
        .accounts-modal {
          width: min(720px, 100%);
          max-height: calc(100vh - 40px);
          overflow-y: auto;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: var(--bg-panel);
          padding: 20px;
          box-shadow: 0 18px 60px rgba(15, 23, 42, 0.28);
        }
        .accounts-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }
        .accounts-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .accounts-field label {
          color: var(--text-muted);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.6px;
          text-transform: uppercase;
        }
        .accounts-field input,
        .accounts-field select {
          border: 1px solid var(--border);
          border-radius: 7px;
          background: var(--bg-main);
          color: var(--text-main);
          padding: 9px 10px;
          font-size: 13px;
        }
        .accounts-zone-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(145px, 1fr));
          gap: 8px;
        }
        .accounts-zone {
          display: flex;
          gap: 8px;
          align-items: center;
          border: 1px solid var(--border);
          border-radius: 7px;
          padding: 8px 10px;
          font-size: 13px;
          color: var(--text-main);
          background: var(--bg-main);
        }
        @media (max-width: 720px) {
          .accounts-form-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="accounts-page">
        <div className="accounts-header">
          <div>
            <h1 style={{ margin: 0, color: 'var(--text-main)', fontSize: '24px' }}>Gestion de cuentas</h1>
            <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: '13px' }}>
              Administra usuarios, roles, estado y acceso por zona operacional.
            </p>
          </div>
          <button className="accounts-btn primary" type="button" onClick={openCreate}>
            Nuevo usuario
          </button>
        </div>

        {message && <div className={`accounts-message ${message.type}`}>{message.text}</div>}

        <div className="accounts-table-wrap">
          <table className="accounts-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Nombre</th>
                <th>Rol</th>
                <th>Zonas</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6}>Cargando usuarios...</td></tr>
              ) : sortedUsers.length === 0 ? (
                <tr><td colSpan={6}>No hay usuarios registrados.</td></tr>
              ) : sortedUsers.map(user => (
                <tr key={user.id}>
                  <td>
                    <strong>{user.usuario}</strong>
                    {user.email && <div style={{ color: 'var(--text-muted)', marginTop: '3px' }}>{user.email}</div>}
                  </td>
                  <td>{user.nombre}</td>
                  <td>{user.rol}</td>
                  <td>{user.zonas_asignadas.length ? user.zonas_asignadas.join(', ') : 'Sin zonas'}</td>
                  <td><span style={badgeStyle(user.activo)}>{user.activo ? 'Activo' : 'Inactivo'}</span></td>
                  <td>
                    <div className="accounts-actions">
                      <button className="accounts-btn" type="button" onClick={() => openEdit(user)}>Editar</button>
                      <button className="accounts-btn" type="button" onClick={() => handleToggleStatus(user)}>
                        {user.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="accounts-modal-overlay" onClick={() => setModalOpen(false)}>
          <form className="accounts-modal" onSubmit={handleSubmit} onClick={event => event.stopPropagation()}>
            <div className="accounts-header" style={{ marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', color: 'var(--text-main)' }}>
                {isEditing ? 'Editar usuario' : 'Nuevo usuario'}
              </h2>
              <button className="accounts-btn" type="button" onClick={() => setModalOpen(false)}>Cerrar</button>
            </div>

            <div className="accounts-form-grid">
              <div className="accounts-field">
                <label>Nombre</label>
                <input value={form.nombre} onChange={event => setField('nombre', event.target.value)} />
              </div>
              <div className="accounts-field">
                <label>Usuario</label>
                <input value={form.usuario} onChange={event => setField('usuario', event.target.value)} />
              </div>
              <div className="accounts-field">
                <label>Email</label>
                <input value={form.email} onChange={event => setField('email', event.target.value)} />
              </div>
              <div className="accounts-field">
                <label>{isEditing ? 'Resetear contrasena' : 'Contrasena temporal'}</label>
                <input
                  type="password"
                  value={form.password_temporal}
                  placeholder={isEditing ? 'Dejar vacio para no cambiar' : ''}
                  onChange={event => setField('password_temporal', event.target.value)}
                />
              </div>
              <div className="accounts-field">
                <label>Rol</label>
                <select value={form.rol} onChange={event => setField('rol', event.target.value as UserRole)}>
                  {ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                </select>
              </div>
              <label className="accounts-zone" style={{ alignSelf: 'end' }}>
                <input
                  type="checkbox"
                  checked={form.activo}
                  onChange={event => setField('activo', event.target.checked)}
                />
                Activo
              </label>
            </div>

            <div style={{ marginTop: '16px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: '8px' }}>
                Zonas permitidas
              </div>
              <div className="accounts-zone-grid">
                {zones.map(zone => (
                  <label className="accounts-zone" key={zone}>
                    <input
                      type="checkbox"
                      checked={form.zonas_asignadas.includes(zone)}
                      onChange={() => toggleZone(zone)}
                    />
                    {zone}
                  </label>
                ))}
              </div>
              {form.rol !== 'supervisor' && (
                <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '8px' }}>
                  Los roles globales pueden operar o visualizar todas las zonas aunque no marques zonas especificas.
                </div>
              )}
            </div>

            <div className="accounts-actions" style={{ justifyContent: 'flex-end', marginTop: '18px' }}>
              <button className="accounts-btn" type="button" onClick={() => setModalOpen(false)}>Cancelar</button>
              <button className="accounts-btn primary" type="submit" disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
};
