import type { BrigadaDiaria } from '../../types/brigadaDia';
import type { BrigadaParseada } from './parseBrigadasIniciales';

export type EstadoComparacion = 'Sin cambios' | 'Patente cambiada' | 'Usuario cambiado' | 'Brigada cambiada' | 'Pareja cambiada' | 'Zona cambiada' | 'Nueva brigada' | 'Faltante' | 'Error' | 'Advertencia';

export interface ComparacionFila {
  id_unico: string;
  estado: EstadoComparacion;
  brigadaOriginal?: BrigadaDiaria;
  datosRecibidos?: BrigadaParseada;
  accionSugerida: string;
  aplicar: boolean;
  observacion: string;
}

export const compararBrigadasIniciales = (actuales: BrigadaDiaria[], recibidas: BrigadaParseada[]): ComparacionFila[] => {
  const resultado: ComparacionFila[] = [];
  const procesadosSap = new Set<string>();

  // 1. Revisar las recibidas contra las actuales
  for (let i = 0; i < recibidas.length; i++) {
    const r = recibidas[i];
    const idUnico = `recibida-${i}`;
    
    if (!r.codigo_sap) {
      resultado.push({
        id_unico: idUnico,
        estado: 'Error',
        datosRecibidos: r,
        accionSugerida: 'Ignorar (Falta SAP)',
        aplicar: false,
        observacion: 'La fila no tiene código SAP válido.'
      });
      continue;
    }

    if (procesadosSap.has(r.codigo_sap)) {
      resultado.push({
        id_unico: idUnico,
        estado: 'Error',
        datosRecibidos: r,
        accionSugerida: 'Ignorar (Duplicado en Excel)',
        aplicar: false,
        observacion: `El SAP ${r.codigo_sap} viene duplicado en los datos pegados.`
      });
      continue;
    }
    
    procesadosSap.add(r.codigo_sap);

    const actual = actuales.find(a => a.codigo_sap === r.codigo_sap);

    if (!actual) {
      resultado.push({
        id_unico: idUnico,
        estado: 'Nueva brigada',
        datosRecibidos: r,
        accionSugerida: 'Crear nueva brigada',
        aplicar: true,
        observacion: 'Brigada no existe en la base actual.'
      });
      continue;
    }

    // Comparamos diferencias
    if (actual.zona !== r.zona && r.zona !== '') {
      resultado.push({
        id_unico: idUnico,
        estado: 'Zona cambiada',
        brigadaOriginal: actual,
        datosRecibidos: r,
        accionSugerida: 'Actualizar zona',
        aplicar: true,
        observacion: `Cambia de ${actual.zona} a ${r.zona}`
      });
    } else if (actual.patente !== r.patente && r.patente !== '') {
      resultado.push({
        id_unico: idUnico,
        estado: 'Patente cambiada',
        brigadaOriginal: actual,
        datosRecibidos: r,
        accionSugerida: 'Actualizar patente',
        aplicar: true,
        observacion: `Cambia de ${actual.patente} a ${r.patente}`
      });
    } else if (actual.usuario !== r.usuario && r.usuario !== '') {
      resultado.push({
        id_unico: idUnico,
        estado: 'Usuario cambiado',
        brigadaOriginal: actual,
        datosRecibidos: r,
        accionSugerida: 'Actualizar usuario',
        aplicar: true,
        observacion: `Cambia de ${actual.usuario} a ${r.usuario}`
      });
    } else if ((actual.brigada || '') !== r.brigada && r.brigada !== '') {
      resultado.push({
        id_unico: idUnico,
        estado: 'Brigada cambiada',
        brigadaOriginal: actual,
        datosRecibidos: r,
        accionSugerida: 'Actualizar brigada',
        aplicar: true,
        observacion: `Cambia de ${actual.brigada || '-'} a ${r.brigada}`
      });
    } else if ((actual.pareja || '') !== r.pareja && r.pareja !== '') {
      resultado.push({
        id_unico: idUnico,
        estado: 'Pareja cambiada',
        brigadaOriginal: actual,
        datosRecibidos: r,
        accionSugerida: 'Actualizar pareja',
        aplicar: true,
        observacion: `Cambia de ${actual.pareja || '-'} a ${r.pareja}`
      });
    } else {
      resultado.push({
        id_unico: idUnico,
        estado: 'Sin cambios',
        brigadaOriginal: actual,
        datosRecibidos: r,
        accionSugerida: 'Mantener igual',
        aplicar: false,
        observacion: 'Todos los datos coinciden.'
      });
    }
  }

  // 2. Revisar las actuales que NO vinieron en las recibidas
  for (const a of actuales) {
    if (!procesadosSap.has(a.codigo_sap) && a.estado_brigada !== 'Inactiva') {
      resultado.push({
        id_unico: `actual-${a.id}`,
        estado: 'Faltante',
        brigadaOriginal: a,
        accionSugerida: 'Marcar como Inactiva',
        aplicar: true,
        observacion: 'No reportada en bitácora inicial del supervisor'
      });
    }
  }

  // Sort by estado for better visualization
  const ordenEstados: Record<EstadoComparacion, number> = {
    'Error': 1,
    'Advertencia': 2,
    'Faltante': 3,
    'Nueva brigada': 4,
    'Zona cambiada': 5,
    'Usuario cambiado': 6,
    'Brigada cambiada': 7,
    'Pareja cambiada': 8,
    'Patente cambiada': 9,
    'Sin cambios': 10
  };

  resultado.sort((a, b) => ordenEstados[a.estado] - ordenEstados[b.estado]);

  return resultado;
};
