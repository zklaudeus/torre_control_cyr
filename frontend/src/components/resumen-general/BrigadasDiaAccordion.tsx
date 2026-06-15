import { AccordionPanel } from '../dashboard/AccordionPanel';
import { addBtnStyle, actionBtnSmallStyle } from '../../styles/dashboardStyles';
import { BrigadasEditableTable } from './BrigadasEditableTable';

interface BrigadasDiaAccordionProps {
  hook: any; // using any here to avoid importing the complex hook return type, but can be typed properly
  readOnly?: boolean;
}

export const BrigadasDiaAccordion = ({ hook, readOnly }: BrigadasDiaAccordionProps) => {
  const {
    rows,
    dirtyRows,
    zonas,
    handleAddRow,
    handleRowChange,
    handleCancelRow,
    handleDeleteRow,
    handleSaveRow,
    handleSaveAll,
    error,
    usuariosSap,
  } = hook;

  return (
    <AccordionPanel
      title="LISTADO DE BRIGADAS"
      meta={<span>{rows.length} brigadas</span>}
      rightAction={
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {!readOnly && dirtyRows.size > 0 && (
            <button 
              type="button" 
              style={{ ...actionBtnSmallStyle, background: '#0e7490', color: 'white', border: 'none' }} 
              onClick={handleSaveAll}
            >
              Guardar Todo ({dirtyRows.size})
            </button>
          )}
          {!readOnly && (
            <button type="button" style={addBtnStyle} onClick={handleAddRow}>
              + Agregar brigada
            </button>
          )}
        </div>
      }
    >
      <div style={{ padding: '1rem' }}>
        {error && (
          <div style={{ marginBottom: '1rem', padding: '0.5rem', background: '#450a0a', border: '1px solid #7f1d1d', borderRadius: '4px', color: '#fca5a5', fontSize: '0.8rem' }}>
            {error}
          </div>
        )}
        <BrigadasEditableTable
          rows={rows}
          zonas={zonas}
          dirtyRows={dirtyRows}
          handleRowChange={handleRowChange}
          handleCancelRow={handleCancelRow}
          handleDeleteRow={handleDeleteRow}
          handleSaveRow={handleSaveRow}
          usuariosSap={usuariosSap}
          readOnly={readOnly}
        />
      </div>
    </AccordionPanel>
  );
};
