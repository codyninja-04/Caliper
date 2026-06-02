import { DefectStatusBadge, SeverityBadge } from './DefectStatusBadge';
import { formatDateTime } from '../../utils/formatDate';

// Sortable, read-at-a-glance defect table. Sorting is client-side on the
// currently loaded page; filtering happens server-side via the hook.
import { useState, useMemo } from 'react';

export default function DefectTable({ defects, loading, onRowClick }) {
  const [sortKey, setSortKey] = useState('detected_at');
  const [sortDir, setSortDir] = useState('desc');

  const sorted = useMemo(() => {
    const copy = [...defects];
    copy.sort((a, b) => {
      const av = a[sortKey] ?? '';
      const bv = b[sortKey] ?? '';
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return copy;
  }, [defects, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const Th = ({ label, k }) => (
    <th
      onClick={() => toggleSort(k)}
      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700"
    >
      {label}
      {sortKey === k && <span className="ml-1">{sortDir === 'asc' ? '▲' : '▼'}</span>}
    </th>
  );

  if (loading) {
    return <div className="card p-8 text-center text-gray-400">Loading defects…</div>;
  }

  if (!defects.length) {
    return <div className="card p-8 text-center text-gray-400">No defects match the current filters.</div>;
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <Th label="Code" k="defect_code" />
              <Th label="Product Line" k="product_line" />
              <Th label="Type" k="defect_type" />
              <Th label="Severity" k="severity" />
              <Th label="Qty" k="quantity_affected" />
              <Th label="Detected" k="detected_at" />
              <Th label="Status" k="status" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {sorted.map((d) => (
              <tr
                key={d.id}
                onClick={() => onRowClick?.(d)}
                className="hover:bg-sky-50 cursor-pointer"
              >
                <td className="px-4 py-3 text-sm font-mono text-sky-700">{d.defect_code}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{d.product_line}</td>
                <td className="px-4 py-3 text-sm text-gray-600 capitalize">{d.defect_type}</td>
                <td className="px-4 py-3"><SeverityBadge severity={d.severity} /></td>
                <td className="px-4 py-3 text-sm text-gray-900 tabular-nums">{d.quantity_affected}</td>
                <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{formatDateTime(d.detected_at)}</td>
                <td className="px-4 py-3"><DefectStatusBadge status={d.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
