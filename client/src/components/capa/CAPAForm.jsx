import { useState } from 'react';

const EMPTY = {
  title: '',
  problem_statement: '',
  root_cause_analysis: '',
  corrective_action: '',
  preventive_action: '',
  ncr_id: '',
  target_date: '',
};

// Modal form to open a CAPA, optionally linked to an NCR.
export default function CAPAForm({ open, onClose, onSubmit, ncrs = [] }) {
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
      await onSubmit({ ...form, ncr_id: form.ncr_id || null, target_date: form.target_date || null });
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
          <h2 className="text-lg font-semibold text-gray-900">Open Corrective / Preventive Action</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Title</label>
            <input className="form-input" required value={form.title} onChange={set('title')} placeholder="Eliminate QFN solder bridging on Line 1" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Linked NCR</label>
              <select className="form-select" value={form.ncr_id} onChange={set('ncr_id')}>
                <option value="">— None —</option>
                {ncrs.map((n) => <option key={n.id} value={n.id}>{n.ncr_number}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Target Date</label>
              <input type="date" className="form-input" value={form.target_date} onChange={set('target_date')} />
            </div>
          </div>
          <div>
            <label className="form-label">Problem Statement</label>
            <textarea rows="2" className="form-textarea" required value={form.problem_statement} onChange={set('problem_statement')} />
          </div>
          <div>
            <label className="form-label">Root Cause Analysis</label>
            <textarea rows="2" className="form-textarea" value={form.root_cause_analysis} onChange={set('root_cause_analysis')} />
          </div>
          <div>
            <label className="form-label">Corrective Action</label>
            <textarea rows="2" className="form-textarea" value={form.corrective_action} onChange={set('corrective_action')} />
          </div>
          <div>
            <label className="form-label">Preventive Action</label>
            <textarea rows="2" className="form-textarea" value={form.preventive_action} onChange={set('preventive_action')} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Saving…' : 'Open CAPA'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
