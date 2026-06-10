import type { BrigadaDiaria } from '../../types/brigadaDia';

export interface ComparacionBrigadaDia {
  brigadaOrigen: BrigadaDiaria;
  estado: 'crear' | 'ya_existe' | 'error';
  mensajeError?: string;
  aplicar: boolean;
}

export const compararBrigadasDiaActual = (
  brigadasOrigen: BrigadaDiaria[],
  brigadasActuales: BrigadaDiaria[]
): ComparacionBrigadaDia[] => {
  return brigadasOrigen.map((bo) => {
    // Check if it already exists in actual day
    // Match by codigo_sap, and tipo_brigada
    const existe = brigadasActuales.find(
      (ba) => ba.codigo_sap === bo.codigo_sap && ba.tipo_brigada === bo.tipo_brigada
    );

    if (existe) {
      return {
        brigadaOrigen: bo,
        estado: 'ya_existe',
        aplicar: false,
      };
    }

    return {
      brigadaOrigen: bo,
      estado: 'crear',
      aplicar: true,
    };
  });
};
