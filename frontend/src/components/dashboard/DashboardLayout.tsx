import type { ReactNode } from 'react';
import type { FormularioActivo } from '../../types/dashboard';

interface DashboardLayoutProps {
  children: ReactNode;
  formularioActivo?: FormularioActivo;
  onChangeFormulario?: (form: FormularioActivo) => void;
  activeSection?: string;
  onChangeSection?: (section: string) => void;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', minWidth: 0 }}>
      {children}
    </div>
  );
};
