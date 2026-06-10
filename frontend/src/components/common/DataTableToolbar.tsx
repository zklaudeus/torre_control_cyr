
import { actionBtnSmallStyle } from '../../styles/dashboardStyles';

const searchInputStyle = {
  width: '200px',
  padding: '0.4rem 0.6rem',
  background: '#FFFFFF',
  border: '1px solid #E2E8F0',
  color: '#1E293B',
  borderRadius: '6px',
  fontSize: '0.85rem',
  outline: 'none',
  boxSizing: 'border-box' as const,
};

interface DataTableToolbarProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  onClearFilters: () => void;
  totalCount: number;
  filteredCount: number;
}

export const DataTableToolbar = ({
  searchTerm,
  onSearchChange,
  onClearFilters,
  totalCount,
  filteredCount
}: DataTableToolbarProps) => {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Buscar..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          style={searchInputStyle}
        />
        {(searchTerm) && (
          <button type="button" onClick={onClearFilters} style={actionBtnSmallStyle}>
            Limpiar filtros
          </button>
        )}
      </div>
      <div style={{ fontSize: '0.85rem', color: '#64748B' }}>
        Mostrando {filteredCount} de {totalCount} filas
      </div>
    </div>
  );
};

