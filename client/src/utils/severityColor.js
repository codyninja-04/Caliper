// Tailwind class maps for severity / status badges. Centralised so the whole
// app speaks the same visual language.

export const severityClasses = {
  critical: 'bg-red-100 text-red-800 ring-red-600/20',
  major: 'bg-amber-100 text-amber-800 ring-amber-600/20',
  minor: 'bg-sky-100 text-sky-800 ring-sky-600/20',
};

export const defectStatusClasses = {
  open: 'bg-red-100 text-red-700 ring-red-600/20',
  under_review: 'bg-amber-100 text-amber-700 ring-amber-600/20',
  closed: 'bg-green-100 text-green-700 ring-green-600/20',
};

export const ncrStatusClasses = {
  draft: 'bg-gray-100 text-gray-700 ring-gray-500/20',
  open: 'bg-sky-100 text-sky-700 ring-sky-600/20',
  under_review: 'bg-amber-100 text-amber-700 ring-amber-600/20',
  awaiting_supplier: 'bg-purple-100 text-purple-700 ring-purple-600/20',
  capa_required: 'bg-orange-100 text-orange-700 ring-orange-600/20',
  escalated: 'bg-red-100 text-red-700 ring-red-600/20',
  closed: 'bg-green-100 text-green-700 ring-green-600/20',
};

export const capaStatusClasses = {
  open: 'bg-gray-100 text-gray-700 ring-gray-500/20',
  in_progress: 'bg-sky-100 text-sky-700 ring-sky-600/20',
  pending_verification: 'bg-amber-100 text-amber-700 ring-amber-600/20',
  verified: 'bg-indigo-100 text-indigo-700 ring-indigo-600/20',
  closed: 'bg-green-100 text-green-700 ring-green-600/20',
};

export const supplierStatusClasses = {
  active: 'bg-green-100 text-green-700 ring-green-600/20',
  probation: 'bg-amber-100 text-amber-700 ring-amber-600/20',
  disqualified: 'bg-red-100 text-red-700 ring-red-600/20',
};

// Human-friendly label from a snake_case status.
export function humanize(value) {
  if (!value) return '';
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// Gauge color for a 0–100 quality score.
export function scoreColor(score) {
  if (score >= 80) return '#16a34a'; // green
  if (score >= 60) return '#eab308'; // yellow
  if (score >= 40) return '#f97316'; // orange
  return '#dc2626'; // red
}
