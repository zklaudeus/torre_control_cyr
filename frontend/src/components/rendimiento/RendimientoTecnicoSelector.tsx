import React, { useState, useMemo } from 'react';

import type { TecnicoResumen, EstadoTecnico } from '../../types/rendimientoTecnico.types';
import { COLOR_ESTADO_TECNICO as ESTADO_COLOR } from '../../data/rendimientoTecnico.config';


interface RendimientoTecnicoSelectorProps {
  selectedId: string | null;
  onSelect: (tecnico: TecnicoResumen) => void;
  tecnicos: TecnicoResumen[];
  loading?: boolean;
}

export const RendimientoTecnicoSelector: React.FC<RendimientoTecnicoSelectorProps> = ({
  selectedId,
  onSelect,
  tecnicos,
  loading,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<EstadoTecnico | 'Todos'>('Todos');
  const [filterZona, setFilterZona] = useState<string>('Todas');
  const [filterFase, setFilterFase] = useState<string>('Todas');

  const zonas = ['Todas', ...Array.from(new Set(tecnicos.map(t => t.zona)))];

  const filteredTecnicos = useMemo(() => {
    return tecnicos.filter(t => {
      const matchSearch =
        t.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.codigoSap.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.zona.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.supervisor.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchEstado = filterEstado === 'Todos' || t.estado === filterEstado;
      const matchZona = filterZona === 'Todas' || t.zona === filterZona;
      const matchFase = filterFase === 'Todas' || t.fase === Number(filterFase);

      return matchSearch && matchEstado && matchZona && matchFase;
    });
  }, [searchTerm, filterEstado, filterZona, filterFase, tecnicos]);

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
          <select
            value={filterFase}
            onChange={e => setFilterFase(e.target.value)}
            style={{
              padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)',
              background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '12px', outline: 'none',
            }}
          >
            <option value="Todas">Todas las fases</option>
            <option value="1">Fase 1</option>
            <option value="2">Fase 2</option>
            <option value="3">Fase 3</option>
          </select>
        </div>
      </div>

      {/* Listado */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          Resultados ({filteredTecnicos.length})
        </div>
        
        {loading ? (
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
            Cargando técnicos…
          </div>
        ) : filteredTecnicos.length === 0 ? (
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
