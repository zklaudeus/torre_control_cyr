import React, { useState, useMemo } from 'react';

export type EstadoTecnico = 'Crítico' | 'En recuperación' | 'Estable' | 'Alto desempeño';

export type TecnicoResumen = {
  id: string;
  nombre: string;
  codigoSap: string;
  zona: string;
  supervisor: string;
  estado: EstadoTecnico;
  fase: number;
  productividadPromedio: number;
};

const MOCK_TECNICOS: TecnicoResumen[] = [
  { id: '1', nombre: 'Andrés Gatica', codigoSap: 'P003014', zona: 'Chillán', supervisor: 'Juan Muñoz', estado: 'Crítico', fase: 2, productividadPromedio: 11.2 },
  { id: '2', nombre: 'Cristian Ulloa', codigoSap: 'P002754', zona: 'Chillán', supervisor: 'Juan Muñoz', estado: 'En recuperación', fase: 1, productividadPromedio: 18.5 },
  { id: '3', nombre: 'José Bravo', codigoSap: 'P003457', zona: 'Concepción', supervisor: 'Juan Muñoz', estado: 'Estable', fase: 1, productividadPromedio: 26.4 },
  { id: '4', nombre: 'Juan Pérez', codigoSap: 'P003863', zona: 'Coquimbo', supervisor: 'Nicolás Farías', estado: 'En recuperación', fase: 2, productividadPromedio: 14.0 },
  { id: '5', nombre: 'Carlos Ruiz', codigoSap: 'P004122', zona: 'Talca', supervisor: 'Jose Masso', estado: 'Alto desempeño', fase: 1, productividadPromedio: 31.0 },
];

const ESTADO_COLOR: Record<EstadoTecnico, string> = {
  'Crítico': '#ef4444',
  'En recuperación': '#f97316',
  'Estable': '#60a5fa',
  'Alto desempeño': '#22c55e',
};

interface RendimientoTecnicoSelectorProps {
  selectedId: string | null;
  onSelect: (tecnico: TecnicoResumen) => void;
}

export const RendimientoTecnicoSelector: React.FC<RendimientoTecnicoSelectorProps> = ({
  selectedId,
  onSelect,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<EstadoTecnico | 'Todos'>('Todos');
  const [filterZona, setFilterZona] = useState<string>('Todas');

  const zonas = ['Todas', ...Array.from(new Set(MOCK_TECNICOS.map(t => t.zona)))];

  const filteredTecnicos = useMemo(() => {
    return MOCK_TECNICOS.filter(t => {
      const matchSearch =
        t.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.codigoSap.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.zona.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.supervisor.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchEstado = filterEstado === 'Todos' || t.estado === filterEstado;
      const matchZona = filterZona === 'Todas' || t.zona === filterZona;

      return matchSearch && matchEstado && matchZona;
    });
  }, [searchTerm, filterEstado, filterZona]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      background: 'var(--bg-panel)',
      border: '1px solid var(--border)',
      borderRadius: '8px',
      padding: '16px',
      height: '100%',
      maxHeight: 'calc(100vh - 120px)',
      overflowY: 'auto',
    }}>
      {/* Buscador */}
      <div>
        <input
          type="text"
          placeholder="Buscar por nombre, SAP, zona o supervisor..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: '6px',
            border: '1px solid var(--border)',
            background: 'var(--bg-main)',
            color: 'var(--text-main)',
            fontSize: '13px',
            outline: 'none',
          }}
        />
      </div>

      {/* Filtros Rápidos */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          <select
            value={filterZona}
            onChange={e => setFilterZona(e.target.value)}
            style={{
              padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)',
              background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '12px', outline: 'none',
            }}
          >
            {zonas.map(z => <option key={z} value={z}>{z}</option>)}
          </select>
          <select
            value={filterEstado}
            onChange={e => setFilterEstado(e.target.value as EstadoTecnico | 'Todos')}
            style={{
              padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)',
              background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '12px', outline: 'none',
            }}
          >
            <option value="Todos">Todos los estados</option>
            <option value="Crítico">Críticos</option>
            <option value="En recuperación">En recuperación</option>
            <option value="Estable">Estables</option>
            <option value="Alto desempeño">Alto desempeño</option>
          </select>
        </div>
      </div>

      {/* Listado */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          Resultados ({filteredTecnicos.length})
        </div>
        
        {filteredTecnicos.length === 0 ? (
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
            No se encontraron técnicos.
          </div>
        ) : (
          filteredTecnicos.map(t => {
            const isSelected = t.id === selectedId;
            const eColor = ESTADO_COLOR[t.estado];

            return (
              <div
                key={t.id}
                onClick={() => onSelect(t)}
                style={{
                  padding: '12px',
                  borderRadius: '6px',
                  border: isSelected ? `1px solid var(--primary)` : '1px solid var(--border)',
                  background: isSelected ? 'rgba(0, 123, 255, 0.05)' : 'var(--bg-panel-sec)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.2 }}>
                      {t.nombre}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {t.codigoSap} • {t.zona}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '12px',
                    color: eColor, border: `1px solid ${eColor}40`, background: `${eColor}10`
                  }}>
                    {t.estado}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>
                    Supervisor: <span style={{ color: 'var(--text-main)' }}>{t.supervisor}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                      Fase {t.fase}
                    </span>
                    <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                      {t.productividadPromedio} cortes
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
