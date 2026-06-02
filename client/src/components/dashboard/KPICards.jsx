// Top-of-dashboard KPI tiles. Pure presentational — parent supplies the numbers.
function Card({ label, value, hint, accent = 'text-gray-900' }) {
  return (
    <div className="card p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold tabular-nums ${accent}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

export default function KPICards({ totalDefects = 0, openNCRs = 0, overdueCAPAs = 0, avgScore = 0 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card label="Defects (30d)" value={totalDefects} hint="Logged in the last 30 days" />
      <Card label="Open NCRs" value={openNCRs} accent="text-amber-600" hint="Not yet closed" />
      <Card label="Overdue CAPAs" value={overdueCAPAs} accent="text-red-600" hint="Past target date" />
      <Card label="Avg Supplier Score" value={avgScore.toFixed(0)} accent="text-sky-600" hint="Across all suppliers" />
    </div>
  );
}
