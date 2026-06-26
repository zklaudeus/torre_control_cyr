import { useState, useCallback, useEffect } from 'react';
import { getBrigadas, createBrigada } from '../api/brigadasDia.api';
import { compararBrigadasDiaActual } from '../utils/inicio-dia/compararBrigadasDiaActual';
import type { ComparacionBrigadaDia } from '../utils/inicio-dia/compararBrigadasDiaActual';
import { prepararBrigadasDesdeDiaAnterior } from '../utils/inicio-dia/prepararBrigadasDesdeDiaAnterior';
import { calcularFechaAnterior } from '../utils/inicio-dia/calcularFechaAnterior';
import { getZonasActivas } from '../api/parametros.api';
import type { ParametroZona } from '../types/programacionZona';

export const useCrearDesdeDiaAnterior = (fechaActual: string) => {
  const [fechaOrigen, setFechaOrigen] = useState<string>(calcularFechaAnterior(fechaActual));
  const [comparacion, setComparacion] = useState<ComparacionBrigadaDia[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [brigadasActuales, setBrigadasActuales] = useState<any[]>([]);
  const [zonas, setZonas] = useState<ParametroZona[]>([]);

  useEffect(() => {
    getZonasActivas().then(setZonas).catch(console.error);
  }, []);

  const buscarBrigadasOrigen = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const [brigadasOrigen, brigadasActualesRes] = await Promise.all([
        getBrigadas(fechaOrigen),
        getBrigadas(fechaActual)
      ]);

      if (brigadasOrigen.length === 0) {
        setError('No se encontraron brigadas en la fecha de origen.');
        setComparacion(null);
        setBrigadasActuales(brigadasActualesRes);
        return;
      }

      setBrigadasActuales(brigadasActualesRes);
      const comp = compararBrigadasDiaActual(brigadasOrigen, brigadasActualesRes);
      setComparacion(comp);
    } catch (err: any) {
      console.error(err);
      setError('Error al buscar brigadas de origen');
    } finally {
      setLoading(false);
    }
  }, [fechaActual, fechaOrigen]);

  const toggleAplicar = useCallback((index: number) => {
    setComparacion((prev) => {
      if (!prev) return prev;
      const newComp = [...prev];
      if (newComp[index].estado === 'crear') {
        newComp[index].aplicar = !newComp[index].aplicar;
      }
      return newComp;
    });
  }, []);

  const limpiar = useCallback(() => {
    setComparacion(null);
    setError(null);
    setSuccess(null);
  }, []);

  const restablecerCambios = useCallback(() => {
    buscarBrigadasOrigen();
  }, [buscarBrigadasOrigen]);

  const updateRow = useCallback((index: number, field: string, value: string) => {
    setComparacion((prev) => {
      if (!prev) return prev;
      const newComp = [...prev];
      const b = { ...newComp[index].brigadaOrigen, [field]: value };
      
      let estado = newComp[index].estado;
      let aplicar = newComp[index].aplicar;

      if (field === 'codigo_sap' || field === 'tipo_brigada') {
        const existe = brigadasActuales.find(
          (ba) => ba.codigo_sap === b.codigo_sap && ba.tipo_brigada === b.tipo_brigada
        );
        if (existe) {
          estado = 'ya_existe';
          aplicar = false;
        } else {
          estado = 'crear';
          aplicar = true;
        }
      }

      newComp[index] = {
        ...newComp[index],
        brigadaOrigen: b,
        estado: estado as any,
        aplicar
      };
      
      return newComp;
    });
  }, [brigadasActuales]);

  const deleteRow = useCallback((index: number) => {
    setComparacion((prev) => {
      if (!prev) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const crearBrigadas = useCallback(async () => {
    if (!comparacion) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const aCrear = comparacion.filter((c) => c.aplicar && c.estado === 'crear');
      
      if (aCrear.length === 0) {
        setError('No hay brigadas seleccionadas para crear.');
        return;
      }

      // Validar campos obligatorios
      for (const item of aCrear) {
        const b = item.brigadaOrigen;
        if (!b.zona || !b.codigo_sap || !b.patente || !b.usuario || !b.tipo_brigada || !b.estado_brigada) {
          setError('Hay brigadas seleccionadas con campos obligatorios vacíos. Por favor complete todos los datos.');
          setSaving(false);
          return;
        }
      }

      // Validar duplicados
      const keys = new Set(brigadasActuales.map(ba => `${fechaActual}-${ba.codigo_sap}-${ba.tipo_brigada}`));
      for (const item of aCrear) {
        const b = item.brigadaOrigen;
        const key = `${fechaActual}-${b.codigo_sap}-${b.tipo_brigada}`;
        if (keys.has(key)) {
          setError(`Duplicado detectado: El SAP ${b.codigo_sap} con tipo ${b.tipo_brigada} ya existe o está repetido en la selección.`);
          setSaving(false);
          return;
        }
        keys.add(key);
      }

      let creadas = 0;
      let errores = 0;

      for (const item of aCrear) {
        try {
          const nueva = prepararBrigadasDesdeDiaAnterior(item.brigadaOrigen, fechaActual);
          await createBrigada(nueva);
          creadas++;
        } catch (e) {
          console.error(e);
          errores++;
        }
      }

      if (errores > 0) {
        setError(`Se crearon ${creadas} brigadas, pero hubo ${errores} errores.`);
      } else {
        setSuccess(`Se crearon ${creadas} brigadas exitosamente.`);
      }
      
      // Refrescar comparación
      await buscarBrigadasOrigen();
    } catch (err: any) {
      console.error(err);
      setError('Error general al crear brigadas.');
    } finally {
      setSaving(false);
    }
  }, [comparacion, fechaActual, buscarBrigadasOrigen]);

  const addRow = useCallback(() => {
    setComparacion((prev) => {
      const current = prev || [];
      const newBrigada: ComparacionBrigadaDia = {
        brigadaOrigen: {
          id: `manual-${Date.now()}`,
          zona: '',
          codigo_sap: '',
          patente: '',
          usuario: '',
          brigada: '',
          pareja: '',
          tipo_brigada: 'PXQ',
          estado_brigada: 'Operativa',
          fecha: fechaActual,
        } as any,
        estado: 'crear',
        aplicar: true,
      };
      return [newBrigada, ...current];
    });
  }, [fechaActual]);

  return {
    fechaOrigen,
    setFechaOrigen,
    comparacion,
    loading,
    saving,
    error,
    success,
    buscarBrigadasOrigen,
    toggleAplicar,
    limpiar,
    restablecerCambios,
    updateRow,
    deleteRow,
    addRow,
    crearBrigadas,
    zonas
  };
};
