import { useState } from 'react';
import { CyrDashboardView } from '../components/cyr/CyrDashboardView';
import { MedicionPlaceholderView } from '../components/medicion/MedicionPlaceholderView';
import { EmpalmePlaceholderView } from '../components/empalme/EmpalmePlaceholderView';

export type FormularioActivo = 'cyr' | 'medicion' | 'empalme';
export type SeccionFormulario = 'inicio-dia' | 'resumen-general' | 'resumen-zona' | 'reporte-gerencial' | 'configuracion';

interface DashboardPageProps {
  fechaOperacional: string;
  onChangeFecha: (fecha: string) => void;
}

export const DashboardPage = ({ fechaOperacional, onChangeFecha }: DashboardPageProps) => {
  const [formularioActivo, setFormularioActivo] = useState<FormularioActivo>('cyr');
  const [activeSection, setActiveSection] = useState<SeccionFormulario>('inicio-dia');

  const handleFormularioChange = (form: FormularioActivo) => {
    setFormularioActivo(form);
    // When switching modules, reset to the default section
    setActiveSection('inicio-dia');
  };

  if (formularioActivo === 'medicion') {
    return (
      <MedicionPlaceholderView
        fechaOperacional={fechaOperacional}
        onChangeFecha={onChangeFecha}
        formularioActivo={formularioActivo}
        onChangeFormulario={handleFormularioChange}
        activeSection={activeSection}
        onChangeSection={(s) => setActiveSection(s as SeccionFormulario)}
      />
    );
  }

  if (formularioActivo === 'empalme') {
    return (
      <EmpalmePlaceholderView
        fechaOperacional={fechaOperacional}
        onChangeFecha={onChangeFecha}
        formularioActivo={formularioActivo}
        onChangeFormulario={handleFormularioChange}
        activeSection={activeSection}
        onChangeSection={(s) => setActiveSection(s as SeccionFormulario)}
      />
    );
  }

  return (
    <CyrDashboardView
      fechaOperacional={fechaOperacional}
      onChangeFecha={onChangeFecha}
      formularioActivo={formularioActivo}
      onChangeFormulario={handleFormularioChange}
      activeSection={activeSection}
      onChangeSection={(s) => setActiveSection(s as SeccionFormulario)}
    />
  );
};