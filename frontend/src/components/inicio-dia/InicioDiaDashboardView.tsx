import { DashboardLayout } from '../dashboard/DashboardLayout';
import { DashboardHeader } from '../dashboard/DashboardHeader';
import { AlertMessage } from '../dashboard/AlertMessage';
import { CrearDesdeDiaAnteriorPanel } from './CrearDesdeDiaAnteriorPanel';
import { ResumenCrearDiaPanel } from './ResumenCrearDiaPanel';
import { PreviewCrearDesdeDiaAnteriorTable } from './PreviewCrearDesdeDiaAnteriorTable';
import { contentStackStyle, actionBtnStyle } from '../../styles/dashboardStyles';
import { useCrearDesdeDiaAnterior } from '../../hooks/useCrearDesdeDiaAnterior';
import type { FormularioActivo } from '../../pages/DashboardPage';

interface InicioDiaDashboardViewProps {
  fechaOperacional: string;
  onChangeFecha: (fecha: string) => void;
  formularioActivo?: FormularioActivo;
  onChangeFormulario?: (form: FormularioActivo) => void;
  activeSection: string;
  onChangeSection: (section: string) => void;
}

export const InicioDiaDashboardView = ({
  fechaOperacional,
  onChangeFecha,
  formularioActivo,
  onChangeFormulario,
  activeSection,
  onChangeSection
}: InicioDiaDashboardViewProps) => {
  const {
    fechaOrigen,
    setFechaOrigen,
    comparacion,
    loading,
    saving,
    error,
    success,
    buscarBrigadasOrigen,
    toggleAplicar,
    limpiar,
    restablecerCambios,
    updateRow,
    deleteRow,
    addRow,
    crearBrigadas,
    zonas
  } = useCrearDesdeDiaAnterior(fechaOperacional);

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
        saving={saving}
      />

      <AlertMessage type="error" message={error || ''} />
      <AlertMessage type="success" message={success || ''} />

      <section style={contentStackStyle}>
        {!comparacion ? (
          <CrearDesdeDiaAnteriorPanel
            fechaOrigen={fechaOrigen}
            onChangeFechaOrigen={setFechaOrigen}
            onBuscar={buscarBrigadasOrigen}
            loading={loading}
          />
        ) : (
          <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0, fontSize: '1rem', color: '#1E293B' }}>Resultados de Brigadas Origen</h2>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={addRow}
                  disabled={saving}
                  style={{ ...actionBtnStyle, background: '#16A34A', color: '#FFFFFF', border: 'none' }}
                >
                  Agregar brigada
                </button>
                <button
                  type="button"
                  onClick={limpiar}
                  disabled={saving}
                  style={{ ...actionBtnStyle, background: '#475569', color: '#1E293B', border: 'none' }}
                >
                  Limpiar vista previa
                </button>
                <button
                  type="button"
                  onClick={restablecerCambios}
                  disabled={saving}
                  style={{ ...actionBtnStyle, background: '#475569', color: '#1E293B', border: 'none' }}
                >
                  Restablecer cambios
                </button>
                <button
                  type="button"
                  onClick={crearBrigadas}
                  disabled={saving || !comparacion.some(c => c.aplicar && c.estado === 'crear')}
                  style={{ ...actionBtnStyle, background: '#0e7490', color: '#1E293B', border: 'none' }}
                >
                  {saving ? 'Creando...' : 'Crear desde día anterior'}
                </button>
              </div>
            </div>
            
            <ResumenCrearDiaPanel comparacion={comparacion} />
            <PreviewCrearDesdeDiaAnteriorTable
              comparacion={comparacion}
              zonas={zonas}
              onToggleAplicar={toggleAplicar}
              onEditRow={updateRow}
              onDeleteRow={deleteRow}
            />
          </div>
        )}
      </section>
    </DashboardLayout>
  );
};
