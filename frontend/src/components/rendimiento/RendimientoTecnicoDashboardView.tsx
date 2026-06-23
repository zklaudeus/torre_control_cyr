import React, { useState } from 'react';
import { DashboardLayout } from '../dashboard/DashboardLayout';
import { TarjetaUsuarioRendimiento } from './TarjetaUsuarioRendimiento';
import { RendimientoTecnicoKpiCards } from './RendimientoTecnicoKpiCards';
import { RendimientoTecnicoSemaforos } from './RendimientoTecnicoSemaforos';
import { RendimientoTecnicoFaseSeguimiento } from './RendimientoTecnicoFaseSeguimiento';
import { RendimientoTecnicoCursos } from './RendimientoTecnicoCursos';
import { RendimientoTecnicoHallazgos } from './RendimientoTecnicoHallazgos';
import { RendimientoTecnicoRecomendacion } from './RendimientoTecnicoRecomendacion';
import { RendimientoTecnicoSelector } from './RendimientoTecnicoSelector';
import type { TecnicoResumen } from '../../types/rendimientoTecnico.types';

interface RendimientoTecnicoDashboardViewProps {
  fechaOperacional: string;
  onChangeFecha: (fecha: string) => void;
  activeSection: string;
  onChangeSection: (section: string) => void;
}

export const RendimientoTecnicoDashboardView: React.FC<RendimientoTecnicoDashboardViewProps> = ({
  fechaOperacional: _fechaOperacional,
  onChangeFecha: _onChangeFecha,
  activeSection,
  onChangeSection
}) => {
  const [selectedTecnico, setSelectedTecnico] = useState<TecnicoResumen | null>(null);

  return (
    <DashboardLayout
      activeSection={activeSection}
      onChangeSection={onChangeSection}
    >
      <style>{`
        .rt-main-layout {
          display: grid;
          grid-template-columns: 340px 1fr;
          gap: 20px;
          padding: 20px;
          background: var(--bg-main);
          min-height: 100%;
          font-family: var(--sans);
          align-items: start;
        }
        @media (max-width: 1024px) {
          .rt-main-layout {
            grid-template-columns: 1fr;
          }
        }
        .rt-ficha {
          display: flex;
          flex-direction: column;
          gap: 20px;
          min-width: 0;
        }
        .rt-top-row {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 1100px) {
          .rt-top-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="rt-main-layout">
        
        {/* Listado Lateral Izquierdo */}
        <div style={{ position: 'sticky', top: '20px' }}>
          <RendimientoTecnicoSelector selectedId={selectedTecnico?.id || null} onSelect={setSelectedTecnico} />
        </div>

        {/* Ficha a la Derecha */}
        <div className="rt-ficha">
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--text-main)' }}>
              Rendimiento Técnico
            </h2>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Seguimiento individual de productividad y desempeño
            </span>
          </div>

          {!selectedTecnico ? (
            <div style={{
              padding: '60px 20px',
              textAlign: 'center',
              background: 'var(--bg-panel)',
              border: '1px dashed var(--border)',
              borderRadius: '8px',
              color: 'var(--text-muted)'
            }}>
              Selecciona un técnico del listado para ver su ficha de rendimiento.
            </div>
          ) : (
            <>
              {/* Fila superior: Tarjeta usuario + Fase de Seguimiento */}
              <div className="rt-top-row">
                {/* Tarjeta usuario */}
                <div>
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
                      Técnico evaluado
                    </span>
                  </div>
                  <TarjetaUsuarioRendimiento
                    usuarioSap={selectedTecnico.nombre}
                    codigoSap={selectedTecnico.codigoSap}
                    zona={selectedTecnico.zona}
                    supervisorResponsable={selectedTecnico.supervisor}
                  />
                </div>

                {/* Fase de Seguimiento */}
                <RendimientoTecnicoFaseSeguimiento />
              </div>

              {/* Separador */}
              <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 0 }} />

              {/* KPI Cards */}
              <RendimientoTecnicoKpiCards />

              {/* Separador */}
              <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 0 }} />

              {/* Semáforos operacionales */}
              <RendimientoTecnicoSemaforos />

              {/* Separador */}
              <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 0 }} />

              {/* Cursos realizados */}
              <RendimientoTecnicoCursos />

              {/* Separador */}
              <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 0 }} />

              {/* Grid para Hallazgos y Recomendación */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '20px',
              }}>
                <RendimientoTecnicoHallazgos />
                <RendimientoTecnicoRecomendacion />
              </div>
            </>
          )}

        </div>
      </div>
    </DashboardLayout>
  );
};
