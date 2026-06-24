import { useEffect, useState } from 'react';
import { checkHealth, type HealthResponse } from '../api/health.api';

export const HomePage = () => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const data = await checkHealth();
        setHealth(data);
      } catch (err) {
        setError('No se pudo conectar con el backend');
      } finally {
        setLoading(false);
      }
    };

    fetchHealth();
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'var(--sans)' }}>
      <h1>Torre de Control CYR EISESA</h1>
      <h2>Beta funcional</h2>
      
      <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h3>Estado de conexión con backend:</h3>
        {loading && <p>Comprobando conexión...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {health && (
          <div>
            <p style={{ color: 'green', fontWeight: 'bold' }}>Backend conectado correctamente</p>
            <pre style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '4px' }}>
              {JSON.stringify(health, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
