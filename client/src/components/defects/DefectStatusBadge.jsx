import { defectStatusClasses, severityClasses, humanize } from '../../utils/severityColor';

// Reusable pill badge. `kind` selects the color map so the same component
// renders defect status, severity, etc. consistently.
export default function Badge({ value, kind = 'defectStatus' }) {
  const maps = {
    defectStatus: defectStatusClasses,
    severity: severityClasses,
  };
  const cls = maps[kind]?.[value] || 'bg-gray-100 text-gray-700 ring-gray-500/20';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}
    >
      {humanize(value)}
    </span>
  );
}

// Convenience wrapper specifically for defect status.
export function DefectStatusBadge({ status }) {
  return <Badge value={status} kind="defectStatus" />;
}

export function SeverityBadge({ severity }) {
  return <Badge value={severity} kind="severity" />;
}
