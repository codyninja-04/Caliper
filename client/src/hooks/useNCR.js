import { useCallback, useEffect, useState } from 'react';
import { ncrApi } from '../api/ncr';

// Manages the NCR list plus workflow actions (status transitions, escalation).
export function useNCR(initialFilters = {}) {
  const [ncrs, setNCRs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNCRs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ncrApi.list(filters);
      setNCRs(res.data || []);
      if (res.pagination) setPagination(res.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchNCRs();
  }, [fetchNCRs]);

  const createNCR = useCallback(
    async (payload) => {
      const res = await ncrApi.create(payload);
      await fetchNCRs();
      return res.data;
    },
    [fetchNCRs]
  );

  const changeStatus = useCallback(
    async (id, status, notes) => {
      const res = await ncrApi.updateStatus(id, { status, notes });
      await fetchNCRs();
      return res.data;
    },
    [fetchNCRs]
  );

  const escalate = useCallback(
    async (id, payload) => {
      const res = await ncrApi.escalate(id, payload);
      await fetchNCRs();
      return res.data;
    },
    [fetchNCRs]
  );

  return {
    ncrs,
    pagination,
    filters,
    setFilters,
    loading,
    error,
    refresh: fetchNCRs,
    createNCR,
    changeStatus,
    escalate,
  };
}
