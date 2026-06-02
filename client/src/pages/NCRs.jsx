import { useEffect, useState } from 'react';
import PageWrapper from '../components/layout/PageWrapper';
import NCRList from '../components/ncr/NCRList';
import NCRCreateForm from '../components/ncr/NCRCreateForm';
import NCRDetailView from '../components/ncr/NCRDetailView';
import { useNCR } from '../hooks/useNCR';
import { useAuth } from '../context/AuthContext';
import { ncrApi } from '../api/ncr';
import { suppliersApi } from '../api/suppliers';
import { defectsApi } from '../api/defects';

const WRITERS = ['quality_engineer', 'supervisor', 'admin'];

export default function NCRs() {
  const { ncrs, filters, setFilters, loading, error, createNCR, changeStatus, escalate, refresh } = useNCR();
  const { role } = useAuth();
  const canWrite = WRITERS.includes(role);

  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [defects, setDefects] = useState([]);

  useEffect(() => {
    suppliersApi.list().then((r) => setSuppliers(r.data || [])).catch(() => {});
    defectsApi.list({ limit: 100 }).then((r) => setDefects(r.data || [])).catch(() => {});
  }, []);

  const openDetail = async (ncr) => {
    // Fetch the full record (with linked defect + CAPAs) for the detail view.
    try {
      const res = await ncrApi.get(ncr.id);
      setSelected(res.data);
    } catch {
      setSelected(ncr);
    }
  };

  const handleChangeStatus = async (id, status, notes) => {
    await changeStatus(id, status, notes);
    const res = await ncrApi.get(id);
    setSelected(res.data);
  };

  const handleEscalate = async (id) => {
    await escalate(id);
    const res = await ncrApi.get(id);
    setSelected(res.data);
  };

  const setFilter = (key, value) =>
    setFilters((f) => {
      const next = { ...f };
      if (value) next[key] = value;
      else delete next[key];
      return next;
    });

  return (
    <PageWrapper
      title="Non-Conformance Reports"
      subtitle="Escalate and track non-conformance through to closure"
      actions={canWrite && <button className="btn-primary" onClick={() => setFormOpen(true)}>+ Raise NCR</button>}
    >
      <div className="flex flex-wrap gap-3 mb-4">
        <select className="form-select w-auto" value={filters.status || ''} onChange={(e) => setFilter('status', e.target.value)}>
          <option value="">All statuses</option>
          {['draft', 'open', 'under_review', 'awaiting_supplier', 'capa_required', 'escalated', 'closed'].map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
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

      <NCRList ncrs={ncrs} loading={loading} onRowClick={openDetail} />

      <NCRCreateForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={createNCR}
        suppliers={suppliers}
        defects={defects}
      />

      {selected && (
        <NCRDetailView
          ncr={selected}
          canEdit={canWrite}
          onClose={() => { setSelected(null); refresh(); }}
          onChangeStatus={handleChangeStatus}
          onEscalate={handleEscalate}
        />
      )}
    </PageWrapper>
  );
}
