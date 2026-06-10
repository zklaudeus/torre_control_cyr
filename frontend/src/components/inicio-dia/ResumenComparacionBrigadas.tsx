import type { ComparacionFila } from '../../utils/inicio-dia/compararBrigadasIniciales';

interface ResumenComparacionBrigadasProps {
  comparacion: ComparacionFila[];
}

export const ResumenComparacionBrigadas = ({ comparacion }: ResumenComparacionBrigadasProps) => {
  const totalRecibidas = comparacion.filter(c => c.datosRecibidos).length;
  const sinCambios = comparacion.filter(c => c.estado === 'Sin cambios').length;
  const patentesCambiadas = comparacion.filter(c => c.estado === 'Patente cambiada').length;
  const usuariosCambiados = comparacion.filter(c => c.estado === 'Usuario cambiado').length;
  const zonasCambiadas = comparacion.filter(c => c.estado === 'Zona cambiada').length;
  const nuevas = comparacion.filter(c => c.estado === 'Nueva brigada').length;
  const faltantes = comparacion.filter(c => c.estado === 'Faltante').length;
  const errores = comparacion.filter(c => c.estado === 'Error').length;

  const cardStyle = {
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '4px',
    padding: '1rem',
    textAlign: 'center' as const,
    flex: '1 1 100px',
  };

  const numberStyle = {
    fontSize: '1.5rem',
    fontWeight: 'bold' as const,
    color: '#1E293B',
  };

  const labelStyle = {
    fontSize: '0.75rem',
    color: '#64748B',
    textTransform: 'uppercase' as const,
    marginTop: '0.25rem',
  };

  return (
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
      <div style={cardStyle}>
        <div style={numberStyle}>{totalRecibidas}</div>
        <div style={labelStyle}>Total Recibidas</div>
      </div>
      <div style={cardStyle}>
        <div style={{ ...numberStyle, color: '#22c55e' }}>{sinCambios}</div>
        <div style={labelStyle}>Sin Cambios</div>
      </div>
      <div style={cardStyle}>
        <div style={{ ...numberStyle, color: '#f59e0b' }}>{patentesCambiadas + usuariosCambiados + zonasCambiadas}</div>
        <div style={labelStyle}>Con Cambios</div>
      </div>
      <div style={cardStyle}>
        <div style={{ ...numberStyle, color: '#3b82f6' }}>{nuevas}</div>
        <div style={labelStyle}>Nuevas</div>
      </div>
      <div style={cardStyle}>
        <div style={{ ...numberStyle, color: '#ef4444' }}>{faltantes}</div>
        <div style={labelStyle}>Faltantes</div>
      </div>
      <div style={cardStyle}>
        <div style={{ ...numberStyle, color: errores > 0 ? '#ef4444' : '#888' }}>{errores}</div>
        <div style={labelStyle}>Errores</div>
      </div>
    </div>
  );
};
