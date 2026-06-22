export interface BitacoraRow {
  id: string;
  patente: string;
  usuarioSap: string;
  cuenta: string;
  brigada: string;
  pareja: string;
  comuna: string;
  zona: string;
  carga: string;
  reconexiones: string;
  observacion: string;
  estado: 'Operativa' | 'Inactiva';
  tipoBrigada: 'PXQ' | 'CF';
  _errors?: Partial<Record<keyof BitacoraRow, string>>;
}

export interface ResumenZona {
  zona: string;
  totalBrigadas: number;
  corteTotal: number;
  reconexionesTotal: number;
  totalEnBandeja: number;
}

import type { SupervisorComunaZona, SupervisorUsuarioSAP } from '../../api/supervisores.api';

export const normalizeStr = (str: string) => str.trim().toLowerCase();
export const normalizarPatente = (val: string) => val.toUpperCase().replace(/\s/g, '').slice(0, 6);
export const normalizarTexto = (val: string) => val.trim().replace(/\s{2,}/g, ' ');

export const obtenerZonaPorComuna = (comuna: string, comunasMap: SupervisorComunaZona[]): string => {
  const norm = normalizeStr(comuna);
  const matchZona = comunasMap.find(c => normalizeStr(c.zona_principal) === norm);
  if (matchZona) return matchZona.zona_principal;

  const matchComuna = comunasMap.find(c => normalizeStr(c.comuna) === norm);
  return matchComuna ? matchComuna.zona_principal : '';
};

export const obtenerSapPorCuenta = (cuenta: string, sapMap: SupervisorUsuarioSAP[]): string => {
  const match = sapMap.find(c => normalizeStr(c.cuenta) === normalizeStr(cuenta));
  return match ? match.codigo_sap : '';
};

export const validarPatente = (patente: string): boolean => {
  const regex = /^[A-Za-z]{4}\d{2}$/;
  return regex.test(patente);
};

export const validarSap = (sap: string): boolean => {
  const regex = /^P\d{6}$/;
  return regex.test(sap);
};

export const parseNumber = (val: string): number => {
  const num = parseInt(val, 10);
  return isNaN(num) ? 0 : num;
};

export const validarFila = (
  row: BitacoraRow,
  existingRows: BitacoraRow[],
  editId: string | null,
  comunasMap: SupervisorComunaZona[],
  sapMap: SupervisorUsuarioSAP[]
): Partial<Record<keyof BitacoraRow, string>> => {
  const errors: Partial<Record<keyof BitacoraRow, string>> = {};

  if (!row.patente) {
    errors.patente = 'Obligatorio';
  } else if (!validarPatente(row.patente)) {
    errors.patente = 'Formato inválido (4 letras + 2 números)';
  }

  if (!row.cuenta) {
    errors.cuenta = 'Obligatorio';
  }

  if (!row.usuarioSap) {
    errors.usuarioSap = 'Obligatorio - seleccione una Cuenta';
  } else if (!validarSap(row.usuarioSap)) {
    errors.usuarioSap = 'Formato inválido (P + 6 números, ej: P004952)';
  } else {
    if (row.cuenta && row.usuarioSap) {
      const validSap = obtenerSapPorCuenta(row.cuenta, sapMap);
      if (validSap.toUpperCase() !== row.usuarioSap.toUpperCase()) {
        errors.usuarioSap = 'La combinación SAP/Cuenta no es válida';
      }
    }
    
    
    const dup = existingRows.find(r =>
      r.id !== editId &&
      r.usuarioSap.toUpperCase() === row.usuarioSap.toUpperCase() &&
      r.tipoBrigada === row.tipoBrigada
    );
    if (dup) {
      errors.usuarioSap = `SAP ya registrado para ${row.tipoBrigada} el día de hoy (${dup.patente})`;
    }
  }

  // Normalizar los textos antes de validar
  if (row.brigada) row.brigada = normalizarTexto(row.brigada);
  if (row.pareja) row.pareja = normalizarTexto(row.pareja);
  if (row.observacion) row.observacion = normalizarTexto(row.observacion);

  if (!row.brigada) {
    errors.brigada = 'Obligatorio';
  }

  if (!row.comuna) {
    errors.comuna = 'Obligatorio';
  } else if (!row.zona && !obtenerZonaPorComuna(row.comuna, comunasMap)) {
    errors.comuna = 'Comuna sin zona asociada';
  }

  if (!row.zona) {
    const derivedZone = obtenerZonaPorComuna(row.comuna, comunasMap);
    if (!derivedZone) {
      errors.zona = 'No se encontró zona válida';
    }
  }

  const cargaNum = parseNumber(row.carga);
  if (cargaNum < 0) {
    errors.carga = 'Debe ser >= 0';
  }

  const recNum = parseNumber(row.reconexiones);
  if (recNum < 0) {
    errors.reconexiones = 'Debe ser >= 0';
  }

  return errors;
};

export const validarBitacoraCompleta = (
  rows: BitacoraRow[], 
  editId: string | null, 
  comunasMap: SupervisorComunaZona[],
  sapMap: SupervisorUsuarioSAP[]
): BitacoraRow[] => {
  return rows.map(row => {
    const rowErrors = validarFila(row, rows, editId, comunasMap, sapMap);
    return { ...row, _errors: Object.keys(rowErrors).length > 0 ? rowErrors : undefined };
  });
};

export const calcularResumenPorZona = (rows: BitacoraRow[], comunasMap: SupervisorComunaZona[]): Record<string, ResumenZona> => {
  const resumen: Record<string, ResumenZona> = {};

  rows.forEach(row => {
    const zona = row.zona || obtenerZonaPorComuna(row.comuna, comunasMap);
    if (!zona) return; 

    if (!resumen[zona]) {
      resumen[zona] = {
        zona,
        totalBrigadas: 0,
        corteTotal: 0,
        reconexionesTotal: 0,
        totalEnBandeja: 0
      };
    }

    resumen[zona].totalBrigadas += 1;
    resumen[zona].corteTotal += parseNumber(row.carga);
    resumen[zona].reconexionesTotal += parseNumber(row.reconexiones);
    resumen[zona].totalEnBandeja += parseNumber(row.carga); 
  });

  return resumen;
};
