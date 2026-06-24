import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';

export const LoginPage = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await apiClient.post('/api/auth/login', {
        usuario: username,
        password: password
      });

      const { access_token, user } = response.data;

      localStorage.setItem('torreControlToken', access_token);

      const mappedUser = {
        id: String(user.id),
        nombre: user.usuario,
        usuario: user.usuario,
        rol: user.rol,
        supervisorId: user.supervisor_id,
      };

      login(mappedUser as any);

      if (mappedUser.rol === 'supervisor') {
        navigate('/supervisor/bitacora');
      } else if (mappedUser.rol === 'torre_control' || mappedUser.rol === 'gerencia') {
        navigate('/torre-control/dashboard-cyr');
      } else {
        navigate('/torre-control/inicio-dia');
      }
    } catch (err: any) {
      console.warn("Backend login falló", err);
      setError('Credenciales incorrectas');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-main)',
      color: 'var(--text-main)',
      fontFamily: 'var(--sans)',
      padding: '1rem'
    }}>
      <div style={{
        background: 'var(--bg-panel)',
        padding: '2.5rem',
        borderRadius: '16px',
        border: `1px solid var(--border)`,
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        boxSizing: 'border-box'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <span style={{
              width: '10px', height: '10px', borderRadius: '50%',
              background: 'var(--secondary)',
              boxShadow: `0 0 12px var(--secondary)`,
            }} />
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>EISESA</h1>
          </div>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>Torre Control CyR</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Usuario</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Ej: juan.munoz"
              style={{
                width: '100%', padding: '0.75rem', borderRadius: '8px', border: `1px solid var(--border)`,
                background: 'var(--bg-main)', color: 'var(--text-main)', boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••"
              style={{
                width: '100%', padding: '0.75rem', borderRadius: '8px', border: `1px solid var(--border)`,
                background: 'var(--bg-main)', color: 'var(--text-main)', boxSizing: 'border-box'
              }}
            />
          </div>

          {error && <div style={{ color: '#FF4D4D', fontSize: '0.85rem', textAlign: 'center' }}>{error}</div>}

          <button type="submit" style={{
            marginTop: '0.5rem', padding: '0.8rem', background: 'var(--primary)', color: 'var(--text-main)',
            border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer',
            transition: 'background 0.2s'
          }}>
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
};
