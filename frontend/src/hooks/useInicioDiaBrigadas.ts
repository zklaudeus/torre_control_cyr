import { useState, useCallback } from 'react';
import { getBrigadas, createBrigada, updateBrigada } from '../api/brigadasDia.api';
import { parseBrigadasIniciales } from '../utils/inicio-dia/parseBrigadasIniciales';
import type { BrigadaParseada } from '../utils/inicio-dia/parseBrigadasIniciales';
import { compararBrigadasIniciales } from '../utils/inicio-dia/compararBrigadasIniciales';
import type { ComparacionFila } from '../utils/inicio-dia/compararBrigadasIniciales';
import type { BrigadaDiariaCreate } from '../types/brigadaDia';

export const useInicioDiaBrigadas = (fechaOperacional: string) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [comparacion, setComparacion] = useState<ComparacionFila[] | null>(null);

  const procesarTexto = useCallback(async (texto: string) => {
    setLoading(true);
    setError(null);
    try {
      const recibidas = parseBrigadasIniciales(texto);
      if (recibidas.length === 0) {
        setError('No se pudo extraer ninguna fila válida de los datos pegados.');
        setComparacion(null);
        return;
      }
      const actuales = await getBrigadas(fechaOperacional);
      const resultado = compararBrigadasIniciales(actuales, recibidas);
      setComparacion(resultado);
    } catch (err) {
      console.error(err);
      setError('Error al procesar los datos o cargar brigadas actuales.');
    } finally {
      setLoading(false);
    }
  }, [fechaOperacional]);

  const toggleAplicar = (idUnico: string) => {
    setComparacion(prev => {
      if (!prev) return null;
      return prev.map(f => f.id_unico === idUnico ? { ...f, aplicar: !f.aplicar } : f);
    });
  };

  const limpiarImportacion = () => {
    setComparacion(null);
    setError(null);
    setSuccess(null);
  };

  const aplicarCambios = async () => {
    if (!comparacion) return;
    const aAplicar = comparacion.filter(f => f.aplicar);
    if (aAplicar.length === 0) {
      setError('No hay filas seleccionadas para aplicar.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      for (const fila of aAplicar) {
        if (fila.estado === 'Nueva brigada' && fila.datosRecibidos) {
          const payload: BrigadaDiariaCreate = {
            fecha_operacional: fechaOperacional,
            zona: fila.datosRecibidos.zona,
            codigo_sap: fila.datosRecibidos.codigo_sap,
            patente: fila.datosRecibidos.patente,
            usuario: fila.datosRecibidos.usuario,
            brigada: fila.datosRecibidos.brigada || fila.datosRecibidos.usuario || null,
            pareja: fila.datosRecibidos.pareja || null,
            tipo_brigada: fila.datosRecibidos.tipo_brigada,
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
            corte_fuera_de_rango: 0,
            visita_fallida: 0,
          };
          await createBrigada(payload);
        } else if (fila.estado === 'Faltante' && fila.brigadaOriginal) {
          const payload: BrigadaDiariaCreate = {
            ...fila.brigadaOriginal,
            estado_brigada: 'Inactiva',
            observacion_brigada: 'No reportada en bitácora inicial del supervisor',
          };
          await updateBrigada(fila.brigadaOriginal.id, payload);
        } else if (fila.brigadaOriginal && fila.datosRecibidos) {
          // Cambios (Patente, Usuario, Zona)
          const payload: BrigadaDiariaCreate = {
            ...fila.brigadaOriginal,
            patente: fila.datosRecibidos.patente || fila.brigadaOriginal.patente,
            usuario: fila.datosRecibidos.usuario || fila.brigadaOriginal.usuario,
            brigada: fila.datosRecibidos.brigada || fila.brigadaOriginal.brigada,
            pareja: fila.datosRecibidos.pareja || fila.brigadaOriginal.pareja,
            zona: fila.datosRecibidos.zona || fila.brigadaOriginal.zona,
          };
          await updateBrigada(fila.brigadaOriginal.id, payload);
        }
      }

      setSuccess('Cambios aplicados correctamente.');
      // Refresh current
      const actuales = await getBrigadas(fechaOperacional);
      // We could re-run comparison against the same received data to show updated state
      const recibidas = comparacion
        .map(c => c.datosRecibidos)
        .filter((r): r is BrigadaParseada => r !== undefined);
      
      const nuevoResultado = compararBrigadasIniciales(actuales, recibidas);
      setComparacion(nuevoResultado);
    } catch (err) {
      console.error(err);
      setError('Ocurrió un error al guardar algunos cambios. Revisa la consola o intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  return {
    loading,
    saving,
    error,
    success,
    comparacion,
    procesarTexto,
    toggleAplicar,
    limpiarImportacion,
    aplicarCambios
  };
};
