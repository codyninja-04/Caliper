import { useCallback, useEffect, useState } from 'react';
import { suppliersApi } from '../api/suppliers';

// Loads suppliers (sorted by score) and exposes scoring actions.
export function useSuppliers(initialFilters = {}) {
  const [suppliers, setSuppliers] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await suppliersApi.list(filters);
      setSuppliers(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const recalculate = useCallback(
    async (id) => {
      await suppliersApi.recalculate(id);
      await fetchSuppliers();
    },
    [fetchSuppliers]
  );

  return { suppliers, filters, setFilters, loading, error, refresh: fetchSuppliers, recalculate };
}
