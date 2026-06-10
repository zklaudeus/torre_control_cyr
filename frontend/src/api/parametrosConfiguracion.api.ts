import type { ConfiguracionCompleta } from '../types/parametrosConfiguracion';

// Endpoint esperado en backend:
// GET /api/configuracion
// POST /api/configuracion

export const getConfiguracion = async (): Promise<ConfiguracionCompleta> => {
  // Simulación temporal porque no hay backend para esto
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        generales: {
          hora_inicio_operacion: '08:00',
          hora_cierre_operacion: '18:00',
          hora_corte_gps: '16:00',
          meta_diaria_cortes_pxq: 30,
          meta_diaria_cortes_cf: 6,
          meta_diaria_reconexiones: 15,
          tramo_horario_inicial: '09:00',
          tramo_horario_final: '14:00',
        },
        pxq: [
          { zona: 'Iquique', activa: true, brigadas_contrato: 5, meta_diaria_cortes: 30, meta_acumulada_09: 5, meta_acumulada_10: 10, meta_acumulada_11: 15, meta_acumulada_12: 20, meta_acumulada_13: 25, meta_acumulada_14: 30, hora_inicio: '08:00', hora_cierre: '18:00' },
          { zona: 'Coquimbo', activa: true, brigadas_contrato: 10, meta_diaria_cortes: 30, meta_acumulada_09: 5, meta_acumulada_10: 10, meta_acumulada_11: 15, meta_acumulada_12: 20, meta_acumulada_13: 25, meta_acumulada_14: 30, hora_inicio: '08:00', hora_cierre: '18:00' },
          { zona: 'Santa Cruz', activa: true, brigadas_contrato: 4, meta_diaria_cortes: 30, meta_acumulada_09: 5, meta_acumulada_10: 10, meta_acumulada_11: 15, meta_acumulada_12: 20, meta_acumulada_13: 25, meta_acumulada_14: 30, hora_inicio: '08:00', hora_cierre: '18:00' },
          { zona: 'Talca', activa: true, brigadas_contrato: 8, meta_diaria_cortes: 30, meta_acumulada_09: 5, meta_acumulada_10: 10, meta_acumulada_11: 15, meta_acumulada_12: 20, meta_acumulada_13: 25, meta_acumulada_14: 30, hora_inicio: '08:00', hora_cierre: '18:00' },
          { zona: 'Concepción', activa: true, brigadas_contrato: 6, meta_diaria_cortes: 30, meta_acumulada_09: 5, meta_acumulada_10: 10, meta_acumulada_11: 15, meta_acumulada_12: 20, meta_acumulada_13: 25, meta_acumulada_14: 30, hora_inicio: '08:00', hora_cierre: '18:00' },
          { zona: 'Los Ángeles', activa: true, brigadas_contrato: 5, meta_diaria_cortes: 30, meta_acumulada_09: 5, meta_acumulada_10: 10, meta_acumulada_11: 15, meta_acumulada_12: 20, meta_acumulada_13: 25, meta_acumulada_14: 30, hora_inicio: '08:00', hora_cierre: '18:00' },
          { zona: 'Chillán', activa: true, brigadas_contrato: 4, meta_diaria_cortes: 30, meta_acumulada_09: 5, meta_acumulada_10: 10, meta_acumulada_11: 15, meta_acumulada_12: 20, meta_acumulada_13: 25, meta_acumulada_14: 30, hora_inicio: '08:00', hora_cierre: '18:00' },
        ],
        cf: [
          { zona: 'Iquique', activa: false, brigadas_contrato: 0, meta_diaria_cortes: 6, meta_acumulada_09: 1, meta_acumulada_10: 1, meta_acumulada_11: 1, meta_acumulada_12: 1, meta_acumulada_13: 1, meta_acumulada_14: 1, hora_inicio: '08:00', hora_cierre: '14:00' },
          { zona: 'Coquimbo', activa: true, brigadas_contrato: 4, meta_diaria_cortes: 6, meta_acumulada_09: 1, meta_acumulada_10: 1, meta_acumulada_11: 1, meta_acumulada_12: 1, meta_acumulada_13: 1, meta_acumulada_14: 1, hora_inicio: '08:00', hora_cierre: '14:00' },
          { zona: 'Santa Cruz', activa: false, brigadas_contrato: 0, meta_diaria_cortes: 6, meta_acumulada_09: 1, meta_acumulada_10: 1, meta_acumulada_11: 1, meta_acumulada_12: 1, meta_acumulada_13: 1, meta_acumulada_14: 1, hora_inicio: '08:00', hora_cierre: '14:00' },
          { zona: 'Talca', activa: true, brigadas_contrato: 3, meta_diaria_cortes: 6, meta_acumulada_09: 1, meta_acumulada_10: 1, meta_acumulada_11: 1, meta_acumulada_12: 1, meta_acumulada_13: 1, meta_acumulada_14: 1, hora_inicio: '08:00', hora_cierre: '14:00' },
          { zona: 'Concepción', activa: false, brigadas_contrato: 0, meta_diaria_cortes: 6, meta_acumulada_09: 1, meta_acumulada_10: 1, meta_acumulada_11: 1, meta_acumulada_12: 1, meta_acumulada_13: 1, meta_acumulada_14: 1, hora_inicio: '08:00', hora_cierre: '14:00' },
          { zona: 'Los Ángeles', activa: false, brigadas_contrato: 0, meta_diaria_cortes: 6, meta_acumulada_09: 1, meta_acumulada_10: 1, meta_acumulada_11: 1, meta_acumulada_12: 1, meta_acumulada_13: 1, meta_acumulada_14: 1, hora_inicio: '08:00', hora_cierre: '14:00' },
          { zona: 'Chillán', activa: false, brigadas_contrato: 0, meta_diaria_cortes: 6, meta_acumulada_09: 1, meta_acumulada_10: 1, meta_acumulada_11: 1, meta_acumulada_12: 1, meta_acumulada_13: 1, meta_acumulada_14: 1, hora_inicio: '08:00', hora_cierre: '14:00' },
        ],
        automatizacion: {
          alerta_sin_brigadas: true,
          alerta_brigadas_efectivas: true,
          calcular_cumplimiento_carga: true,
          calcular_promedio_cortes: true,
          calcular_promedio_reconexiones: true,
          calcular_total_actividades: true,
          calcular_cumplimiento_promedio: true,
          generar_observacion_automatica: true,
        }
      });
    }, 500);
  });
};

export const saveConfiguracion = async (_data: ConfiguracionCompleta): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 500);
  });
};
