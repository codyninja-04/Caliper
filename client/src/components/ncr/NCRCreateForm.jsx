import { useState } from 'react';

const EMPTY = {
  title: '',
  description: '',
  severity: 'major',
  supplier_id: '',
  defect_id: '',
  due_date: '',
  status: 'open',
};

// Modal form to raise a new NCR, optionally linking an existing defect.
export default function NCRCreateForm({ open, onClose, onSubmit, suppliers = [], defects = [] }) {
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!open) return null;
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        ...form,
        supplier_id: form.supplier_id || null,
        defect_id: form.defect_id || null,
        due_date: form.due_date || null,
      });
      setForm(EMPTY);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Raise Non-Conformance Report</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="form-label">Title</label>
            <input className="form-input" required value={form.title} onChange={set('title')} placeholder="Critical dimensional defect — PCB Line 3" />
          </div>
          <div className="sm:col-span-2">
            <label className="form-label">Description</label>
            <textarea rows="3" className="form-textarea" required value={form.description} onChange={set('description')} />
          </div>
          <div>
            <label className="form-label">Severity</label>
            <select className="form-select" value={form.severity} onChange={set('severity')}>
              <option value="critical">Critical</option>
              <option value="major">Major</option>
              <option value="minor">Minor</option>
            </select>
          </div>
          <div>
            <label className="form-label">Initial Status</label>
            <select className="form-select" value={form.status} onChange={set('status')}>
              <option value="draft">Draft</option>
              <option value="open">Open</option>
            </select>
          </div>
          <div>
            <label className="form-label">Supplier</label>
            <select className="form-select" value={form.supplier_id} onChange={set('supplier_id')}>
              <option value="">— None —</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.code} — {s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Linked Defect</label>
            <select className="form-select" value={form.defect_id} onChange={set('defect_id')}>
              <option value="">— None —</option>
              {defects.map((d) => <option key={d.id} value={d.id}>{d.defect_code}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Due Date</label>
            <input type="date" className="form-input" value={form.due_date} onChange={set('due_date')} />
          </div>

          <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Saving…' : 'Raise NCR'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
