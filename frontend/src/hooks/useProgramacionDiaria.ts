import { useState, useCallback } from 'react';
import { getProgramacionZona } from '../api/programacionZona.api';
import type { ProgramacionZona } from '../types/programacionZona';

export const useProgramacionDiaria = (fechaOperacional: string) => {
  const [data, setData] = useState<ProgramacionZona[]>([]);

  const fetchProgramacion = useCallback(async () => {
    try {
      const res = await getProgramacionZona(fechaOperacional);
      setData(res);
    } catch (err) {
      console.error('Error fetching programacion data', err);
      throw err;
    }
  }, [fechaOperacional]);

  const handleChange = (
    zona: string,
    tipo_brigada: string,
    field: keyof ProgramacionZona,
    value: string,
  ) => {
    let n: number | '' = value === '' ? '' : parseInt(value, 10);

    if (n !== '' && (Number.isNaN(n) || n < 0)) {
      n = 0;
    }

    setData((prev) =>
      prev.map((p) =>
        p.zona === zona && p.tipo_brigada === tipo_brigada
          ? {
              ...p,
              [field]: n,
            }
          : p,
      ),
    );
  };

  return { programacionData: data, setProgramacionData: setData, fetchProgramacion, handleProgramacionChange: handleChange };
};
