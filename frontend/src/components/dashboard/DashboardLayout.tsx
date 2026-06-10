import type { ReactNode } from 'react';
import { pageStyle, mainContentStyle } from '../../styles/dashboardStyles';
import { SidebarNav } from './SidebarNav';
import type { FormularioActivo } from '../../pages/DashboardPage';

interface DashboardLayoutProps {
  children: ReactNode;
  formularioActivo?: FormularioActivo;
  onChangeFormulario?: (form: FormularioActivo) => void;
  activeSection?: string;
  onChangeSection?: (section: string) => void;
}

export const DashboardLayout = ({ 
  children, 
  formularioActivo = 'cyr', 
  onChangeFormulario,
  activeSection, 
  onChangeSection 
}: DashboardLayoutProps) => {
  return (
    <div style={pageStyle}>
      <SidebarNav 
        formularioActivo={formularioActivo}
        onChangeFormulario={onChangeFormulario}
        activeSection={activeSection} 
        onChangeSection={onChangeSection} 
      />
      <main style={mainContentStyle}>
        {children}
      </main>
    </div>
  );
};
