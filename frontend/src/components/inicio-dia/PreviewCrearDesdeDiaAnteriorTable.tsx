import { thStyle, tdStyle, badgeOperativaStyle, badgeInactivaStyle, actionBtnSmallStyle } from '../../styles/dashboardStyles';
import type { ComparacionBrigadaDia } from '../../utils/inicio-dia/compararBrigadasDiaActual';
import type { ParametroZona } from '../../types/programacionZona';
import { useDataTableControls } from '../../hooks/useDataTableControls';
import { DataTableToolbar } from '../common/DataTableToolbar';
import { SortableHeaderCell } from '../common/SortableHeaderCell';

const inputStyleLocal = {
  width: '100%',
  padding: '0.25rem',
  background: '#FFFFFF',
  border: '1px solid #E2E8F0',
  color: '#1E293B',
  borderRadius: '4px',
  fontSize: '0.8rem',
  outline: 'none',
  boxSizing: 'border-box' as const,
};

const selectStyleLocal = {
  ...inputStyleLocal,
  appearance: 'none' as const,
};

interface PreviewCrearDesdeDiaAnteriorTableProps {
  comparacion: ComparacionBrigadaDia[];
  zonas: ParametroZona[];
  onToggleAplicar: (index: number) => void;
  onEditRow: (index: number, field: string, value: string) => void;
  onDeleteRow: (index: number) => void;
}

export const PreviewCrearDesdeDiaAnteriorTable = ({
  comparacion,
  zonas,
  onToggleAplicar,
  onEditRow,
  onDeleteRow
}: PreviewCrearDesdeDiaAnteriorTableProps) => {
  const {
    searchTerm,
    setSearchTerm,
    sortColumn,
    sortDirection,
    handleSort,
    clearFilters,
    processedData
  } = useDataTableControls<ComparacionBrigadaDia>({
    data: comparacion,
    searchableColumns: [
      'brigadaOrigen.zona',
      'brigadaOrigen.codigo_sap',
      'brigadaOrigen.patente',
      'brigadaOrigen.usuario',
      'brigadaOrigen.tipo_brigada',
      'brigadaOrigen.estado_brigada'
    ]
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <DataTableToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onClearFilters={clearFilters}
        totalCount={comparacion.length}
        filteredCount={processedData.length}
      />

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: '40px', textAlign: 'center' }}></th>
              <SortableHeaderCell column="estado" label="Estado" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
              <SortableHeaderCell column="brigadaOrigen.zona" label="Zona" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
              <SortableHeaderCell column="brigadaOrigen.codigo_sap" label="SAP" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
              <SortableHeaderCell column="brigadaOrigen.patente" label="Patente" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
              <SortableHeaderCell column="brigadaOrigen.usuario" label="Usuario" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
              <SortableHeaderCell column="brigadaOrigen.tipo_brigada" label="Tipo" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
              <SortableHeaderCell column="brigadaOrigen.estado_brigada" label="Estado Brig." sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
              <th style={thStyle}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {processedData.map((item) => {
              const idx = comparacion.findIndex(c => c === item); // get original index
              const b = item.brigadaOrigen;
              
              // Validate row
              const isValid = b.zona && b.codigo_sap && b.patente && b.usuario && b.tipo_brigada && b.estado_brigada;
              const hasError = item.estado === 'error' || !isValid;

              const rowStyle = {
                borderBottom: '1px solid #E2E8F0',
                background: item.estado === 'ya_existe' ? 'rgba(255,255,255,0.02)' : hasError ? 'rgba(153,27,27,0.1)' : 'transparent',
                opacity: item.estado === 'ya_existe' ? 0.6 : 1
              };

              const statusBadge = b.estado_brigada.toLowerCase() === 'inactiva' ? badgeInactivaStyle : badgeOperativaStyle;
              let badgeStyle = { ...statusBadge, padding: '2px 8px' };
              
              if (item.estado === 'ya_existe') {
                 badgeStyle = { background: '#475569', color: '#1E293B', borderRadius: '12px', padding: '2px 8px', fontSize: '0.8rem' };
              } else if (item.estado === 'crear') {
                 badgeStyle = { background: '#166534', color: '#1E293B', borderRadius: '12px', padding: '2px 8px', fontSize: '0.8rem' };
              }
              if (hasError) {
                 badgeStyle = { background: '#991b1b', color: '#1E293B', borderRadius: '12px', padding: '2px 8px', fontSize: '0.8rem' };
              }

              let estadoText = 'A Crear';
              if (item.estado === 'ya_existe') estadoText = 'Ya Existe';
              if (hasError) estadoText = item.mensajeError || 'Inválido';

              return (
                <tr key={idx} style={rowStyle}>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={item.aplicar && !hasError}
                      onChange={() => onToggleAplicar(idx)}
                      disabled={item.estado !== 'crear' || hasError}
                    />
                  </td>
                  <td style={tdStyle}>
                    <span style={badgeStyle}>{estadoText}</span>
                  </td>
                  <td style={tdStyle}>
                    <select value={b.zona} onChange={(e) => onEditRow(idx, 'zona', e.target.value)} style={{...selectStyleLocal, width: '100px'}}>
                      <option value="">Selec...</option>
                      {zonas.map(z => <option key={z.zona} value={z.zona}>{z.zona}</option>)}
                    </select>
                  </td>
                  <td style={tdStyle}>
                    <input type="text" value={b.codigo_sap} onChange={(e) => onEditRow(idx, 'codigo_sap', e.target.value)} style={{...inputStyleLocal, width: '90px'}} />
                  </td>
                  <td style={tdStyle}>
                    <input type="text" value={b.patente} onChange={(e) => onEditRow(idx, 'patente', e.target.value)} style={{...inputStyleLocal, width: '90px'}} />
                  </td>
                  <td style={tdStyle}>
                    <input type="text" value={b.usuario} onChange={(e) => onEditRow(idx, 'usuario', e.target.value)} style={{...inputStyleLocal, width: '120px'}} />
                  </td>
                  <td style={tdStyle}>
                    <select value={b.tipo_brigada} onChange={(e) => onEditRow(idx, 'tipo_brigada', e.target.value)} style={{...selectStyleLocal, width: '100px'}}>
                      <option value="PXQ">PXQ</option>
                      <option value="CF">CF</option>
                    </select>
                  </td>
                  <td style={tdStyle}>
                    <select value={b.estado_brigada} onChange={(e) => onEditRow(idx, 'estado_brigada', e.target.value)} style={{...selectStyleLocal, width: '100px'}}>
                      <option value="Operativa">Operativa</option>
                      <option value="Inactiva">Inactiva</option>
                    </select>
                  </td>
                  <td style={tdStyle}>
                    <button type="button" onClick={() => onDeleteRow(idx)} style={{ ...actionBtnSmallStyle, background: '#FEE2E2', borderColor: '#FCA5A5', color: '#DC2626' }}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              );
            })}
            {processedData.length === 0 && (
              <tr>
                <td colSpan={8} style={{ ...tdStyle, textAlign: 'center', color: '#64748B' }}>
                  No hay brigadas para mostrar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
