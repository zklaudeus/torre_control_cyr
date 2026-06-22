import { tableStyle, tableHeadRowStyle, thStyle, tableBodyRowStyle, tdStyle } from '../../styles/dashboardStyles';
import type { ComparacionFila, EstadoComparacion } from '../../utils/inicio-dia/compararBrigadasIniciales';

interface ComparacionBrigadasTableProps {
  comparacion: ComparacionFila[];
  onToggleAplicar: (id: string) => void;
}

export const ComparacionBrigadasTable = ({ comparacion, onToggleAplicar }: ComparacionBrigadasTableProps) => {
  const getBadgeStyle = (estado: EstadoComparacion) => {
    let bg = '#333';
    let color = '#fff';

    if (estado === 'Sin cambios') { bg = '#064e3b'; color = '#34d399'; }
    if (estado.includes('cambiad')) { bg = '#78350f'; color = '#fbbf24'; }
    if (estado === 'Nueva brigada') { bg = '#1e3a8a'; color = '#60a5fa'; }
    if (estado === 'Faltante') { bg = '#7f1d1d'; color = '#fca5a5'; }
    if (estado === 'Error' || estado === 'Advertencia') { bg = '#7f1d1d'; color = '#fca5a5'; }

    return {
      background: bg,
      color: color,
      padding: '0.15rem 0.4rem',
      borderRadius: '4px',
      fontSize: '0.65rem',
      fontWeight: 'bold' as const,
      whiteSpace: 'nowrap' as const,
    };
  };

  return (
    <div className="table-responsive">
      <table style={tableStyle}>
        <thead>
          <tr style={{ ...tableHeadRowStyle, background: 'var(--bg-panel-sec)', fontSize: '0.65rem' }}>
            <th style={thStyle}>APLICAR</th>
            <th style={thStyle}>ESTADO</th>
            <th style={thStyle}>ACCIÓN SUGERIDA</th>
            <th style={thStyle}>SAP</th>
            <th style={thStyle}>ZONA ACTUAL</th>
            <th style={thStyle}>ZONA RECIBIDA</th>
            <th style={thStyle}>USUARIO ACTUAL</th>
            <th style={thStyle}>USUARIO RECIBIDO</th>
            <th style={thStyle}>PATENTE ACTUAL</th>
            <th style={thStyle}>PATENTE RECIBIDA</th>
            <th style={thStyle}>OBSERVACIÓN</th>
          </tr>
        </thead>
        <tbody>
          {comparacion.map(f => (
            <tr key={f.id_unico} style={{ ...tableBodyRowStyle, opacity: f.estado === 'Sin cambios' || f.estado === 'Error' ? 0.6 : 1 }}>
              <td style={{ ...tdStyle, textAlign: 'center' }}>
                <input 
                  type="checkbox" 
                  checked={f.aplicar} 
                  onChange={() => onToggleAplicar(f.id_unico)} 
                  disabled={f.estado === 'Sin cambios' || f.estado === 'Error'}
                  style={{ cursor: f.estado === 'Sin cambios' || f.estado === 'Error' ? 'not-allowed' : 'pointer' }}
                />
              </td>
              <td style={tdStyle}><span style={getBadgeStyle(f.estado)}>{f.estado}</span></td>
              <td style={tdStyle}>{f.accionSugerida}</td>
              <td style={{ ...tdStyle, fontWeight: 'bold' }}>{f.datosRecibidos?.codigo_sap || f.brigadaOriginal?.codigo_sap}</td>
              <td style={tdStyle}>{f.brigadaOriginal?.zona || '-'}</td>
              <td style={{ ...tdStyle, color: f.estado === 'Zona cambiada' ? '#fbbf24' : 'inherit' }}>{f.datosRecibidos?.zona || '-'}</td>
              <td style={tdStyle}>{f.brigadaOriginal?.usuario || '-'}</td>
              <td style={{ ...tdStyle, color: f.estado === 'Usuario cambiado' ? '#fbbf24' : 'inherit' }}>{f.datosRecibidos?.usuario || '-'}</td>
              <td style={tdStyle}>{f.brigadaOriginal?.patente || '-'}</td>
              <td style={{ ...tdStyle, color: f.estado === 'Patente cambiada' ? '#fbbf24' : 'inherit' }}>{f.datosRecibidos?.patente || '-'}</td>
              <td style={{ ...tdStyle, fontSize: '0.7rem', color: '#aaa', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={f.observacion}>
                {f.observacion}
              </td>
            </tr>
          ))}
          {comparacion.length === 0 && (
            <tr>
              <td colSpan={11} style={{ ...tdStyle, padding: '2rem', color: '#64748B' }}>
                Sin resultados.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
