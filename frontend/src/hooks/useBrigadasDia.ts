import { useState, useCallback } from 'react';
import { getBrigadas, deleteBrigada, createBrigada, updateBrigada } from '../api/brigadasDia.api';
import { getZonasActivas } from '../api/parametros.api';
import type { BrigadaDiaria, BrigadaDiariaCreate } from '../types/brigadaDia';
import type { ParametroZona } from '../types/programacionZona';
import { getAllUsuariosSap, type SupervisorUsuarioSAP } from '../api/supervisores.api';

export type EditableBrigada = Omit<BrigadaDiaria, 'id'> & {
  id: number | string;
  isTemp?: boolean;
};

const emptyForm = (fecha: string, primerZona: string = ''): Omit<EditableBrigada, 'id' | 'isTemp'> => ({
  fecha_operacional: fecha,
  zona: primerZona,
  codigo_sap: '',
  patente: '',
  usuario: '',
  tipo_brigada: 'PXQ',
  estado_brigada: 'Operativa',
  hora_primer_movimiento: null,
  observacion_brigada: null,
  reconexiones_ejecutadas: 0,
  primer_corte: null,
  ultimo_corte: null,
  acum_09: 0,
  acum_10: 0,
  acum_11: 0,
  acum_12: 0,
  acum_13: 0,
  acum_14: 0,
  corte_en_poste: 0,
  corte_en_empalme: 0,
  visita_fallida: 0,
  corte_programado: 0,
  reconexiones_programadas: 0,
});

export const useBrigadasDia = (fechaOperacional: string) => {
  const [originalBrigadas, setOriginalBrigadas] = useState<BrigadaDiaria[]>([]);
  const [rows, setRows] = useState<EditableBrigada[]>([]);
  const [dirtyRows, setDirtyRows] = useState<Set<number | string>>(new Set());
  const [zonas, setZonas] = useState<ParametroZona[]>([]);
  const [usuariosSap, setUsuariosSap] = useState<SupervisorUsuarioSAP[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBrigadasData = useCallback(async () => {
    setLoading(true);
    try {
      const [brigadasData, zonasData, sapData] = await Promise.all([
        getBrigadas(fechaOperacional),
        getZonasActivas(),
        getAllUsuariosSap(),
      ]);
      setOriginalBrigadas(brigadasData);
      setRows(brigadasData);
      setZonas(zonasData);
      setUsuariosSap(sapData);
      setDirtyRows(new Set());
      setError(null);
    } catch (err) {
      console.error('Error fetching brigadas data', err);
      setError('Error al cargar datos de brigadas.');
    } finally {
      setLoading(false);
    }
  }, [fechaOperacional]);

  const handleAddRow = () => {
    const newId = `temp-${Date.now()}`;
    const newRow: EditableBrigada = {
      id: newId,
      isTemp: true,
      ...emptyForm(fechaOperacional, zonas.length > 0 ? zonas[0].zona : '')
    };
    setRows([...rows, newRow]);
    setDirtyRows(new Set(dirtyRows).add(newId));
  };

  const handleRowChange = (id: number | string, field: keyof EditableBrigada, value: any) => {
    setRows(currentRows =>
      currentRows.map(row => {
        if (row.id === id) {
          return { ...row, [field]: value };
        }
        return row;
      })
    );
    setDirtyRows(prev => new Set(prev).add(id));
  };

  const handleCancelRow = (id: number | string) => {
    const row = rows.find(r => r.id === id);
    if (row?.isTemp) {
      setRows(rows.filter(r => r.id !== id));
    } else {
      const original = originalBrigadas.find(r => r.id === id);
      if (original) {
        setRows(rows.map(r => r.id === id ? original : r));
      }
    }
    const newDirty = new Set(dirtyRows);
    newDirty.delete(id);
    setDirtyRows(newDirty);
    setError(null);
  };

  const handleDeleteRow = async (id: number | string) => {
    if (!window.confirm('¿Está seguro de eliminar esta brigada?')) return;
    try {
      const row = rows.find(r => r.id === id);
      if (!row?.isTemp) {
        await deleteBrigada(id as number);
      }
      await fetchBrigadasData();
    } catch (err) {
      console.error('Error deleting brigada', err);
      setError('Error al eliminar brigada.');
    }
  };

  const handleSaveRow = async (id: number | string) => {
    const row = rows.find(r => r.id === id);
    if (!row) return;

    if (!row.zona || !row.codigo_sap || !row.patente || !row.usuario) {
      setError('Complete los campos obligatorios: Zona, SAP, Patente, Usuario.');
      return;
    }
    if (row.estado_brigada === 'Inactiva' && !row.observacion_brigada) {
      setError('Si el estado es Inactiva, la observación es obligatoria.');
      return;
    }

    try {
      const payload: BrigadaDiariaCreate = {
        fecha_operacional: row.fecha_operacional,
        zona: row.zona,
        codigo_sap: row.codigo_sap,
        patente: row.patente,
        usuario: row.usuario,
        tipo_brigada: row.tipo_brigada,
        estado_brigada: row.estado_brigada,
        hora_primer_movimiento: row.hora_primer_movimiento || null,
        observacion_brigada: row.observacion_brigada || null,
        reconexiones_ejecutadas: Number(row.reconexiones_ejecutadas) || 0,
        primer_corte: row.primer_corte || null,
        ultimo_corte: row.ultimo_corte || null,
        acum_09: Number(row.acum_09) || 0,
        acum_10: Number(row.acum_10) || 0,
        acum_11: Number(row.acum_11) || 0,
        acum_12: Number(row.acum_12) || 0,
        acum_13: Number(row.acum_13) || 0,
        acum_14: Number(row.acum_14) || 0,
        corte_en_poste: Number(row.corte_en_poste) || 0,
        corte_en_empalme: Number(row.corte_en_empalme) || 0,
        visita_fallida: Number(row.visita_fallida) || 0,
        corte_programado: Number(row.corte_programado) || 0,
        reconexiones_programadas: Number(row.reconexiones_programadas) || 0,
      };

      if (row.isTemp) {
        await createBrigada(payload);
      } else {
        await updateBrigada(id as number, payload);
      }
      setError(null);
      await fetchBrigadasData();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Error al guardar brigada.');
    }
  };

  const handleSaveAll = async () => {
    for (const id of Array.from(dirtyRows)) {
      await handleSaveRow(id);
    }
  };

  return {
    rows,
    dirtyRows,
    zonas,
    loading,
    error,
    fetchBrigadasData,
    handleAddRow,
    handleRowChange,
    handleCancelRow,
    handleDeleteRow,
    handleSaveRow,
    handleSaveAll,
    originalBrigadas,
    usuariosSap,
  };
};
