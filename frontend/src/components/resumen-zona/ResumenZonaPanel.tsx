import { useEffect } from 'react';
import { AccordionPanel } from '../dashboard/AccordionPanel';
import { useResumenZona } from '../../hooks/useResumenZona';
import { tableStyle, tableHeadRowStyle, tableBodyRowStyle, tdStyle, errorAlertStyle } from '../../styles/dashboardStyles';
import type { ResumenZonaFila } from '../../types/resumenZona';
import { useDataTableControls } from '../../hooks/useDataTableControls';
import { DataTableToolbar } from '../common/DataTableToolbar';
import { SortableHeaderCell } from '../common/SortableHeaderCell';

interface ResumenZonaPanelProps {
  fechaOperacional: string;
  refreshKey: number;
}

const fmt = (n: number) => n.toLocaleString('es-CL', { maximumFractionDigits: 2 });
const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;

const FilaResumen = ({ fila, isTotal }: { fila: ResumenZonaFila; isTotal?: boolean }) => {
  const bgStyle = isTotal
    ? { background: '#F1F5F9', color: '#0A192F', fontWeight: 'bold' as const }
    : {};

  return (
    <tr style={{ ...tableBodyRowStyle, ...bgStyle }}>
      <td style={{ ...tdStyle, textAlign: 'left', fontWeight: isTotal ? 'bold' : 'normal' }}>
        {fila.zona}
      </td>
      <td style={tdStyle}>{fila.brigadas_pxq}</td>
      <td style={tdStyle}>{fila.brigadas_cf}</td>
      <td style={tdStyle}>{fila.brigadas_convenio}</td>
      <td style={{ ...tdStyle, fontWeight: 'bold' }}>{fila.total_brigadas_reportadas}</td>
      <td style={tdStyle}>{fila.brigadas_contrato}</td>
      <td style={{ ...tdStyle, color: fila.porcentaje_brigadas_efectivas >= 1 ? '#48bb78' : '#fc8181' }}>
        {fmtPct(fila.porcentaje_brigadas_efectivas)}
      </td>
      <td style={tdStyle}>{fila.reconexiones_programadas}</td>
      <td style={tdStyle}>{fila.total_reconexiones_ejecutadas}</td>
      <td style={tdStyle}>{fmt(fila.promedio_reconexiones)}</td>
      <td style={tdStyle}>{fila.asignacion_carga}</td>
      <td style={tdStyle}>{fila.corte_programado}</td>
      <td style={tdStyle}>{fila.total_cortes}</td>
      <td style={{ ...tdStyle, color: fila.cumplimiento_corte_porcentaje >= 1 ? '#48bb78' : '#fc8181' }}>
        {fmtPct(fila.cumplimiento_corte_porcentaje)}
      </td>
      <td style={tdStyle}>{fmt(fila.promedio_cortes)}</td>
      <td style={tdStyle}>{fila.total_actividades}</td>
      <td style={tdStyle}>{fmt(fila.promedio_actividades)}</td>
      <td style={{ ...tdStyle, color: fila.cumplimiento_promedio_meta >= 1 ? '#48bb78' : '#fc8181' }}>
        {fmtPct(fila.cumplimiento_promedio_meta)}
      </td>
      <td style={{ ...tdStyle, color: '#a0aec0', fontSize: '0.75rem' }}>{fila.observacion || '—'}</td>
    </tr>
  );
};

export const ResumenZonaPanel = ({ fechaOperacional, refreshKey }: ResumenZonaPanelProps) => {
  const { resumen, loading, error, fetchResumen } = useResumenZona(fechaOperacional);

  const {
    searchTerm,
    setSearchTerm,
    sortColumn,
    sortDirection,
    handleSort,
    clearFilters,
    processedData
  } = useDataTableControls<ResumenZonaFila>({
    data: resumen?.zonas || [],
    searchableColumns: ['zona', 'observacion']
  });

  useEffect(() => {
    fetchResumen();
  }, [fetchResumen, refreshKey]);

  return (
    <AccordionPanel title="RESUMEN CALCULADO POR ZONA" defaultOpen={true}>
      <div style={{ padding: '1rem' }}>
        {resumen && resumen.alertas.length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            {resumen.alertas.map((alerta, idx) => (
              <div
                key={idx}
                style={{ padding: '0.5rem', background: '#450a0a', border: '1px solid #7f1d1d', borderRadius: '4px', marginBottom: '0.5rem', color: '#fca5a5', fontSize: '0.8rem' }}
              >
                ⚠️ {alerta}
              </div>
            ))}
          </div>
        )}

        {loading && <p style={{ color: '#64748B' }}>Calculando resumen...</p>}

        {error && (
          <div style={errorAlertStyle}>{error}</div>
        )}

        {!loading && !error && resumen && (
          <div style={{ width: '100%' }}>
            <DataTableToolbar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onClearFilters={clearFilters}
              totalCount={resumen.zonas.length}
              filteredCount={processedData.length}
            />
            <div style={{ overflowX: 'auto' }}>
              <table style={tableStyle}>
                <thead>
                  <tr style={tableHeadRowStyle}>
                    <SortableHeaderCell column="zona" label="Zona" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} width="120px" />
                    <SortableHeaderCell column="brigadas_pxq" label="PXQ" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                    <SortableHeaderCell column="brigadas_cf" label="CF" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                    <SortableHeaderCell column="brigadas_convenio" label="Conv." sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                    <SortableHeaderCell column="total_brigadas_reportadas" label="Total B. Rep." sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                    <SortableHeaderCell column="brigadas_contrato" label="B. Contrato" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                    <SortableHeaderCell column="porcentaje_brigadas_efectivas" label="% B. Efectivas" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                    <SortableHeaderCell column="reconexiones_programadas" label="Rec. Prog." sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                    <SortableHeaderCell column="total_reconexiones_ejecutadas" label="Rec. Ejec." sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                    <SortableHeaderCell column="promedio_reconexiones" label="Prom. Rec." sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                    <SortableHeaderCell column="asignacion_carga" label="Asig. Carga" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                    <SortableHeaderCell column="corte_programado" label="Corte Prog." sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                    <SortableHeaderCell column="total_cortes" label="Total Cortes" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                    <SortableHeaderCell column="cumplimiento_corte_porcentaje" label="Cumpl. Corte %" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                    <SortableHeaderCell column="promedio_cortes" label="Prom. Cortes" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                    <SortableHeaderCell column="total_actividades" label="Total Act." sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                    <SortableHeaderCell column="promedio_actividades" label="Prom. Act." sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                    <SortableHeaderCell column="cumplimiento_promedio_meta" label="Cumpl. % Meta" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                    <SortableHeaderCell column="observacion" label="Observación" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                  </tr>
                </thead>
                <tbody>
                  {processedData.map((fila) => (
                    <FilaResumen key={fila.zona} fila={fila} isTotal={false} />
                  ))}
                  {(!searchTerm && !sortColumn) && <FilaResumen fila={resumen.total} isTotal={true} />}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && !error && resumen && resumen.zonas.length === 0 && (
          <p style={{ color: '#64748B', marginTop: '1rem' }}>No hay zonas activas configuradas para calcular el resumen.</p>
        )}
      </div>
    </AccordionPanel>
  );
};
