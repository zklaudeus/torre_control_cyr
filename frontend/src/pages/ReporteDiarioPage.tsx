import { useState, useEffect } from 'react';
import { createOrGetReporte, getReportes } from '../api/reportes.api';
import type { ReporteCYR } from '../types/reporte';

interface ReporteDiarioPageProps {
  onSelectReporte: (fecha: string) => void;
  onChangeView: (view: 'reporte' | 'programacion' | 'brigadas') => void;
}

export const ReporteDiarioPage = ({ onSelectReporte, onChangeView }: ReporteDiarioPageProps) => {
  const [fecha, setFecha] = useState<string>('');
  const [reporteActual, setReporteActual] = useState<ReporteCYR | null>(null);
  const [reportesRecientes, setReportesRecientes] = useState<ReporteCYR[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReportes();
  }, []);

  const fetchReportes = async () => {
    try {
      const data = await getReportes();
      setReportesRecientes(data);
    } catch (err) {
      console.error('Error fetching reportes', err);
    }
  };

  const handleCrearAbrir = async () => {
    if (!fecha) {
      setError('La fecha es obligatoria');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const reporte = await createOrGetReporte({ fecha_operacional: fecha });
      setReporteActual(reporte);
      onSelectReporte(reporte.fecha_operacional);
      fetchReportes(); // Refresh list
    } catch (err) {
      setError('Error al comunicar con el backend');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Reporte diario CYR</h1>
      
      <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h3>Seleccionar Fecha Operacional</h3>
        <input 
          type="date" 
          value={fecha} 
          onChange={(e) => setFecha(e.target.value)} 
          style={{ padding: '0.5rem', marginRight: '1rem' }}
        />
        <button 
          onClick={handleCrearAbrir} 
          disabled={loading}
          style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}
        >
          {loading ? 'Cargando...' : 'Crear / Abrir reporte'}
        </button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>

      {reporteActual && (
        <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #4CAF50', borderRadius: '8px' }}>
          <h3 style={{ color: '#4CAF50' }}>Reporte Activo</h3>
          <p><strong>Fecha:</strong> {reporteActual.fecha_operacional}</p>
          <p><strong>Estado:</strong> {reporteActual.estado}</p>
          <p style={{ color: 'gray', fontSize: '0.9rem' }}>ID: {reporteActual.id}</p>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button 
              onClick={() => onChangeView('programacion')}
              style={{ padding: '0.5rem 1rem', cursor: 'pointer', background: '#2196F3', color: 'white', border: 'none', borderRadius: '4px' }}
            >
              Ir a Programación por Zona
            </button>
            <button 
              onClick={() => onChangeView('brigadas')}
              style={{ padding: '0.5rem 1rem', cursor: 'pointer', background: '#9C27B0', color: 'white', border: 'none', borderRadius: '4px' }}
            >
              Ir a Brigadas del Día
            </button>
          </div>
        </div>
      )}

      <div>
        <h3>Reportes Recientes</h3>
        {reportesRecientes.length === 0 ? (
          <p>No hay reportes recientes.</p>
        ) : (
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            {reportesRecientes.map(r => (
              <li key={r.id} style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>
                {r.fecha_operacional} - <span style={{ color: 'gray' }}>{r.estado}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
