import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

export interface UsuarioApp {
  id: string;
  nombre: string;
  usuario: string;
  rol: 'supervisor' | 'admin' | 'superadmin' | 'torre_control' | 'gerencia';
  zonasAsignadas?: string[];
  tiposBrigadaPermitidos?: ('PXQ' | 'CF')[];
  supervisorId?: number;
}

export type UserRole = 'supervisor' | 'admin' | 'superadmin' | 'torre_control' | 'gerencia';

interface AuthContextType {
  user: UsuarioApp | null;
  login: (user: UsuarioApp) => void;
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

  const login = (user: UsuarioApp) => {
    setUser(user);
    localStorage.setItem('torreControlUser', JSON.stringify(user));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('torreControlUser');
    localStorage.removeItem('torreControlToken');
    window.location.href = '/login';
  };

  if (!isLoaded) return null; // Prevent flash of unauthenticated state

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
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
