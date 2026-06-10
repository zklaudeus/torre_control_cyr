import { panelContainerStyle as cardStyle } from '../../styles/dashboardStyles';
import type { ComparacionBrigadaDia } from '../../utils/inicio-dia/compararBrigadasDiaActual';

interface ResumenCrearDiaPanelProps {
  comparacion: ComparacionBrigadaDia[];
}

export const ResumenCrearDiaPanel = ({ comparacion }: ResumenCrearDiaPanelProps) => {
  const encontradas = comparacion.length;
  const aCrear = comparacion.filter(c => c.estado === 'crear' && c.aplicar).length;
  const yaExisten = comparacion.filter(c => c.estado === 'ya_existe').length;
  const errores = comparacion.filter(c => c.estado === 'error').length;

  return (
    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
      <div style={{ ...cardStyle, flex: 1, textAlign: 'center', padding: '1rem' }}>
        <h4 style={{ margin: '0 0 0.5rem 0', color: '#64748B' }}>Encontradas en origen</h4>
        <span style={{ fontSize: '1.5rem', color: '#1E293B', fontWeight: 'bold' }}>{encontradas}</span>
      </div>
      <div style={{ ...cardStyle, flex: 1, textAlign: 'center', padding: '1rem' }}>
        <h4 style={{ margin: '0 0 0.5rem 0', color: '#64748B' }}>A Crear</h4>
        <span style={{ fontSize: '1.5rem', color: '#10b981', fontWeight: 'bold' }}>{aCrear}</span>
      </div>
      <div style={{ ...cardStyle, flex: 1, textAlign: 'center', padding: '1rem' }}>
        <h4 style={{ margin: '0 0 0.5rem 0', color: '#64748B' }}>Ya Existentes</h4>
        <span style={{ fontSize: '1.5rem', color: '#eab308', fontWeight: 'bold' }}>{yaExisten}</span>
      </div>
      <div style={{ ...cardStyle, flex: 1, textAlign: 'center', padding: '1rem' }}>
        <h4 style={{ margin: '0 0 0.5rem 0', color: '#64748B' }}>Errores</h4>
        <span style={{ fontSize: '1.5rem', color: '#ef4444', fontWeight: 'bold' }}>{errores}</span>
      </div>
    </div>
  );
};
