import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatDate } from '../../utils/formatDate';

// 30-day rolling defect quantity trend (Recharts LineChart).
export default function DefectTrendChart({ trend = [] }) {
  const data = trend.map((t) => ({ ...t, label: formatDate(t.date) }));

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Defect Trend — last 30 days</h3>
      {data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-400 text-sm">No defect data yet.</div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#9ca3af" />
            <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="total" stroke="#0284c7" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} name="Defect qty" />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
