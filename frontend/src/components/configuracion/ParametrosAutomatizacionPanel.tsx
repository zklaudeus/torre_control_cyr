import { AccordionPanel } from '../dashboard/AccordionPanel';
import type { ParametrosAutomatizacion } from '../../types/parametrosConfiguracion';

interface ParametrosAutomatizacionPanelProps {
  data: ParametrosAutomatizacion;
  onChange: (field: keyof ParametrosAutomatizacion, value: boolean) => void;
}

export const ParametrosAutomatizacionPanel = ({ data, onChange }: ParametrosAutomatizacionPanelProps) => {
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1rem',
    padding: '1rem'
  };

  const itemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.5rem',
    background: '#FFFFFF',
    borderRadius: '4px',
    border: '1px solid #E2E8F0'
  };

  const labelStyle = {
    fontSize: '0.85rem',
    color: '#e2e8f0',
    cursor: 'pointer'
  };

  const fields: Array<{ key: keyof ParametrosAutomatizacion, label: string }> = [
    { key: 'alerta_sin_brigadas', label: 'Alerta si zona no tiene brigadas' },
    { key: 'alerta_brigadas_efectivas', label: 'Alerta si brigadas efectivas < contrato' },
    { key: 'calcular_cumplimiento_carga', label: 'Calcular cumplimiento según carga' },
    { key: 'calcular_promedio_cortes', label: 'Calcular promedio de cortes' },
    { key: 'calcular_promedio_reconexiones', label: 'Calcular promedio de reconexiones' },
    { key: 'calcular_total_actividades', label: 'Calcular total de actividades' },
    { key: 'calcular_cumplimiento_promedio', label: 'Calcular cumplimiento promedio meta' },
    { key: 'generar_observacion_automatica', label: 'Generar observación automática' },
  ];

  return (
    <AccordionPanel title="REGLAS DE CÁLCULO Y OBSERVACIONES" defaultOpen={true}>
      <div style={gridStyle}>
        {fields.map(f => (
          <label key={f.key} style={itemStyle}>
            <input 
              type="checkbox" 
              checked={data[f.key]} 
              onChange={(e) => onChange(f.key, e.target.checked)} 
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <span style={labelStyle}>{f.label}</span>
          </label>
        ))}
      </div>
    </AccordionPanel>
  );
};
