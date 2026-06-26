import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { BitacoraRow, ResumenZona } from './SupervisorBitacoraLogic';
import { 
  validarFila,
  obtenerZonaPorComuna,
  obtenerSapPorCuenta,
  normalizarPatente,
  normalizarTexto
} from './SupervisorBitacoraLogic';
import { useAuth } from '../../auth/AuthContext';
import { apiClient } from '../../api/client';
import { getSupervisoresActivos, getComunasZonasBySupervisor, getUsuariosSapBySupervisor, getResumenBitacoraPreview, getMeComunasZonas, getMeUsuariosSap, getMeResumenBitacoraPreview } from '../../api/supervisores.api';
import type { Supervisor, SupervisorComunaZona, SupervisorUsuarioSAP, BitacoraResumenPreviewRes } from '../../api/supervisores.api';

interface SupervisorBitacoraViewProps {
  fechaOperacional: string;
  onChangeFecha: (fecha: string) => void;
  activeSection?: string;
  onChangeSection?: (section: string) => void;
}

const K = {
  primary:     'var(--primary)',
  secondary:   'var(--secondary)',
  tertiary:    'var(--bg-main)',
  tertiaryMid: 'var(--bg-panel)',
  neutral:     'var(--text-main)',
  mutedText:   'var(--text-muted)',
  border:      'var(--border)',
  error:       'var(--error)',
  bgMain:      'var(--bg-main)',
  headerBg:    'var(--bg-panel-sec)',
  headerText:  'var(--text-main)'
};

const initialForm: Omit<BitacoraRow, 'id' | '_errors'> = {
  patente: '',
  usuarioSap: '',
  cuenta: '',
  brigada: '',
  pareja: '',
  comuna: '',
  zona: '',
  carga: '',
  reconexiones: '',
  observacion: '',
  estado: 'Operativa',
  tipoBrigada: 'PXQ'
};

export const SupervisorBitacoraView = ({
  fechaOperacional,
  onChangeFecha
}: SupervisorBitacoraViewProps) => {
  const { user } = useAuth();
  const [rows, setRows] = useState<BitacoraRow[]>([]);
  const [form, setForm] = useState(initialForm);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof BitacoraRow, string>>>({});
  const [asignacionCarga, setAsignacionCarga] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<Record<string, 'Guardando...' | 'Guardado' | 'Error al guardar' | undefined>>({});
  const saveTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const formRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [backendResumen, setBackendResumen] = useState<BitacoraResumenPreviewRes | null>(null);

  // Filtros de tabla
  const [filterZona, setFilterZona] = useState<string>('');
  const [filterTipo, setFilterTipo] = useState<string>('');
  const [filterSearch, setFilterSearch] = useState<string>('');

  const [supervisores, setSupervisores] = useState<Supervisor[]>([]);
  const [selectedSupervisorId, setSelectedSupervisorId] = useState<number | ''>('');
  const [comunasMap, setComunasMap] = useState<SupervisorComunaZona[]>([]);
  const [sapMap, setSapMap] = useState<SupervisorUsuarioSAP[]>([]);

  useEffect(() => {
    if (user?.rol === 'supervisor') {
      const sId = (user as any).supervisorId;
      if (sId) {
        setSupervisores([{ id: sId, nombre: user.nombre, activo: true }]);
        setSelectedSupervisorId(sId);
      } else {
        // Fallback en caso de no tener ID (no debería pasar con la data correcta)
        setSupervisores([{ id: -1, nombre: user.nombre, activo: true }]);
        setSelectedSupervisorId(-1);
      }
      return;
    }

    getSupervisoresActivos().then(data => {
      setSupervisores(data);
      if (data.length > 0) setSelectedSupervisorId(data[0].id);
    }).catch(console.error);
  }, [user]);


  useEffect(() => {
    if (user?.rol === 'supervisor') {
      getMeComunasZonas().then(setComunasMap).catch(console.error);
      getMeUsuariosSap().then(setSapMap).catch(console.error);
    } else if (selectedSupervisorId) {
      getComunasZonasBySupervisor(Number(selectedSupervisorId)).then(setComunasMap).catch(console.error);
      getUsuariosSapBySupervisor(Number(selectedSupervisorId)).then(setSapMap).catch(console.error);
    } else {
      setComunasMap([]);
      setSapMap([]);
    }
  }, [selectedSupervisorId, user?.rol, (user as any)?.supervisorId]);

  // Filtrar comunas según las zonas asignadas al supervisor
  const comunasVisibles = useMemo(() =>
    comunasMap.filter(c =>
      !user?.zonasAsignadas || user.zonasAsignadas.includes(c.zona_principal)
    ),
  [user, comunasMap]);

  const fetchBrigadas = async (): Promise<BitacoraRow[] | undefined> => {
    try {
      const res = await apiClient.get<any[]>(`/api/brigadas-dia/?fecha=${fechaOperacional}`);
      const data = res.data;
      const mapped: BitacoraRow[] = data.map(b => ({
        id: String(b.id),
        patente: b.patente || '',
        usuarioSap: b.codigo_sap || '',
        cuenta: b.usuario || '',
        brigada: b.brigada || '',
        pareja: b.pareja || '',
        comuna: b.zona || '',
        zona: b.zona || '',
        carga: (!b.corte_programado || b.corte_programado === 0) ? '' : String(b.corte_programado),
        reconexiones: (!b.reconexiones_programadas || b.reconexiones_programadas === 0) ? '' : String(b.reconexiones_programadas),
        observacion: b.observacion_brigada || '',
        estado: b.estado_brigada || 'Operativa',
        tipoBrigada: b.tipo_brigada || 'PXQ'
      }));
      mapped.forEach(m => {
        const matchingSAP = sapMap.find(s => s.codigo_sap === m.usuarioSap);
        if (matchingSAP) {
          m.cuenta = matchingSAP.cuenta || m.cuenta;
          m.brigada = m.brigada || matchingSAP.brigada || matchingSAP.cuenta;
          m.pareja = m.pareja || matchingSAP.pareja || '';
        } else if (!m.brigada) {
          m.brigada = m.cuenta;
        }
      });
      const filtered = mapped.filter(m => {
        const isAdmin = user?.rol === 'admin' || user?.rol === 'superadmin';
        const hasAll = user?.zonasAsignadas?.includes('TODAS');

        // Antes se filtraba estrictamente por usuarios SAP del supervisor, pero
        // eso oculta brigadas reportadas en la zona que no están en su lista SAP.
        // if (selectedSupervisorId && sapMap.length > 0) {
        //   const matchingSAP = sapMap.find(s => s.codigo_sap === m.usuarioSap);
        //   if (!matchingSAP) return false;
        // }


        // Filtrar por zona asignada al supervisor
        const zona = m.zona || obtenerZonaPorComuna(m.comuna, comunasMap);
        return isAdmin || hasAll || !user?.zonasAsignadas || (zona && user.zonasAsignadas.includes(zona));
      });
      setRows(filtered);
      return filtered;
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Error al cargar brigadas desde servidor.', type: 'error' });
      return undefined;
    }
  };

  const fetchProgramacionZona = async () => {
    try {
      const res = await apiClient.get<any[]>(`/api/programacion-zona/?fecha=${fechaOperacional}`);
      const data = res.data;
      const cargas: Record<string, string> = {};
      data.forEach(p => {
        if (p.tipo_brigada === 'PXQ' && p.asignacion_carga !== undefined && p.asignacion_carga !== null) {
          cargas[p.zona] = p.asignacion_carga === 0 ? '' : String(p.asignacion_carga);
        }
      });
      setAsignacionCarga(cargas);
    } catch (err) {
      console.error('Error al cargar programación de zona:', err);
    }
  };

  useEffect(() => {
    // Disparar fetch cuando ya se cargaron las comunas del supervisor.
    // No se requiere sapMap: supervisores nuevos sin SAP configurado
    // igual pueden ver las brigadas de sus zonas.
    if (comunasMap.length > 0) {
      fetchBrigadas();
      fetchProgramacionZona();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechaOperacional, comunasMap, sapMap]);

  const handleFormChange = (field: keyof typeof form, value: string) => {
    setForm(prev => {
      let finalValue = value;
      if (field === 'patente') {
        finalValue = value.toUpperCase().slice(0, 6);
      }
      if (field === 'carga' || field === 'reconexiones') {
        let cleanVal = value;
        if (cleanVal.startsWith('0') && cleanVal.length > 1) {
          cleanVal = cleanVal.replace(/^0+/, '');
        }
        if (cleanVal === '0') cleanVal = '';
        finalValue = cleanVal;
      }
      const updated = { ...prev, [field]: finalValue };
      if (field === 'cuenta') {
        const matchingSAP = sapMap.find(s => normalizarTexto(s.cuenta).toLowerCase() === normalizarTexto(value).toLowerCase());
        updated.usuarioSap = matchingSAP?.codigo_sap || obtenerSapPorCuenta(value, sapMap);
        updated.brigada = updated.brigada || matchingSAP?.brigada || value;
        updated.pareja = updated.pareja || matchingSAP?.pareja || '';
      }
      if (field === 'comuna') {
        updated.zona = obtenerZonaPorComuna(value, comunasMap);
      }
      return updated;
    });
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleIncrement = (field: 'carga' | 'reconexiones', delta: number) => {
    setForm(prev => {
      const current = parseInt(prev[field] || '0', 10);
      const next = Math.max(0, current + delta);
      return { ...prev, [field]: next === 0 ? '' : next.toString() };
    });
  };

  const guardarAsignacionZona = async (zona: string, carga: number) => {
    setSaveStatus(prev => ({ ...prev, [zona]: 'Guardando...' }));
    try {
      const r = resumen[zona];
      if (!r) throw new Error("Zona no encontrada");

      const payload = [{
        zona: r.zona,
        corte_programado: r.corteTotal,
        reconexiones_programadas: r.reconexionesTotal,
        asignacion_carga: carga,
        tipo_brigada: 'PXQ' 
      }];

      await apiClient.post('/api/programacion-zona/bulk', {
        fecha_operacional: fechaOperacional,
        items: payload
      });

      setSaveStatus(prev => ({ ...prev, [zona]: 'Guardado' }));
      setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, [zona]: undefined }));
      }, 2000);
    } catch (err) {
      console.error(err);
      setSaveStatus(prev => ({ ...prev, [zona]: 'Error al guardar' }));
    }
  };

  const handleCargaZonaChange = (zona: string, val: string) => {
    let cleanVal = val;
    if (cleanVal.startsWith('0') && cleanVal.length > 1) {
      cleanVal = cleanVal.replace(/^0+/, '');
    }
    if (cleanVal === '0') cleanVal = '';

    setAsignacionCarga(prev => ({ ...prev, [zona]: cleanVal }));

    if (saveTimeouts.current[zona]) {
      clearTimeout(saveTimeouts.current[zona]);
    }

    saveTimeouts.current[zona] = setTimeout(() => {
      const numValue = parseInt(cleanVal, 10) || 0;
      guardarAsignacionZona(zona, numValue);
    }, 500);
  };


  const guardarFila = async () => {
    if (!user) {
      setMessage({ text: 'Error: No hay sesión activa de usuario.', type: 'error' });
      return;
    }

    const tempRow = { ...form, id: editId || `temp-${Date.now()}` } as BitacoraRow;
    const errors = validarFila(tempRow, rows, editId, comunasMap, sapMap);

    const zonaDestino = form.zona || obtenerZonaPorComuna(form.comuna, comunasMap);
    const hasAll = user.zonasAsignadas?.includes('TODAS');
    if (user.rol === 'supervisor' && !hasAll && user.zonasAsignadas && zonaDestino && !user.zonasAsignadas.includes(zonaDestino)) {
      errors.comuna = `La comuna no pertenece a sus zonas asignadas (${user.zonasAsignadas.join(', ')}).`;
    }

    const puedeUsarCF = !(user.rol === 'supervisor') || (user as any)?.tiposBrigadaPermitidos?.includes('CF');
    if (!puedeUsarCF && form.tipoBrigada === 'CF') {
      errors.tipoBrigada = 'No tiene permiso para registrar brigadas de tipo CF.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    tempRow.patente = normalizarPatente(tempRow.patente);
    tempRow.brigada = normalizarTexto(tempRow.brigada);
    tempRow.pareja = normalizarTexto(tempRow.pareja);

        try {
      setIsSaving(true);
      const payload: any = {
          fecha_operacional: fechaOperacional,
          zona: tempRow.zona || obtenerZonaPorComuna(tempRow.comuna, comunasMap),
          codigo_sap: tempRow.usuarioSap,
          patente: tempRow.patente,
          usuario: tempRow.cuenta,
          brigada: tempRow.brigada || null,
          pareja: tempRow.pareja || null,
          tipo_brigada: tempRow.tipoBrigada || 'PXQ',
          estado_brigada: tempRow.estado,
          observacion_brigada: tempRow.observacion,
          corte_programado: parseInt(tempRow.carga, 10) || 0,
          reconexiones_programadas: parseInt(tempRow.reconexiones, 10) || 0,
      };

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
          await apiClient.post('/api/brigadas-dia/', payload);
      } else {
          await apiClient.put(`/api/brigadas-dia/${editId}`, payload);
      }
      
      await fetchBrigadas();
      setForm(initialForm);
      setEditId(null);
      setFormErrors({});
      setMessage({ text: 'Fila guardada exitosamente.', type: 'success' });
    } catch (err: any) {
      console.error(err);
      setMessage({ text: `Error al guardar la fila: ${err.message}`, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };


  const eliminarFila = async (id: string) => {
    if (id.startsWith('temp-')) {
      setRows(prev => prev.filter(r => r.id !== id));
      return;
    }
    if (window.confirm('¿Eliminar esta brigada de la base de datos?')) {
      try {
        await apiClient.delete(`/api/brigadas-dia/${id}`);
        setMessage({ text: 'Brigada eliminada de la BD.', type: 'success' });
        const newRows = await fetchBrigadas();
        if (newRows) {
          await actualizarBitacora(newRows);
        }
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
      // Desplazar la vista al formulario de edición
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const limpiarFormulario = () => {
    setForm(initialForm);
    setEditId(null);
    setFormErrors({});
  };

  const validarBitacora = async (customRows?: BitacoraRow[], silent = false) => {
    if (!selectedSupervisorId) {
      setMessage({ text: 'Debe seleccionar un supervisor.', type: 'error' });
      return null;
    }
    const targetRows = customRows || rows;
    if (targetRows.length === 0) {
      setMessage({ text: 'No hay brigadas para validar.', type: 'error' });
      return null;
    }
    
    if (!silent) if (!silent) setIsSaving(true);
    try {
      const cleanBandeja: Record<string, number> = {};
      for (const [z, val] of Object.entries(asignacionCarga)) {
        cleanBandeja[z] = parseInt(val, 10) || 0;
      }

      const payload = {
        fecha_operacional: fechaOperacional,
        filas: targetRows.map(r => ({
          codigo_sap: r.usuarioSap || "",
          cuenta: r.cuenta || "",
          patente: r.patente || "",
          brigada: r.brigada || "",
          pareja: r.pareja || "",
          comuna: r.comuna || "",
          tipo_brigada: r.tipoBrigada || "PXQ",
          carga: parseFloat(r.carga || '0') || 0.0,
          reconexiones: parseFloat(r.reconexiones || '0') || 0.0,
          estado_brigada: r.estado || "Operativa",
          observacion: r.observacion || ""
        })),
        total_en_bandeja_por_zona: cleanBandeja
      };
      
      let res;
      if (user?.rol === 'supervisor') {
        res = await getMeResumenBitacoraPreview(payload);
      } else {
        res = await getResumenBitacoraPreview(Number(selectedSupervisorId), payload);
      }
      
      if (!res) {
        throw new Error("Respuesta vacía del servidor.");
      }
      
      setBackendResumen(res);
      
      let msg = 'Bitácora validada exitosamente. Revise el resumen actualizado.';
      let type: 'success' | 'error' = 'success';
      if (res.errores && res.errores.length > 0) {
        msg = `Errores encontrados: ${res.errores.join(' | ')}`;
        type = 'error';
      } else if (res.advertencias && res.advertencias.length > 0) {
        msg = `Advertencias: ${res.advertencias.join(' | ')}`;
        type = 'error';
      }
      
      if (!customRows && !silent) {
        setMessage({ text: msg, type });
      }
      return res;
    } catch (err: any) {
      console.error(err);
      setMessage({ text: `Error al validar bitácora: ${err.message}`, type: 'error' });
      return null;
    } finally {
      if (!silent) setIsSaving(false);
    }
  };

  const actualizarBitacora = async (customRows?: BitacoraRow[], silent = false) => {
    const targetRows = customRows || rows;
    const res = await validarBitacora(targetRows);
    if (!res || (res.errores && res.errores.length > 0)) {
      return;
    }

    if (!silent) setIsSaving(true);
    if (!customRows && !silent) setMessage({ text: 'Actualizando bitácora...', type: 'success' });

    try {
      for (const row of targetRows) {
        const payload: any = {
          fecha_operacional: fechaOperacional,
          zona: row.zona || obtenerZonaPorComuna(row.comuna, comunasMap),
          codigo_sap: row.usuarioSap,
          patente: normalizarPatente(row.patente),
          usuario: row.cuenta,
          brigada: normalizarTexto(row.brigada) || null,
          pareja: normalizarTexto(row.pareja) || null,
          tipo_brigada: row.tipoBrigada || 'PXQ',
          estado_brigada: row.estado,
          observacion_brigada: normalizarTexto(row.observacion),
          corte_programado: parseInt(row.carga, 10) || 0,
          reconexiones_programadas: parseInt(row.reconexiones, 10) || 0,
        };

        if (row.id.startsWith('temp-')) {
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
          await apiClient.post('/api/brigadas-dia/', payload);
        } else {
          const { fecha_operacional: _, ...updatePayload } = payload;
          await apiClient.put(`/api/brigadas-dia/${row.id}`, updatePayload);
        }
      }

      if (!silent) await fetchBrigadas();

      const pxqZonas = res!.zonas.filter(z => z.tipo_brigada !== 'CF');
      const pxqBulkData = pxqZonas.map(r => ({
        zona: r.zona,
        corte_programado: r.corte_programado,
        reconexiones_programadas: r.reconexiones_programadas,
        asignacion_carga: parseInt(asignacionCarga[r.zona] || '0', 10),
        tipo_brigada: 'PXQ' 
      }));
      if (pxqBulkData.length > 0) {
        await apiClient.post('/api/programacion-zona/bulk', { fecha_operacional: fechaOperacional, items: pxqBulkData });
      }

      const cfZonas = res!.zonas.filter(z => z.tipo_brigada === 'CF');
      if (cfZonas.length > 0) {
        const cfBulkData = cfZonas.map(r => ({
          zona: r.zona,
          cortes_programados: r.corte_programado,
          reconexiones_programadas: r.reconexiones_programadas
        }));
        await apiClient.post('/api/programacion-cf-zona/bulk', { fecha_operacional: fechaOperacional, items: cfBulkData });
      }

      if (!customRows && !silent) setMessage({ text: 'Bitácora guardada — Torre Control refleja los cambios.', type: 'success' });
    } catch (err: any) {
      console.error(err);
      if (!customRows && !silent) setMessage({ text: `Error al guardar: ${err.message}`, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };


  // Convertimos el backendResumen en el formato que usaba el frontend temporalmente para no reescribir toda la UI
  const resumen = useMemo(() => {
    const completo: Record<string, ResumenZona> = {};
    if (backendResumen && backendResumen.zonas) {
      // Agrupamos por zona (sumando PXQ y CF si estuvieran separados, aunque el UI original parece no separarlos visualmente en KPIs)
      backendResumen.zonas.forEach(z => {
        if (!completo[z.zona]) {
          completo[z.zona] = { zona: z.zona, totalBrigadas: 0, corteTotal: 0, reconexionesTotal: 0, totalEnBandeja: 0 };
        }
        completo[z.zona].totalBrigadas += z.total_brigadas;
        completo[z.zona].corteTotal += z.corte_programado;
        completo[z.zona].reconexionesTotal += z.reconexiones_programadas;
        completo[z.zona].totalEnBandeja = Math.max(completo[z.zona].totalEnBandeja, z.total_en_bandeja);
      });
    } else {
      // Mostrar vacías las zonas permitidas inicialmente
      const zonasVisibles = user?.zonasAsignadas?.includes('TODAS')
        ? Array.from(new Set(comunasMap.map(c => c.zona_principal)))
        : (user?.zonasAsignadas || []);

      zonasVisibles.forEach(z => {
        completo[z] = { zona: z, totalBrigadas: 0, corteTotal: 0, reconexionesTotal: 0, totalEnBandeja: 0 };
      });
    }
    return completo;
  }, [backendResumen, user, comunasMap]);

  const cuentasDisponibles = useMemo(() => {
    const usadas = rows
      .filter(r => r.id !== editId)
      .map(r => r.cuenta)
      .filter(Boolean);
      
    const hasAll = user?.zonasAsignadas?.includes('TODAS');
    const sapFiltrado = sapMap.filter(s => {
      if (user?.rol === 'supervisor') return true;
      // Filtrar estrictamente por zonas permitidas del usuario actual
      if (hasAll || !user?.zonasAsignadas) return true;
      
      const zona = s.zona_principal || obtenerZonaPorComuna(s.comuna_habitual || '', comunasMap);
      if (!zona) return false;
      
      const normZona = zona.trim().toLowerCase();
      return user.zonasAsignadas.some(za => za.trim().toLowerCase() === normZona);
    });

    const todas = Array.from(new Set(sapFiltrado.map(s => s.cuenta))).sort();
    return todas.filter(c => !usadas.includes(c));
  }, [rows, editId, sapMap, user, comunasMap]);

  const cargarBrigadasFrecuentes = async () => {
    if (!selectedSupervisorId) {
      setMessage({ text: 'Debe seleccionar un supervisor para cargar sus brigadas frecuentes.', type: 'error' });
      return;
    }
    if (!sapMap.length) {
      setMessage({ text: 'No hay brigadas frecuentes (usuarios SAP) para este supervisor.', type: 'error' });
      return;
    }
    setMessage(null);

    const actualesSap = rows.map(r => `${r.usuarioSap}_${r.tipoBrigada}`);
    const puedeCargarCF = !(user?.rol === 'supervisor') || (user as any)?.tiposBrigadaPermitidos?.includes('CF');
    
    const hasAll = user?.zonasAsignadas?.includes('TODAS');
    const sapZonificados = sapMap.filter(s => {
      if (user?.rol === 'supervisor') return true;
      if (hasAll || !user?.zonasAsignadas) return true;
      const zona = s.zona_principal || obtenerZonaPorComuna(s.comuna_habitual || '', comunasMap);
      if (!zona) return false;
      const normZona = zona.trim().toLowerCase();
      return user.zonasAsignadas.some(za => za.trim().toLowerCase() === normZona);
    });

    const faltantes = sapZonificados.filter(s => {
      if (!s.activo) return false;
      if (!puedeCargarCF && (s.tipo_brigada === 'CF')) return false;
      const key = `${s.codigo_sap}_${s.tipo_brigada || 'PXQ'}`;
      return !actualesSap.includes(key);
    });

    if (faltantes.length === 0) {
      setMessage({ text: 'Todas las brigadas frecuentes ya están cargadas en la tabla.', type: 'success' });
      return;
    }

    const invalidas: string[] = [];
    const sinCuenta: string[] = [];
    const payloads: any[] = [];

    faltantes.forEach(s => {
      if (!s.cuenta || s.cuenta.trim() === '') {
        sinCuenta.push(s.codigo_sap);
        return;
      }
      const comuna_hab = s.comuna_habitual || '';
      const zona = s.zona_principal || obtenerZonaPorComuna(comuna_hab, comunasMap);
      if (!zona) {
        invalidas.push(`${s.cuenta} (${s.codigo_sap})`);
        return;
      }
      payloads.push({
          fecha_operacional: fechaOperacional,
          zona: zona,
          codigo_sap: s.codigo_sap,
          patente: normalizarPatente(s.patente_habitual || ''),
          usuario: s.cuenta,
          brigada: normalizarTexto(s.brigada || s.cuenta || '') || null,
          pareja: normalizarTexto(s.pareja || '') || null,
          tipo_brigada: s.tipo_brigada || 'PXQ',
          estado_brigada: 'Operativa',
          observacion_brigada: '',
          corte_programado: 0,
          reconexiones_programadas: 0,
          hora_primer_movimiento: null,
          primer_corte: null,
          ultimo_corte: null,
          acum_09: 0,
          acum_10: 0,
          acum_11: 0,
          acum_12: 0,
          acum_13: 0,
          acum_14: 0,
          visita_fallida: 0,
          reconexiones_ejecutadas: 0,
          corte_en_poste: 0,
          corte_en_empalme: 0
      });
    });

    try {
      setIsSaving(true);
      await Promise.all(payloads.map(p => apiClient.post('/api/brigadas-dia/', p)));
      await fetchBrigadas();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
    
    let msg = '';
    if (payloads.length > 0) msg += `Se cargaron ${payloads.length} brigadas frecuentes. `;
    if (sinCuenta.length > 0) msg += `⚠ Error: ${sinCuenta.length} brigadas omitidas por no tener Cuenta válida. `;
    if (invalidas.length > 0) msg += `⚠ Faltan por configurar zona: ${invalidas.join(', ')}`;
    
    setMessage({ text: msg || 'No se cargaron nuevas brigadas.', type: (sinCuenta.length > 0 || invalidas.length > 0) ? 'error' : 'success' });
  };



  // Debounced auto-validation for inline edits
  useEffect(() => {
    if (rows.length === 0) return;
    const timer = setTimeout(() => {
      actualizarBitacora(rows, true);
    }, 800);
    return () => clearTimeout(timer);
  }, [rows, asignacionCarga]);

  const handleInlineChange = (id: string, field: keyof BitacoraRow, value: string) => {
    setRows(prev => prev.map(r => {
      if (r.id !== id) return r;
      const updated = { ...r, [field]: value, _errors: undefined } as any;
      
      if (field === 'cuenta') {
        const matchingSAP = sapMap.find(s => normalizarTexto(s.cuenta).toLowerCase() === normalizarTexto(value).toLowerCase());
        updated.usuarioSap = matchingSAP?.codigo_sap || obtenerSapPorCuenta(value, sapMap);
        updated.brigada = updated.brigada || matchingSAP?.brigada || value;
        updated.pareja = updated.pareja || matchingSAP?.pareja || '';
      }
      if (field === 'comuna') updated.zona = obtenerZonaPorComuna(value, comunasMap);
      if (field === 'patente') updated.patente = normalizarPatente(value);
      if (field === 'brigada') updated.brigada = normalizarTexto(value);
      if (field === 'pareja') updated.pareja = normalizarTexto(value);
      
      if (field === 'carga' || field === 'reconexiones') {
        let cleanVal = value.replace(/^0+/, '');
        if (cleanVal === '') cleanVal = '0';
        updated[field] = cleanVal;
      }
      return updated;
    }));
  };
  const filteredRows = useMemo(() => {
    const term = filterSearch.trim().toLowerCase();
    return rows.filter(r => {
      if (filterZona && (r.zona || obtenerZonaPorComuna(r.comuna, comunasMap)) !== filterZona) return false;
      if (filterTipo && r.tipoBrigada !== filterTipo) return false;
      if (term) {
        const zona = r.zona || obtenerZonaPorComuna(r.comuna, comunasMap);
        const searchStr = [
          r.patente,
          r.cuenta,
          r.usuarioSap,
          r.brigada,
          r.pareja,
          zona,
          r.tipoBrigada,
          r.estado,
          r.observacion,
        ].join(' ').toLowerCase();
        if (!searchStr.includes(term)) return false;
      }
      return true;
    });
  }, [rows, filterZona, filterTipo, filterSearch, comunasMap]);

  const zonasFiltro = useMemo(() => {
    const zonas = rows
      .map(r => r.zona || obtenerZonaPorComuna(r.comuna, comunasMap))
      .filter(Boolean);
    return Array.from(new Set(zonas)).sort();
  }, [rows, comunasMap]);

  const hayFiltrosBrigadas = Boolean(filterZona || filterTipo || filterSearch.trim());

  return (
    <div style={{ padding: '2rem', height: '100%', overflowY: 'auto', background: K.bgMain }}>
      {/* 1. Encabezado Superior */}
      <div style={{ background: K.headerBg, padding: '1.5rem 2rem', borderRadius: '12px', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: K.headerText }}>Bitácora Supervisor</h2>
          {user && (
            <div style={{ fontSize: '0.9rem', color: K.secondary, marginTop: '0.25rem' }}>
              <span style={{ fontWeight: 600 }}>{user.nombre}</span> — Zonas: {user.zonasAsignadas?.join(', ')}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={selectedSupervisorId}
            onChange={(e) => setSelectedSupervisorId(Number(e.target.value) || '')}
            disabled={user?.rol === 'supervisor'}
            style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: `1px solid var(--border)`, background: 'var(--bg-main)', color: K.headerText, opacity: user?.rol === 'supervisor' ? 0.7 : 1 }}
          >
            <option value="">Seleccione supervisor...</option>
            {supervisores.map(s => (
              <option key={s.id} value={s.id}>{s.nombre}</option>
            ))}
          </select>
          <input 
            type="date" 
            value={fechaOperacional}
            onChange={(e) => onChangeFecha(e.target.value)}
            style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: `1px solid var(--border)`, background: 'var(--bg-main)', color: K.headerText }}
          />
          <button onClick={cargarBrigadasFrecuentes} disabled={isSaving} style={{ padding: '0.6rem 1.5rem', background: '#FF9800', color: '#fff', border: 'none', borderRadius: '24px', cursor: isSaving ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
            {isSaving ? 'Cargando...' : 'Cargar brigadas frecuentes'}
          </button>
          <button onClick={() => validarBitacora()} disabled={isSaving} style={{ padding: '0.6rem 1.5rem', background: '#2C3E50', color: '#fff', border: 'none', borderRadius: '24px', cursor: isSaving ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
            {isSaving ? 'Validando...' : 'Validar bitácora'}
          </button>
          <button onClick={() => actualizarBitacora()} disabled={isSaving} style={{ padding: '0.6rem 1.5rem', background: K.primary, color: '#fff', border: 'none', borderRadius: '24px', cursor: isSaving ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
            {isSaving ? 'Subiendo...' : 'Guardar bitácora de hoy'}
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
          {Object.values(resumen).map((r, i) => (
            <div key={`${r.zona}-${i}`} style={{ background: K.tertiaryMid, border: `1px solid ${K.border}`, borderRadius: '12px', padding: '1.25rem', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
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
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ color: K.mutedText, fontWeight: 600 }}>Asign. Carga Zona:</span>
                      {saveStatus[r.zona] && (
                        <span style={{ 
                          fontSize: '0.7rem', 
                          marginTop: '2px',
                          color: saveStatus[r.zona] === 'Guardado' ? '#10b981' : 
                                 saveStatus[r.zona] === 'Error al guardar' ? K.error : 
                                 K.primary 
                        }}>
                          {saveStatus[r.zona]}
                        </span>
                      )}
                    </div>
                    <input 
                      type="number" 
                      min="0"
                      value={asignacionCarga[r.zona] ?? ''}
                      onChange={(e) => handleCargaZonaChange(r.zona, e.target.value)}
                      style={{ width: '80px', padding: '0.4rem', borderRadius: '6px', border: `1px solid ${K.border}`, background: K.tertiary, color: K.neutral, textAlign: 'center', fontWeight: 600 }}
                    />
                  </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Formulario de ingreso de una sola brigada */}
      <div ref={formRef} style={{ background: K.tertiaryMid, borderRadius: '12px', padding: '1.5rem', border: `1px solid ${K.border}`, marginBottom: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
        <h3 style={{ margin: '0 0 1.5rem', color: K.neutral, fontSize: '1.2rem' }}>
          {editId ? 'Editar Brigada' : 'Ingresar Brigada'}
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <FormGroup label="Patente" error={formErrors.patente}>
            <input value={form.patente} onChange={e => handleFormChange('patente', e.target.value)} maxLength={6} placeholder="Ej: VSXK79" style={inputStyle(!!formErrors.patente)} />
          </FormGroup>
          
          <FormGroup label="Cuenta / Proyecto" error={formErrors.cuenta}>
            <select value={form.cuenta} onChange={e => handleFormChange('cuenta', e.target.value)} style={inputStyle(!!formErrors.cuenta)}>
              <option value="" style={{ background: K.tertiary, color: K.neutral }}>Seleccione...</option>
              {cuentasDisponibles.map(c => (
                <option key={c} value={c} style={{ background: K.tertiary, color: K.neutral }}>{c}</option>
              ))}
            </select>
          </FormGroup>

          <FormGroup label="Usuario SAP" error={formErrors.usuarioSap}>
            <input value={form.usuarioSap} readOnly placeholder="Autocompletado" style={{ ...inputStyle(!!formErrors.usuarioSap), opacity: 0.7, background: '#E2E8F0' }} title="Se completa al seleccionar la Cuenta" />
          </FormGroup>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <FormGroup label="Brigada" error={formErrors.brigada}>
            <input value={form.brigada} onChange={e => handleFormChange('brigada', e.target.value)} placeholder="Nombre Brigada" style={inputStyle(!!formErrors.brigada)} />
          </FormGroup>
          
          <FormGroup label="Pareja" error={formErrors.pareja}>
            <input value={form.pareja} onChange={e => handleFormChange('pareja', e.target.value)} placeholder="Opcional" style={inputStyle(!!formErrors.pareja)} />
          </FormGroup>

          <FormGroup label="Comuna" error={formErrors.comuna}>
            <select value={form.comuna} onChange={e => handleFormChange('comuna', e.target.value)} style={inputStyle(!!formErrors.comuna)} title="Seleccione la comuna. La zona se deriva automáticamente (ej: Coronel → Concepción)">
              <option value="" style={{ background: K.tertiary, color: K.neutral }}>Seleccione...</option>
              {comunasVisibles.map((c, i) => (
                <option key={`${c.comuna}-${i}`} value={c.comuna} style={{ background: K.tertiary, color: K.neutral }}>{c.comuna} → {c.zona_principal}</option>
              ))}
            </select>
          </FormGroup>

          <FormGroup label="Zona" error={formErrors.zona}>
            <input value={form.zona} readOnly placeholder="Autocompletado" style={{ ...inputStyle(!!formErrors.zona), opacity: 0.7, background: '#E2E8F0' }} title="Se completa al seleccionar la Comuna" />
          </FormGroup>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ background: 'var(--bg-panel-sec)', padding: '1rem', borderRadius: '8px', border: `1px solid ${K.border}` }}>
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
                <select value={form.tipoBrigada} onChange={e => handleFormChange('tipoBrigada', e.target.value as any)} style={{ ...inputStyle(false), flex: 1 }}>
                  <option value="PXQ" style={{ background: K.tertiary, color: K.neutral }}>PXQ</option>
                  {/* CF solo disponible para supervisores con permiso explícito */}
                  {(!(user?.rol === 'supervisor') || (user as any)?.tiposBrigadaPermitidos?.includes('CF')) && (
                    <option value="CF" style={{ background: K.tertiary, color: K.neutral }}>CF</option>
                  )}
                </select>
              </FormGroup>
              <FormGroup label="Estado">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', ...inputStyle(false) }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: form.estado === 'Operativa' ? K.primary : K.error }}></span>
                  <select value={form.estado} onChange={e => handleFormChange('estado', e.target.value as any)} style={{ background: 'transparent', border: 'none', color: K.neutral, outline: 'none', flex: 1, appearance: 'none' }}>
                    <option value="Operativa" style={{ background: K.tertiary, color: K.neutral }}>Operativo</option>
                    <option value="Inactiva" style={{ background: K.tertiary, color: K.neutral }}>Inactivo</option>
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
      <div style={{ background: K.tertiaryMid, borderRadius: '12px', border: `1px solid ${K.border}`, overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: `1px solid ${K.border}`, background: K.tertiaryMid, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ margin: 0, color: K.neutral, fontSize: '1.1rem' }}>
          Lista de Brigadas Ingresadas ({hayFiltrosBrigadas ? `${filteredRows.length} de ${rows.length}` : rows.length})
        </h4>
        <div style={{ fontSize: '0.85rem', color: K.mutedText, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          Revise o edite las brigadas antes de subir la bitácora
          <span title="La columna 'Comuna' muestra la zona derivada (ej: Concepción). 
                    No se puede mostrar la comuna específica (ej: Coronel) porque el backend solo almacena zona." 
                style={{ cursor: 'help', color: K.secondary, fontWeight: 600 }}>ℹ️</span>
        </div>
      </div>
        <div style={{ padding: '1rem 1.5rem', borderBottom: `1px solid ${K.border}`, background: K.tertiaryMid, display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) minmax(160px, 220px) minmax(120px, 160px) auto', gap: '0.75rem', alignItems: 'center' }}>
          <input
            value={filterSearch}
            onChange={e => setFilterSearch(e.target.value)}
            placeholder="Buscar por usuario, SAP, patente, brigada..."
            style={inputStyle(false)}
          />
          <select value={filterZona} onChange={e => setFilterZona(e.target.value)} style={inputStyle(false)}>
            <option value="">Todas las zonas</option>
            {zonasFiltro.map(zona => (
              <option key={zona} value={zona}>{zona}</option>
            ))}
          </select>
          <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)} style={inputStyle(false)}>
            <option value="">Todos los tipos</option>
            <option value="PXQ">PXQ</option>
            <option value="CF">CF</option>
          </select>
          <button
            type="button"
            onClick={() => {
              setFilterSearch('');
              setFilterZona('');
              setFilterTipo('');
            }}
            disabled={!hayFiltrosBrigadas}
            style={{ padding: '0.55rem 1rem', borderRadius: '8px', border: `1px solid ${K.border}`, background: hayFiltrosBrigadas ? K.tertiary : 'transparent', color: hayFiltrosBrigadas ? K.neutral : K.mutedText, cursor: hayFiltrosBrigadas ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap' }}
          >
            Limpiar filtros
          </button>
        </div>
        <div className="table-responsive">
          {rows.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: K.mutedText }}>
              <div style={{ fontSize: '2rem', opacity: 0.5, marginBottom: '1rem' }}>📋</div>
              Aún no hay brigadas agregadas.
            </div>
          ) : filteredRows.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: K.mutedText }}>
              No hay brigadas que coincidan con los filtros.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: K.tertiary }}>
                <tr>
                  {['Patente', 'Cuenta', 'SAP / Nombre', 'Brigada', 'Tipo', 'Pareja', 'Zona', 'Cortes', 'Reconex.', 'Estado', 'Acciones'].map((h, i) => (
                    <th key={i} style={{ padding: '0.85rem 1rem', color: K.mutedText, fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600, borderBottom: `1px solid ${K.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, i) => (
                  <tr key={row.id} style={{ background: row.id === editId ? `${K.secondary}22` : (i % 2 === 0 ? 'transparent' : K.tertiary), transition: 'background 0.2s' }}>
                    <td style={{ padding: '0.85rem 1rem', borderBottom: `1px solid ${K.border}`, fontSize: '0.85rem', color: K.neutral }}>
                      <input 
                        value={row.patente} 
                        onChange={e => handleInlineChange(row.id, 'patente', e.target.value)} 
                        maxLength={6} 
                        style={{ ...inputStyle(!!row._errors?.patente), padding: '0.4rem', width: '80px' }} 
                        title={row._errors?.patente}
                      />
                    </td>
                    <td style={{ padding: '0.85rem 1rem', borderBottom: `1px solid ${K.border}`, fontSize: '0.85rem', color: K.neutral }}>
                      <select 
                        value={row.cuenta} 
                        onChange={e => handleInlineChange(row.id, 'cuenta', e.target.value)} 
                        style={{ ...inputStyle(!!row._errors?.cuenta), padding: '0.4rem', width: '120px' }}
                        title={row._errors?.cuenta}
                      >
                        <option value="">Sel...</option>
                        {Array.from(new Set([row.cuenta, ...cuentasDisponibles])).filter(Boolean).map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', borderBottom: `1px solid ${K.border}`, fontSize: '0.85rem', color: K.neutral }}>
                      <div title={row._errors?.usuarioSap} style={{ color: row._errors?.usuarioSap ? K.error : 'inherit' }}>
                        {row.usuarioSap}
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', borderBottom: `1px solid ${K.border}`, fontSize: '0.85rem', color: K.neutral }}>
                      <input 
                        value={row.brigada} 
                        onChange={e => handleInlineChange(row.id, 'brigada', e.target.value)} 
                        style={{ ...inputStyle(!!row._errors?.brigada), padding: '0.4rem', width: '100px' }} 
                        title={row._errors?.brigada}
                      />
                    </td>
                    <td style={{ padding: '0.85rem 1rem', borderBottom: `1px solid ${K.border}`, fontSize: '0.85rem', color: K.neutral }}>
                      <select 
                        value={row.tipoBrigada} 
                        onChange={e => handleInlineChange(row.id, 'tipoBrigada', e.target.value)} 
                        style={{ ...inputStyle(!!row._errors?.tipoBrigada), padding: '0.4rem', width: '70px' }}
                        title={row._errors?.tipoBrigada}
                      >
                        <option value="PXQ">PXQ</option>
                        {(!(user?.rol === 'supervisor') || (user as any)?.tiposBrigadaPermitidos?.includes('CF')) && (
                          <option value="CF">CF</option>
                        )}
                      </select>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', borderBottom: `1px solid ${K.border}`, fontSize: '0.85rem', color: K.neutral }}>
                      <input 
                        value={row.pareja} 
                        onChange={e => handleInlineChange(row.id, 'pareja', e.target.value)} 
                        style={{ ...inputStyle(!!row._errors?.pareja), padding: '0.4rem', width: '100px' }} 
                        title={row._errors?.pareja}
                      />
                    </td>
                    <td style={{ padding: '0.85rem 1rem', borderBottom: `1px solid ${K.border}`, fontSize: '0.85rem', color: K.neutral }}>
                      {row.zona || obtenerZonaPorComuna(row.comuna, comunasMap)}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', borderBottom: `1px solid ${K.border}`, fontSize: '0.85rem', color: K.neutral }}>
                      <input 
                        type="number" min="0"
                        value={row.carga} 
                        onChange={e => handleInlineChange(row.id, 'carga', e.target.value)} 
                        style={{ ...inputStyle(!!row._errors?.carga), padding: '0.4rem', width: '60px' }} 
                        title={row._errors?.carga}
                      />
                    </td>
                    <td style={{ padding: '0.85rem 1rem', borderBottom: `1px solid ${K.border}`, fontSize: '0.85rem', color: K.neutral }}>
                      <input 
                        type="number" min="0"
                        value={row.reconexiones} 
                        onChange={e => handleInlineChange(row.id, 'reconexiones', e.target.value)} 
                        style={{ ...inputStyle(!!row._errors?.reconexiones), padding: '0.4rem', width: '60px' }} 
                        title={row._errors?.reconexiones}
                      />
                    </td>
                    <td style={{ padding: '0.85rem 1rem', borderBottom: `1px solid ${K.border}`, fontSize: '0.85rem', color: K.neutral }}>
                      <select 
                        value={row.estado} 
                        onChange={e => handleInlineChange(row.id, 'estado', e.target.value)} 
                        style={{ ...inputStyle(!!row._errors?.estado), padding: '0.4rem', width: '90px', color: row.estado === 'Operativa' ? K.secondary : K.error }}
                        title={row._errors?.estado}
                      >
                        <option value="Operativa">Operativa</option>
                        <option value="Inactiva">Inactiva</option>
                      </select>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', borderBottom: `1px solid ${K.border}`, textAlign: 'right' }}>
                      <button onClick={() => editarFila(row.id)} title="Editar Formulario Completo" style={{ background: 'transparent', color: K.primary, border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0 0.5rem', marginRight: '0.25rem' }}>✎</button>
                      <button onClick={() => eliminarFila(row.id)} title="Eliminar" style={{ background: 'transparent', color: K.error, border: 'none', cursor: 'pointer', fontSize: '1.4rem', padding: '0 0.5rem' }}>×</button>
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
    <button type="button" onClick={() => onIncrement(-1)} style={{ background: 'transparent', color: K.mutedText, border: 'none', padding: '0.5rem 0.75rem', cursor: 'pointer', fontSize: '1rem' }}>−</button>
    <input 
      type="number" 
      min="0"
      value={value} 
      onChange={e => onChange(e.target.value)} 
      style={{ width: '40px', textAlign: 'center', background: 'transparent', color: K.neutral, border: 'none', outline: 'none', appearance: 'none', padding: '0.5rem 0' }} 
    />
    <button type="button" onClick={() => onIncrement(1)} style={{ background: 'transparent', color: K.mutedText, border: 'none', padding: '0.5rem 0.75rem', cursor: 'pointer', fontSize: '1rem' }}>+</button>
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
