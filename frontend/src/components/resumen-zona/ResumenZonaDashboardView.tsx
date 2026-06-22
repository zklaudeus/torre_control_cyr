import { useState } from 'react';
import { DashboardLayout } from '../dashboard/DashboardLayout';
import { headerStyle, titleStyle, actionsContainerStyle, dateBadgeStyle, dateLabelStyle, actionBtnStyle, contentStackStyle } from '../../styles/dashboardStyles';
import { ResumenZonaPanel } from './ResumenZonaPanel';
import { ResultadosRealesZonaPanel } from './ResultadosRealesZonaPanel';
import type { FormularioActivo } from '../../types/dashboard';

interface ResumenZonaDashboardViewProps {
  fechaOperacional: string;
  onChangeFecha: (fecha: string) => void;
  formularioActivo?: FormularioActivo;
  onChangeFormulario?: (form: FormularioActivo) => void;
  activeSection: string;
  onChangeSection: (section: string) => void;
}

export const ResumenZonaDashboardView = ({ 
  fechaOperacional, 
  onChangeFecha, 
  formularioActivo,
  onChangeFormulario,
  activeSection, 
  onChangeSection 
}: ResumenZonaDashboardViewProps) => {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <DashboardLayout 
      formularioActivo={formularioActivo}
      onChangeFormulario={onChangeFormulario}
      activeSection={activeSection} 
      onChangeSection={onChangeSection}
    >
      <header style={headerStyle}>
        <div>
          <h1 style={titleStyle}>Resumen por Zona</h1>
          <p style={{ margin: '0.2rem 0 0', color: '#64748B', fontSize: '0.85rem' }}>
            Indicadores y resultados consolidados
          </p>
        </div>

        <div style={actionsContainerStyle}>
          <div style={dateBadgeStyle}>
            <span style={dateLabelStyle}>FECHA OPERACIONAL</span>
            <input
              type="date"
              value={fechaOperacional}
              onChange={(e) => onChangeFecha(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#1E293B',
                fontSize: '0.9rem',
                fontFamily: 'monospace',
                outline: 'none',
                cursor: 'pointer'
              }}
            />
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            style={{
              ...actionBtnStyle,
              background: '#00bcd4',
              color: '#1E293B',
              border: 'none',
              fontWeight: 'bold',
            }}
          >
            ↻ Actualizar
          </button>
        </div>
      </header>

      <section style={contentStackStyle}>
        <ResumenZonaPanel fechaOperacional={fechaOperacional} refreshKey={refreshKey} />
        <ResultadosRealesZonaPanel fechaOperacional={fechaOperacional} refreshKey={refreshKey} />
      </section>
    </DashboardLayout>
  );
};
