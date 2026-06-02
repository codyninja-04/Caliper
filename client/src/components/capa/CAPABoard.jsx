import { useState } from 'react';
import CAPACard from './CAPACard';
import { humanize } from '../../utils/severityColor';

// Kanban columns mirror the CAPA state machine. Dragging a card to an adjacent
// column requests a transition; invalid jumps are rejected by the server.
const COLUMNS = ['open', 'in_progress', 'pending_verification', 'verified', 'closed'];

// Valid forward/back moves per the server-side machine — used to give instant
// UI feedback before the request round-trips.
const ALLOWED = {
  open: ['in_progress'],
  in_progress: ['pending_verification', 'open'],
  pending_verification: ['verified', 'in_progress'],
  verified: ['closed', 'in_progress'],
  closed: [],
};

export default function CAPABoard({ capas, loading, onMove, onCardClick }) {
  const [dragOver, setDragOver] = useState(null);
  const [dragged, setDragged] = useState(null);

  const onDragStart = (e, capa) => {
    setDragged(capa);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDrop = (status) => {
    setDragOver(null);
    if (!dragged) return;
    if (dragged.status === status) return;
    if (!ALLOWED[dragged.status]?.includes(status)) return; // invalid transition — ignore
    onMove(dragged, status);
    setDragged(null);
  };

  const byColumn = (status) => capas.filter((c) => c.status === status);

  if (loading) return <div className="card p-8 text-center text-gray-400">Loading CAPA board…</div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {COLUMNS.map((col) => {
        const items = byColumn(col);
        const droppable = dragged && ALLOWED[dragged.status]?.includes(col);
        return (
          <div
            key={col}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(col);
            }}
            onDragLeave={() => setDragOver((c) => (c === col ? null : c))}
            onDrop={() => onDrop(col)}
            className={`rounded-lg p-2 min-h-[200px] transition-colors ${
              dragOver === col && droppable
                ? 'bg-sky-50 ring-2 ring-sky-300'
                : 'bg-gray-100'
            }`}
          >
            <div className="flex items-center justify-between px-1 mb-2">
              <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{humanize(col)}</h3>
              <span className="text-xs text-gray-400 bg-white rounded-full px-2 py-0.5">{items.length}</span>
            </div>
            <div className="space-y-2">
              {items.map((c) => (
                <CAPACard key={c.id} capa={c} onDragStart={onDragStart} onClick={onCardClick} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
