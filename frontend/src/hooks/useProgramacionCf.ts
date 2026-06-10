import { useState, useCallback } from 'react';
import { getProgramacionCFZona } from '../api/cf.api';
import type { ProgramacionCFZona } from '../types/cf';

export const useProgramacionCf = (fechaOperacional: string) => {
  const [data, setData] = useState<ProgramacionCFZona[]>([]);

  const fetchCf = useCallback(async () => {
    try {
      const res = await getProgramacionCFZona(fechaOperacional);
      setData(res.zonas);
    } catch (err) {
      console.error('Error fetching CF data', err);
      throw err;
    }
  }, [fechaOperacional]);

  const handleChange = (
    zona: string,
    field: keyof ProgramacionCFZona,
    value: string,
  ) => {
    let n: number | '' = value === '' ? '' : parseInt(value, 10);

    if (n !== '' && (Number.isNaN(n) || n < 0)) {
      n = 0;
    }

    setData((prev) =>
      prev.map((c) =>
        c.zona === zona
          ? {
              ...c,
              [field]: n,
            }
          : c,
      ),
    );
  };

  return { cfData: data, setCfData: setData, fetchCf, handleCfChange: handleChange };
};
