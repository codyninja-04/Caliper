import { scoreColor } from '../../utils/severityColor';

// Simple SVG arc gauge for a 0–100 supplier quality score. No chart lib needed.
export default function ScoreGauge({ score = 0, size = 140 }) {
  const radius = size / 2 - 12;
  const circumference = Math.PI * radius; // semicircle
  const clamped = Math.max(0, Math.min(100, score));
  const offset = circumference * (1 - clamped / 100);
  const color = scoreColor(clamped);
  const cx = size / 2;
  const cy = size / 2;

  return (
    <div className="flex flex-col items-center" style={{ width: size }}>
      <svg width={size} height={size / 2 + 10} viewBox={`0 0 ${size} ${size / 2 + 10}`}>
        {/* track */}
        <path
          d={`M 12 ${cy} A ${radius} ${radius} 0 0 1 ${size - 12} ${cy}`}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* value */}
        <path
          d={`M 12 ${cy} A ${radius} ${radius} 0 0 1 ${size - 12} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="-mt-6 text-center">
        <div className="text-3xl font-bold tabular-nums" style={{ color }}>
          {clamped.toFixed(0)}
        </div>
        <div className="text-xs text-gray-400">/ 100</div>
      </div>
    </div>
  );
}
