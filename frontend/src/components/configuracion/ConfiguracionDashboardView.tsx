import { DashboardLayout } from '../dashboard/DashboardLayout';
import { headerStyle, titleStyle, actionsContainerStyle, actionBtnStyle, contentStackStyle } from '../../styles/dashboardStyles';
import { ParametrosGeneralesPanel } from './ParametrosGeneralesPanel';
import { ParametrosAutomatizacionPanel } from './ParametrosAutomatizacionPanel';
import { ParametrosPxqZonaPanel } from './ParametrosPxqZonaPanel';
import { ParametrosCfZonaPanel } from './ParametrosCfZonaPanel';
import { useParametrosConfiguracion } from '../../hooks/useParametrosConfiguracion';
import { AlertMessage } from '../dashboard/AlertMessage';
import type { FormularioActivo } from '../../pages/DashboardPage';

interface ConfiguracionDashboardViewProps {
  formularioActivo?: FormularioActivo;
  onChangeFormulario?: (form: FormularioActivo) => void;
  activeSection: string;
  onChangeSection: (section: string) => void;
}

export const ConfiguracionDashboardView = ({ 
  formularioActivo,
  onChangeFormulario,
  activeSection, 
  onChangeSection 
}: ConfiguracionDashboardViewProps) => {
  const {
    config,
    loading,
    saving,
    error,
    success,
    isDirty,
    handleChangeGenerales,
    handleChangeAutomatizacion,
    handleChangePxq,
    handleChangeCf,
    handleSave,
    handleCancel,
    fetchConfig
  } = useParametrosConfiguracion();

  return (
    <DashboardLayout 
      formularioActivo={formularioActivo}
      onChangeFormulario={onChangeFormulario}
      activeSection={activeSection} 
      onChangeSection={onChangeSection}
    >
      <header style={headerStyle}>
        <div>
          <h1 style={titleStyle}>Configuración de Automatización</h1>
          <p style={{ margin: '0.2rem 0 0', color: '#64748B', fontSize: '0.85rem' }}>
            Parámetros y reglas para el cálculo del reporte diario
          </p>
        </div>

        <div style={actionsContainerStyle}>
          {isDirty && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              style={{
                ...actionBtnStyle,
                background: '#475569',
                color: '#1E293B',
                border: 'none',
              }}
            >
              Cancelar cambios
            </button>
          )}

          <button
            type="button"
            onClick={fetchConfig}
            disabled={loading || saving}
            style={{
              ...actionBtnStyle,
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
            }}
          >
            ↻ Recargar
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !isDirty}
            style={{
              ...actionBtnStyle,
              background: saving ? '#0e7490' : (isDirty ? '#00bcd4' : '#1e1e1e'),
              color: isDirty || saving ? '#fff' : '#aaa',
              border: isDirty || saving ? 'none' : '1px solid #333',
              fontWeight: 'bold',
            }}
          >
            {saving ? 'Guardando...' : '💾 Guardar Configuración'}
          </button>
        </div>
      </header>

      <AlertMessage type="error" message={error || ''} />
      <AlertMessage type="success" message={success || ''} />

      {loading && !config ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>
          Cargando configuración...
        </div>
      ) : config ? (
        <section style={contentStackStyle}>
          <ParametrosGeneralesPanel data={config.generales} onChange={handleChangeGenerales} />
          <ParametrosAutomatizacionPanel data={config.automatizacion} onChange={handleChangeAutomatizacion} />
          <ParametrosPxqZonaPanel data={config.pxq} onChange={handleChangePxq} />
          <ParametrosCfZonaPanel data={config.cf} onChange={handleChangeCf} />
        </section>
      ) : null}
    </DashboardLayout>
  );
};
