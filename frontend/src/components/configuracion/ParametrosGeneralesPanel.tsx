import { AccordionPanel } from '../dashboard/AccordionPanel';
import type { ParametrosGenerales } from '../../types/parametrosConfiguracion';

interface ParametrosGeneralesPanelProps {
  data: ParametrosGenerales;
  onChange: (field: keyof ParametrosGenerales, value: any) => void;
}

export const ParametrosGeneralesPanel = ({ data, onChange }: ParametrosGeneralesPanelProps) => {
  const inputStyle = {
    width: '100%',
    padding: '0.4rem',
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    color: '#1E293B',
    borderRadius: '4px',
    fontSize: '0.85rem',
    outline: 'none'
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '1rem',
    padding: '1rem'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.75rem',
    color: '#aaa',
    marginBottom: '0.3rem',
    fontWeight: 'bold' as const
  };

  return (
    <AccordionPanel title="PARÁMETROS GENERALES DE OPERACIÓN" defaultOpen={true}>
      <div style={gridStyle}>
        <div>
          <label style={labelStyle}>Hora inicio operación</label>
          <input type="time" value={data.hora_inicio_operacion} onChange={(e) => onChange('hora_inicio_operacion', e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Hora cierre operación</label>
          <input type="time" value={data.hora_cierre_operacion} onChange={(e) => onChange('hora_cierre_operacion', e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Hora corte GPS / control</label>
          <input type="time" value={data.hora_corte_gps} onChange={(e) => onChange('hora_corte_gps', e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Meta diaria cortes PXQ</label>
          <input type="number" value={data.meta_diaria_cortes_pxq} onChange={(e) => onChange('meta_diaria_cortes_pxq', Number(e.target.value))} style={inputStyle} min={0} />
        </div>
        <div>
          <label style={labelStyle}>Meta diaria cortes CF</label>
          <input type="number" value={data.meta_diaria_cortes_cf} onChange={(e) => onChange('meta_diaria_cortes_cf', Number(e.target.value))} style={inputStyle} min={0} />
        </div>
        <div>
          <label style={labelStyle}>Meta diaria reconexiones</label>
          <input type="number" value={data.meta_diaria_reconexiones} onChange={(e) => onChange('meta_diaria_reconexiones', Number(e.target.value))} style={inputStyle} min={0} />
        </div>
        <div>
          <label style={labelStyle}>Tramo inicial acumulados</label>
          <input type="time" value={data.tramo_horario_inicial} onChange={(e) => onChange('tramo_horario_inicial', e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Tramo final acumulados</label>
          <input type="time" value={data.tramo_horario_final} onChange={(e) => onChange('tramo_horario_final', e.target.value)} style={inputStyle} />
        </div>
      </div>
    </AccordionPanel>
  );
};
