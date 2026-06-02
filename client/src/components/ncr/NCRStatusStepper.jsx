import { humanize } from '../../utils/severityColor';

// The canonical NCR happy-path. `escalated` sits off to the side and is shown
// inline when active. Visualizes where an NCR is in its lifecycle.
const FLOW = ['draft', 'open', 'under_review', 'awaiting_supplier', 'capa_required', 'closed'];

export default function NCRStatusStepper({ status }) {
  const isEscalated = status === 'escalated';
  // Escalated NCRs are conceptually somewhere mid-flow; anchor the marker at under_review.
  const activeIndex = isEscalated ? FLOW.indexOf('under_review') : FLOW.indexOf(status);

  return (
    <div className="w-full">
      <ol className="flex items-center w-full overflow-x-auto">
        {FLOW.map((step, i) => {
          const done = i < activeIndex;
          const active = i === activeIndex;
          return (
            <li key={step} className="flex items-center flex-1 min-w-max">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                    done
                      ? 'bg-green-500 text-white'
                      : active
                      ? 'bg-sky-600 text-white ring-4 ring-sky-100'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {done ? '✓' : i + 1}
                </div>
                <span className={`mt-1 text-[11px] whitespace-nowrap ${active ? 'text-sky-700 font-medium' : 'text-gray-500'}`}>
                  {humanize(step)}
                </span>
              </div>
              {i < FLOW.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${i < activeIndex ? 'bg-green-500' : 'bg-gray-200'}`} />
              )}
            </li>
          );
        })}
      </ol>
      {isEscalated && (
        <div className="mt-3 inline-flex items-center gap-2 rounded-md bg-red-50 px-3 py-1.5 text-sm text-red-700 ring-1 ring-red-200">
          ⚠ This NCR has been escalated
        </div>
      )}
    </div>
  );
}
