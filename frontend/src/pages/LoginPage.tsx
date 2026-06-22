import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { USUARIOS_TEMP } from '../auth/supervisoresTemp';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';

// Kinetic Analytics palette
const K = {
  primary:     '#0B7BFF',   // electric blue
  secondary:   '#08E5FF',   // cyan
  tertiary:    '#0A192F',   // deep navy
  tertiaryMid: '#102240',   // mid navy
  neutral:     '#F8FAFC',   // white
  mutedText:   '#64849F',   // muted blue-grey
  border:      '#1C3454',   // subtle border
};

export const LoginPage = () => {
  const { loginAsSupervisor, loginAsAdmin } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // 1. Intentar login en el backend
      const response = await apiClient.post('/api/auth/login', {
        usuario: username,
        password: password
      });

      const { access_token, user } = response.data;
      
      // Guardar token
      localStorage.setItem('torreControlToken', access_token);
      
      // Mapear user del backend a UsuarioApp del frontend
      const mappedUser = {
        id: String(user.id),
        nombre: user.usuario, // El backend por ahora devuelve el usuario
        usuario: user.usuario,
        rol: user.rol,
        supervisorId: user.supervisor_id
      };

      loginAsSupervisor(mappedUser as any);
      
      if (mappedUser.rol === 'supervisor') {
        navigate('/supervisor/bitacora');
      } else if (mappedUser.rol === 'torre_control') {
        navigate('/torre-control/dashboard-cyr');
      } else {
        navigate('/torre-control/inicio-dia');
      }
      return;
    } catch (err: any) {
      console.warn("Backend login falló, intentando fallback local", err);
      // 2. Fallback a USUARIOS_TEMP si el backend falla o el usuario no está en BD
      const supervisor = USUARIOS_TEMP.find(s => {
        const decodedTargetPass = s.password && s.password === btoa('admin123') ? atob(s.password) : s.password;
        return s.usuario === username && decodedTargetPass === password;
      });
      
      if (supervisor) {
        const { password: _, ...userWithoutPassword } = supervisor;
        loginAsSupervisor(userWithoutPassword);
        if (userWithoutPassword.rol === 'supervisor') {
          navigate('/supervisor/bitacora');
        } else if (userWithoutPassword.rol === 'torre_control') {
          navigate('/torre-control/dashboard-cyr');
        } else {
          navigate('/torre-control/inicio-dia');
        }
      } else {
        setError('Credenciales incorrectas');
      }
    }
  };

  const handleAdminBypass = () => {
    loginAsAdmin();
    navigate('/torre-control/inicio-dia');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: K.tertiary,
      color: K.neutral,
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <div style={{
        background: K.tertiaryMid,
        padding: '2.5rem',
        borderRadius: '16px',
        border: `1px solid ${K.border}`,
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <span style={{
              width: '10px', height: '10px', borderRadius: '50%',
              background: K.secondary,
              boxShadow: `0 0 12px ${K.secondary}`,
            }} />
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Torre de Control</h1>
          </div>
          <p style={{ color: K.mutedText, margin: 0, fontSize: '0.9rem' }}>Acceso Operaciones CyR</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: K.mutedText }}>Usuario</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Ej: juan.munoz"
              style={{
                width: '100%', padding: '0.75rem', borderRadius: '8px', border: `1px solid ${K.border}`,
                background: K.tertiary, color: K.neutral, boxSizing: 'border-box'
              }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: K.mutedText }}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••"
              style={{
                width: '100%', padding: '0.75rem', borderRadius: '8px', border: `1px solid ${K.border}`,
                background: K.tertiary, color: K.neutral, boxSizing: 'border-box'
              }}
            />
          </div>

          {error && <div style={{ color: '#FF4D4D', fontSize: '0.85rem', textAlign: 'center' }}>{error}</div>}

          <button type="submit" style={{
            marginTop: '0.5rem', padding: '0.8rem', background: K.primary, color: K.neutral,
            border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer',
            transition: 'background 0.2s'
          }}>
            Ingresar
          </button>
        </form>

        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: `1px solid ${K.border}`, textAlign: 'center' }}>
          <p style={{ fontSize: '0.8rem', color: K.mutedText, marginBottom: '1rem' }}>¿Eres administrador global?</p>
          <button onClick={handleAdminBypass} style={{
            padding: '0.6rem 1rem', background: 'transparent', color: K.secondary,
            border: `1px solid ${K.secondary}33`, borderRadius: '8px', fontSize: '0.85rem', cursor: 'pointer'
          }}>
            Entrar como Administrador
          </button>
        </div>
      </div>
    </div>
  );
};
