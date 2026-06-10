import { DashboardLayout } from '../dashboard/DashboardLayout';
import { DashboardHeader } from '../dashboard/DashboardHeader';
import { ModuloPlaceholder } from '../dashboard/ModuloPlaceholder';
import type { FormularioActivo } from '../../pages/DashboardPage';

interface EmpalmePlaceholderViewProps {
  fechaOperacional: string;
  onChangeFecha: (fecha: string) => void;
  formularioActivo: FormularioActivo;
  onChangeFormulario: (form: FormularioActivo) => void;
  activeSection: string;
  onChangeSection: (section: string) => void;
}

export const EmpalmePlaceholderView = ({
  fechaOperacional,
  onChangeFecha,
  formularioActivo,
  onChangeFormulario,
  activeSection,
  onChangeSection
}: EmpalmePlaceholderViewProps) => {
  
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
      <ModuloPlaceholder formulario="Empalme" seccion={sectionNames[activeSection] || activeSection} />
    </DashboardLayout>
  );
};
