export interface BitacoraRow {
  id: string; // unique local ID for the table
  patente: string;
  usuarioSap: string;
  cuenta: string;
  brigada: string;
  pareja: string;
  comuna: string;
  carga: string; // string initially for input, parsed to number
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
  totalEnBandeja: number; // calculated from carga
}

export const SAP_CUENTA_TEMP = [
  { sap: "P004952", cuenta: "Claudio Escobar" },
  { sap: "P000375", cuenta: "David Guevara" },
  { sap: "P004950", cuenta: "Erick Oyarce" },
  { sap: "P004956", cuenta: "Fabian Lopez" },
  { sap: "P004984", cuenta: "Fabian Saavedra" },
  { sap: "P004984", cuenta: "Felipe Lopez" },
  { sap: "P003383", cuenta: "Gabriel Flores" },
  { sap: "P004953", cuenta: "Ignacio Salas" },
  { sap: "P003457", cuenta: "José Bravo" },
  { sap: "P004981", cuenta: "Jose Oliva" },
  { sap: "P002752", cuenta: "Juan Medina" },
  { sap: "P003372", cuenta: "Marck Sanhueza" },
  { sap: "P004949", cuenta: "Marco Candia" },
  { sap: "P004986", cuenta: "Marlon Cartes" },
  { sap: "P004951", cuenta: "Martin Sepulveda" },
  { sap: "P004983", cuenta: "Paulo Soto" },
  { sap: "P004561", cuenta: "Victor Faundez" },
  { sap: "P004985", cuenta: "Boris Cerro" },
  { sap: "P004985", cuenta: "Victor Gonzalez" },
  { sap: "P004954", cuenta: "Manuel Olivera" },
  { sap: "P004115", cuenta: "Miguel Bello" },
  { sap: "P003823", cuenta: "Rodrigo Muñoz" },
  { sap: "P003014", cuenta: "Andres Gatica" },
  { sap: "P002754", cuenta: "Cristian Ulloa" },
  { sap: "P004560", cuenta: "Sergio Castillo" }
];

export const COMUNA_ZONA_TEMP = [
  { comuna: "Concepción", zona: "Concepción" },
  { comuna: "Los Ángeles", zona: "Los Ángeles" },
  { comuna: "Chillán", zona: "Chillán" }
];

export const normalizeStr = (str: string) => str.trim().toLowerCase();

export const obtenerZonaPorComuna = (comuna: string): string => {
  const match = COMUNA_ZONA_TEMP.find(c => normalizeStr(c.comuna) === normalizeStr(comuna));
  return match ? match.zona : '';
};

export const obtenerSapPorCuenta = (cuenta: string): string => {
  const match = SAP_CUENTA_TEMP.find(c => normalizeStr(c.cuenta) === normalizeStr(cuenta));
  return match ? match.sap : '';
};

export const validarPatente = (patente: string): boolean => {
  const regex = /^[A-Za-z]{4}\d{2}$/;
  return regex.test(patente);
};

export const parseNumber = (val: string): number => {
  const num = parseInt(val, 10);
  return isNaN(num) ? 0 : num;
};

export const validarFila = (row: BitacoraRow, allSaps: string[]): Partial<Record<keyof BitacoraRow, string>> => {
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
    errors.usuarioSap = 'SAP no encontrado para la cuenta seleccionada';
  } else if (allSaps.filter(s => s.toUpperCase() === row.usuarioSap.toUpperCase()).length > 1) {
    errors.usuarioSap = 'SAP duplicado en la bitácora del día';
  }

  if (!row.brigada) {
    errors.brigada = 'Obligatorio';
  }

  if (!row.comuna) {
    errors.comuna = 'Obligatorio';
  } else if (!obtenerZonaPorComuna(row.comuna)) {
    errors.comuna = 'Comuna sin zona asociada';
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

export const validarBitacoraCompleta = (rows: BitacoraRow[]): BitacoraRow[] => {
  const allSaps = rows.map(r => r.usuarioSap?.trim()).filter(Boolean);
  return rows.map(row => {
    const rowErrors = validarFila(row, allSaps);
    return { ...row, _errors: Object.keys(rowErrors).length > 0 ? rowErrors : undefined };
  });
};

export const calcularResumenPorZona = (rows: BitacoraRow[]): Record<string, ResumenZona> => {
  const resumen: Record<string, ResumenZona> = {};

  rows.forEach(row => {
    const zona = obtenerZonaPorComuna(row.comuna);
    if (!zona) return; // ignorar si no tiene zona

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
    resumen[zona].totalEnBandeja += parseNumber(row.carga); // En las reglas dice "Total en bandeja = carga por zona"
  });

  return resumen;
};
