import {
  tableStyle,
  tableHeadRowStyle,
  thStyle,
  tableBodyRowStyle,
  tdStyle,
  actionBtnSmallStyle,
  badgeOperativaStyle,
  badgeInactivaStyle,
} from '../../styles/dashboardStyles';
import type { EditableBrigada } from '../../hooks/useBrigadasDia';
import type { ParametroZona } from '../../types/programacionZona';
import { useDataTableControls } from '../../hooks/useDataTableControls';
import { DataTableToolbar } from '../common/DataTableToolbar';
import { SortableHeaderCell } from '../common/SortableHeaderCell';

const displayNumber = (value: number | null | undefined): string => {
  return value === 0 || value === null || value === undefined ? '' : String(value);
};

const normalizeNumber = (value: string): number => {
  if (value.trim() === '') return 0;
  const n = Number(value);
  return Number.isNaN(n) || n < 0 ? 0 : n;
};

const calcTotalCorte = (row: EditableBrigada): string => {
  const acums = [row.acum_14, row.acum_13, row.acum_12, row.acum_11, row.acum_10, row.acum_09];
  for (const val of acums) {
    const n = normalizeNumber(String(val ?? 0));
    if (n > 0) return String(n);
  }
  return '';
};

interface BrigadasEditableTableProps {
  rows: EditableBrigada[];
  zonas: ParametroZona[];
  dirtyRows: Set<number | string>;
  handleRowChange: (id: number | string, field: keyof EditableBrigada, value: any) => void;
  handleCancelRow: (id: number | string) => void;
  handleDeleteRow: (id: number | string) => void;
  handleSaveRow: (id: number | string) => void;
}

export const BrigadasEditableTable = ({
  rows,
  zonas,
  dirtyRows,
  handleRowChange,
  handleCancelRow,
  handleDeleteRow,
  handleSaveRow,
}: BrigadasEditableTableProps) => {
  const inputStyle = {
    width: '100%',
    padding: '0.25rem',
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    color: '#1E293B',
    borderRadius: '4px',
    fontSize: '0.75rem',
    outline: 'none',
    boxSizing: 'border-box' as const,
  };

  const selectStyle = {
    ...inputStyle,
    appearance: 'none' as const,
  };

  const numberStyle = {
    ...inputStyle,
    width: '45px',
    textAlign: 'center' as const,
  };

  const totalCorteStyle = {
    ...numberStyle,
    background: '#0f172a',
    border: '1px solid #334155',
    color: '#67e8f9',
    fontWeight: 'bold' as const,
    cursor: 'default',
  };

  const handleNumericChange = (rowId: number | string, field: keyof EditableBrigada, rawValue: string) => {
    handleRowChange(rowId, field, normalizeNumber(rawValue));
  };

  const {
    searchTerm,
    setSearchTerm,
    sortColumn,
    sortDirection,
    handleSort,
    clearFilters,
    processedData
  } = useDataTableControls<EditableBrigada>({
    data: rows,
    searchableColumns: [
      'zona',
      'codigo_sap',
      'patente',
      'usuario',
      'tipo_brigada',
      'estado_brigada',
      'observacion_brigada'
    ]
  });

  const stickyZonaHeaderStyle = {
    position: 'sticky' as const,
    left: 0,
    zIndex: 10,
    background: '#F8FAFC',
    minWidth: '120px',
  };

  const stickyUsuarioHeaderStyle = {
    position: 'sticky' as const,
    left: '120px',
    zIndex: 10,
    background: '#F8FAFC',
    boxShadow: '4px 0 6px -2px rgba(0,0,0,0.05)',
  };

  const getStickyCellZona = (isDirty: boolean) => ({
    ...tdStyle,
    position: 'sticky' as const,
    left: 0,
    zIndex: 5,
    background: isDirty ? '#1e293b' : '#FFFFFF',
    minWidth: '120px',
  });

  const getStickyCellUsuario = (isDirty: boolean) => ({
    ...tdStyle,
    position: 'sticky' as const,
    left: '120px',
    zIndex: 5,
    background: isDirty ? '#1e293b' : '#FFFFFF',
    boxShadow: '4px 0 6px -2px rgba(0,0,0,0.05)',
  });

  return (
    <div style={{ width: '100%' }}>
      <DataTableToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onClearFilters={clearFilters}
        totalCount={rows.length}
        filteredCount={processedData.length}
      />
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr style={{ ...tableHeadRowStyle, background: '#F8FAFC', fontSize: '0.65rem' }}>
              <SortableHeaderCell column="zona" label="ZONA" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} style={stickyZonaHeaderStyle} />
              <SortableHeaderCell column="codigo_sap" label="SAP" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
              <SortableHeaderCell column="patente" label="PATENTE" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
              <SortableHeaderCell column="usuario" label="USUARIO" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} style={stickyUsuarioHeaderStyle} />
              <SortableHeaderCell column="tipo_brigada" label="TIPO" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
              <SortableHeaderCell column="estado_brigada" label="ESTADO" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
              <SortableHeaderCell column="hora_primer_movimiento" label="HORA GPS" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
              <SortableHeaderCell column="reconexiones_ejecutadas" label="REC. EJEC." sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
              <SortableHeaderCell column="primer_corte" label="1ER CORTE" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
              <SortableHeaderCell column="ultimo_corte" label="ÚLT. CORTE" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
              <th style={thStyle}>09H</th>
              <th style={thStyle}>10H</th>
              <th style={thStyle}>11H</th>
              <th style={thStyle}>12H</th>
              <th style={thStyle}>13H</th>
              <th style={thStyle}>14H+</th>
              <th style={{ ...thStyle, color: '#67e8f9' }}>T. CORTE</th>
              <SortableHeaderCell column="corte_en_poste" label="C. POSTE" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
              <SortableHeaderCell column="corte_en_empalme" label="C. EMP." sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
              <SortableHeaderCell column="visita_fallida" label="V. FALL." sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
              <SortableHeaderCell column="observacion_brigada" label="OBSERVACIÓN" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
              <th style={thStyle}>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {processedData.map((row) => {
              const isDirty = dirtyRows.has(row.id);

              return (
                <tr key={row.id} style={{ ...tableBodyRowStyle, background: isDirty ? '#1e293b' : 'transparent' }}>
                  <td style={getStickyCellZona(isDirty)}>
                    <select value={row.zona} onChange={(e) => handleRowChange(row.id, 'zona', e.target.value)} style={selectStyle}>
                      <option value="">Selec...</option>
                      {zonas.map(z => <option key={z.zona} value={z.zona}>{z.zona}</option>)}
                    </select>
                  </td>
                  <td style={tdStyle}><input type="text" value={row.codigo_sap} onChange={(e) => handleRowChange(row.id, 'codigo_sap', e.target.value)} style={{ ...inputStyle, width: '70px' }} /></td>
                  <td style={tdStyle}><input type="text" value={row.patente} onChange={(e) => handleRowChange(row.id, 'patente', e.target.value)} style={{ ...inputStyle, width: '70px' }} /></td>
                  <td style={getStickyCellUsuario(isDirty)}><input type="text" value={row.usuario} onChange={(e) => handleRowChange(row.id, 'usuario', e.target.value)} style={{ ...inputStyle, width: '80px' }} /></td>
                  <td style={tdStyle}>
                    <select value={row.tipo_brigada} onChange={(e) => handleRowChange(row.id, 'tipo_brigada', e.target.value)} style={{ ...selectStyle, width: '60px', color: row.tipo_brigada === 'CF' ? '#d97706' : row.tipo_brigada === 'Convenio' ? '#0d9488' : '#1e40af' }}>
                      <option value="PXQ">PXQ</option>
                      <option value="CF">CF</option>
                      <option value="Convenio">Conv</option>
                    </select>
                  </td>
                  <td style={tdStyle}>
                    <select value={row.estado_brigada} onChange={(e) => handleRowChange(row.id, 'estado_brigada', e.target.value)} style={{ ...selectStyle, width: '80px', ...(row.estado_brigada === 'Operativa' ? badgeOperativaStyle : badgeInactivaStyle) }}>
                      <option value="Operativa">Operativa</option>
                      <option value="Inactiva">Inactiva</option>
                    </select>
                  </td>
                  <td style={tdStyle}><input type="time" value={row.hora_primer_movimiento || ''} onChange={(e) => handleRowChange(row.id, 'hora_primer_movimiento', e.target.value)} style={inputStyle} /></td>
                  <td style={tdStyle}><input type="text" inputMode="numeric" value={displayNumber(row.reconexiones_ejecutadas)} onChange={(e) => handleNumericChange(row.id, 'reconexiones_ejecutadas', e.target.value)} style={numberStyle} /></td>
                  <td style={tdStyle}><input type="time" value={row.primer_corte || ''} onChange={(e) => handleRowChange(row.id, 'primer_corte', e.target.value)} style={inputStyle} /></td>
                  <td style={tdStyle}><input type="time" value={row.ultimo_corte || ''} onChange={(e) => handleRowChange(row.id, 'ultimo_corte', e.target.value)} style={inputStyle} /></td>

                  <td style={tdStyle}><input type="text" inputMode="numeric" value={displayNumber(row.acum_09)} onChange={(e) => handleNumericChange(row.id, 'acum_09', e.target.value)} style={numberStyle} /></td>
                  <td style={tdStyle}><input type="text" inputMode="numeric" value={displayNumber(row.acum_10)} onChange={(e) => handleNumericChange(row.id, 'acum_10', e.target.value)} style={numberStyle} /></td>
                  <td style={tdStyle}><input type="text" inputMode="numeric" value={displayNumber(row.acum_11)} onChange={(e) => handleNumericChange(row.id, 'acum_11', e.target.value)} style={numberStyle} /></td>
                  <td style={tdStyle}><input type="text" inputMode="numeric" value={displayNumber(row.acum_12)} onChange={(e) => handleNumericChange(row.id, 'acum_12', e.target.value)} style={numberStyle} /></td>
                  <td style={tdStyle}><input type="text" inputMode="numeric" value={displayNumber(row.acum_13)} onChange={(e) => handleNumericChange(row.id, 'acum_13', e.target.value)} style={numberStyle} /></td>
                  <td style={tdStyle}><input type="text" inputMode="numeric" value={displayNumber(row.acum_14)} onChange={(e) => handleNumericChange(row.id, 'acum_14', e.target.value)} style={numberStyle} /></td>

                  <td style={tdStyle}><input type="text" readOnly value={calcTotalCorte(row)} style={totalCorteStyle} tabIndex={-1} /></td>

                  <td style={tdStyle}><input type="text" inputMode="numeric" value={displayNumber(row.corte_en_poste)} onChange={(e) => handleNumericChange(row.id, 'corte_en_poste', e.target.value)} style={numberStyle} /></td>
                  <td style={tdStyle}><input type="text" inputMode="numeric" value={displayNumber(row.corte_en_empalme)} onChange={(e) => handleNumericChange(row.id, 'corte_en_empalme', e.target.value)} style={numberStyle} /></td>
                  <td style={tdStyle}><input type="text" inputMode="numeric" value={displayNumber(row.visita_fallida)} onChange={(e) => handleNumericChange(row.id, 'visita_fallida', e.target.value)} style={numberStyle} /></td>
                  <td style={tdStyle}>
                    <input type="text" value={row.observacion_brigada || ''} onChange={(e) => handleRowChange(row.id, 'observacion_brigada', e.target.value)} style={{ ...inputStyle, width: '100px' }} placeholder={row.estado_brigada === 'Inactiva' ? 'Obligatorio' : ''} />
                  </td>

                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: '0.2rem', justifyContent: 'center' }}>
                      {isDirty ? (
                        <>
                          <button type="button" style={{ ...actionBtnSmallStyle, background: '#0e7490', color: 'white', border: 'none' }} onClick={() => handleSaveRow(row.id)}>
                            Guardar
                          </button>
                          <button type="button" style={{ ...actionBtnSmallStyle, background: '#475569', color: 'white', border: 'none' }} onClick={() => handleCancelRow(row.id)}>
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <button type="button" style={{ ...actionBtnSmallStyle, color: '#ef4444' }} onClick={() => handleDeleteRow(row.id)}>
                          Eliminar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {processedData.length === 0 && (
              <tr>
                <td colSpan={22} style={{ ...tdStyle, color: '#64748B', padding: '2rem' }}>
                  No hay brigadas registradas. Haz clic en "+ Agregar brigada".
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
