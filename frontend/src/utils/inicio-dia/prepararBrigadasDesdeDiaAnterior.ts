import type { BrigadaDiaria, BrigadaDiariaCreate } from '../../types/brigadaDia';

export const prepararBrigadasDesdeDiaAnterior = (
  brigadaOrigen: BrigadaDiaria,
  fechaActual: string
): BrigadaDiariaCreate => {
  return {
    fecha_operacional: fechaActual,
    zona: brigadaOrigen.zona,
    codigo_sap: brigadaOrigen.codigo_sap,
    patente: brigadaOrigen.patente,
    usuario: brigadaOrigen.usuario,
    tipo_brigada: brigadaOrigen.tipo_brigada,
    estado_brigada: brigadaOrigen.estado_brigada,
    // Limpiar campos
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
    visita_fallida: 0,
  };
};
