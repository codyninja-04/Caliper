import { useState } from 'react';
import NCRStatusStepper from './NCRStatusStepper';
import { severityClasses, humanize } from '../../utils/severityColor';
import { formatDate, formatDateTime } from '../../utils/formatDate';

// Allowed next states mirror the server-side NCR state machine.
const NEXT_STATES = {
  draft: ['open'],
  open: ['under_review', 'escalated'],
  under_review: ['awaiting_supplier', 'capa_required', 'escalated', 'closed'],
  awaiting_supplier: ['under_review', 'capa_required', 'escalated'],
  capa_required: ['under_review', 'closed', 'escalated'],
  escalated: ['under_review', 'capa_required', 'closed'],
  closed: [],
};

export default function NCRDetailView({ ncr, onClose, onChangeStatus, onEscalate, canEdit }) {
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  if (!ncr) return null;
  const nextOptions = (NEXT_STATES[ncr.status] || []).filter((s) => s !== 'escalated');

  const act = async (fn) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      setNotes('');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="card w-full max-w-3xl max-h-[92vh] overflow-y-auto p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="font-mono text-sm text-sky-700">{ncr.ncr_number}</p>
            <h2 className="text-xl font-semibold text-gray-900 mt-1">{ncr.title}</h2>
            <span className={`mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${severityClasses[ncr.severity]}`}>
              {humanize(ncr.severity)} severity
            </span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        <div className="my-6">
          <NCRStatusStepper status={ncr.status} />
        </div>

        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm mb-6">
          <div>
            <dt className="text-gray-500">Supplier</dt>
            <dd className="text-gray-900 font-medium">{ncr.suppliers?.name || '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Linked Defect</dt>
            <dd className="text-gray-900 font-mono">{ncr.defects?.defect_code || '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Due Date</dt>
            <dd className="text-gray-900">{formatDate(ncr.due_date)}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Raised</dt>
            <dd className="text-gray-900">{formatDateTime(ncr.created_at)}</dd>
          </div>
          {ncr.escalated_at && (
            <div>
              <dt className="text-gray-500">Escalated</dt>
              <dd className="text-red-600">{formatDateTime(ncr.escalated_at)}</dd>
            </div>
          )}
          {ncr.closed_at && (
            <div>
              <dt className="text-gray-500">Closed</dt>
              <dd className="text-green-600">{formatDateTime(ncr.closed_at)}</dd>
            </div>
          )}
        </dl>

        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-1">Description</h3>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{ncr.description}</p>
        </div>

        {Array.isArray(ncr.capas) && ncr.capas.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Linked CAPAs</h3>
            <ul className="space-y-1">
              {ncr.capas.map((c) => (
                <li key={c.id} className="text-sm flex items-center gap-2">
                  <span className="font-mono text-sky-700">{c.capa_number}</span>
                  <span className="text-gray-600">{c.title}</span>
                  <span className="text-gray-400">· {humanize(c.status)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        {canEdit && ncr.status !== 'closed' && (
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Workflow Actions</h3>
            <textarea
              rows="2"
              className="form-textarea mb-3"
              placeholder="Transition notes (recorded in the audit trail)…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              {nextOptions.map((s) => (
                <button
                  key={s}
                  disabled={busy}
                  onClick={() => act(() => onChangeStatus(ncr.id, s, notes))}
                  className={s === 'closed' ? 'btn-primary' : 'btn-secondary'}
                >
                  → {humanize(s)}
                </button>
              ))}
              {ncr.status !== 'escalated' && (
                <button
                  disabled={busy}
                  onClick={() => act(() => onEscalate(ncr.id))}
                  className="btn-danger ml-auto"
                >
                  ⚠ Escalate
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
