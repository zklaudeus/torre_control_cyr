import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '../dashboard/DashboardLayout';
import { TarjetaUsuarioRendimiento } from './TarjetaUsuarioRendimiento';
import { RendimientoTecnicoKpiCards } from './RendimientoTecnicoKpiCards';
import { RendimientoTecnicoSemaforos } from './RendimientoTecnicoSemaforos';
import { RendimientoTecnicoFaseSeguimiento } from './RendimientoTecnicoFaseSeguimiento';
import { RendimientoTecnicoCursos } from './RendimientoTecnicoCursos';
import { RendimientoTecnicoHallazgos } from './RendimientoTecnicoHallazgos';
import { RendimientoTecnicoRecomendacion } from './RendimientoTecnicoRecomendacion';
import { RendimientoTecnicoSelector } from './RendimientoTecnicoSelector';
import { RendimientoTecnicoPanelZonas } from './RendimientoTecnicoPanelZonas';
import { useProductividad } from '../../hooks/useProductividad';
import { useAuth } from '../../auth/AuthContext';
import { getZonasResumen, getSemaforosTecnico } from '../../api/productividad.api';
import type { ZonaResumenPanelBackend } from '../../api/productividad.api';
import type { EstadoTecnico, SemaforoTecnico, TecnicoResumen } from '../../types/rendimientoTecnico.types';

interface RendimientoTecnicoDashboardViewProps {
  fechaOperacional: string;
  onChangeFecha: (fecha: string) => void;
  activeSection: string;
  onChangeSection: (section: string) => void;
}

export const RendimientoTecnicoDashboardView: React.FC<RendimientoTecnicoDashboardViewProps> = ({
  fechaOperacional,
  onChangeFecha,
  activeSection,
  onChangeSection
}) => {
  const { user } = useAuth();
  const {
    tecnicos,
    loadingTecnicos,
    selectedTecnico,
    selectTecnico,
    rendimiento,
    kpiResumen,
    loadingRendimiento,
    alertas,
    seguimiento,
    registrandoAdvertencia,
    registrarAdvertencia,
    cambiandoFase,
    cambiarFase,
    anulandoAdvertencia,
    anularAdvertencia,
    eliminandoAdvertencia,
    eliminarAdvertencia,
  } = useProductividad(fechaOperacional);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<EstadoTecnico | 'Todos'>('Todos');
  const [filterZona, setFilterZona] = useState<string>('Todas');
  const [filterFase] = useState<string>('Todas');

  // ─── Query Params ──────────────────────────────────────
  const [searchParams, setSearchParams] = useSearchParams();
  const zonaFromUrl = searchParams.get('zona');
  const codigoSapFromUrl = searchParams.get('codigo_sap');

  // ─── Panel de Zonas ───────────────────────────────────────
  const [selectedZona, setSelectedZona] = useState<string | null>(null);
  const [zonasData, setZonasData] = useState<ZonaResumenPanelBackend[]>([]);
  const [loadingZonas, setLoadingZonas] = useState(true);

  // ─── Semáforos ─────────────────────────────────────────────
  const [semaforos, setSemaforos] = useState<SemaforoTecnico[]>([]);
  const [loadingSemaforos, setLoadingSemaforos] = useState(false);

  const canEditSemaforos = user?.rol === 'torre_control' || user?.rol === 'admin' || user?.rol === 'superadmin';

  // Restaurar estado desde URL al montar el componente
  useEffect(() => {
    if (zonasData.length === 0 && loadingZonas) return;

    if (zonaFromUrl && selectedZona !== zonaFromUrl) {
      setSelectedZona(zonaFromUrl);
      setFilterZona(zonaFromUrl);
    }

    if (zonaFromUrl && codigoSapFromUrl && tecnicos.length > 0 && !selectedTecnico) {
      const tecnico = tecnicos.find(t => t.codigoSap === codigoSapFromUrl);
      if (tecnico && selectTecnico) {
        selectTecnico(tecnico);
      }
    }

  }, [zonaFromUrl, codigoSapFromUrl, selectedZona, loadingZonas, zonasData.length, tecnicos.length, selectedTecnico, selectTecnico]);

  useEffect(() => {
    let cancelled = false;
    setLoadingZonas(true);
    getZonasResumen().then(data => {
      if (!cancelled) {
        setZonasData(data);
        setLoadingZonas(false);
      }
    }).catch(() => {
      if (!cancelled) setLoadingZonas(false);
    });
    return () => { cancelled = true; };
  }, []);

  // Cargar semáforos cuando se selecciona un técnico
  useEffect(() => {
    if (!selectedTecnico?.codigoSap) {
      setSemaforos([]);
      return;
    }
    let cancelled = false;
    setLoadingSemaforos(true);
    getSemaforosTecnico(selectedTecnico.codigoSap).then(data => {
      if (!cancelled) {
        setSemaforos(data.map(s => ({
          categoria: s.categoria,
          estado: s.estado as SemaforoTecnico['estado'],
          descripcion: s.descripcion,
          updated_at: s.updated_at,
          usuario_actualiza_id: s.usuario_actualiza_id,
        })));
        setLoadingSemaforos(false);
      }
    }).catch(() => {
      if (!cancelled) setLoadingSemaforos(false);
    });
    return () => { cancelled = true; };
  }, [selectedTecnico?.codigoSap]);

  const handleSelectZona = useCallback((zona: string) => {
    setSelectedZona(zona);
    setFilterZona(zona);
    const params = new URLSearchParams(searchParams);
    params.set('zona', zona);
    params.delete('codigo_sap');
    setSearchParams(params);
  }, [searchParams, setSearchParams]);

  const handleSelectTecnico = useCallback((tecnico: TecnicoResumen) => {
    selectTecnico(tecnico);
    const params = new URLSearchParams(searchParams);
    if (selectedZona) {
      params.set('zona', selectedZona);
    }
    params.set('codigo_sap', tecnico.codigoSap);
    setSearchParams(params);
  }, [selectedZona, searchParams, setSearchParams, selectTecnico]);

  const handleBackToZonas = useCallback(() => {
    setSelectedZona(null);
    setFilterZona('Todas');
    // Reset technician selection when going back to zones
    selectTecnico(null);
    const params = new URLSearchParams(searchParams);
    params.delete('zona');
    params.delete('codigo_sap');
    setSearchParams(params);
  }, [searchParams, setSearchParams, selectTecnico]);

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
    <DashboardLayout
      activeSection={activeSection}
      onChangeSection={onChangeSection}
    >
      <style>{`
        .rt-main-layout {
          display: grid;
          grid-template-columns: 300px 1fr;
          grid-template-areas:
            "sidebar ficha-header"
            "sidebar ficha-content";
          gap: 16px;
          padding: 12px;
          background: var(--bg-main);
          min-height: 100%;
          font-family: var(--sans);
          align-items: start;
        }
        .rt-zonas-full {
          padding: 16px 20px;
          background: var(--bg-main);
          min-height: 100%;
          font-family: var(--sans);
        }
        .rt-sidebar {
          grid-area: sidebar;
          position: sticky;
          top: 12px;
          max-height: calc(100vh - 24px);
          overflow-y: auto;
        }
        .rt-ficha-header {
          grid-area: ficha-header;
          display: flex;
          flex-direction: column;
          gap: 16px;
          min-width: 0;
        }
        .rt-ficha-content {
          grid-area: ficha-content;
          display: flex;
          flex-direction: column;
          gap: 16px;
          min-width: 0;
        }
        .rt-sidebar::-webkit-scrollbar {
          width: 6px;
        }
        .rt-sidebar::-webkit-scrollbar-thumb {
          background: var(--border);
          border-radius: 4px;
        }
        @media (max-width: 1024px) {
          .rt-main-layout {
            grid-template-columns: 1fr;
            grid-template-areas:
              "ficha-header"
              "sidebar"
              "ficha-content";
          }
          .rt-sidebar {
            position: static;
            max-height: none;
            overflow-y: visible;
          }
        }
        .rt-top-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          align-items: stretch;
        }
        @media (max-width: 1100px) {
          .rt-top-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* ── Modo A: Sin zona seleccionada → Panel de zonas full page ── */}
      {!selectedZona ? (
        <div className="rt-zonas-full">
        <RendimientoTecnicoPanelZonas
          zonas={zonasData}
          loading={loadingZonas}
          onSelectZona={handleSelectZona}
        />
        </div>
      ) : (

      /* ── Modo B: Zona seleccionada → Grid sidebar + contenido ── */
      <div className="rt-main-layout">

        {/* Sidebar: botón volver + lista brigadas */}
        <div className="rt-sidebar">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              onClick={handleBackToZonas}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600,
                padding: '8px 0', textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}
            >
              ← Volver a zonas
            </button>
            <div style={{
              fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)',
              textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px',
            }}>
              {selectedZona}
            </div>
            <RendimientoTecnicoSelector
              tecnicos={filteredTecnicos}
              loading={loadingTecnicos}
              selectedId={selectedTecnico?.id || null}
              onSelect={handleSelectTecnico}
            />
          </div>
        </div>

        {/* Header + Filtros */}
        <div className="rt-ficha-header">
          <>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--text-main)' }}>
                Rendimiento Brigada
              </h2>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Seguimiento individual de productividad y desempeño
              </span>
              <label style={{
                marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px',
                fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.6px',
              }}>
                Fecha operacional
                <input
                  type="date"
                  value={fechaOperacional}
                  onChange={e => onChangeFecha(e.target.value)}
                  style={{
                    padding: '6px 9px', border: '1px solid var(--border)', borderRadius: '6px',
                    background: 'var(--bg-panel)', color: 'var(--text-main)', fontSize: '12px',
                  }}
                />
              </label>
            </div>

            {/* Filtros búsqueda */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Buscar brigada..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{
                    flex: '1 1 200px', padding: '7px 12px',
                    border: '1px solid var(--border)', borderRadius: '8px',
                    background: 'var(--bg-panel)', color: 'var(--text-main)', fontSize: '13px',
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                {[
                  { value: 'Todos',            label: 'Todos',          activeColor: '#1E3A5F', activeBg: '#E8EFF7' },
                  { value: 'Crítico',          label: 'Crítico',        activeColor: '#991B1B', activeBg: '#FEE2E2' },
                  { value: 'En recuperación',  label: 'Recuperación',   activeColor: '#78350F', activeBg: '#FEF9C3' },
                  { value: 'Estable',          label: 'Estable',        activeColor: '#1E4D3A', activeBg: '#D1FAE5' },
                  { value: 'Alto desempeño',   label: 'Alto desempeño', activeColor: '#312E81', activeBg: '#EEF2FF' },
                  { value: 'Sin evaluación',   label: 'Sin eval.',      activeColor: '#374151', activeBg: '#F1F5F9' },
                ].map(f => (
                  <button
                    key={f.value}
                    onClick={() => setFilterEstado(f.value as EstadoTecnico | 'Todos')}
                    style={{
                      padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 600,
                      border: `1px solid ${filterEstado === f.value ? f.activeColor : 'var(--border)'}`,
                      background: filterEstado === f.value ? f.activeBg : 'var(--bg-panel)',
                      color: filterEstado === f.value ? f.activeColor : 'var(--text-muted)',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    {f.label}
                  </button>
                ))}
                <span style={{
                  fontSize: '12px', color: '#94A3B8', alignSelf: 'center',
                  marginLeft: 'auto', padding: '0 4px',
                }}>
                  {filteredTecnicos.length} brigadas
                </span>
              </div>
            </div>
          </>
        </div>

        {/* Contenido: Ficha del Técnico Evaluado */}
        <div className="rt-ficha-content">
          {selectedZona ? (
            !selectedTecnico ? (
              <div style={{
                padding: '60px 20px',
                textAlign: 'center',
                background: 'var(--bg-panel)',
                border: '1px dashed var(--border)',
                borderRadius: '8px',
                color: 'var(--text-muted)'
              }}>
                Selecciona una brigada del listado para ver su ficha de rendimiento.
              </div>
            ) : (
              <>
                <div className="rt-top-row">
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{
                      marginBottom: '10px',
                      display: 'flex', alignItems: 'center', gap: '8px',
                    }}>
                      <span style={{
                        width: '3px', height: '18px', borderRadius: '2px',
                        background: 'var(--primary)', display: 'inline-block', flexShrink: 0,
                      }} />
                      <span style={{
                        fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)',
                        textTransform: 'uppercase', letterSpacing: '1px',
                      }}>
                        Brigada evaluada
                      </span>
                    </div>
                    <TarjetaUsuarioRendimiento
                      usuarioSap={rendimiento?.usuario ?? selectedTecnico.nombre}
                      codigoSap={selectedTecnico.codigoSap}
                      brigada={rendimiento?.brigada}
                      pareja={rendimiento?.pareja}
                      zona={rendimiento?.zona ?? selectedTecnico.zona}
                      patente={rendimiento?.patente}
                      fechaOperacional={rendimiento?.fecha_operacional ?? fechaOperacional}
                      tipoBrigada={rendimiento?.tipo_brigada ?? selectedTecnico.tipoBrigada}
                      productividad={rendimiento ? `${rendimiento.cortes_productivos} cortes (${rendimiento.cumplimiento_pct}%)` : null}
                      estadoRendimiento={rendimiento?.estado_diario ?? selectedTecnico.estado}
                      supervisorResponsable={selectedTecnico.supervisor}
                    />
                  </div>

                  <RendimientoTecnicoFaseSeguimiento
                    seguimiento={seguimiento}
                    codigoSap={selectedTecnico.codigoSap}
                    userRol={user?.rol || ''}
                    onRegistrarAdvertencia={async (motivo) => {
                      await registrarAdvertencia(selectedTecnico.codigoSap, fechaOperacional, motivo);
                    }}
                    registrandoAdvertencia={registrandoAdvertencia}
                    onCambiarFase={async (faseNueva, motivo) => {
                      await cambiarFase(selectedTecnico.codigoSap, faseNueva, motivo);
                    }}
                    cambiandoFase={cambiandoFase}
                    onAnularAdvertencia={async (advertenciaId, motivo) => {
                      await anularAdvertencia(advertenciaId, motivo);
                    }}
                    anulandoAdvertencia={anulandoAdvertencia}
                  />
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 0 }} />

                <RendimientoTecnicoKpiCards
                  kpiData={rendimiento ?? undefined}
                  resumen={kpiResumen ?? undefined}
                  loading={loadingRendimiento}
                />

                <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 0 }} />

                <RendimientoTecnicoSemaforos
                  semaforos={semaforos}
                  codigoSap={selectedTecnico?.codigoSap ?? ''}
                  canEdit={canEditSemaforos}
                  loading={loadingSemaforos}
                  onUpdated={updated => {
                    setSemaforos(prev => prev.map(s => s.categoria === updated.categoria ? updated : s));
                  }}
                />

                <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 0 }} />

                <RendimientoTecnicoCursos />

                <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 0 }} />

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '20px',
                }}>
                  <RendimientoTecnicoHallazgos
                    alertas={alertas}
                    puedeGestionar={user?.rol === 'torre_control' || user?.rol === 'admin' || user?.rol === 'superadmin'}
                    onAnularAdvertencia={async (advertenciaId, motivo) => {
                      await anularAdvertencia(advertenciaId, motivo);
                    }}
                    anulandoAdvertencia={anulandoAdvertencia}
                    onEliminarAdvertencia={async (advertenciaId) => {
                      await eliminarAdvertencia(advertenciaId);
                    }}
                    eliminandoAdvertencia={eliminandoAdvertencia}
                  />
                  <RendimientoTecnicoRecomendacion codigoSap={selectedTecnico?.codigoSap ?? null} />
                </div>
              </>
            )
          ) : null}
        </div>
      </div>
      )}
    </DashboardLayout>
  );
};
