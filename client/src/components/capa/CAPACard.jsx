import { formatDate, daysOverdue } from '../../utils/formatDate';

// Draggable CAPA card. Drag state is handled by the board via HTML5 DnD.
export default function CAPACard({ capa, onDragStart, onClick }) {
  const overdue = daysOverdue(capa.target_date);
  const isOverdue = overdue != null && overdue > 0 && capa.status !== 'closed' && capa.status !== 'verified';

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, capa)}
      onClick={() => onClick?.(capa)}
      className="card p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-mono text-xs text-sky-700">{capa.capa_number}</span>
        {capa.effectiveness_score != null && (
          <span className="text-xs font-semibold text-indigo-600">★ {capa.effectiveness_score}/10</span>
        )}
      </div>
      <p className="text-sm font-medium text-gray-900 line-clamp-2">{capa.title}</p>
      {capa.ncrs?.ncr_number && (
        <p className="mt-1 text-xs text-gray-400 font-mono">↳ {capa.ncrs.ncr_number}</p>
      )}
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className={isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}>
          {formatDate(capa.target_date)}
          {isOverdue && ' · overdue'}
        </span>
      </div>
    </div>
  );
}
