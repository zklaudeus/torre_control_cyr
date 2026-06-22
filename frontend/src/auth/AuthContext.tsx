import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { UsuarioApp } from './supervisoresTemp';

export type UserRole = 'supervisor' | 'admin' | 'superadmin' | 'torre_control';

interface AuthContextType {
  user: UsuarioApp | null;
  loginAsSupervisor: (user: UsuarioApp) => void;
  loginAsAdmin: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UsuarioApp | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('torreControlUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoaded(true);
  }, []);

  const loginAsSupervisor = (supervisorUser: UsuarioApp) => {
    setUser(supervisorUser);
    localStorage.setItem('torreControlUser', JSON.stringify(supervisorUser));
  };

  const loginAsAdmin = () => {
    const adminUser: UsuarioApp = {
      id: 'admin-local',
      nombre: 'Administrador Local',
      usuario: 'admin',
      rol: 'admin'
    };
    setUser(adminUser);
    localStorage.setItem('torreControlUser', JSON.stringify(adminUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('torreControlUser');
    localStorage.removeItem('torreControlToken');
    window.location.href = '/login';
  };

  if (!isLoaded) return null; // Prevent flash of unauthenticated state

  return (
    <AuthContext.Provider value={{ user, loginAsSupervisor, loginAsAdmin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
