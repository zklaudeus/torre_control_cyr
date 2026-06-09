import { useState, useEffect } from 'react';
import { getProgramacionZona, bulkCreateOrUpdateProgramacion } from '../api/programacionZona.api';
import type { ProgramacionZona } from '../types/programacionZona';

interface ProgramacionZonaPageProps {
  fechaOperacional: string;
  onBack: () => void;
}

export const ProgramacionZonaPage = ({ fechaOperacional, onBack }: ProgramacionZonaPageProps) => {
  const [programacion, setProgramacion] = useState<ProgramacionZona[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchProgramacion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechaOperacional]);

  const fetchProgramacion = async () => {
    setLoading(true);
    try {
      const data = await getProgramacionZona(fechaOperacional);
      setProgramacion(data);
    } catch (err) {
      setError('Error al cargar la programación de zonas');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (zonaName: string, field: keyof ProgramacionZona, value: string) => {
    // Evitar negativos
    let numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue < 0) numValue = 0;

    setProgramacion(prev => 
      prev.map(p => p.zona === zonaName ? { ...p, [field]: numValue } : p)
    );
  };

  const handleGuardar = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const items = programacion.map(p => ({
        zona: p.zona,
        reconexiones_programadas: p.reconexiones_programadas,
        asignacion_carga: p.asignacion_carga,
        corte_programado: p.corte_programado,
      }));
      
      const res = await bulkCreateOrUpdateProgramacion({
        fecha_operacional: fechaOperacional,
        items
      });
      
      setProgramacion(res);
      setSuccess('Programación guardada exitosamente');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Error al guardar la programación');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Cargando programación...</p>;

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <button onClick={onBack} style={{ marginBottom: '1rem', cursor: 'pointer' }}>
        &larr; Volver a Reporte Diario
      </button>

      <h1>Programación diaria por zona</h1>
      <h3 style={{ color: '#555' }}>Fecha operacional: {fechaOperacional}</h3>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green', fontWeight: 'bold' }}>{success}</p>}

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
        <thead>
          <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
            <th style={{ padding: '0.5rem', border: '1px solid #ccc' }}>Zona</th>
            <th style={{ padding: '0.5rem', border: '1px solid #ccc' }}>Reconexiones Programadas</th>
            <th style={{ padding: '0.5rem', border: '1px solid #ccc' }}>Asignación Carga</th>
            <th style={{ padding: '0.5rem', border: '1px solid #ccc' }}>Corte Programado</th>
          </tr>
        </thead>
        <tbody>
          {programacion.map(p => (
            <tr key={p.zona}>
              <td style={{ padding: '0.5rem', border: '1px solid #ccc' }}>{p.zona}</td>
              <td style={{ padding: '0.5rem', border: '1px solid #ccc' }}>
                <input 
                  type="number" 
                  min="0"
                  value={p.reconexiones_programadas} 
                  onChange={(e) => handleInputChange(p.zona, 'reconexiones_programadas', e.target.value)}
                  style={{ width: '100px' }}
                />
              </td>
              <td style={{ padding: '0.5rem', border: '1px solid #ccc' }}>
                <input 
                  type="number" 
                  min="0"
                  value={p.asignacion_carga} 
                  onChange={(e) => handleInputChange(p.zona, 'asignacion_carga', e.target.value)}
                  style={{ width: '100px' }}
                />
              </td>
              <td style={{ padding: '0.5rem', border: '1px solid #ccc' }}>
                <input 
                  type="number" 
                  min="0"
                  value={p.corte_programado} 
                  onChange={(e) => handleInputChange(p.zona, 'corte_programado', e.target.value)}
                  style={{ width: '100px' }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button 
        onClick={handleGuardar} 
        disabled={saving}
        style={{ marginTop: '2rem', padding: '0.5rem 1rem', cursor: 'pointer', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px' }}
      >
        {saving ? 'Guardando...' : 'Guardar programación'}
      </button>
    </div>
  );
};
