import { useState, useEffect } from 'react';
import { ProfilePanel } from './components/ProfilePanel';
import { UsagePanel } from './components/UsagePanel';
import { SettingsPanel } from './components/SettingsPanel';
import { Header } from './components/Header';
import type { ProfileInfo, AuthStatus, UsageData, StatsData, CostSummary } from './types';

type Tab = 'usage' | 'profiles' | 'settings';

function isSettingsRoute() {
  return window.location.hash === '#/settings';
}

export function App() {
  const [tab, setTab] = useState<Tab>(isSettingsRoute() ? 'settings' : 'usage');
  const [profiles, setProfiles] = useState<ProfileInfo[]>([]);
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [costs, setCosts] = useState<CostSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!window.ccManager) {
      console.error('ccManager API not available — preload may have failed');
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [profileList, data] = await Promise.all([
        window.ccManager.profiles.list(),
        window.ccManager.usage.refresh(),
      ]);
      setProfiles(profileList);
      setAuthStatus(data.status);
      setUsage(data.usage);
      setStats(data.stats);
      setCosts(data.costs);
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();

    if (!window.ccManager) return;
    const unsub = window.ccManager.on('usage-updated', (...args: unknown[]) => {
      const data = args[0] as {
        status: AuthStatus;
        usage: UsageData | null;
        stats: StatsData;
        costs: CostSummary;
      };
      if (data) {
        setAuthStatus(data.status);
        setUsage(data.usage);
        setStats(data.stats);
        setCosts(data.costs);
      }
    });

    return unsub;
  }, []);

  if (isSettingsRoute()) {
    return (
      <div className="h-full flex flex-col">
        <div className="h-8 flex-shrink-0" /> {/* titlebar inset */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <SettingsPanel />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col rounded-xl overflow-hidden">
      <Header
        authStatus={authStatus}
        loading={loading}
        onRefresh={refresh}
        tab={tab}
        onTabChange={setTab}
      />

      <div className="flex-1 overflow-y-auto">
        {tab === 'usage' && (
          <UsagePanel
            usage={usage}
            stats={stats}
            costs={costs}
            authStatus={authStatus}
          />
        )}
        {tab === 'profiles' && (
          <ProfilePanel
            profiles={profiles}
            onRefresh={refresh}
          />
        )}
        {tab === 'settings' && <SettingsPanel />}
      </div>
    </div>
  );
}
