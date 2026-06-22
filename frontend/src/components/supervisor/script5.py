import re

path = 'c:/Users/claud/Desktop/TorreDeControl/frontend/src/components/supervisor/SupervisorBitacoraView.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update cargarBrigadasFrecuentes to save immediately
cbf_old_pattern = r'const nuevasFilas: BitacoraRow\[\] = \[\];.*?setRows\(prev => \[\.\.\.prev, \.\.\.nuevasFilas\]\);'
cbf_new = '''const payloads: any[] = [];

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
      payloads.push({
          fecha_operacional: fechaOperacional,
          zona: zona,
          codigo_sap: s.codigo_sap,
          patente: normalizarPatente(s.patente_habitual || ''),
          usuario: s.cuenta,
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
      if (!silentGuardar) setIsSaving(true);
      await Promise.all(payloads.map(p => apiClient.post('/api/brigadas-dia/', p)));
      await fetchBrigadas();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }'''
content = re.sub(cbf_old_pattern, cbf_new, content, flags=re.DOTALL)
content = content.replace("if (nuevasFilas.length > 0) msg += `Se cargaron ${nuevasFilas.length} brigadas frecuentes. Recuerde Guardar la Bitácora. `;", "if (payloads.length > 0) msg += `Se cargaron ${payloads.length} brigadas frecuentes. `;")

# 2. Update guardarFila (Lápiz) to save immediately
gf_old_pattern = r'setRows\(prev => editId \? prev\.map\(r => r\.id === editId \? tempRow : r\) : \[\.\.\.prev, tempRow\]\);\s*setForm\(initialForm\);\s*setEditId\(null\);\s*setFormErrors\({}\);\s*setMessage\({ text: \'Fila actualizada localmente\. Recuerde Guardar la bitácora\.\', type: \'success\' }\);'
gf_new = '''    try {
      setIsSaving(true);
      const payload: any = {
          fecha_operacional: fechaOperacional,
          zona: tempRow.zona || obtenerZonaPorComuna(tempRow.comuna, comunasMap),
          codigo_sap: tempRow.usuarioSap,
          patente: tempRow.patente,
          usuario: tempRow.cuenta,
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
    }'''
content = re.sub(gf_old_pattern, gf_new, content, flags=re.DOTALL)

# 3. Modify actualizarBitacora to accept silent parameter and NOT call fetchBrigadas if silent
content = content.replace("const actualizarBitacora = async (customRows?: BitacoraRow[]) => {", "const actualizarBitacora = async (customRows?: BitacoraRow[], silent = false) => {")
content = content.replace("setIsSaving(true);", "if (!silent) setIsSaving(true);")
content = content.replace("if (!customRows) setMessage({ text: 'Actualizando bitácora...', type: 'success' });", "if (!customRows && !silent) setMessage({ text: 'Actualizando bitácora...', type: 'success' });")
content = content.replace("await fetchBrigadas(); // refrescar IDs reales", "if (!silent) await fetchBrigadas();")
content = content.replace("if (!customRows) setMessage({ text: 'Bitácora guardada — Torre Control refleja los cambios.', type: 'success' });", "if (!customRows && !silent) setMessage({ text: 'Bitácora guardada — Torre Control refleja los cambios.', type: 'success' });")
content = content.replace("if (!customRows) setMessage({ text: `Error al guardar: ${err.message}`, type: 'error' });", "if (!customRows && !silent) setMessage({ text: `Error al guardar: ${err.message}`, type: 'error' });")
content = content.replace("setIsSaving(false);", "if (!silent) setIsSaving(false);")

# 4. Modify the debounce useEffect to call actualizarBitacora directly instead of validarBitacora
eff_old = '''    const timer = setTimeout(() => {
      validarBitacora(rows, true);
    }, 800);'''
eff_new = '''    const timer = setTimeout(() => {
      actualizarBitacora(rows, true);
    }, 800);'''
content = content.replace(eff_old, eff_new)

# Add silentGuardar boolean at the top to avoid typescript errors in cargarBrigadas
content = content.replace("const faltantes = sapZonificados.filter(s => {", "const silentGuardar = false;\n    const faltantes = sapZonificados.filter(s => {")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
