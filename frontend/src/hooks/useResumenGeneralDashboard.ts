import { useState, useCallback } from 'react';
import { useProgramacionPxq } from './useProgramacionPxq';
import { useProgramacionCf } from './useProgramacionCf';
import { useBrigadasDia } from './useBrigadasDia';
import { bulkCreateOrUpdateProgramacion } from '../api/programacionZona.api';
import { saveProgramacionCFZona } from '../api/cf.api';
import type { ProgramacionZonaBulkCreate } from '../types/programacionZona';
import type { ProgramacionCFZonaBulkCreate } from '../types/cf';

export const useResumenGeneralDashboard = (fechaOperacional: string) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { pxqData, fetchPxq, handlePxqChange } = useProgramacionPxq(fechaOperacional);
  const { cfData, fetchCf, handleCfChange } = useProgramacionCf(fechaOperacional);
  
  const brigadasHook = useBrigadasDia(fechaOperacional);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchPxq(),
        fetchCf(),
        brigadasHook.fetchBrigadasData(),
      ]);
    } catch (err) {
      setError('Error al cargar la información del panel');
    } finally {
      setLoading(false);
    }
  }, [fetchPxq, fetchCf, brigadasHook.fetchBrigadasData]);

  const handleSaveAll = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const pxqPayload: ProgramacionZonaBulkCreate = {
        fecha_operacional: fechaOperacional,
        items: pxqData.map((p) => ({
          zona: p.zona,
          reconexiones_programadas: Number(p.reconexiones_programadas) || 0,
          asignacion_carga: Number(p.asignacion_carga) || 0,
          corte_programado: Number(p.corte_programado) || 0,
        })),
      };

      const cfPayload: ProgramacionCFZonaBulkCreate = {
        fecha_operacional: fechaOperacional,
        items: cfData.map((c) => ({
          ...c,
          cortes_programados: Number(c.cortes_programados) || 0,
          reconexiones_programadas: Number(c.reconexiones_programadas) || 0,
          total_reconexiones_ejecutadas: Number(c.total_reconexiones_ejecutadas) || 0,
        })),
      };

      await Promise.all([
        bulkCreateOrUpdateProgramacion(pxqPayload),
        saveProgramacionCFZona(cfPayload),
      ]);

      // Refetch to get updated database state
      await Promise.all([fetchPxq(), fetchCf()]);

      setSuccess('Programación (PXQ y CF) guardada correctamente.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Ocurrió un error al guardar la programación.');
    } finally {
      setSaving(false);
    }
  };

  return {
    loading,
    saving,
    error,
    success,
    fetchAll,
    handleSaveAll,
    
    pxqData,
    handlePxqChange,
    
    cfData,
    handleCfChange,
    
    brigadasHook,
  };
};
