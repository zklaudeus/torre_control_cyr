import type { ComparacionBrigadaDia } from '../../utils/inicio-dia/compararBrigadasDiaActual';

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
      flex: 1, background: '#FFFFFF', border: '1px solid #E2E8F0',
      borderRadius: '12px', padding: '1.25rem',
      display: 'flex', alignItems: 'center', gap: '1rem',
      boxShadow: '0 4px 6px rgba(0,0,0,0.02), 0 1px 3px rgba(0,0,0,0.05)',
      transition: 'transform 0.2s'
    }}>
      <div style={{
        width: '44px', height: '44px', borderRadius: '10px',
        background: `${color}1A`, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: '20px', flexShrink: 0
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>{label}</div>
        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: color, lineHeight: 1 }}>{value}</div>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
      {kpiCard('Encontradas en origen', encontradas, '#0B7BFF', '📁')}
      {kpiCard('A Crear', aCrear, '#10B981', '✅')}
      {kpiCard('Ya Existentes', yaExisten, '#F59E0B', '⚠️')}
      {kpiCard('Errores', errores, '#EF4444', '❌')}
    </div>
  );
};
