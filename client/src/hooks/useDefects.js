import { useCallback, useEffect, useState } from 'react';
import { defectsApi } from '../api/defects';

// Fetches and manages the defect list with server-side filtering.
export function useDefects(initialFilters = {}) {
  const [defects, setDefects] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDefects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await defectsApi.list(filters);
      setDefects(res.data || []);
      if (res.pagination) setPagination(res.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchDefects();
  }, [fetchDefects]);

  const createDefect = useCallback(
    async (payload) => {
      const res = await defectsApi.create(payload);
      await fetchDefects();
      return res.data;
    },
    [fetchDefects]
  );

  const updateDefect = useCallback(
    async (id, payload) => {
      const res = await defectsApi.update(id, payload);
      await fetchDefects();
      return res.data;
    },
    [fetchDefects]
  );

  return {
    defects,
    pagination,
    filters,
    setFilters,
    loading,
    error,
    refresh: fetchDefects,
    createDefect,
    updateDefect,
  };
}
