import { useState, useCallback } from 'react';
import { getResumenZona } from '../api/resumenZona.api';
import type { ResumenZonaResponse } from '../types/resumenZona';

export const useResumenZona = (fechaOperacional: string) => {
  const [resumen, setResumen] = useState<ResumenZonaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResumen = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getResumenZona(fechaOperacional);
      setResumen(data);
    } catch (err) {
      setError('Error al obtener el resumen. Verifica que el backend esté activo.');
    } finally {
      setLoading(false);
    }
  }, [fechaOperacional]);

  return { resumen, loading, error, fetchResumen };
};
