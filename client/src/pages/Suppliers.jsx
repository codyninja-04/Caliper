import { useState } from 'react';
import PageWrapper from '../components/layout/PageWrapper';
import SupplierTable from '../components/suppliers/SupplierTable';
import SupplierScorecard from '../components/suppliers/SupplierScorecard';
import { useSuppliers } from '../hooks/useSuppliers';
import { suppliersApi } from '../api/suppliers';

export default function Suppliers() {
  const { suppliers, filters, setFilters, loading, error, recalculate } = useSuppliers();
  const [selected, setSelected] = useState(null);

  const openScorecard = async (supplier) => {
    try {
      const res = await suppliersApi.get(supplier.id);
      setSelected(res.data);
    } catch {
      setSelected(supplier);
    }
  };

  const handleRecalculate = async (id) => {
    await recalculate(id);
    const res = await suppliersApi.get(id);
    setSelected(res.data);
  };

  const setFilter = (value) =>
    setFilters((f) => {
      const next = { ...f };
      if (value) next.status = value;
      else delete next.status;
      return next;
    });

  return (
    <PageWrapper title="Suppliers" subtitle="Quality scores on a rolling 90-day event model">
      <div className="flex flex-wrap gap-3 mb-4">
        <select className="form-select w-auto" value={filters.status || ''} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="probation">Probation</option>
          <option value="disqualified">Disqualified</option>
        </select>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <SupplierTable suppliers={suppliers} loading={loading} onRowClick={openScorecard} />

      {selected && (
        <SupplierScorecard
          supplier={selected}
          onClose={() => setSelected(null)}
          onRecalculate={handleRecalculate}
        />
      )}
    </PageWrapper>
  );
}
