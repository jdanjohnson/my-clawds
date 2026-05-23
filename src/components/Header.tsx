import type { AuthStatus } from '../types';

type Tab = 'usage' | 'profiles' | 'settings';

interface HeaderProps {
  authStatus: AuthStatus | null;
  loading: boolean;
  onRefresh: () => void;
  tab: Tab;
  onTabChange: (tab: Tab) => void;
}

export function Header({ authStatus, loading, onRefresh, tab, onTabChange }: HeaderProps) {
  const tabs: { key: Tab; label: string }[] = [
    { key: 'usage', label: 'Usage' },
    { key: 'profiles', label: 'Profiles' },
    { key: 'settings', label: 'Settings' },
  ];

  return (
    <div className="flex-shrink-0 border-b" style={{ borderColor: 'var(--border)' }}>
      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: authStatus?.loggedIn ? 'var(--success)' : 'var(--danger)',
            }}
          />
          <span className="text-xs font-medium truncate max-w-[200px]">
            {authStatus?.email || 'Not logged in'}
          </span>
          {authStatus?.subscriptionType && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
              style={{
                backgroundColor: 'var(--accent)',
                color: '#fff',
              }}
            >
              {authStatus.subscriptionType.charAt(0).toUpperCase() +
                authStatus.subscriptionType.slice(1)}
            </span>
          )}
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-1 rounded hover:bg-white/10 transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <svg
            className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex px-3 gap-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => onTabChange(t.key)}
            className="px-3 py-1.5 text-xs font-medium rounded-t-md transition-colors relative"
            style={{
              color: tab === t.key ? 'var(--accent)' : 'var(--text-dim)',
              backgroundColor: tab === t.key ? 'var(--surface-hover)' : 'transparent',
            }}
          >
            {t.label}
            {tab === t.key && (
              <div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                style={{ backgroundColor: 'var(--accent)' }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
