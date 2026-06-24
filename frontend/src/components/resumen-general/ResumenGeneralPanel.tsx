import { useEffect } from 'react';
import { DashboardLayout } from '../dashboard/DashboardLayout';
import { DashboardHeader } from '../dashboard/DashboardHeader';
import { AlertMessage } from '../dashboard/AlertMessage';
import { BrigadasDiaAccordion } from './BrigadasDiaAccordion';
import { ProgramacionDiariaGrid } from './ProgramacionDiariaGrid';
import { ProcesadorOperacional } from './ProcesadorOperacional';
import { contentStackStyle } from '../../styles/dashboardStyles';
import { useResumenGeneralDashboard } from '../../hooks/useResumenGeneralDashboard';
import { useAuth } from '../../auth/AuthContext';
import type { FormularioActivo } from '../../types/dashboard';

interface ResumenGeneralPanelProps {
  fechaOperacional: string;
  onChangeFecha: (fecha: string) => void;
  formularioActivo?: FormularioActivo;
  onChangeFormulario?: (form: FormularioActivo) => void;
  activeSection?: string;
  onChangeSection?: (section: string) => void;
}

export const ResumenGeneralPanel = ({ 
  fechaOperacional, 
  onChangeFecha, 
  formularioActivo,
  onChangeFormulario,
  activeSection, 
  onChangeSection 
}: ResumenGeneralPanelProps) => {
  const { user } = useAuth();
  const isReadOnly = user?.rol === 'gerencia';
  const {
    loading,
    saving,
    error,
    success,
    fetchAll,
    handleSaveAll,
    programacionData,
    handleProgramacionChange,
    brigadasHook,
  } = useResumenGeneralDashboard(fechaOperacional);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return (
    <DashboardLayout 
      formularioActivo={formularioActivo}
      onChangeFormulario={onChangeFormulario}
      activeSection={activeSection} 
      onChangeSection={onChangeSection}
    >
      <DashboardHeader
        fechaOperacional={fechaOperacional}
        onChangeFecha={onChangeFecha}
        loading={loading}
        saving={saving}
        onRefresh={fetchAll}
        onSaveAll={handleSaveAll}
        readOnly={isReadOnly}
      />

      <AlertMessage type="error" message={error || ''} />
      <AlertMessage type="success" message={success || ''} />

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>
          Cargando panel de control...
        </div>
      ) : (
        <section style={contentStackStyle}>
          {!isReadOnly && (
            <ProcesadorOperacional
              fechaOperacional={fechaOperacional}
              onProcessingComplete={fetchAll}
            />
          )}

          <BrigadasDiaAccordion hook={brigadasHook} readOnly={isReadOnly} />

          <ProgramacionDiariaGrid 
            data={programacionData} 
            onChange={handleProgramacionChange} 
            readOnly={isReadOnly}
          />
        </section>
      )}
    </DashboardLayout>
  );
};
