import { AccordionPanel } from '../dashboard/AccordionPanel';
import { tableStyle, tableHeadRowStyle, thStyle, tableBodyRowStyle, tdStyle } from '../../styles/dashboardStyles';
import type { ParametrosPxqZona } from '../../types/parametrosConfiguracion';

interface ParametrosPxqZonaPanelProps {
  data: ParametrosPxqZona[];
  onChange: (zona: string, field: keyof ParametrosPxqZona, value: any) => void;
}

export const ParametrosPxqZonaPanel = ({ data, onChange }: ParametrosPxqZonaPanelProps) => {
  const inputStyle = {
    width: '100%',
    padding: '0.25rem',
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    color: '#1E293B',
    borderRadius: '4px',
    fontSize: '0.75rem',
    outline: 'none',
    boxSizing: 'border-box' as const,
  };

  const numberStyle = {
    ...inputStyle,
    width: '50px',
    textAlign: 'center' as const,
  };

  return (
    <AccordionPanel title="PARÁMETROS PXQ POR ZONA" defaultOpen={true}>
      <div style={{ width: '100%', overflowX: 'auto', padding: '1rem' }}>
        <table style={tableStyle}>
          <thead>
            <tr style={{ ...tableHeadRowStyle, background: '#F8FAFC', fontSize: '0.65rem' }}>
              <th style={{ ...thStyle, textAlign: 'left' }}>ZONA</th>
              <th style={thStyle}>ACTIVA</th>
              <th style={thStyle}>B. CONTRATO</th>
              <th style={thStyle}>META CORTES</th>
              <th style={thStyle}>META 09H</th>
              <th style={thStyle}>META 10H</th>
              <th style={thStyle}>META 11H</th>
              <th style={thStyle}>META 12H</th>
              <th style={thStyle}>META 13H</th>
              <th style={thStyle}>META 14H</th>
              <th style={thStyle}>INICIO</th>
              <th style={thStyle}>CIERRE</th>
            </tr>
          </thead>
          <tbody>
            {data.map(z => (
              <tr key={z.zona} style={{ ...tableBodyRowStyle, opacity: z.activa ? 1 : 0.5 }}>
                <td style={{ ...tdStyle, fontWeight: 'bold' }}>{z.zona}</td>
                <td style={tdStyle}>
                  <input type="checkbox" checked={z.activa} onChange={(e) => onChange(z.zona, 'activa', e.target.checked)} />
                </td>
                <td style={tdStyle}><input type="number" value={z.brigadas_contrato} onChange={(e) => onChange(z.zona, 'brigadas_contrato', Number(e.target.value))} style={numberStyle} min={0} /></td>
                <td style={tdStyle}><input type="number" value={z.meta_diaria_cortes} onChange={(e) => onChange(z.zona, 'meta_diaria_cortes', Number(e.target.value))} style={numberStyle} min={0} /></td>
                <td style={tdStyle}><input type="number" value={z.meta_acumulada_09} onChange={(e) => onChange(z.zona, 'meta_acumulada_09', Number(e.target.value))} style={numberStyle} min={0} /></td>
                <td style={tdStyle}><input type="number" value={z.meta_acumulada_10} onChange={(e) => onChange(z.zona, 'meta_acumulada_10', Number(e.target.value))} style={numberStyle} min={0} /></td>
                <td style={tdStyle}><input type="number" value={z.meta_acumulada_11} onChange={(e) => onChange(z.zona, 'meta_acumulada_11', Number(e.target.value))} style={numberStyle} min={0} /></td>
                <td style={tdStyle}><input type="number" value={z.meta_acumulada_12} onChange={(e) => onChange(z.zona, 'meta_acumulada_12', Number(e.target.value))} style={numberStyle} min={0} /></td>
                <td style={tdStyle}><input type="number" value={z.meta_acumulada_13} onChange={(e) => onChange(z.zona, 'meta_acumulada_13', Number(e.target.value))} style={numberStyle} min={0} /></td>
                <td style={tdStyle}><input type="number" value={z.meta_acumulada_14} onChange={(e) => onChange(z.zona, 'meta_acumulada_14', Number(e.target.value))} style={numberStyle} min={0} /></td>
                <td style={tdStyle}><input type="time" value={z.hora_inicio} onChange={(e) => onChange(z.zona, 'hora_inicio', e.target.value)} style={inputStyle} /></td>
                <td style={tdStyle}><input type="time" value={z.hora_cierre} onChange={(e) => onChange(z.zona, 'hora_cierre', e.target.value)} style={inputStyle} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AccordionPanel>
  );
};
