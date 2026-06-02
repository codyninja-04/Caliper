import { useEffect, useState } from 'react';
import PageWrapper from '../components/layout/PageWrapper';
import DefectTable from '../components/defects/DefectTable';
import DefectForm from '../components/defects/DefectForm';
import { useDefects } from '../hooks/useDefects';
import { useAuth } from '../context/AuthContext';
import { suppliersApi } from '../api/suppliers';

const WRITERS = ['quality_engineer', 'supervisor', 'admin'];

export default function Defects() {
  const { defects, filters, setFilters, loading, error, createDefect } = useDefects();
  const { role } = useAuth();
  const [formOpen, setFormOpen] = useState(false);
  const [suppliers, setSuppliers] = useState([]);

  const canWrite = WRITERS.includes(role);

  useEffect(() => {
    suppliersApi.list().then((r) => setSuppliers(r.data || [])).catch(() => {});
  }, []);

  const setFilter = (key, value) =>
    setFilters((f) => {
      const next = { ...f };
      if (value) next[key] = value;
      else delete next[key];
      return next;
    });

  return (
    <PageWrapper
      title="Defects"
      subtitle="Logged product quality failures across all lines"
      actions={
        canWrite && (
          <button className="btn-primary" onClick={() => setFormOpen(true)}>+ Log Defect</button>
        )
      }
    >
      <div className="flex flex-wrap gap-3 mb-4">
        <select className="form-select w-auto" value={filters.status || ''} onChange={(e) => setFilter('status', e.target.value)}>
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="under_review">Under Review</option>
          <option value="closed">Closed</option>
        </select>
        <select className="form-select w-auto" value={filters.severity || ''} onChange={(e) => setFilter('severity', e.target.value)}>
          <option value="">All severities</option>
          <option value="critical">Critical</option>
          <option value="major">Major</option>
          <option value="minor">Minor</option>
        </select>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <DefectTable defects={defects} loading={loading} />

      <DefectForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={createDefect}
        suppliers={suppliers}
      />
    </PageWrapper>
  );
}
