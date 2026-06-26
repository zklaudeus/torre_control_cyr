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
import type { SupervisorUsuarioSAP } from '../../api/supervisores.api';
import { useDataTableControls } from '../../hooks/useDataTableControls';
import { DataTableToolbar } from '../common/DataTableToolbar';
import { SortableHeaderCell } from '../common/SortableHeaderCell';


import { getTotalCorteBrigada } from '../../utils/calculosBrigada';

const displayNumber = (value: number | null | undefined): string => {
  return value === 0 || value === null || value === undefined ? '' : String(value);
};

const normalizeNumber = (value: string): number => {
  if (value.trim() === '') return 0;
  const n = Number(value);
  return Number.isNaN(n) || n < 0 ? 0 : n;
};

const calcTotalCorte = (row: EditableBrigada): string => {
  const total = getTotalCorteBrigada(row);
  return total > 0 ? String(total) : '';
};

interface BrigadasEditableTableProps {
  rows: EditableBrigada[];
  zonas: ParametroZona[];
  dirtyRows: Set<number | string>;
  handleRowChange: (id: number | string, field: keyof EditableBrigada, value: any) => void;
  handleCancelRow: (id: number | string) => void;
  handleDeleteRow: (id: number | string) => void;
  handleSaveRow: (id: number | string) => void;
  usuariosSap?: SupervisorUsuarioSAP[];
  readOnly?: boolean;
}

export const BrigadasEditableTable = ({
  rows,
  zonas,
  dirtyRows,
  handleRowChange,
  handleCancelRow,
  handleDeleteRow,
  handleSaveRow,
  readOnly = false,
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

  // Patente: 4 letras + 2 números, todo mayúsculas (formato chileno LLLLNN)
  const handlePatenteChange = (rowId: number | string, rawValue: string) => {
    let val = rawValue.toUpperCase();
    // Construir string válido carácter a carácter
    let result = '';
    for (let i = 0; i < val.length && result.length < 6; i++) {
      const ch = val[i];
      if (result.length < 4) {
        // Posiciones 0-3: solo letras
        if (/[A-Z]/.test(ch)) result += ch;
      } else {
        // Posiciones 4-5: solo dígitos
        if (/[0-9]/.test(ch)) result += ch;
      }
    }
    handleRowChange(rowId, 'patente', result);
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
      'brigada',
      'pareja',
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

  const stickySapHeaderStyle = {
    position: 'sticky' as const,
    left: '120px',
    zIndex: 10,
    background: '#F8FAFC',
    minWidth: '90px',
  };

  const stickyCuentaHeaderStyle = {
    position: 'sticky' as const,
    left: '210px',
    zIndex: 10,
    background: '#F8FAFC',
    minWidth: '150px',
    boxShadow: '4px 0 6px -2px rgba(0,0,0,0.05)',
    fontWeight: 600,
    color: '#64748B',
    fontSize: '0.65rem',
  };

  const getStickyCellZona = (isDirty: boolean) => ({
    ...tdStyle,
    position: 'sticky' as const,
    left: 0,
    zIndex: 5,
    background: isDirty ? '#1e293b' : '#FFFFFF',
    minWidth: '120px',
  });

  const getStickyCellSap = (isDirty: boolean) => ({
    ...tdStyle,
    position: 'sticky' as const,
    left: '120px',
    zIndex: 5,
    background: isDirty ? '#1e293b' : '#FFFFFF',
    minWidth: '90px',
  });

  const getStickyCellCuenta = (isDirty: boolean) => ({
    ...tdStyle,
    position: 'sticky' as const,
    left: '210px',
    zIndex: 5,
    background: isDirty ? '#1e293b' : '#FFFFFF',
    minWidth: '150px',
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
              <SortableHeaderCell column="codigo_sap" label="SAP" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} style={stickySapHeaderStyle} />
              <SortableHeaderCell column="usuario" label="CUENTA SAP" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} style={stickyCuentaHeaderStyle} />
              <SortableHeaderCell column="brigada" label="BRIGADA" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
              <SortableHeaderCell column="pareja" label="PAREJA" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
              <SortableHeaderCell column="patente" label="PATENTE" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
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
              <SortableHeaderCell column="corte_fuera_de_rango" label="C. F. RANGO" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
              <SortableHeaderCell column="visita_fallida" label="V. FALL." sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
              <SortableHeaderCell column="observacion_brigada" label="OBSERVACIÓN" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
              {!readOnly && <th style={thStyle}>ACCIONES</th>}
            </tr>
          </thead>
          <tbody>
            {processedData.map((row) => {
              const isDirty = dirtyRows.has(row.id);

              return (
                <tr key={row.id} style={{ ...tableBodyRowStyle, background: isDirty && !readOnly ? '#1e293b' : 'transparent' }}>
                  <td style={getStickyCellZona(isDirty && !readOnly)}>
                    {readOnly ? row.zona : (
                      <select value={row.zona} onChange={(e) => handleRowChange(row.id, 'zona', e.target.value)} style={selectStyle}>
                        <option value="">Selec...</option>
                        {Array.from(new Set(zonas.map(z => z.zona).filter(Boolean))).map(zona => <option key={zona} value={zona}>{zona}</option>)}
                      </select>
                    )}
                  </td>
                  <td style={getStickyCellSap(isDirty && !readOnly)}>
                    {readOnly ? row.codigo_sap : <input type="text" value={row.codigo_sap} onChange={(e) => handleRowChange(row.id, 'codigo_sap', e.target.value)} style={{ ...inputStyle, width: '70px' }} />}
                  </td>
                  <td style={getStickyCellCuenta(isDirty && !readOnly)}>
                    {readOnly ? (
                      <div style={{ fontSize: '0.75rem', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }} title={row.usuario || row.codigo_sap || ''}>
                        {row.usuario || row.codigo_sap || '-'}
                      </div>
                    ) : (
                      <input type="text" value={row.usuario || ''} onChange={(e) => handleRowChange(row.id, 'usuario', e.target.value)} style={{ ...inputStyle, width: '100%', minWidth: '130px', fontWeight: 600, color: '#64748B' }} title={row.usuario || ''} />
                    )}
                  </td>
                  <td style={tdStyle}>
                    {readOnly
                      ? <span style={{ fontSize: '0.75rem', color: row.brigada ? '#1E293B' : '#94A3B8' }}>{row.brigada || '-'}</span>
                      : <input type="text" value={row.brigada || ''} onChange={(e) => handleRowChange(row.id, 'brigada', e.target.value)} style={{ ...inputStyle, width: '120px' }} />
                    }
                  </td>
                  <td style={tdStyle}>
                    {readOnly
                      ? <span style={{ fontSize: '0.75rem', color: row.pareja ? '#1E293B' : '#94A3B8' }}>{row.pareja || '-'}</span>
                      : <input type="text" value={row.pareja || ''} onChange={(e) => handleRowChange(row.id, 'pareja', e.target.value)} style={{ ...inputStyle, width: '120px' }} />
                    }
                  </td>
                  <td style={tdStyle}>
                    {readOnly
                      ? row.patente
                      : (
                        <input
                          type="text"
                          value={row.patente}
                          onChange={(e) => handlePatenteChange(row.id, e.target.value)}
                          maxLength={6}
                          placeholder="LLLL12"
                          title="4 letras + 2 números (ej: VSKT23)"
                          style={{ ...inputStyle, width: '70px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                        />
                      )
                    }
                  </td>
                  <td style={tdStyle}>
                    {readOnly ? (
                      <span style={{ color: row.tipo_brigada === 'CF' ? '#d97706' : '#1e40af', fontWeight: 500 }}>{row.tipo_brigada}</span>
                    ) : (
                      <select value={row.tipo_brigada} onChange={(e) => handleRowChange(row.id, 'tipo_brigada', e.target.value)} style={{ ...selectStyle, width: '60px', color: row.tipo_brigada === 'CF' ? '#d97706' : '#1e40af' }}>
                        <option value="PXQ">PXQ</option>
                        <option value="CF">CF</option>
                      </select>
                    )}
                  </td>
                  <td style={tdStyle}>
                    {readOnly ? (
                      <span style={{ padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem', ...(row.estado_brigada === 'Operativa' ? badgeOperativaStyle : badgeInactivaStyle) }}>{row.estado_brigada}</span>
                    ) : (
                      <select value={row.estado_brigada} onChange={(e) => handleRowChange(row.id, 'estado_brigada', e.target.value)} style={{ ...selectStyle, width: '80px', ...(row.estado_brigada === 'Operativa' ? badgeOperativaStyle : badgeInactivaStyle) }}>
                        <option value="Operativa">Operativa</option>
                        <option value="Inactiva">Inactiva</option>
                      </select>
                    )}
                  </td>
                  <td style={tdStyle}>{readOnly ? row.hora_primer_movimiento : <input type="time" value={row.hora_primer_movimiento || ''} onChange={(e) => handleRowChange(row.id, 'hora_primer_movimiento', e.target.value)} style={inputStyle} />}</td>
                  <td style={tdStyle}>{readOnly ? displayNumber(row.reconexiones_ejecutadas) : <input type="text" inputMode="numeric" value={displayNumber(row.reconexiones_ejecutadas)} onChange={(e) => handleNumericChange(row.id, 'reconexiones_ejecutadas', e.target.value)} style={numberStyle} />}</td>
                  <td style={tdStyle}>{readOnly ? row.primer_corte : <input type="time" value={row.primer_corte || ''} onChange={(e) => handleRowChange(row.id, 'primer_corte', e.target.value)} style={inputStyle} />}</td>
                  <td style={tdStyle}>{readOnly ? row.ultimo_corte : <input type="time" value={row.ultimo_corte || ''} onChange={(e) => handleRowChange(row.id, 'ultimo_corte', e.target.value)} style={inputStyle} />}</td>

                  <td style={tdStyle}>{readOnly ? displayNumber(row.acum_09) : <input type="text" inputMode="numeric" value={displayNumber(row.acum_09)} onChange={(e) => handleNumericChange(row.id, 'acum_09', e.target.value)} style={numberStyle} />}</td>
                  <td style={tdStyle}>{readOnly ? displayNumber(row.acum_10) : <input type="text" inputMode="numeric" value={displayNumber(row.acum_10)} onChange={(e) => handleNumericChange(row.id, 'acum_10', e.target.value)} style={numberStyle} />}</td>
                  <td style={tdStyle}>{readOnly ? displayNumber(row.acum_11) : <input type="text" inputMode="numeric" value={displayNumber(row.acum_11)} onChange={(e) => handleNumericChange(row.id, 'acum_11', e.target.value)} style={numberStyle} />}</td>
                  <td style={tdStyle}>{readOnly ? displayNumber(row.acum_12) : <input type="text" inputMode="numeric" value={displayNumber(row.acum_12)} onChange={(e) => handleNumericChange(row.id, 'acum_12', e.target.value)} style={numberStyle} />}</td>
                  <td style={tdStyle}>{readOnly ? displayNumber(row.acum_13) : <input type="text" inputMode="numeric" value={displayNumber(row.acum_13)} onChange={(e) => handleNumericChange(row.id, 'acum_13', e.target.value)} style={numberStyle} />}</td>
                  <td style={tdStyle}>{readOnly ? displayNumber(row.acum_14) : <input type="text" inputMode="numeric" value={displayNumber(row.acum_14)} onChange={(e) => handleNumericChange(row.id, 'acum_14', e.target.value)} style={numberStyle} />}</td>

                  <td style={tdStyle}><input type="text" readOnly value={calcTotalCorte(row)} style={totalCorteStyle} tabIndex={-1} /></td>

                  <td style={tdStyle}>{readOnly ? displayNumber(row.corte_en_poste) : <input type="text" inputMode="numeric" value={displayNumber(row.corte_en_poste)} onChange={(e) => handleNumericChange(row.id, 'corte_en_poste', e.target.value)} style={numberStyle} />}</td>
                  <td style={tdStyle}>{readOnly ? displayNumber(row.corte_en_empalme) : <input type="text" inputMode="numeric" value={displayNumber(row.corte_en_empalme)} onChange={(e) => handleNumericChange(row.id, 'corte_en_empalme', e.target.value)} style={numberStyle} />}</td>
                  <td style={tdStyle}>{readOnly ? displayNumber(row.corte_fuera_de_rango) : <input type="text" inputMode="numeric" value={displayNumber(row.corte_fuera_de_rango)} onChange={(e) => handleNumericChange(row.id, 'corte_fuera_de_rango', e.target.value)} style={numberStyle} />}</td>
                  <td style={tdStyle}>{readOnly ? displayNumber(row.visita_fallida) : <input type="text" inputMode="numeric" value={displayNumber(row.visita_fallida)} onChange={(e) => handleNumericChange(row.id, 'visita_fallida', e.target.value)} style={numberStyle} />}</td>
                  <td style={tdStyle}>
                    {readOnly ? (
                      <span style={{ fontSize: '0.75rem', color: row.observacion_brigada ? '#1E293B' : '#94A3B8' }}>{row.observacion_brigada || '-'}</span>
                    ) : (
                      <input type="text" value={row.observacion_brigada || ''} onChange={(e) => handleRowChange(row.id, 'observacion_brigada', e.target.value)} style={{ ...inputStyle, width: '100px' }} placeholder={row.estado_brigada === 'Inactiva' ? 'Obligatorio' : ''} />
                    )}
                  </td>

                  {!readOnly && (
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
                  )}
                </tr>
              );
            })}
            {processedData.length === 0 && (
              <tr>
                <td colSpan={24} style={{ ...tdStyle, color: '#64748B', padding: '2rem' }}>
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
