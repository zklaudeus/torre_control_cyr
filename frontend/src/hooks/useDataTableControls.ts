import { useState, useMemo } from 'react';

export type SortDirection = 'asc' | 'desc' | null;

export interface DataTableConfig<T> {
  data: T[];
  searchableColumns: (keyof T | string)[];
}

export function useDataTableControls<T>({ data, searchableColumns }: DataTableConfig<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortColumn(null);
      } else setSortDirection('asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSortColumn(null);
    setSortDirection(null);
  };

  const processedData = useMemo(() => {
    let result = [...data];

    // Search
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(item => {
        return searchableColumns.some(col => {
          // Allow nested access like 'brigadaOrigen.zona'
          const keys = (col as string).split('.');
          let val: any = item;
          for (const key of keys) {
            if (val == null) break;
            val = val[key];
          }
          if (val == null) return false;
          return String(val).toLowerCase().includes(lowerSearch);
        });
      });
    }

    // Sort
    if (sortColumn && sortDirection) {
      result.sort((a, b) => {
        const keys = sortColumn.split('.');
        let valA: any = a;
        let valB: any = b;
        for (const key of keys) {
          if (valA != null) valA = valA[key];
          if (valB != null) valB = valB[key];
        }

        if (valA === valB) return 0;
        if (valA == null) return 1;
        if (valB == null) return -1;

        const cmp = valA < valB ? -1 : 1;
        return sortDirection === 'asc' ? cmp : -cmp;
      });
    }

    return result;
  }, [data, searchTerm, sortColumn, sortDirection, searchableColumns]);

  return {
    searchTerm,
    setSearchTerm,
    sortColumn,
    sortDirection,
    handleSort,
    clearFilters,
    processedData
  };
}
