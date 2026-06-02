import { useAuth } from '../../context/AuthContext';
import { humanize } from '../../utils/severityColor';

export default function Navbar() {
  const { user, profile, role, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 md:px-6">
      <div className="md:hidden flex items-center gap-2">
        <span className="text-sky-600 text-lg font-bold">Caliper</span>
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">
            {profile?.full_name || user?.email || 'Guest'}
          </p>
          <p className="text-xs text-gray-500">{humanize(role)}</p>
        </div>
        <div className="h-9 w-9 rounded-full bg-sky-600 text-white flex items-center justify-center text-sm font-semibold">
          {(profile?.full_name || user?.email || '?').charAt(0).toUpperCase()}
        </div>
        <button onClick={signOut} className="btn-secondary text-xs px-3 py-1.5">
          Sign out
        </button>
      </div>
    </header>
  );
}
