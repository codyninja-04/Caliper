import { ncrStatusClasses, severityClasses, humanize } from '../../utils/severityColor';
import { formatDate, daysOverdue } from '../../utils/formatDate';

export default function NCRList({ ncrs, loading, onRowClick }) {
  if (loading) return <div className="card p-8 text-center text-gray-400">Loading NCRs…</div>;
  if (!ncrs.length) return <div className="card p-8 text-center text-gray-400">No NCRs match the current filters.</div>;

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['NCR #', 'Title', 'Supplier', 'Severity', 'Status', 'Due', ''].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {ncrs.map((n) => {
              const overdue = daysOverdue(n.due_date);
              const isOverdue = overdue != null && overdue > 0 && n.status !== 'closed';
              return (
                <tr key={n.id} onClick={() => onRowClick?.(n)} className="hover:bg-sky-50 cursor-pointer">
                  <td className="px-4 py-3 text-sm font-mono text-sky-700">{n.ncr_number}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">{n.title}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{n.suppliers?.name || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${severityClasses[n.severity]}`}>
                      {humanize(n.severity)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${ncrStatusClasses[n.status]}`}>
                      {humanize(n.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm whitespace-nowrap">
                    <span className={isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}>
                      {formatDate(n.due_date)}
                      {isOverdue && ` (${overdue}d over)`}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-400">›</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
