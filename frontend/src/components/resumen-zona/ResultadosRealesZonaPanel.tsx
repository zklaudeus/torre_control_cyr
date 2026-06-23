import { useEffect } from 'react';
import { AccordionPanel } from '../dashboard/AccordionPanel';
import { useResultadosRealesZona } from '../../hooks/useResultadosRealesZona';
import { tableStyle, tableHeadRowStyle, tableBodyRowStyle, tdStyle, errorAlertStyle } from '../../styles/dashboardStyles';
import type { ResultadoRealZonaCalculado } from '../../types/resultadoRealZona';
import { useDataTableControls } from '../../hooks/useDataTableControls';
import { DataTableToolbar } from '../common/DataTableToolbar';
import { SortableHeaderCell } from '../common/SortableHeaderCell';

interface ResultadosRealesZonaPanelProps {
  fechaOperacional: string;
  refreshKey: number;
}

export const ResultadosRealesZonaPanel = ({ fechaOperacional, refreshKey }: ResultadosRealesZonaPanelProps) => {
  const { data, loading, error, fetchResultados } = useResultadosRealesZona(fechaOperacional);

  // Eliminar duplicados por zona (ej: cuando la API devuelve registros adicionales idénticos)
  const uniqueZonas = (data?.zonas || []).reduce((acc: ResultadoRealZonaCalculado[], current) => {
    if (!acc.find(item => item.zona === current.zona)) {
      acc.push(current);
    }
    return acc;
  }, []);

  const {
    searchTerm,
    setSearchTerm,
    sortColumn,
    sortDirection,
    handleSort,
    clearFilters,
    processedData
  } = useDataTableControls<ResultadoRealZonaCalculado>({
    data: uniqueZonas,
    searchableColumns: ['zona']
  });

  useEffect(() => {
    fetchResultados();
  }, [fetchResultados, refreshKey]);

  return (
    <AccordionPanel title="RESULTADOS REALES POR ZONA" defaultOpen={true}>
      <div style={{ padding: '1rem' }}>
        {data && data.alertas.length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            {data.alertas.map((alerta, idx) => (
              <div
                key={idx}
                style={{ padding: '0.5rem', background: '#450a0a', border: '1px solid #7f1d1d', borderRadius: '4px', marginBottom: '0.5rem', color: '#fca5a5', fontSize: '0.8rem' }}
              >
                ⚠️ {alerta}
              </div>
            ))}
          </div>
        )}

        {loading && <p style={{ color: '#64748B' }}>Calculando resultados reales...</p>}

        {error && (
          <div style={errorAlertStyle}>{error}</div>
        )}

        {!loading && !error && data && (
          <>
            {data.zonas.length === 0 ? (
              <p style={{ color: '#64748B' }}>No hay zonas activas para mostrar.</p>
            ) : (
              <div style={{ width: '100%' }}>
                <DataTableToolbar
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  onClearFilters={clearFilters}
                  totalCount={data.zonas.length}
                  filteredCount={processedData.length}
                />
                <div style={{ overflowX: 'auto' }}>
                  <table style={tableStyle}>
                    <thead>
                      <tr style={tableHeadRowStyle}>
                        <SortableHeaderCell
                          column="zona"
                          label="Zona"
                          sortColumn={sortColumn}
                          sortDirection={sortDirection}
                          onSort={handleSort}
                          style={{
                            position: 'sticky',
                            left: 0,
                            zIndex: 10,
                            background: '#F8FAFC',
                            minWidth: '130px',
                            boxShadow: '4px 0 6px -2px rgba(0,0,0,0.08)',
                          }}
                        />
                        <SortableHeaderCell column="total_reconexiones_ejecutadas" label="Rec. Ejec." sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                        <SortableHeaderCell column="total_cortes" label="Total Cortes" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                        <SortableHeaderCell column="corte_en_poste" label="C. Poste" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                        <SortableHeaderCell column="corte_en_empalme" label="C. Empalme" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                        <SortableHeaderCell column="corte_fuera_de_rango" label="C. F. Rango" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                        <SortableHeaderCell column="visita_fallida" label="V. Fallida" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                      </tr>
                    </thead>
                    <tbody>
                      {processedData.map((z: ResultadoRealZonaCalculado, idx: number) => (
                        <tr
                          key={`${z.fecha_operacional}-${z.zona}-${(z as any).tipo_brigada || idx}`}
                          style={{ ...tableBodyRowStyle, opacity: z.tiene_brigadas ? 1 : 0.5 }}
                        >
                          <td style={{
                            ...tdStyle,
                            textAlign: 'left',
                            fontWeight: 'bold',
                            position: 'sticky',
                            left: 0,
                            zIndex: 5,
                            background: '#FFFFFF',
                            minWidth: '130px',
                            boxShadow: '4px 0 6px -2px rgba(0,0,0,0.06)',
                            whiteSpace: 'nowrap',
                          }}>
                            {z.zona}
                            {!z.tiene_brigadas && (
                              <span style={{ marginLeft: '0.5rem', fontSize: '0.65rem', color: '#d97706', fontWeight: 'normal' }}>
                                sin brigadas
                              </span>
                            )}
                          </td>
                          <td style={tdStyle}>{z.total_reconexiones_ejecutadas}</td>
                          <td style={{ ...tdStyle, fontWeight: 'bold', color: '#fb923c' }}>{z.total_cortes}</td>
                          <td style={tdStyle}>{z.corte_en_poste}</td>
                          <td style={tdStyle}>{z.corte_en_empalme}</td>
                          <td style={{ ...tdStyle, color: z.corte_fuera_de_rango > 0 ? '#a78bfa' : undefined }}>{z.corte_fuera_de_rango}</td>
                          <td style={tdStyle}>{z.visita_fallida}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            <p style={{ color: '#555', fontSize: '0.75rem', marginTop: '1rem' }}>
              * Los datos se calculan en tiempo real desde las brigadas cargadas en "Brigadas del día".
            </p>
          </>
        )}
      </div>
    </AccordionPanel>
  );
};
