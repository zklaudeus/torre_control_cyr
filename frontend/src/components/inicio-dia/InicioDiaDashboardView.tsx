import { DashboardLayout } from '../dashboard/DashboardLayout';
import { DashboardHeader } from '../dashboard/DashboardHeader';
import { AlertMessage } from '../dashboard/AlertMessage';
import { CrearDesdeDiaAnteriorPanel } from './CrearDesdeDiaAnteriorPanel';
import { ResumenCrearDiaPanel } from './ResumenCrearDiaPanel';
import { PreviewCrearDesdeDiaAnteriorTable } from './PreviewCrearDesdeDiaAnteriorTable';
import { contentStackStyle } from '../../styles/dashboardStyles';
import { useCrearDesdeDiaAnterior } from '../../hooks/useCrearDesdeDiaAnterior';
import type { FormularioActivo } from '../../types/dashboard';

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
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.02), 0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#0B7BFF15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>📋</div>
                <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0A192F' }}>Resultados de Brigadas Origen</h2>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={addRow}
                  disabled={saving}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#0B7BFF', color: '#ffffff', fontSize: '0.85rem', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}
                >
                  + Agregar brigada
                </button>
                <button
                  type="button"
                  onClick={limpiar}
                  disabled={saving}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#64748B', fontSize: '0.85rem', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}
                >
                  Limpiar vista
                </button>
                <button
                  type="button"
                  onClick={restablecerCambios}
                  disabled={saving}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#64748B', fontSize: '0.85rem', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}
                >
                  Restablecer
                </button>
                <button
                  type="button"
                  onClick={crearBrigadas}
                  disabled={saving || !comparacion.some(c => c.aplicar && c.estado === 'crear')}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: (saving || !comparacion.some(c => c.aplicar && c.estado === 'crear')) ? '#94A3B8' : '#0B7BFF', color: '#ffffff', fontSize: '0.85rem', fontWeight: 600, cursor: (saving || !comparacion.some(c => c.aplicar && c.estado === 'crear')) ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}
                >
                  {saving ? '⏳ Creando...' : '✓ Crear desde día anterior'}
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
