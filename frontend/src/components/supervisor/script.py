import re

path = 'c:/Users/claud/Desktop/TorreDeControl/frontend/src/components/supervisor/SupervisorBitacoraView.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update imports
content = content.replace("import { \n  validarFila,\n  obtenerZonaPorComuna,\n  obtenerSapPorCuenta\n} from './SupervisorBitacoraLogic';", "import { \n  validarFila,\n  obtenerZonaPorComuna,\n  obtenerSapPorCuenta,\n  normalizarPatente,\n  normalizarTexto\n} from './SupervisorBitacoraLogic';")

# 2. Update cargarBrigadasFrecuentes
new_cbf = '''  const cargarBrigadasFrecuentes = async () => {
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
    const nuevasFilas: BitacoraRow[] = [];

    faltantes.forEach((s, i) => {
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
      nuevasFilas.push({
        id: `temp-freq-${Date.now()}-${i}`,
        patente: normalizarPatente(s.patente_habitual || ''),
        usuarioSap: s.codigo_sap,
        cuenta: s.cuenta,
        brigada: normalizarTexto(s.brigada || s.cuenta),
        pareja: normalizarTexto(s.pareja || ''),
        comuna: comuna_hab,
        zona: zona,
        carga: '',
        reconexiones: '',
        observacion: '',
        estado: 'Operativa',
        tipoBrigada: s.tipo_brigada || 'PXQ'
      });
    });

    setRows(prev => [...prev, ...nuevasFilas]);
    
    let msg = '';
    if (nuevasFilas.length > 0) msg += `Se cargaron ${nuevasFilas.length} brigadas frecuentes. Recuerde Guardar la Bitácora. `;
    if (sinCuenta.length > 0) msg += `⚠ Error: ${sinCuenta.length} brigadas omitidas por no tener Cuenta válida. `;
    if (invalidas.length > 0) msg += `⚠ Faltan por configurar zona: ${invalidas.join(', ')}`;
    
    setMessage({ text: msg || 'No se cargaron nuevas brigadas.', type: (sinCuenta.length > 0 || invalidas.length > 0) ? 'error' : 'success' });
  };'''
content = re.sub(r'  const cargarBrigadasFrecuentes = async \(\) => \{.*?^\s*};\n', new_cbf + '\n', content, flags=re.DOTALL | re.MULTILINE)

# 3. Update guardarFila (lápiz)
new_gf = '''  const guardarFila = async () => {
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

    setRows(prev => editId ? prev.map(r => r.id === editId ? tempRow : r) : [...prev, tempRow]);
    setForm(initialForm);
    setEditId(null);
    setFormErrors({});
    setMessage({ text: 'Fila actualizada localmente. Recuerde Guardar la bitácora.', type: 'success' });
  };'''
content = re.sub(r'  const guardarFila = async \(\) => \{.*?(?=^\s*const eliminarFila = async)', new_gf + '\n\n', content, flags=re.DOTALL | re.MULTILINE)

# 4. Update actualizarBitacora
new_ab = '''  const actualizarBitacora = async (customRows?: BitacoraRow[]) => {
    const targetRows = customRows || rows;
    const res = await validarBitacora(targetRows);
    if (!res || (res.errores && res.errores.length > 0)) {
      return;
    }

    setIsSaving(true);
    if (!customRows) setMessage({ text: 'Actualizando bitácora...', type: 'success' });

    try {
      for (const row of targetRows) {
        const payload: any = {
          fecha_operacional: fechaOperacional,
          zona: row.zona || obtenerZonaPorComuna(row.comuna, comunasMap),
          codigo_sap: row.usuarioSap,
          patente: normalizarPatente(row.patente),
          usuario: row.cuenta,
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

      await fetchBrigadas(); // refrescar IDs reales

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

      if (!customRows) setMessage({ text: 'Bitácora guardada — Torre Control refleja los cambios.', type: 'success' });
    } catch (err: any) {
      console.error(err);
      if (!customRows) setMessage({ text: `Error al guardar: ${err.message}`, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };'''
content = re.sub(r'  const actualizarBitacora = async \(customRows\?: BitacoraRow\[\]\) => \{.*?(?=^\s*// Convertimos el backendResumen)', new_ab + '\n\n', content, flags=re.DOTALL | re.MULTILINE)

# 5. Add handleInlineChange 
inline_change = '''
  const handleInlineChange = (id: string, field: keyof BitacoraRow, value: string) => {
    setRows(prev => prev.map(r => {
      if (r.id !== id) return r;
      const updated = { ...r, [field]: value, _errors: undefined };
      
      if (field === 'cuenta') updated.usuarioSap = obtenerSapPorCuenta(value, sapMap);
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
'''
content = content.replace('  return (', inline_change + '\n  return (')

# 6. Delete row local check
del_row = '''  const eliminarFila = async (id: string) => {
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
  };'''
content = re.sub(r'  const eliminarFila = async \(id: string\) => \{.*?(?=^\s*const editarFila =)', del_row + '\n\n', content, flags=re.DOTALL | re.MULTILINE)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
