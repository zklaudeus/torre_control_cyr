import { sidebarStyle, menuBtnStyle } from '../../styles/dashboardStyles';
import type { FormularioActivo } from '../../pages/DashboardPage';

interface SidebarNavProps {
  formularioActivo?: FormularioActivo;
  onChangeFormulario?: (form: FormularioActivo) => void;
  activeSection?: string;
  onChangeSection?: (section: string) => void;
}

export const SidebarNav = ({ 
  formularioActivo = 'cyr',
  onChangeFormulario,
  activeSection = 'inicio-dia', 
  onChangeSection 
}: SidebarNavProps) => {

  const getGroupStyle = (form: FormularioActivo) => ({
    padding: '0.75rem 1rem',
    background: formularioActivo === form ? '#10233D' : 'transparent',
    color: '#F8FAFC',
    borderLeft: formularioActivo === form ? '4px solid #007BFF' : '4px solid transparent',
    cursor: 'pointer',
    fontWeight: 'bold' as const,
    display: 'flex',
    justifyContent: 'space-between' as const,
    alignItems: 'center',
    transition: 'background 0.2s',
  });

  const getBtnStyle = (section: string) => ({
    ...menuBtnStyle,
    background: activeSection === section ? '#007BFF' : 'transparent',
    color: activeSection === section ? '#F8FAFC' : '#B8C7DA',
    borderRadius: '4px',
    paddingLeft: '2rem',
    marginTop: '0.25rem',
  });

  const handleFormClick = (form: FormularioActivo) => {
    if (onChangeFormulario) onChangeFormulario(form);
  };

  const handleClick = (section: string) => {
    if (onChangeSection) onChangeSection(section);
  };

  const renderOpciones = () => (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '0.5rem 0' }}>
      <button type="button" style={getBtnStyle('inicio-dia')} onClick={() => handleClick('inicio-dia')}>
        <span style={{ marginRight: '10px' }}>🌅</span> Inicio del día
      </button>
      <button type="button" style={getBtnStyle('resumen-general')} onClick={() => handleClick('resumen-general')}>
        <span style={{ marginRight: '10px' }}>◫</span> Resumen General
      </button>
      <button type="button" style={getBtnStyle('resumen-zona')} onClick={() => handleClick('resumen-zona')}>
        <span style={{ marginRight: '10px' }}>🗺️</span> Resumen por Zona
      </button>
      <button type="button" style={getBtnStyle('configuracion')} onClick={() => handleClick('configuracion')}>
        <span style={{ marginRight: '10px' }}>⚙️</span> Configuración
      </button>
    </div>
  );

  return (
    <aside style={sidebarStyle}>
      <div style={{ padding: '1.5rem 1rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#F8FAFC' }}>Operaciones</h2>
        <span style={{ fontSize: '0.75rem', color: '#B8C7DA' }}>Torre de Control v2</span>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div>
          <div style={getGroupStyle('cyr')} onClick={() => handleFormClick('cyr')}>
            <span>CyR</span>
            <span style={{ fontSize: '0.8rem', color: '#B8C7DA' }}>{formularioActivo === 'cyr' ? '▼' : '▶'}</span>
          </div>
          {formularioActivo === 'cyr' && renderOpciones()}
        </div>

        <div>
          <div style={getGroupStyle('medicion')} onClick={() => handleFormClick('medicion')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>Medición</span>
              <span style={{ fontSize: '0.65rem', background: '#132B4A', padding: '2px 6px', borderRadius: '4px', color: '#00E5FF' }}>Próximamente</span>
            </div>
            <span style={{ fontSize: '0.8rem', color: '#B8C7DA' }}>{formularioActivo === 'medicion' ? '▼' : '▶'}</span>
          </div>
          {formularioActivo === 'medicion' && renderOpciones()}
        </div>

        <div>
          <div style={getGroupStyle('empalme')} onClick={() => handleFormClick('empalme')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>Empalme</span>
              <span style={{ fontSize: '0.65rem', background: '#132B4A', padding: '2px 6px', borderRadius: '4px', color: '#00E5FF' }}>Próximamente</span>
            </div>
            <span style={{ fontSize: '0.8rem', color: '#B8C7DA' }}>{formularioActivo === 'empalme' ? '▼' : '▶'}</span>
          </div>
          {formularioActivo === 'empalme' && renderOpciones()}
        </div>
      </nav>
    </aside>
  );
};

