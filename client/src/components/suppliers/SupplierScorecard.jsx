import ScoreGauge from './ScoreGauge';
import { supplierStatusClasses, humanize } from '../../utils/severityColor';
import { formatDate } from '../../utils/formatDate';

// Detail panel: gauge + event-type breakdown + recent event history.
export default function SupplierScorecard({ supplier, onClose, onRecalculate }) {
  if (!supplier) return null;
  const events = supplier.events || [];

  // Group recent events by type for the contribution breakdown.
  const breakdown = {};
  for (const e of events) {
    if (!breakdown[e.event_type]) breakdown[e.event_type] = { count: 0, total: 0 };
    breakdown[e.event_type].count += 1;
    breakdown[e.event_type].total += Number(e.impact_score);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="card w-full max-w-2xl max-h-[92vh] overflow-y-auto p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="font-mono text-sm text-sky-700">{supplier.code}</p>
            <h2 className="text-xl font-semibold text-gray-900 mt-1">{supplier.name}</h2>
            <p className="text-sm text-gray-500">{supplier.country} · {supplier.contact_email}</p>
            <span className={`mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${supplierStatusClasses[supplier.status]}`}>
              {humanize(supplier.status)}
            </span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6 mb-6">
          <ScoreGauge score={Number(supplier.quality_score)} />
          <div className="flex-1 w-full">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">90-Day Contribution Breakdown</h3>
            {Object.keys(breakdown).length === 0 ? (
              <p className="text-sm text-gray-400">No quality events in the last 90 days.</p>
            ) : (
              <ul className="space-y-1">
                {Object.entries(breakdown).map(([type, b]) => (
                  <li key={type} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{humanize(type)} <span className="text-gray-400">×{b.count}</span></span>
                    <span className={`font-medium tabular-nums ${b.total < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {b.total > 0 ? '+' : ''}{b.total.toFixed(1)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4 mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Recent Quality Events</h3>
          <div className="max-h-56 overflow-y-auto">
            <ul className="divide-y divide-gray-100">
              {events.slice(0, 20).map((e) => (
                <li key={e.id} className="py-2 flex items-center justify-between text-sm">
                  <div>
                    <span className="text-gray-900">{humanize(e.event_type)}</span>
                    {e.notes && <span className="text-gray-400"> — {e.notes}</span>}
                    <div className="text-xs text-gray-400">{formatDate(e.created_at)}</div>
                  </div>
                  <span className={`font-medium tabular-nums ${Number(e.impact_score) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {Number(e.impact_score) > 0 ? '+' : ''}{Number(e.impact_score).toFixed(1)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex justify-end">
          <button onClick={() => onRecalculate(supplier.id)} className="btn-secondary">
            ↻ Recalculate Score
          </button>
        </div>
      </div>
    </div>
  );
}
