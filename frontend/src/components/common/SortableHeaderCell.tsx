import { thStyle } from '../../styles/dashboardStyles';
import type { SortDirection } from '../../hooks/useDataTableControls';

interface SortableHeaderCellProps {
  column: string;
  label: string;
  sortColumn: string | null;
  sortDirection: SortDirection;
  onSort: (column: string) => void;
  width?: string;
  style?: React.CSSProperties;
}

export const SortableHeaderCell = ({
  column,
  label,
  sortColumn,
  sortDirection,
  onSort,
  width,
  style = {}
}: SortableHeaderCellProps) => {
  const isSorted = sortColumn === column;

  return (
    <th
      style={{
        ...thStyle,
        width,
        cursor: 'pointer',
        userSelect: 'none',
        background: isSorted ? 'rgba(0, 123, 255, 0.06)' : 'transparent',
        ...style
      }}
      onClick={() => onSort(column)}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem' }}>
        {label}
        <span style={{ fontSize: '0.7rem', color: isSorted ? '#007BFF' : '#CBD5E1', width: '10px' }}>
          {isSorted ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
        </span>
      </div>
    </th>
  );
};

