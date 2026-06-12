import { useState, useMemo } from 'react';
import type { ProgramacionZona } from '../../types/programacionZona';

const K = {
  primary: '#0B7BFF',
  secondary: '#08E5FF',
  tertiary: '#0A192F',
  neutral: '#F8FAFC',
  textMain: '#1A2B4A',
  textMuted: '#64748B',
  bgMain: '#F1F5F9',
  bgCard: '#FFFFFF',
  border: '#E2E8F0',
  success: '#10B981',
  successBg: '#D1FAE5',
  warning: '#F59E0B',
  warningBg: '#FEF3C7',
  info: '#3B82F6',
  infoBg: '#DBEAFE',
};

interface ProgramacionDiariaGridProps {
  data: ProgramacionZona[];
  onChange: (zona: string, tipo_brigada: string, field: keyof ProgramacionZona, value: string) => void;
}

type TabType = 'PXQ' | 'CF';

export const ProgramacionDiariaGrid = ({ data, onChange }: ProgramacionDiariaGridProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('PXQ');

  const filteredData = useMemo(() => data.filter(d => d.tipo_brigada === activeTab), [data, activeTab]);

  const summary = useMemo(() => {
    return filteredData.reduce(
      (acc, curr) => ({
        zonas: acc.zonas + 1,
        cortes: acc.cortes + (Number(curr.corte_programado) || 0),
        carga: acc.carga + (Number(curr.asignacion_carga) || 0),
        reconexiones: acc.reconexiones + (Number(curr.reconexiones_programadas) || 0),
      }),
      { zonas: 0, cortes: 0, carga: 0, reconexiones: 0 }
    );
  }, [filteredData]);

  const getStatus = (item: ProgramacionZona) => {
    // If all inputs have values > 0, it's completed, otherwise pending.
    // Real logic might depend on backend state or if it has an ID, but let's use a simple heuristic.
    const hasValues = item.corte_programado > 0 || item.asignacion_carga > 0 || item.reconexiones_programadas > 0;
    if (hasValues) return 'Completado';
    return 'Pendiente';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* Header and Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${K.border}`, paddingBottom: '1rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.4rem', color: K.tertiary, fontWeight: 800 }}>
          Programación diaria por zona
        </h2>
        
        <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', border: `1px solid ${K.border}` }}>
          <button
            onClick={() => setActiveTab('PXQ')}
            style={{
              padding: '0.4rem 1.2rem',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              background: activeTab === 'PXQ' ? K.primary : K.bgCard,
              color: activeTab === 'PXQ' ? '#FFF' : K.textMuted,
              transition: 'background 0.2s',
            }}
          >
            PXQ
          </button>
          <button
            onClick={() => setActiveTab('CF')}
            style={{
              padding: '0.4rem 1.2rem',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              background: activeTab === 'CF' ? K.primary : K.bgCard,
              color: activeTab === 'CF' ? '#FFF' : K.textMuted,
              transition: 'background 0.2s',
            }}
          >
            CF
          </button>
        </div>
      </div>

      {/* Summary Bar */}
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', padding: '0.5rem 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: K.textMuted }}>🏠 Total Zonas:</span>
          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: K.tertiary }}>{summary.zonas}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: K.textMuted }}>✂️ Cortes Prog:</span>
          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: K.tertiary }}>{summary.cortes}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: K.textMuted }}>👤 Asign. Carga:</span>
          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: K.tertiary }}>{summary.carga}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: K.textMuted }}>🔄 Rec. Programadas:</span>
          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: K.tertiary }}>{summary.reconexiones}</span>
        </div>
      </div>

      {/* Grid of Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '1.5rem',
      }}>
        {filteredData.map((item) => {
          const status = getStatus(item);
          const isCompleted = status === 'Completado';
          
          return (
            <div key={`${item.zona}-${item.tipo_brigada}`} style={{
              background: K.bgCard,
              borderRadius: '12px',
              padding: '1.25rem',
              boxShadow: '0 4px 6px rgba(0,0,0,0.02), 0 1px 3px rgba(0,0,0,0.05)',
              border: `1px solid ${isCompleted ? K.success : K.border}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              position: 'relative',
              transition: 'all 0.2s',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: K.tertiary, fontWeight: 700 }}>{item.zona}</h3>
                
                {status === 'Completado' && (
                  <span style={{ background: K.successBg, color: K.success, padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    ✅ Completado
                  </span>
                )}
                {status === 'Pendiente' && (
                  <span style={{ background: K.warningBg, color: K.warning, padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    ⚠️ Pendiente
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: K.textMain, fontWeight: 500 }}>Corte Prog</span>
                  <input 
                    type="number"
                    value={item.corte_programado === 0 ? '' : item.corte_programado}
                    onChange={(e) => onChange(item.zona, item.tipo_brigada, 'corte_programado', e.target.value)}
                    style={{
                      width: '100px', padding: '0.4rem 0.5rem', borderRadius: '6px',
                      border: `1px solid ${K.border}`, textAlign: 'right', fontSize: '0.9rem',
                      background: K.bgMain, color: K.textMain, fontWeight: 600,
                      outline: 'none', transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = K.primary}
                    onBlur={(e) => e.target.style.borderColor = K.border}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: K.textMain, fontWeight: 500 }}>Asign. Carga</span>
                  <input 
                    type="number"
                    value={item.asignacion_carga === 0 ? '' : item.asignacion_carga}
                    onChange={(e) => onChange(item.zona, item.tipo_brigada, 'asignacion_carga', e.target.value)}
                    style={{
                      width: '100px', padding: '0.4rem 0.5rem', borderRadius: '6px',
                      border: `1px solid ${K.border}`, textAlign: 'right', fontSize: '0.9rem',
                      background: K.bgMain, color: K.textMain, fontWeight: 600,
                      outline: 'none', transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = K.primary}
                    onBlur={(e) => e.target.style.borderColor = K.border}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: K.textMain, fontWeight: 500 }}>Rec. Programadas</span>
                  <input 
                    type="number"
                    value={item.reconexiones_programadas === 0 ? '' : item.reconexiones_programadas}
                    onChange={(e) => onChange(item.zona, item.tipo_brigada, 'reconexiones_programadas', e.target.value)}
                    style={{
                      width: '100px', padding: '0.4rem 0.5rem', borderRadius: '6px',
                      border: `1px solid ${K.border}`, textAlign: 'right', fontSize: '0.9rem',
                      background: K.bgMain, color: K.textMain, fontWeight: 600,
                      outline: 'none', transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = K.primary}
                    onBlur={(e) => e.target.style.borderColor = K.border}
                  />
                </div>
              </div>
              
              {/* Optional Guardar button on the card itself, or we rely on the global Save button. 
                  Given the design had a floating blue "Guardar" on an active card, we could show it when focused.
                  For simplicity and robustness, the main save will be used via handleSaveAll.
              */}
            </div>
          );
        })}
      </div>
      {filteredData.length === 0 && (
        <div style={{ padding: '3rem', textAlign: 'center', color: K.textMuted, background: K.bgCard, borderRadius: '12px', border: `1px dashed ${K.border}` }}>
          No hay zonas activas para la pestaña seleccionada.
        </div>
      )}
    </div>
  );
};
