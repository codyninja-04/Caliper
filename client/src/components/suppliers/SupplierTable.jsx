import { supplierStatusClasses, humanize, scoreColor } from '../../utils/severityColor';

export default function SupplierTable({ suppliers, loading, onRowClick }) {
  if (loading) return <div className="card p-8 text-center text-gray-400">Loading suppliers…</div>;
  if (!suppliers.length) return <div className="card p-8 text-center text-gray-400">No suppliers found.</div>;

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Code', 'Name', 'Country', 'Score', 'Status', ''].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {suppliers.map((s) => {
              const score = Number(s.quality_score);
              return (
                <tr key={s.id} onClick={() => onRowClick?.(s)} className="hover:bg-sky-50 cursor-pointer">
                  <td className="px-4 py-3 text-sm font-mono text-sky-700">{s.code}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">{s.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{s.country || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 rounded-full bg-gray-200 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: scoreColor(score) }} />
                      </div>
                      <span className="text-sm font-semibold tabular-nums" style={{ color: scoreColor(score) }}>{score.toFixed(0)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${supplierStatusClasses[s.status]}`}>
                      {humanize(s.status)}
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
