import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { BitacoraRow, ResumenZona } from './SupervisorBitacoraLogic';
import { 
  validarBitacoraCompleta, 
  validarFila,
  calcularResumenPorZona, 
  SAP_CUENTA_TEMP, 
  COMUNA_ZONA_TEMP,
  obtenerZonaPorComuna,
  obtenerSapPorCuenta
} from './SupervisorBitacoraLogic';
import { useAuth } from '../../auth/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const fetchAPI = async (url: string, options?: RequestInit) => {
  const res = await fetch(`${API_BASE}/api${url}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers }
  });
  if (!res.ok) throw new Error(`Error: ${res.status}`);
  return res.json();
};

interface SupervisorBitacoraViewProps {
  fechaOperacional: string;
  onChangeFecha: (fecha: string) => void;
  activeSection: string;
  onChangeSection: (section: string) => void;
}

const K = {
  primary:     '#0B7BFF',
  secondary:   '#08E5FF',
  tertiary:    '#0A192F',
  tertiaryMid: '#102240',
  neutral:     '#F8FAFC',
  mutedText:   '#64849F',
  border:      '#1C3454',
  error:       '#FF4B4B'
};

const initialForm: Omit<BitacoraRow, 'id' | '_errors'> = {
  patente: '',
  usuarioSap: '',
  cuenta: '',
  brigada: '',
  pareja: '',
  comuna: '',
  carga: '0',
  reconexiones: '0',
  observacion: '',
  estado: 'Operativa',
  tipoBrigada: 'PXQ'
};

const LOCAL_STORAGE_KEY = 'bitacora_programmed_values';

const saveProgrammedDataToStorage = (fecha: string, sap: string, data: { carga: string, reconexiones: string }) => {
  try {
    const existing = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
    existing[`${fecha}_${sap}`] = data;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existing));
  } catch (e) {
    console.error('Error saving to localStorage', e);
  }
};

const getProgrammedDataFromStorage = (fecha: string, sap: string) => {
  try {
    const existing = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
    return existing[`${fecha}_${sap}`] || null;
  } catch (e) {
    return null;
  }
};

export const SupervisorBitacoraView = ({
  fechaOperacional,
  onChangeFecha
}: SupervisorBitacoraViewProps) => {
  const { user } = useAuth();
  const [rows, setRows] = useState<BitacoraRow[]>([]);
  const [form, setForm] = useState(initialForm);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof BitacoraRow, string>>>({});
  const [asignacionCarga, setAsignacionCarga] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  const fetchBrigadas = async () => {
    try {
      const data: any[] = await fetchAPI(`/brigadas-dia/?fecha=${fechaOperacional}`);
      const mapped: BitacoraRow[] = data.map(b => ({
        id: String(b.id),
        patente: b.patente || '',
        usuarioSap: b.codigo_sap || '',
        cuenta: '',
        brigada: b.usuario || '', // using usuario as brigada
        pareja: '',
        comuna: b.zona || '', // using zona as comuna
        carga: '0', // Supervisor local programmed value
        reconexiones: '0', // Supervisor local programmed value
        observacion: b.observacion_brigada || '',
        estado: b.estado_brigada || 'Operativa',
        tipoBrigada: b.tipo_brigada || 'PXQ'
      }));
      // Assign missing 'cuenta' dynamically using SAP
      mapped.forEach(m => {
        const matchingSAP = SAP_CUENTA_TEMP.find(s => s.sap === m.usuarioSap);
        if (matchingSAP) m.cuenta = matchingSAP.cuenta;
      });
      const filtered = mapped.filter(m => {
        const zona = obtenerZonaPorComuna(m.comuna);
        const isAdmin = user?.rol === 'admin' || user?.rol === 'superadmin';
        const hasAll = user?.zonasAsignadas?.includes('TODAS');
        return isAdmin || hasAll || !user?.zonasAsignadas || (zona && user.zonasAsignadas.includes(zona));
      });
      setRows(prevRows => {
        return filtered.map(m => {
          const prog = getProgrammedDataFromStorage(fechaOperacional, m.usuarioSap);
          if (prog) {
            return {
              ...m,
              carga: prog.carga,
              reconexiones: prog.reconexiones
            };
          }
          const existing = prevRows.find(r => r.id === m.id);
          if (existing) {
            return {
              ...m,
              carga: existing.carga,
              reconexiones: existing.reconexiones
            };
          }
          return m;
        });
      });
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Error al cargar brigadas desde servidor.', type: 'error' });
    }
  };

  const fetchProgramacionZona = async () => {
    try {
      const data: any[] = await fetchAPI(`/programacion-zona/?fecha=${fechaOperacional}`);
      const cargas: Record<string, number> = {};
      data.forEach(p => {
        if (p.asignacion_carga !== undefined && p.asignacion_carga !== null) {
          cargas[p.zona] = Number(p.asignacion_carga);
        }
      });
      setAsignacionCarga(cargas);
    } catch (err) {
      console.error('Error al cargar programación de zona:', err);
    }
  };

  useEffect(() => {
    fetchBrigadas();
    fetchProgramacionZona();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechaOperacional]);

  const handleFormChange = (field: keyof typeof form, value: string) => {
    setForm(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'cuenta') {
        updated.usuarioSap = obtenerSapPorCuenta(value);
      }
      return updated;
    });
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleIncrement = (field: 'carga' | 'reconexiones', delta: number) => {
    setForm(prev => {
      const current = parseInt(prev[field], 10) || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [field]: next.toString() };
    });
  };

  const guardarFila = async () => {
    if (!user) {
      setMessage({ text: 'Error: No hay sesión activa de usuario.', type: 'error' });
      return;
    }

    const tempRow = { ...form, id: 'temp' } as BitacoraRow;
    const allSaps = editId ? rows.filter(r => r.id !== editId).map(r => r.usuarioSap) : rows.map(r => r.usuarioSap);
    const errors = validarFila(tempRow, allSaps);
    
    const zonaComuna = obtenerZonaPorComuna(form.comuna);
    const hasAll = user.zonasAsignadas?.includes('TODAS');
    if (user.rol === 'supervisor' && !hasAll && user.zonasAsignadas && zonaComuna && !user.zonasAsignadas.includes(zonaComuna)) {
      errors.comuna = `La comuna no pertenece a sus zonas asignadas (${user.zonasAsignadas.join(', ')}).`;
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSaving(true);
    setMessage(null);
    try {
      const payload: any = {
        fecha_operacional: fechaOperacional,
        zona: form.comuna,
        codigo_sap: form.usuarioSap,
        patente: form.patente,
        usuario: form.brigada,
        tipo_brigada: form.tipoBrigada,
        estado_brigada: form.estado,
        observacion_brigada: form.observacion,
      };

      saveProgrammedDataToStorage(fechaOperacional, form.usuarioSap, {
        carga: form.carga,
        reconexiones: form.reconexiones
      });

      if (!editId) {
        payload.hora_primer_movimiento = null;
        payload.primer_corte = null;
        payload.ultimo_corte = null;
        payload.acum_09 = 0;
        payload.acum_10 = 0;
        payload.acum_11 = 0;
        payload.acum_12 = 0;
        payload.acum_13 = 0;
        payload.acum_14 = 0;
        payload.visita_fallida = 0;
        payload.reconexiones_ejecutadas = 0;
        payload.corte_en_poste = 0;
        payload.corte_en_empalme = 0;
      }

      if (editId) {
        await fetchAPI(`/brigadas-dia/${editId}`, {
          method: 'PATCH', // Changed to PATCH to avoid overwriting missing fields if backend supports it, or it will just process as partial
          body: JSON.stringify(payload)
        }).catch(async (err) => {
           // Fallback to PUT if PATCH is not supported, hoping backend ignores missing fields
           await fetchAPI(`/brigadas-dia/${editId}`, {
             method: 'PUT',
             body: JSON.stringify(payload)
           });
        });
        setMessage({ text: 'Brigada actualizada en la BD.', type: 'success' });
      } else {
        await fetchAPI(`/brigadas-dia/`, {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        setMessage({ text: 'Brigada guardada en la BD.', type: 'success' });
      }

      setForm(initialForm);
      setEditId(null);
      setFormErrors({});
      await fetchBrigadas();
    } catch (err: any) {
      console.error(err);
      setMessage({ text: `Error al guardar: ${err.message}`, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const eliminarFila = async (id: string) => {
    if (window.confirm('¿Eliminar esta brigada de la base de datos?')) {
      try {
        await fetchAPI(`/brigadas-dia/${id}`, { method: 'DELETE' });
        setMessage({ text: 'Brigada eliminada de la BD.', type: 'success' });
        await fetchBrigadas();
      } catch (err: any) {
        console.error(err);
        setMessage({ text: `Error al eliminar: ${err.message}`, type: 'error' });
      }
    }
  };

  const editarFila = (id: string) => {
    const row = rows.find(r => r.id === id);
    if (row) {
      setForm({ ...row });
      setEditId(id);
      setMessage(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const limpiarFormulario = () => {
    setForm(initialForm);
    setEditId(null);
    setFormErrors({});
  };

  const actualizarBitacora = async () => {
    if (rows.length === 0) {
      setMessage({ text: 'No hay brigadas registradas para actualizar el KPI.', type: 'error' });
      return;
    }

    setIsSaving(true);
    setMessage({ text: 'Subiendo...', type: 'success' });

    try {
      const programacionBulkData = Object.values(resumen).map(r => ({
        zona: r.zona,
        corte_programado: r.corteTotal,
        reconexiones_programadas: r.reconexionesTotal,
        asignacion_carga: asignacionCarga[r.zona] || 0,
        tipo_brigada: 'PXQ' 
      }));

      await fetchAPI(`/programacion-zona/bulk`, { 
        method: 'POST', 
        body: JSON.stringify({
          fecha_operacional: fechaOperacional,
          items: programacionBulkData
        }) 
      });

      setMessage({ text: 'KPIs zonales actualizados exitosamente en Torre de Control.', type: 'success' });
    } catch (err: any) {
      console.error(err);
      setMessage({ text: `Error al actualizar: ${err.message}`, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const resumen = useMemo(() => {
    const calc = calcularResumenPorZona(rows);
    if (!user?.zonasAsignadas) return calc;
    
    const completo: Record<string, ResumenZona> = {};
    const isAdminOrAll = user.rol === 'admin' || user.rol === 'superadmin' || user.zonasAsignadas.includes('TODAS');

    if (isAdminOrAll) {
      // Show all predefined zones for Superadmin/TODAS
      const allZones = Array.from(new Set(COMUNA_ZONA_TEMP.map(c => c.zona)));
      allZones.forEach(z => {
        completo[z] = calc[z] || { zona: z, totalBrigadas: 0, corteTotal: 0, reconexionesTotal: 0, totalEnBandeja: 0 };
      });
    } else {
      user.zonasAsignadas.forEach(z => {
        completo[z] = calc[z] || { zona: z, totalBrigadas: 0, corteTotal: 0, reconexionesTotal: 0, totalEnBandeja: 0 };
      });
    }
    return completo;
  }, [rows, user]);

  const cuentasDisponibles = useMemo(() => {
    const usadas = rows
      .filter(r => r.id !== editId)
      .map(r => r.cuenta)
      .filter(Boolean);
      
    const todas = Array.from(new Set(SAP_CUENTA_TEMP.map(s => s.cuenta))).sort();
    return todas.filter(c => !usadas.includes(c));
  }, [rows, editId]);

  return (
    <div style={{ padding: '2rem', height: '100%', overflowY: 'auto' }}>
      {/* 1. Encabezado Superior */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: K.neutral }}>Bitácora Supervisor</h2>
          {user && (
            <div style={{ fontSize: '0.9rem', color: K.mutedText, marginTop: '0.25rem' }}>
              <span style={{ color: K.secondary, fontWeight: 600 }}>{user.nombre}</span> — Zonas: {user.zonasAsignadas?.join(', ')}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input 
            type="date" 
            value={fechaOperacional}
            onChange={(e) => onChangeFecha(e.target.value)}
            style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: `1px solid ${K.border}`, background: K.tertiaryMid, color: K.neutral }}
          />
          <button onClick={actualizarBitacora} disabled={isSaving} style={{ padding: '0.6rem 1.5rem', background: K.primary, color: '#fff', border: 'none', borderRadius: '24px', cursor: isSaving ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
            {isSaving ? 'Subiendo...' : 'Actualizar bitácora del día de hoy'}
          </button>
        </div>
      </div>

      {message && (
        <div style={{ 
          padding: '1rem', marginBottom: '1.5rem', borderRadius: '8px', 
          backgroundColor: message.type === 'error' ? `${K.error}33` : `${K.primary}33`,
          border: `1px solid ${message.type === 'error' ? K.error : K.primary}`,
          color: message.type === 'error' ? K.error : K.secondary
        }}>
          {message.text}
        </div>
      )}

      {/* 2. Paneles KPI por zona */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {Object.values(resumen).map(r => (
            <div key={r.zona} style={{ background: K.tertiaryMid, border: `1px solid ${K.border}`, borderRadius: '12px', padding: '1.25rem' }}>
              <h4 style={{ margin: '0 0 1rem', color: K.secondary, fontSize: '1.1rem' }}>Zona: {r.zona}</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: K.mutedText }}>Brigadas:</span>
                  <span style={{ color: K.neutral, fontWeight: 600 }}>{r.totalBrigadas}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: K.mutedText }}>Corte Programado:</span>
                  <span style={{ color: K.neutral, fontWeight: 600 }}>{r.corteTotal}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: K.mutedText }}>Rec. Programadas:</span>
                  <span style={{ color: K.neutral, fontWeight: 600 }}>{r.reconexionesTotal}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: `1px solid ${K.border}` }}>
                  <span style={{ color: K.mutedText, fontWeight: 600 }}>Asign. Carga Zona:</span>
                  <input 
                    type="number" 
                    min="0"
                    value={asignacionCarga[r.zona] ?? ''}
                    onChange={(e) => setAsignacionCarga(prev => ({ ...prev, [r.zona]: parseInt(e.target.value, 10) || 0 }))}
                    style={{ width: '80px', padding: '0.4rem', borderRadius: '6px', border: `1px solid ${K.border}`, background: K.tertiary, color: K.neutral, textAlign: 'center', fontWeight: 600 }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Formulario de ingreso de una sola brigada */}
      <div style={{ background: K.tertiaryMid, borderRadius: '12px', padding: '1.5rem', border: `1px solid ${K.border}`, marginBottom: '2rem' }}>
        <h3 style={{ margin: '0 0 1.5rem', color: K.neutral, fontSize: '1.2rem' }}>
          {editId ? 'Editar Brigada' : 'Ingresar Brigada'}
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <FormGroup label="Patente" error={formErrors.patente}>
            <input value={form.patente} onChange={e => handleFormChange('patente', e.target.value)} placeholder="Ej: VSXK79" style={inputStyle(!!formErrors.patente)} />
          </FormGroup>
          
          <FormGroup label="Cuenta / Proyecto" error={formErrors.cuenta}>
            <select value={form.cuenta} onChange={e => handleFormChange('cuenta', e.target.value)} style={inputStyle(!!formErrors.cuenta)}>
              <option value="">Seleccione...</option>
              {cuentasDisponibles.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </FormGroup>

          <FormGroup label="Usuario SAP" error={formErrors.usuarioSap}>
            <input value={form.usuarioSap} readOnly placeholder="Autocompletado" style={{ ...inputStyle(!!formErrors.usuarioSap), opacity: 0.7, background: K.tertiary }} title="Se completa al seleccionar la Cuenta" />
          </FormGroup>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <FormGroup label="Brigada" error={formErrors.brigada}>
            <input value={form.brigada} onChange={e => handleFormChange('brigada', e.target.value)} placeholder="Nombre Brigada" style={inputStyle(!!formErrors.brigada)} />
          </FormGroup>
          
          <FormGroup label="Pareja" error={formErrors.pareja}>
            <input value={form.pareja} onChange={e => handleFormChange('pareja', e.target.value)} placeholder="Opcional" style={inputStyle(!!formErrors.pareja)} />
          </FormGroup>

          <FormGroup label="Comuna" error={formErrors.comuna}>
            <select value={form.comuna} onChange={e => handleFormChange('comuna', e.target.value)} style={inputStyle(!!formErrors.comuna)}>
              <option value="">Seleccione...</option>
              {COMUNA_ZONA_TEMP
                .filter(c => user?.rol === 'admin' || !user?.zonasAsignadas || user.zonasAsignadas.includes(c.zona))
                .map(c => (
                <option key={c.comuna} value={c.comuna}>{c.comuna} ({c.zona})</option>
              ))}
            </select>
          </FormGroup>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ background: K.tertiary, padding: '1rem', borderRadius: '8px', border: `1px solid ${K.border}` }}>
            <div style={{ fontSize: '0.75rem', color: K.mutedText, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem', fontWeight: 600 }}>Carga Operativa</div>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <FormGroup label="Cortes Prog." error={formErrors.carga}>
                <NumberStepper value={form.carga} onChange={(val) => handleFormChange('carga', val)} onIncrement={(d) => handleIncrement('carga', d)} hasError={!!formErrors.carga} />
              </FormGroup>
              <FormGroup label="Rec. Programadas" error={formErrors.reconexiones}>
                <NumberStepper value={form.reconexiones} onChange={(val) => handleFormChange('reconexiones', val)} onIncrement={(d) => handleIncrement('reconexiones', d)} hasError={!!formErrors.reconexiones} />
              </FormGroup>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <FormGroup label="Tipo Brigada">
                <select value={form.tipoBrigada} onChange={e => handleFormChange('tipoBrigada', e.target.value as any)} style={inputStyle(false)}>
                  <option value="PXQ">PXQ</option>
                  <option value="CF">CF</option>
                </select>
              </FormGroup>
              <FormGroup label="Estado">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', ...inputStyle(false) }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: form.estado === 'Operativa' ? K.primary : K.error }}></span>
                  <select value={form.estado} onChange={e => handleFormChange('estado', e.target.value as any)} style={{ background: 'transparent', border: 'none', color: K.neutral, outline: 'none', flex: 1, appearance: 'none' }}>
                    <option value="Operativa">Operativo</option>
                    <option value="Inactiva">Inactivo</option>
                  </select>
                </div>
              </FormGroup>
            </div>
            <FormGroup label="Observación">
              <textarea 
                value={form.observacion} 
                onChange={e => handleFormChange('observacion', e.target.value)} 
                placeholder="Añade una observación..."
                rows={1}
                style={{ ...inputStyle(false), resize: 'vertical' }}
              />
            </FormGroup>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', borderTop: `1px solid ${K.border}`, paddingTop: '1.5rem' }}>
          <button onClick={guardarFila} style={{ padding: '0.6rem 2rem', background: editId ? K.secondary : 'transparent', color: editId ? K.tertiary : K.secondary, border: editId ? 'none' : `1px solid ${K.secondary}`, borderRadius: '24px', cursor: 'pointer', fontWeight: 600 }}>
            {editId ? '✔ Guardar cambios' : '+ Agregar brigada'}
          </button>
          <button onClick={limpiarFormulario} style={{ padding: '0.6rem 2rem', background: 'transparent', color: K.mutedText, border: `1px solid ${K.mutedText}`, borderRadius: '24px', cursor: 'pointer', fontWeight: 600 }}>
            {editId ? 'Cancelar' : 'Limpiar formulario'}
          </button>
        </div>
      </div>

      {/* 4. Lista de brigadas ingresadas */}
      <div style={{ background: K.tertiaryMid, borderRadius: '12px', border: `1px solid ${K.border}`, overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: `1px solid ${K.border}`, background: '#102240', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ margin: 0, color: K.neutral, fontSize: '1.1rem' }}>Lista de Brigadas Ingresadas ({rows.length})</h4>
          <div style={{ fontSize: '0.85rem', color: K.mutedText }}>Revise o edite las brigadas antes de subir la bitácora</div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          {rows.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: K.mutedText }}>
              <div style={{ fontSize: '2rem', opacity: 0.5, marginBottom: '1rem' }}>📋</div>
              Aún no hay brigadas agregadas.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: K.tertiary }}>
                <tr>
                  {['Patente', 'Cuenta', 'SAP', 'Brigada', 'Tipo', 'Pareja', 'Comuna', 'Cortes', 'Reconex.', 'Estado', 'Acciones'].map((h, i) => (
                    <th key={i} style={{ padding: '0.85rem 1rem', color: K.mutedText, fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600, borderBottom: `1px solid ${K.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.id} style={{ background: i % 2 === 0 ? 'transparent' : `${K.tertiary}55`, transition: 'background 0.2s' }}>
                    <td style={{ padding: '0.85rem 1rem', borderBottom: `1px solid ${K.border}`, fontSize: '0.85rem', color: K.neutral }}>{row.patente}</td>
                    <td style={{ padding: '0.85rem 1rem', borderBottom: `1px solid ${K.border}`, fontSize: '0.85rem', color: K.neutral }}>{row.cuenta}</td>
                    <td style={{ padding: '0.85rem 1rem', borderBottom: `1px solid ${K.border}`, fontSize: '0.85rem', color: K.neutral }}>{row.usuarioSap}</td>
                    <td style={{ padding: '0.85rem 1rem', borderBottom: `1px solid ${K.border}`, fontSize: '0.85rem', color: K.neutral }}>{row.brigada}</td>
                    <td style={{ padding: '0.85rem 1rem', borderBottom: `1px solid ${K.border}`, fontSize: '0.85rem', color: K.neutral }}>{row.tipoBrigada}</td>
                    <td style={{ padding: '0.85rem 1rem', borderBottom: `1px solid ${K.border}`, fontSize: '0.85rem', color: K.neutral }}>{row.pareja || '-'}</td>
                    <td style={{ padding: '0.85rem 1rem', borderBottom: `1px solid ${K.border}`, fontSize: '0.85rem', color: K.neutral }}>{row.comuna}</td>
                    <td style={{ padding: '0.85rem 1rem', borderBottom: `1px solid ${K.border}`, fontSize: '0.85rem', color: K.neutral }}>{row.carga}</td>
                    <td style={{ padding: '0.85rem 1rem', borderBottom: `1px solid ${K.border}`, fontSize: '0.85rem', color: K.neutral }}>{row.reconexiones}</td>
                    <td style={{ padding: '0.85rem 1rem', borderBottom: `1px solid ${K.border}`, fontSize: '0.85rem', color: row.estado === 'Operativa' ? K.secondary : K.error }}>{row.estado}</td>
                    <td style={{ padding: '0.85rem 1rem', borderBottom: `1px solid ${K.border}`, textAlign: 'right' }}>
                      <button onClick={() => editarFila(row.id)} title="Editar" style={{ background: 'transparent', color: K.primary, border: 'none', cursor: 'pointer', fontSize: '1rem', padding: '0 0.5rem', marginRight: '0.25rem' }}>✎</button>
                      <button onClick={() => eliminarFila(row.id)} title="Eliminar" style={{ background: 'transparent', color: K.error, border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0 0.5rem' }}>×</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

const FormGroup = ({ label, error, children }: { label: string, error?: string, children: React.ReactNode }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
    <label style={{ fontSize: '0.8rem', color: K.mutedText }}>{label}</label>
    {children}
    {error && <span style={{ color: K.error, fontSize: '0.7rem' }}>{error}</span>}
  </div>
);

const NumberStepper = ({ value, onChange, onIncrement, hasError }: { value: string, onChange: (val: string) => void, onIncrement: (d: number) => void, hasError: boolean }) => (
  <div style={{ display: 'flex', alignItems: 'center', background: K.tertiary, border: `1px solid ${hasError ? K.error : K.border}`, borderRadius: '4px', overflow: 'hidden' }}>
    <button onClick={() => onIncrement(-1)} style={{ background: 'transparent', color: K.mutedText, border: 'none', padding: '0.5rem 0.75rem', cursor: 'pointer', fontSize: '1rem' }}>−</button>
    <input 
      type="number" 
      value={value} 
      onChange={e => onChange(e.target.value)} 
      style={{ width: '40px', textAlign: 'center', background: 'transparent', color: K.neutral, border: 'none', outline: 'none', appearance: 'none', padding: '0.5rem 0' }} 
    />
    <button onClick={() => onIncrement(1)} style={{ background: 'transparent', color: K.mutedText, border: 'none', padding: '0.5rem 0.75rem', cursor: 'pointer', fontSize: '1rem' }}>+</button>
  </div>
);

const inputStyle = (hasError: boolean): React.CSSProperties => ({
  background: K.tertiary,
  border: `1px solid ${hasError ? K.error : K.border}`,
  color: K.neutral,
  padding: '0.5rem 0.75rem',
  borderRadius: '4px',
  outline: 'none',
  fontSize: '0.9rem',
  width: '100%',
  boxSizing: 'border-box'
});
