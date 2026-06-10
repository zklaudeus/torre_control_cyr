import { useState, useCallback } from 'react';
import { getResultadosRealesZona } from '../api/resultadosRealesZona.api';
import type { ResultadosRealesZonaResponse } from '../types/resultadoRealZona';

export const useResultadosRealesZona = (fechaOperacional: string) => {
  const [data, setData] = useState<ResultadosRealesZonaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResultados = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getResultadosRealesZona(fechaOperacional);
      setData(res);
    } catch {
      setError('Error al obtener los resultados. Verifica que el backend esté activo.');
    } finally {
      setLoading(false);
    }
  }, [fechaOperacional]);

  return { data, loading, error, fetchResultados };
};
