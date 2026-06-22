import { ResumenGeneralPanel } from '../resumen-general/ResumenGeneralPanel';
import { ResumenZonaDashboardView } from '../resumen-zona/ResumenZonaDashboardView';
import { ConfiguracionDashboardView } from '../configuracion/ConfiguracionDashboardView';
import { InicioDiaDashboardView } from '../inicio-dia/InicioDiaDashboardView';
import { ReporteGerencialDashboardView } from '../reporte-gerencial/ReporteGerencialDashboardView';
import { SupervisorBitacoraView } from '../supervisor/SupervisorBitacoraView';
import type { FormularioActivo } from '../../types/dashboard';

interface CyrDashboardViewProps {
  fechaOperacional: string;
  onChangeFecha: (fecha: string) => void;
  formularioActivo: FormularioActivo;
  onChangeFormulario: (form: FormularioActivo) => void;
  activeSection: string;
  onChangeSection: (section: string) => void;
}

export const CyrDashboardView = ({
  fechaOperacional,
  onChangeFecha,
  formularioActivo: _formularioActivo,
  onChangeFormulario: _onChangeFormulario,
  activeSection,
  onChangeSection
}: CyrDashboardViewProps) => {

  if (activeSection === 'inicio-dia') {
    return (
      <InicioDiaDashboardView
        fechaOperacional={fechaOperacional}
        onChangeFecha={onChangeFecha}
        activeSection={activeSection}
        onChangeSection={onChangeSection}
      />
    );
  }

  if (activeSection === 'reporte-gerencial') {
    return (
      <ReporteGerencialDashboardView
        fechaOperacional={fechaOperacional}
        onChangeFecha={onChangeFecha}
        activeSection={activeSection}
        onChangeSection={onChangeSection}
      />
    );
  }

  if (activeSection === 'resumen-zona') {
    return (
      <ResumenZonaDashboardView
        fechaOperacional={fechaOperacional}
        onChangeFecha={onChangeFecha}
        activeSection={activeSection}
        onChangeSection={onChangeSection}
      />
    );
  }

  if (activeSection === 'configuracion') {
    return (
      <ConfiguracionDashboardView
        activeSection={activeSection}
        onChangeSection={onChangeSection}
      />
    );
  }

  if (activeSection === 'supervisor-cyr') {
    return (
      <SupervisorBitacoraView
        fechaOperacional={fechaOperacional}
        onChangeFecha={onChangeFecha}
        activeSection={activeSection}
        onChangeSection={onChangeSection}
      />
    );
  }

  return (
    <ResumenGeneralPanel
      fechaOperacional={fechaOperacional}
      onChangeFecha={onChangeFecha}
      activeSection={activeSection}
      onChangeSection={onChangeSection}
    />
  );
};
