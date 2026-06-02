import { NavLink } from 'react-router-dom';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/defects', label: 'Defects', icon: '🔧' },
  { to: '/ncrs', label: 'NCRs', icon: '📋' },
  { to: '/capa', label: 'CAPA', icon: '✅' },
  { to: '/suppliers', label: 'Suppliers', icon: '🏭' },
  { to: '/audit', label: 'Audit Log', icon: '🗒️' },
];

export default function Sidebar() {
  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 bg-gray-900 text-gray-100">
      <div className="flex items-center gap-2 h-16 px-5 border-b border-gray-800">
        <span className="text-sky-400 text-xl font-bold">Caliper</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-sky-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <span aria-hidden>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-5 py-4 border-t border-gray-800 text-xs text-gray-500">
        Quality Management System
      </div>
    </aside>
  );
}
