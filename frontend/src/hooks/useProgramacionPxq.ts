import { useState, useCallback } from 'react';
import { getProgramacionZona } from '../api/programacionZona.api';
import type { ProgramacionZona } from '../types/programacionZona';

export const useProgramacionPxq = (fechaOperacional: string) => {
  const [data, setData] = useState<ProgramacionZona[]>([]);

  const fetchPxq = useCallback(async () => {
    try {
      const res = await getProgramacionZona(fechaOperacional);
      setData(res);
    } catch (err) {
      console.error('Error fetching PXQ data', err);
      throw err;
    }
  }, [fechaOperacional]);

  const handleChange = (
    zona: string,
    field: keyof ProgramacionZona,
    value: string,
  ) => {
    let n: number | '' = value === '' ? '' : parseInt(value, 10);

    if (n !== '' && (Number.isNaN(n) || n < 0)) {
      n = 0;
    }

    setData((prev) =>
      prev.map((p) =>
        p.zona === zona
          ? {
              ...p,
              [field]: n,
            }
          : p,
      ),
    );
  };

  return { pxqData: data, setPxqData: setData, fetchPxq, handlePxqChange: handleChange };
};
