import { useState, useCallback, useEffect } from 'react';
import { getReporteGerencial } from '../api/reportes.api';

export interface ZonaGerencialData {
  zona: string;
  brigadas_operativas: number;
  total_brigadas: number;
  reconexiones_programadas: number;
  reconexiones_ejecutadas: number;
  corte_programado: number;
  cortes_ejecutados: number;
  corte_en_poste: number;
  corte_en_empalme: number;
  corte_fuera_de_rango: number;
  visitas_fallidas: number;
  
  promedio_reconexiones: number;
  promedio_cortes: number;
  promedio_actividad: number;
  cumplimiento_meta_pct: number;
  cumplimiento_corte_pct: number;
}

export interface ReporteGerencialData {
  fecha_operacional: string;
  zonas: ZonaGerencialData[];
  total: ZonaGerencialData;
}

export type FiltroBrigada = 'Todo' | 'PXQ' | 'CF';

export const useReporteGerencial = (fechaOperacional: string, filtro: FiltroBrigada = 'Todo') => {
  const [reporte, setReporte] = useState<ReporteGerencialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReporte = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getReporteGerencial(fechaOperacional, filtro);
      setReporte(data);
    } catch (err) {
      console.error(err);
      setError('Error al generar el reporte gerencial. Verifique los endpoints.');
    } finally {
      setLoading(false);
    }
  }, [fechaOperacional, filtro]);

  useEffect(() => {
    fetchReporte();
  }, [fetchReporte]);

  return { reporte, loading, error, fetchReporte };
};
