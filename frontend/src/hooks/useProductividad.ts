import { useState, useEffect, useCallback } from 'react';

import type { TecnicoResumen as TecnicoFrontend, EstadoTecnico } from '../types/rendimientoTecnico.types';
import {
  getTecnicos,
  getRendimientoDiario,
  getHistorial,
  getAlertas,
  type TecnicoResumenBackend,
  type RendimientoDiarioBackend,
  type HistorialItemBackend,
  type AlertaItemBackend,
} from '../api/productividad.api';

function mapEstado(estado: string): EstadoTecnico {
  switch (estado) {
    case 'CRITICO': return 'Crítico';
    case 'RECUPERACION': return 'En recuperación';
    case 'ESTABLE': return 'Estable';
    case 'ALTO_DESEMPENO': return 'Alto desempeño';
    default: return 'Estable';
  }
}

function mapTecnico(b: TecnicoResumenBackend): TecnicoFrontend {
  return {
    id: b.codigo_sap,
    nombre: b.cuenta,
    codigoSap: b.codigo_sap,
    zona: b.zona ?? '',
    supervisor: b.supervisor_nombre ?? '',
    estado: mapEstado(b.estado_productivo_actual),
    fase: b.fase_actual,
    productividadPromedio: 0,
  };
}

export function useProductividad() {
  const [tecnicos, setTecnicos] = useState<TecnicoFrontend[]>([]);
  const [tecnicosRaw, setTecnicosRaw] = useState<TecnicoResumenBackend[]>([]);
  const [loadingTecnicos, setLoadingTecnicos] = useState(true);
  const [errorTecnicos, setErrorTecnicos] = useState<string | null>(null);

  const [selectedTecnico, setSelectedTecnico] = useState<TecnicoFrontend | null>(null);
  const [selectedCodigoSap, setSelectedCodigoSap] = useState<string | null>(null);

  const [rendimiento, setRendimiento] = useState<RendimientoDiarioBackend | null>(null);
  const [rendimientoList, setRendimientoList] = useState<RendimientoDiarioBackend[]>([]);
  const [loadingRendimiento, setLoadingRendimiento] = useState(false);
  const [errorRendimiento, setErrorRendimiento] = useState<string | null>(null);

  const [historial, setHistorial] = useState<HistorialItemBackend[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [errorHistorial, setErrorHistorial] = useState<string | null>(null);

  const [alertas, setAlertas] = useState<AlertaItemBackend[]>([]);
  const [loadingAlertas, setLoadingAlertas] = useState(false);
  const [errorAlertas, setErrorAlertas] = useState<string | null>(null);

  const fetchTecnicos = useCallback(async () => {
    setLoadingTecnicos(true);
    setErrorTecnicos(null);
    try {
      const data = await getTecnicos();
      setTecnicosRaw(data);
      setTecnicos(data.map(mapTecnico));
    } catch {
      setErrorTecnicos('Error al cargar técnicos');
    } finally {
      setLoadingTecnicos(false);
    }
  }, []);

  useEffect(() => {
    fetchTecnicos();
  }, [fetchTecnicos]);

  const selectTecnico = useCallback((tecnico: TecnicoFrontend | null) => {
    setSelectedTecnico(tecnico);
    const sap = tecnico?.codigoSap ?? null;
    setSelectedCodigoSap(sap);
  }, []);

  useEffect(() => {
    if (!selectedCodigoSap) {
      setRendimiento(null);
      setRendimientoList([]);
      setHistorial([]);
      setAlertas([]);
      return;
    }

    setLoadingRendimiento(true);
    setErrorRendimiento(null);
    setLoadingHistorial(true);
    setErrorHistorial(null);
    setLoadingAlertas(true);
    setErrorAlertas(null);

    let cancelled = false;

    const load = async () => {
      const [rendData, histData, alertData] = await Promise.all([
        getRendimientoDiario({ codigo_sap: selectedCodigoSap, limit: 1 }).catch(() => []),
        getHistorial({ codigo_sap: selectedCodigoSap }).catch(() => []),
        getAlertas({ codigo_sap: selectedCodigoSap }).catch(() => []),
      ]);

      if (cancelled) return;

      setRendimiento(rendData[0] ?? null);
      setRendimientoList(rendData);
      setLoadingRendimiento(false);
      setErrorRendimiento(null);

      setHistorial(histData);
      setLoadingHistorial(false);
      setErrorHistorial(null);

      setAlertas(alertData);
      setLoadingAlertas(false);
      setErrorAlertas(null);
    };

    load();

    return () => { cancelled = true; };
  }, [selectedCodigoSap]);

  return {
    tecnicos,
    tecnicosRaw,
    loadingTecnicos,
    errorTecnicos,
    selectedTecnico,
    selectTecnico,
    rendimiento,
    rendimientoList,
    loadingRendimiento,
    errorRendimiento,
    historial,
    loadingHistorial,
    errorHistorial,
    alertas,
    loadingAlertas,
    errorAlertas,
    refetchTecnicos: fetchTecnicos,
  };
}
