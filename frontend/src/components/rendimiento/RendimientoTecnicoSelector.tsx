import React from 'react';

import type { TecnicoResumen } from '../../types/rendimientoTecnico.types';
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
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      background: 'var(--bg-panel)',
      border: '1px solid var(--border)',
      borderRadius: '8px',
      padding: '12px',
      height: '100%',
      maxHeight: 'calc(100vh - 120px)',
      overflowY: 'auto',
    }}>
      {/* Listado */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexGrow: 1 }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          Brigadas ({tecnicos.length})
        </div>
        
        {loading ? (
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
            Cargando brigadas…
          </div>
        ) : tecnicos.length === 0 ? (
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
            No se encontraron técnicos.
          </div>
        ) : (
          tecnicos.map(t => {
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {t.nombre}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <span>{t.codigoSap}</span>
                      <span>•</span>
                      <span>{t.zona}</span>
                      <span>•</span>
                      <span style={{ fontWeight: 600, color: '#6366F1' }}>{t.tipoBrigada}</span>
                    </div>
                  </div>
                  <div style={{
                    flexShrink: 0,
                    fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px',
                    color: eColor, border: `1px solid ${eColor}40`, background: `${eColor}10`,
                    whiteSpace: 'nowrap',
                  }}>
                    {t.estado}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>
                    <span>{t.supervisor}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '10px', padding: '2px 6px', borderRadius: '4px',
                      background: t.fase === 3 ? '#FEE2E2' : t.fase === 2 ? '#FEF3C7' : '#F1F5F9',
                      color: t.fase === 3 ? '#DC2626' : t.fase === 2 ? '#D97706' : '#475569',
                      fontWeight: 600,
                    }}>
                      N{t.fase}
                    </span>
                    {t.advertenciasActivas > 0 && (
                      <span style={{
                        fontSize: '10px', padding: '2px 6px', borderRadius: '4px',
                        background: '#FEE2E2', color: '#DC2626', fontWeight: 600,
                      }}>
                        {t.advertenciasActivas} adv.
                      </span>
                    )}
                    <span style={{ fontSize: '10px', background: '#F1F5F9', padding: '2px 6px', borderRadius: '4px', color: '#475569' }}>
                      {t.productividadPromedio > 0 ? `${t.productividadPromedio} cortes` : '—'}
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
