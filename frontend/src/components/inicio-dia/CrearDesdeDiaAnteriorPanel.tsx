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
    <div style={{
      background: '#ffffff',
      border: '1px solid #E2E8F0',
      borderRadius: '8px',
      padding: '20px 24px',
      marginBottom: '16px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '6px',
          background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '16px'
        }}>📋</div>
        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#1E293B' }}>
          Crear brigadas desde día anterior
        </h3>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 200px' }}>
          <label style={{
            display: 'block', marginBottom: '6px',
            color: '#64748B', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em'
          }}>
            Fecha origen
          </label>
          <input
            type="date"
            value={fechaOrigen}
            onChange={(e) => onChangeFechaOrigen(e.target.value)}
            disabled={loading}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: '#F8FAFC',
              border: '1px solid #CBD5E1',
              borderRadius: '6px',
              color: '#1E293B',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box' as const,
              cursor: loading ? 'not-allowed' : 'text',
              opacity: loading ? 0.6 : 1
            }}
          />
        </div>
        <button
          type="button"
          onClick={onBuscar}
          disabled={loading}
          style={{
            background: loading ? '#94A3B8' : '#0059bb',
            color: '#ffffff',
            border: 'none',
            padding: '9px 20px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap' as const,
            transition: 'background 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          {loading ? '⏳ Buscando...' : '🔍 Buscar brigadas origen'}
        </button>
      </div>
    </div>
  );
};

