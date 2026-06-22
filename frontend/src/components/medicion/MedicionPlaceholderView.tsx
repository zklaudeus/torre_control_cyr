import { DashboardLayout } from '../dashboard/DashboardLayout';
import { DashboardHeader } from '../dashboard/DashboardHeader';
import { ModuloPlaceholder } from '../dashboard/ModuloPlaceholder';
import type { FormularioActivo } from '../../types/dashboard';

interface MedicionPlaceholderViewProps {
  fechaOperacional: string;
  onChangeFecha: (fecha: string) => void;
  formularioActivo: FormularioActivo;
  onChangeFormulario: (form: FormularioActivo) => void;
  activeSection: string;
  onChangeSection: (section: string) => void;
}

export const MedicionPlaceholderView = ({
  fechaOperacional,
  onChangeFecha,
  formularioActivo,
  onChangeFormulario,
  activeSection,
  onChangeSection
}: MedicionPlaceholderViewProps) => {
  
  const sectionNames: Record<string, string> = {
    'inicio-dia': 'Inicio del día',
    'resumen-general': 'Resumen General',
    'resumen-zona': 'Resumen por Zona',
    'configuracion': 'Configuración'
  };

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
        loading={false}
        saving={false}
      />
      <ModuloPlaceholder formulario="Medición" seccion={sectionNames[activeSection] || activeSection} />
    </DashboardLayout>
  );
};
