import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { scoreColor } from '../../utils/severityColor';

// Top-10 suppliers by quality score (Recharts horizontal BarChart).
export default function SupplierRankChart({ suppliers = [] }) {
  const data = [...suppliers]
    .sort((a, b) => Number(b.quality_score) - Number(a.quality_score))
    .slice(0, 10)
    .map((s) => ({ name: s.code, score: Number(s.quality_score), full: s.name }));

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Top Suppliers by Quality Score</h3>
      {data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-400 text-sm">No suppliers yet.</div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#9ca3af" />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="#9ca3af" width={70} />
            <Tooltip formatter={(value, _n, p) => [`${value}`, p.payload.full]} />
            <Bar dataKey="score" radius={[0, 4, 4, 0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={scoreColor(entry.score)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
