import { panelContainerStyle as cardStyle, inputStyle, actionBtnStyle } from '../../styles/dashboardStyles';

interface CrearDesdeDiaAnteriorPanelProps {
  fechaOrigen: string;
  onChangeFechaOrigen: (fecha: string) => void;
  onBuscar: () => void;
  loading: boolean;
}

export const CrearDesdeDiaAnteriorPanel = ({
  fechaOrigen,
  onChangeFechaOrigen,
  onBuscar,
  loading
}: CrearDesdeDiaAnteriorPanelProps) => {
  return (
    <div style={cardStyle}>
      <h3 style={{ margin: '0 0 1rem 0', color: '#1E293B' }}>Crear brigadas desde día anterior</h3>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ccc', fontSize: '0.9rem' }}>
            Fecha origen:
          </label>
          <input
            type="date"
            style={inputStyle}
            value={fechaOrigen}
            onChange={(e) => onChangeFechaOrigen(e.target.value)}
            disabled={loading}
          />
        </div>
        <button
          type="button"
          style={{ ...actionBtnStyle, background: '#0e7490', color: '#1E293B', border: 'none' }}
          onClick={onBuscar}
          disabled={loading}
        >
          {loading ? 'Buscando...' : 'Buscar brigadas origen'}
        </button>
      </div>
    </div>
  );
};
