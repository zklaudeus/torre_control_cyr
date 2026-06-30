import { useState, useEffect, useCallback } from 'react';

import type { TecnicoResumen as TecnicoFrontend, EstadoTecnico } from '../types/rendimientoTecnico.types';
import {
  getTecnicos,
  getRendimientoDiario,
  getResumenKpisTecnico,
  getHistorial,
  getAlertas,
  getSeguimientoTecnico,
  registrarAdvertencia as apiRegistrarAdvertencia,
  anularAdvertencia as apiAnularAdvertencia,
  eliminarAdvertencia as apiEliminarAdvertencia,
  cambiarFaseTecnico as apiCambiarFase,
  type TecnicoResumenBackend,
  type RendimientoDiarioBackend,
  type ResumenKpiTecnicoBackend,
  type HistorialItemBackend,
  type AlertaItemBackend,
  type SeguimientoTecnicoBackend,
} from '../api/productividad.api';

function mapEstado(estado: string): EstadoTecnico {
  switch (estado) {
    case 'CRITICO': return 'Crítico';
    case 'RECUPERACION': return 'En recuperación';
    case 'ESTABLE': return 'Estable';
    case 'ALTO_DESEMPENO': return 'Alto desempeño';
    case 'SIN_EVALUACION': return 'Sin evaluación';
    default: return 'Sin evaluación';
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
    tipoBrigada: b.tipo_brigada,
    advertenciasActivas: b.advertencias_fase2,
    productividadPromedio: 0,
  };
}

export function useProductividad(fechaOperacional?: string) {
  const [tecnicos, setTecnicos] = useState<TecnicoFrontend[]>([]);
  const [tecnicosRaw, setTecnicosRaw] = useState<TecnicoResumenBackend[]>([]);
  const [loadingTecnicos, setLoadingTecnicos] = useState(true);
  const [errorTecnicos, setErrorTecnicos] = useState<string | null>(null);

  const [selectedTecnico, setSelectedTecnico] = useState<TecnicoFrontend | null>(null);
  const [selectedCodigoSap, setSelectedCodigoSap] = useState<string | null>(null);

  const [rendimiento, setRendimiento] = useState<RendimientoDiarioBackend | null>(null);
  const [rendimientoList, setRendimientoList] = useState<RendimientoDiarioBackend[]>([]);
  const [kpiResumen, setKpiResumen] = useState<ResumenKpiTecnicoBackend | null>(null);
  const [loadingRendimiento, setLoadingRendimiento] = useState(false);
  const [errorRendimiento, setErrorRendimiento] = useState<string | null>(null);

  const [historial, setHistorial] = useState<HistorialItemBackend[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [errorHistorial, setErrorHistorial] = useState<string | null>(null);

  const [alertas, setAlertas] = useState<AlertaItemBackend[]>([]);
  const [loadingAlertas, setLoadingAlertas] = useState(false);
  const [errorAlertas, setErrorAlertas] = useState<string | null>(null);

  const [seguimiento, setSeguimiento] = useState<SeguimientoTecnicoBackend | null>(null);
  const [loadingSeguimiento, setLoadingSeguimiento] = useState(false);
  const [registrandoAdvertencia, setRegistrandoAdvertencia] = useState(false);
  const [cambiandoFase, setCambiandoFase] = useState(false);
  const [anulandoAdvertencia, setAnulandoAdvertencia] = useState(false);
  const [eliminandoAdvertencia, setEliminandoAdvertencia] = useState(false);

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
      setKpiResumen(null);
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
    setLoadingSeguimiento(true);

    let cancelled = false;

    const load = async () => {
      const [rendData, resumenData, histData, alertData, segData] = await Promise.all([
        getRendimientoDiario({
          codigo_sap: selectedCodigoSap,
          fecha_desde: fechaOperacional,
          fecha_hasta: fechaOperacional,
          limit: 1,
        }).catch(() => []),
        fechaOperacional
          ? getResumenKpisTecnico(selectedCodigoSap, fechaOperacional).catch(() => null)
          : Promise.resolve(null),
        getHistorial({ codigo_sap: selectedCodigoSap }).catch(() => []),
        getAlertas({ codigo_sap: selectedCodigoSap }).catch(() => []),
        getSeguimientoTecnico(selectedCodigoSap).catch(() => null),
      ]);

      if (cancelled) return;

      setRendimiento(rendData[0] ?? null);
      setRendimientoList(rendData);
      setKpiResumen(resumenData);
      setLoadingRendimiento(false);
      setErrorRendimiento(null);

      setHistorial(histData);
      setLoadingHistorial(false);
      setErrorHistorial(null);

      setAlertas(alertData);
      setLoadingAlertas(false);
      setErrorAlertas(null);

      setSeguimiento(segData);
      setLoadingSeguimiento(false);
    };

    load();

    return () => { cancelled = true; };
  }, [selectedCodigoSap, fechaOperacional]);

  const refreshAlertas = useCallback(async (sap: string) => {
    const alertData = await getAlertas({ codigo_sap: sap }).catch(() => [] as AlertaItemBackend[]);
    setAlertas(alertData);
  }, []);

  const registrarAdvertenciaFn = useCallback(async (codigoSap: string, fechaOperacional: string, motivo: string) => {
    setRegistrandoAdvertencia(true);
    try {
      const result = await apiRegistrarAdvertencia(codigoSap, {
        fecha_operacional: fechaOperacional,
        motivo,
      });
      const [segData] = await Promise.all([
        getSeguimientoTecnico(codigoSap).catch(() => null),
        refreshAlertas(codigoSap),
      ]);
      setSeguimiento(segData);
      return result;
    } finally {
      setRegistrandoAdvertencia(false);
    }
  }, [refreshAlertas]);

  const cambiarFase = useCallback(async (codigoSap: string, faseNueva: number, motivo: string) => {
    setCambiandoFase(true);
    try {
      const result = await apiCambiarFase(codigoSap, { fase_nueva: faseNueva, motivo });
      // Refrescar seguimiento y lista de técnicos
      const [segData, tecData] = await Promise.all([
        getSeguimientoTecnico(codigoSap).catch(() => null),
        getTecnicos().catch(() => null),
      ]);
      setSeguimiento(segData);
      if (tecData) {
        setTecnicosRaw(tecData);
        setTecnicos(tecData.map(mapTecnico));
      }
      return result;
    } finally {
      setCambiandoFase(false);
    }
  }, []);

  const anularAdvertenciaFn = useCallback(async (advertenciaId: number, motivo: string) => {
    setAnulandoAdvertencia(true);
    try {
      const result = await apiAnularAdvertencia(advertenciaId, { motivo_anulacion: motivo });
      const sap = seguimiento?.codigo_sap ?? '';
      const [segData] = await Promise.all([
        getSeguimientoTecnico(sap).catch(() => null),
        refreshAlertas(sap),
      ]);
      setSeguimiento(segData);
      return result;
    } finally {
      setAnulandoAdvertencia(false);
    }
  }, [seguimiento?.codigo_sap, refreshAlertas]);

  const eliminarAdvertenciaFn = useCallback(async (advertenciaId: number) => {
    setEliminandoAdvertencia(true);
    try {
      const result = await apiEliminarAdvertencia(advertenciaId);
      const sap = seguimiento?.codigo_sap ?? '';
      const [segData] = await Promise.all([
        getSeguimientoTecnico(sap).catch(() => null),
        refreshAlertas(sap),
      ]);
      setSeguimiento(segData);
      return result;
    } finally {
      setEliminandoAdvertencia(false);
    }
  }, [seguimiento?.codigo_sap, refreshAlertas]);

  return {
    tecnicos,
    tecnicosRaw,
    loadingTecnicos,
    errorTecnicos,
    selectedTecnico,
    selectTecnico,
    rendimiento,
    rendimientoList,
    kpiResumen,
    loadingRendimiento,
    errorRendimiento,
    historial,
    loadingHistorial,
    errorHistorial,
    alertas,
    loadingAlertas,
    errorAlertas,
    seguimiento,
    loadingSeguimiento,
    registrandoAdvertencia,
    registrarAdvertencia: registrarAdvertenciaFn,
    cambiandoFase,
    cambiarFase,
    anulandoAdvertencia,
    anularAdvertencia: anularAdvertenciaFn,
    eliminandoAdvertencia,
    eliminarAdvertencia: eliminarAdvertenciaFn,
    refetchTecnicos: fetchTecnicos,
  };
}


0