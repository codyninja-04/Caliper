import { useEffect, useState, useCallback } from 'react';
import PageWrapper from '../components/layout/PageWrapper';
import AuditLogTable from '../components/audit/AuditLogTable';
import { auditsApi } from '../api/audits';

export default function AuditLog() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await auditsApi.list(filters);
      setEntries(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const setFilter = (key, value) =>
    setFilters((f) => {
      const next = { ...f };
      if (value) next[key] = value;
      else delete next[key];
      return next;
    });

  return (
    <PageWrapper title="Audit Log" subtitle="Append-only trail of every record mutation">
      <div className="flex flex-wrap gap-3 mb-4">
        <select className="form-select w-auto" value={filters.table || ''} onChange={(e) => setFilter('table', e.target.value)}>
          <option value="">All tables</option>
          {['defects', 'ncrs', 'capas', 'suppliers'].map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="form-select w-auto" value={filters.action || ''} onChange={(e) => setFilter('action', e.target.value)}>
          <option value="">All actions</option>
          <option value="INSERT">Insert</option>
          <option value="UPDATE">Update</option>
          <option value="DELETE">Delete</option>
        </select>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <AuditLogTable entries={entries} loading={loading} />
    </PageWrapper>
  );
}
