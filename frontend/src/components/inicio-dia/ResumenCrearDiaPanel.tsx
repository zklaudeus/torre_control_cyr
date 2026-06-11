import type { ComparacionBrigadaDia } from '../../utils/inicio-dia/compararBrigadasDiaActual';
import { contentStackStyle } from '../../styles/dashboardStyles';

interface ResumenCrearDiaPanelProps {
  comparacion: ComparacionBrigadaDia[];
}

export const ResumenCrearDiaPanel = ({ comparacion }: ResumenCrearDiaPanelProps) => {
  const encontradas = comparacion.length;
  const aCrear = comparacion.filter(c => c.estado === 'crear' && c.aplicar).length;
  const yaExisten = comparacion.filter(c => c.estado === 'ya_existe').length;
  const errores = comparacion.filter(c => c.estado === 'error').length;

  const kpiCard = (label: string, value: number, color: string, icon: string) => (
    <div style={{
      flex: 1, background: '#ffffff', border: '1px solid #E2E8F0',
      borderRadius: '8px', padding: '16px 20px',
      display: 'flex', alignItems: 'center', gap: '16px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    }}>
      <div style={{
        width: '40px', height: '40px', borderRadius: '8px',
        background: `${color}18`, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: '20px', flexShrink: 0
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{label}</div>
        <div style={{ fontSize: '28px', fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
      {kpiCard('Encontradas en origen', encontradas, '#1E293B', '📁')}
      {kpiCard('A Crear', aCrear, '#16A34A', '✅')}
      {kpiCard('Ya Existentes', yaExisten, '#D97706', '⚠️')}
      {kpiCard('Errores', errores, '#DC2626', '❌')}
    </div>
  );
};
