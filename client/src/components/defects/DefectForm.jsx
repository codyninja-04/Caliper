import { useState } from 'react';

const EMPTY = {
  product_line: '',
  batch_number: '',
  defect_type: 'dimensional',
  severity: 'major',
  quantity_affected: 1,
  detected_at: new Date().toISOString().slice(0, 16),
  supplier_id: '',
  description: '',
};

// Controlled modal form for logging a new defect.
export default function DefectForm({ open, onClose, onSubmit, suppliers = [] }) {
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
        quantity_affected: Number(form.quantity_affected),
        detected_at: new Date(form.detected_at).toISOString(),
        supplier_id: form.supplier_id || null,
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
          <h2 className="text-lg font-semibold text-gray-900">Log New Defect</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="form-label">Product Line</label>
            <input className="form-input" required value={form.product_line} onChange={set('product_line')} placeholder="PCB Assembly Line 3" />
          </div>

          <div>
            <label className="form-label">Batch Number</label>
            <input className="form-input" required value={form.batch_number} onChange={set('batch_number')} placeholder="BATCH-2024-08-142" />
          </div>

          <div>
            <label className="form-label">Defect Type</label>
            <select className="form-select" value={form.defect_type} onChange={set('defect_type')}>
              <option value="dimensional">Dimensional</option>
              <option value="cosmetic">Cosmetic</option>
              <option value="functional">Functional</option>
            </select>
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
            <label className="form-label">Quantity Affected</label>
            <input type="number" min="1" className="form-input" required value={form.quantity_affected} onChange={set('quantity_affected')} />
          </div>

          <div>
            <label className="form-label">Detected At</label>
            <input type="datetime-local" className="form-input" required value={form.detected_at} onChange={set('detected_at')} />
          </div>

          <div>
            <label className="form-label">Supplier</label>
            <select className="form-select" value={form.supplier_id} onChange={set('supplier_id')}>
              <option value="">— None —</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.code} — {s.name}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="form-label">Description</label>
            <textarea rows="3" className="form-textarea" value={form.description} onChange={set('description')} placeholder="Component placement offset exceeding ±0.2mm tolerance on U12 position" />
          </div>

          <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Saving…' : 'Log Defect'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
