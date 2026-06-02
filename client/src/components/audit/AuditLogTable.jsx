import { humanize } from '../../utils/severityColor';
import { formatDateTime } from '../../utils/formatDate';

const actionClasses = {
  INSERT: 'bg-green-100 text-green-700 ring-green-600/20',
  UPDATE: 'bg-amber-100 text-amber-700 ring-amber-600/20',
  DELETE: 'bg-red-100 text-red-700 ring-red-600/20',
};

// Read-only, timestamped audit feed. Each row can expand to show the JSON diff.
import { Fragment, useState } from 'react';

export default function AuditLogTable({ entries, loading }) {
  const [expanded, setExpanded] = useState(null);

  if (loading) return <div className="card p-8 text-center text-gray-400">Loading audit trail…</div>;
  if (!entries.length) return <div className="card p-8 text-center text-gray-400">No audit entries match the current filters.</div>;

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['When', 'Table', 'Action', 'Record', ''].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {entries.map((e) => (
              <Fragment key={e.id}>
                <tr
                  onClick={() => setExpanded((id) => (id === e.id ? null : e.id))}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{formatDateTime(e.changed_at)}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">{e.table_name}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${actionClasses[e.action] || ''}`}>
                      {humanize(e.action)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-gray-400">{e.record_id?.slice(0, 8)}…</td>
                  <td className="px-4 py-3 text-right text-gray-400">{expanded === e.id ? '▲' : '▼'}</td>
                </tr>
                {expanded === e.id && (
                  <tr className="bg-gray-50">
                    <td colSpan={5} className="px-4 py-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-1">Old values</p>
                          <pre className="text-xs bg-white rounded border border-gray-200 p-2 overflow-x-auto max-h-48">{JSON.stringify(e.old_values, null, 2) || '—'}</pre>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-1">New values</p>
                          <pre className="text-xs bg-white rounded border border-gray-200 p-2 overflow-x-auto max-h-48">{JSON.stringify(e.new_values, null, 2) || '—'}</pre>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
