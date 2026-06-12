import { useState, useCallback, useMemo } from 'react';
import { useProgramacionDiaria } from './useProgramacionDiaria';
import { useBrigadasDia } from './useBrigadasDia';
import { bulkCreateOrUpdateProgramacion } from '../api/programacionZona.api';
import type { ProgramacionZonaBulkCreate } from '../types/programacionZona';

export const useResumenGeneralDashboard = (fechaOperacional: string) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { programacionData, fetchProgramacion, handleProgramacionChange } = useProgramacionDiaria(fechaOperacional);
  
  const brigadasHook = useBrigadasDia(fechaOperacional);

  const displayProgramacionData = useMemo(() => {
    const sums: Record<string, { corte: number; rec: number }> = {};
    brigadasHook.originalBrigadas.forEach(b => {
      const key = `${b.zona}_${b.tipo_brigada}`;
      if (!sums[key]) sums[key] = { corte: 0, rec: 0 };
      sums[key].corte += Number(b.corte_programado) || 0;
      sums[key].rec += Number(b.reconexiones_programadas) || 0;
    });

    return programacionData.map(p => {
      const key = `${p.zona}_${p.tipo_brigada}`;
      const sum = sums[key] || { corte: 0, rec: 0 };
      return {
        ...p,
        corte_programado: sum.corte,
        reconexiones_programadas: sum.rec
      };
    });
  }, [programacionData, brigadasHook.originalBrigadas]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchProgramacion(),
        brigadasHook.fetchBrigadasData(),
      ]);
    } catch (err) {
      setError('Error al cargar la información del panel');
    } finally {
      setLoading(false);
    }
  }, [fetchProgramacion, brigadasHook.fetchBrigadasData]);

  const handleSaveAll = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload: ProgramacionZonaBulkCreate = {
        fecha_operacional: fechaOperacional,
        items: displayProgramacionData.map((p) => ({
          zona: p.zona,
          tipo_brigada: p.tipo_brigada,
          reconexiones_programadas: Number(p.reconexiones_programadas) || 0,
          asignacion_carga: Number(p.asignacion_carga) || 0,
          corte_programado: Number(p.corte_programado) || 0,
        })),
      };

      await bulkCreateOrUpdateProgramacion(payload);

      // Refetch to get updated database state
      await fetchProgramacion();

      setSuccess('Programación guardada correctamente.');
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
    
    programacionData: displayProgramacionData,
    handleProgramacionChange,
    
    brigadasHook,
  };
};
