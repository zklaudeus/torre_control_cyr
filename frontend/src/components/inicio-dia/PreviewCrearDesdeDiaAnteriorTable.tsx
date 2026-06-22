import { thStyle, tdStyle, badgeOperativaStyle, badgeInactivaStyle, actionBtnSmallStyle } from '../../styles/dashboardStyles';
import type { ComparacionBrigadaDia } from '../../utils/inicio-dia/compararBrigadasDiaActual';
import type { ParametroZona } from '../../types/programacionZona';
import { useDataTableControls } from '../../hooks/useDataTableControls';
import { DataTableToolbar } from '../common/DataTableToolbar';
import { SortableHeaderCell } from '../common/SortableHeaderCell';

const inputStyleLocal = {
  width: '100%',
  padding: '0.4rem 0.5rem',
  background: 'var(--bg-main)',
  border: '1px solid var(--border)',
  color: 'var(--text-main)',
  borderRadius: '6px',
  fontSize: '0.85rem',
  outline: 'none',
  boxSizing: 'border-box' as const,
  transition: 'border-color 0.2s',
  fontWeight: 500,
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

      <div className="table-responsive">
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
                borderBottom: '1px solid var(--border)',
                background: item.estado === 'ya_existe' ? 'var(--bg-panel-sec)' : hasError ? '#FEF2F2' : 'var(--bg-panel)',
                opacity: item.estado === 'ya_existe' ? 0.7 : 1,
                transition: 'background 0.2s'
              };

              const statusBadge = b.estado_brigada.toLowerCase() === 'inactiva' ? badgeInactivaStyle : badgeOperativaStyle;
              let badgeStyle = { ...statusBadge, padding: '4px 10px', fontSize: '0.75rem', fontWeight: 600, display: 'inline-block', borderRadius: '12px' };
              
              if (item.estado === 'ya_existe') {
                 badgeStyle = { ...badgeStyle, background: '#FEF3C7', color: '#F59E0B' };
              } else if (item.estado === 'crear') {
                 badgeStyle = { ...badgeStyle, background: '#D1FAE5', color: '#10B981' };
              }
              if (hasError) {
                 badgeStyle = { ...badgeStyle, background: '#FEE2E2', color: '#EF4444' };
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
                      {Array.from(new Set(zonas.map(z => z.zona).filter(Boolean))).map(zona => <option key={zona} value={zona}>{zona}</option>)}
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
                    <button type="button" onClick={() => onDeleteRow(idx)} style={{ ...actionBtnSmallStyle, background: '#FEE2E2', borderColor: '#FCA5A5', color: '#EF4444', padding: '4px 8px', borderRadius: '6px', fontWeight: 600 }}>
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
