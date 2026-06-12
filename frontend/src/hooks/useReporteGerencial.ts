import { useState, useCallback, useEffect } from 'react';
import { getBrigadas } from '../api/brigadasDia.api';
import { getProgramacionZona } from '../api/programacionZona.api';

export interface ZonaGerencialData {
  zona: string;
  brigadas_operativas: number;
  reconexiones_programadas: number;
  reconexiones_ejecutadas: number;
  corte_programado: number;
  cortes_ejecutados: number;
  corte_en_poste: number;
  corte_en_empalme: number;
  visitas_fallidas: number;
  
  promedio_reconexiones: number;
  promedio_cortes: number;
  promedio_actividad: number;
  cumplimiento_meta_pct: number;
  cumplimiento_corte_pct: number;
  asignacion_carga: number;
}

export interface ReporteGerencialData {
  fecha_operacional: string;
  zonas: ZonaGerencialData[];
  total: ZonaGerencialData;
}

export type FiltroBrigada = 'Todo' | 'PXQ' | 'CF';

const formatNumber = (num: number) => isNaN(num) || !isFinite(num) ? 0 : Number(num.toFixed(2));

export const useReporteGerencial = (fechaOperacional: string, filtro: FiltroBrigada = 'Todo') => {
  const [reporte, setReporte] = useState<ReporteGerencialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReporte = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch raw data
      const [brigadas, progAll] = await Promise.all([
        getBrigadas(fechaOperacional),
        getProgramacionZona(fechaOperacional)
      ]);

      const progPXQ = progAll.filter(p => p.tipo_brigada === 'PXQ');
      const progCF = progAll.filter(p => p.tipo_brigada === 'CF');

      // Extract unique zones based on filter
      const zonasSet = new Set<string>();
      
      if (filtro === 'Todo' || filtro === 'PXQ') {
        progPXQ.forEach(p => zonasSet.add(p.zona));
        brigadas.filter(b => b.tipo_brigada.toUpperCase() === 'PXQ').forEach(b => zonasSet.add(b.zona));
      }
      
      if (filtro === 'Todo' || filtro === 'CF') {
        progCF.forEach(p => zonasSet.add(p.zona));
        brigadas.filter(b => b.tipo_brigada.toUpperCase() === 'CF').forEach(b => zonasSet.add(b.zona));
      }

      if (filtro === 'Todo') {
        brigadas.forEach(b => zonasSet.add(b.zona));
      }

      let zonasList = Array.from(zonasSet).sort();

      const zonasCalculadas: ZonaGerencialData[] = zonasList.map(zona => {
        // Filter brigadas by zona and tipo_brigada
        const tb = (s: string) => s.toUpperCase();
        const bFiltradas = brigadas.filter(b => 
          b.zona === zona && 
          (filtro === 'Todo' ? ['PXQ', 'CF'].includes(tb(b.tipo_brigada)) : tb(b.tipo_brigada) === filtro)
        );

        let reconexiones_programadas = 0;
        let corte_programado = 0;
        let asignacion_carga = 0;

        // Add PXQ programming
        if (filtro === 'Todo' || filtro === 'PXQ') {
          const p = progPXQ.find(x => x.zona === zona);
          if (p) {
            reconexiones_programadas += p.reconexiones_programadas || 0;
            corte_programado += p.corte_programado || 0;
            asignacion_carga += p.asignacion_carga || 0;
          }
        }

        // Add CF programming
        if (filtro === 'Todo' || filtro === 'CF') {
          const c = progCF.find(x => x.zona === zona);
          if (c) {
            reconexiones_programadas += c.reconexiones_programadas || 0;
            corte_programado += c.corte_programado || 0;
            asignacion_carga += c.asignacion_carga || 0;
          }
        }

        // Aggregate executions
        const brigadas_operativas = bFiltradas.length;
        const reconexiones_ejecutadas = bFiltradas.reduce((sum, b) => sum + (Number(b.reconexiones_ejecutadas) || 0), 0);
        const corte_en_poste = bFiltradas.reduce((sum, b) => sum + (Number(b.corte_en_poste) || 0), 0);
        const corte_en_empalme = bFiltradas.reduce((sum, b) => sum + (Number(b.corte_en_empalme) || 0), 0);
        const visitas_fallidas = bFiltradas.reduce((sum, b) => sum + (Number(b.visita_fallida) || 0), 0);

        const cortes_ejecutados = corte_en_poste + corte_en_empalme;

        const promedio_reconexiones = brigadas_operativas > 0 ? (reconexiones_ejecutadas / brigadas_operativas) : 0;
        const promedio_cortes = brigadas_operativas > 0 ? (cortes_ejecutados / brigadas_operativas) : 0;
        const promedio_actividad = brigadas_operativas > 0 ? ((reconexiones_ejecutadas + cortes_ejecutados + visitas_fallidas) / brigadas_operativas) : 0;

        // Meta parameters
        const meta_diaria = 30; // Using 30 to match backend default
        const base_meta_calc = brigadas_operativas * meta_diaria;
        
        const cumplimiento_meta_pct = base_meta_calc > 0 ? (cortes_ejecutados / base_meta_calc) * 100 : 0;
        const cumplimiento_corte_pct = asignacion_carga > 0 ? (cortes_ejecutados / asignacion_carga) * 100 : 0;

        return {
          zona,
          brigadas_operativas,
          reconexiones_programadas,
          reconexiones_ejecutadas,
          corte_programado,
          cortes_ejecutados,
          corte_en_poste,
          corte_en_empalme,
          visitas_fallidas,
          promedio_reconexiones: formatNumber(promedio_reconexiones),
          promedio_cortes: formatNumber(promedio_cortes),
          promedio_actividad: formatNumber(promedio_actividad),
          cumplimiento_meta_pct: formatNumber(cumplimiento_meta_pct),
          cumplimiento_corte_pct: formatNumber(cumplimiento_corte_pct),
          asignacion_carga
        };
      });

      // Calcular totales
      const totalGlobal = zonasCalculadas.reduce((acc, curr) => {
        acc.brigadas_operativas += curr.brigadas_operativas;
        acc.reconexiones_programadas += curr.reconexiones_programadas;
        acc.reconexiones_ejecutadas += curr.reconexiones_ejecutadas;
        acc.corte_programado += curr.corte_programado;
        acc.cortes_ejecutados += curr.cortes_ejecutados;
        acc.corte_en_poste += curr.corte_en_poste;
        acc.corte_en_empalme += curr.corte_en_empalme;
        acc.visitas_fallidas += curr.visitas_fallidas;
        // Keep asignacion_carga in total as well
        acc.asignacion_carga += curr.asignacion_carga;
        return acc;
      }, {
        zona: 'Total General',
        brigadas_operativas: 0,
        reconexiones_programadas: 0,
        reconexiones_ejecutadas: 0,
        corte_programado: 0,
        cortes_ejecutados: 0,
        corte_en_poste: 0,
        corte_en_empalme: 0,
        visitas_fallidas: 0,
        promedio_reconexiones: 0,
        promedio_cortes: 0,
        promedio_actividad: 0,
        cumplimiento_meta_pct: 0,
        cumplimiento_corte_pct: 0,
        asignacion_carga: 0
      } as ZonaGerencialData);

      // Calcular promedios y porcentajes del total
      const bo = totalGlobal.brigadas_operativas;
      const asigCargaTot = totalGlobal.asignacion_carga;
      const meta_diaria_tot = 30;
      const baseM = bo * meta_diaria_tot;

      totalGlobal.promedio_reconexiones = bo > 0 ? formatNumber(totalGlobal.reconexiones_ejecutadas / bo) : 0;
      totalGlobal.promedio_cortes = bo > 0 ? formatNumber(totalGlobal.cortes_ejecutados / bo) : 0;
      totalGlobal.promedio_actividad = bo > 0 ? formatNumber((totalGlobal.reconexiones_ejecutadas + totalGlobal.cortes_ejecutados + totalGlobal.visitas_fallidas) / bo) : 0;
      totalGlobal.cumplimiento_meta_pct = baseM > 0 ? formatNumber((totalGlobal.cortes_ejecutados / baseM) * 100) : 0;
      totalGlobal.cumplimiento_corte_pct = asigCargaTot > 0 ? formatNumber((totalGlobal.cortes_ejecutados / asigCargaTot) * 100) : 0;

      setReporte({
        fecha_operacional: fechaOperacional,
        zonas: zonasCalculadas,
        total: totalGlobal
      });

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
