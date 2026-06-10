import {
  headerStyle,
  titleStyle,
  actionsContainerStyle,
  dateBadgeStyle,
  dateLabelStyle,
  statusBadgeStyle,
  actionBtnStyle,
} from '../../styles/dashboardStyles';

interface DashboardHeaderProps {
  fechaOperacional: string;
  onChangeFecha: (fecha: string) => void;
  loading: boolean;
  saving: boolean;
  onRefresh?: () => void;
  onSaveAll?: () => void;
}

export const DashboardHeader = ({
  fechaOperacional,
  onChangeFecha,
  loading,
  saving,
  onRefresh,
  onSaveAll,
}: DashboardHeaderProps) => {
  return (
    <header style={headerStyle}>
      <h1 style={titleStyle}>
        Panel de Control Diario
      </h1>

      <div style={actionsContainerStyle}>
        <div style={dateBadgeStyle}>
          <span style={dateLabelStyle}>FECHA OPERACIONAL</span>
          <input
            type="date"
            value={fechaOperacional}
            onChange={(e) => onChangeFecha(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#1E293B',
              fontSize: '0.9rem',
              fontFamily: 'monospace',
              outline: 'none',
              cursor: 'pointer'
            }}
          />
        </div>

        <div style={statusBadgeStyle}>⊘ INCOMPLETO</div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading || saving}
          style={{
            ...actionBtnStyle,
            cursor: (loading || saving) ? 'not-allowed' : 'pointer',
            opacity: (loading || saving) ? 0.5 : 1,
          }}
        >
          ↻ Recalcular
        </button>

        <button
          type="button"
          style={actionBtnStyle}
        >
          ↓ Exportar
        </button>

        <button
          type="button"
          onClick={onSaveAll}
          disabled={saving}
          style={{
            ...actionBtnStyle,
            background: saving ? '#0056b3' : '#007BFF',
            color: '#FFFFFF',
            border: 'none',
            fontWeight: 'bold',
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? 'Guardando...' : '💾 Guardar Todo'}
        </button>
      </div>
    </header>
  );
};


