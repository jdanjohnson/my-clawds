import { useState, useEffect } from 'react';

interface Settings {
  refreshInterval: number;
  launchAtLogin: boolean;
  showSessionUsage: boolean;
  showWeeklyUsage: boolean;
  showCosts: boolean;
  showResetTimers: boolean;
}

const defaultSettings: Settings = {
  refreshInterval: 300,
  launchAtLogin: false,
  showSessionUsage: true,
  showWeeklyUsage: true,
  showCosts: true,
  showResetTimers: true,
};

export function SettingsPanel() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  useEffect(() => {
    (async () => {
      const keys = Object.keys(defaultSettings) as Array<keyof Settings>;
      const loaded: Partial<Settings> = {};
      for (const key of keys) {
        const val = await window.ccManager.settings.get(key);
        if (val !== undefined && val !== null) {
          (loaded as Record<string, unknown>)[key] = val;
        }
      }
      setSettings({ ...defaultSettings, ...loaded });
    })();
  }, []);

  const update = async <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    await window.ccManager.settings.set(key, value);
  };

  return (
    <div className="p-3 space-y-4">
      <section>
        <h3 className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: 'var(--text-dim)' }}>
          General
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs">Auto-refresh interval</label>
            <select
              value={settings.refreshInterval}
              onChange={(e) => update('refreshInterval', Number(e.target.value))}
              className="text-xs rounded px-2 py-1 border outline-none"
              style={{
                backgroundColor: 'var(--surface-hover)',
                borderColor: 'var(--border)',
                color: 'var(--text)',
              }}
            >
              <option value={60}>1 minute</option>
              <option value={120}>2 minutes</option>
              <option value={300}>5 minutes</option>
              <option value={600}>10 minutes</option>
              <option value={1800}>30 minutes</option>
            </select>
          </div>

          <ToggleRow
            label="Launch at login"
            value={settings.launchAtLogin}
            onChange={(v) => update('launchAtLogin', v)}
          />
        </div>
      </section>

      <section>
        <h3 className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: 'var(--text-dim)' }}>
          Display
        </h3>
        <div className="space-y-2">
          <ToggleRow
            label="Show session usage"
            value={settings.showSessionUsage}
            onChange={(v) => update('showSessionUsage', v)}
          />
          <ToggleRow
            label="Show weekly usage"
            value={settings.showWeeklyUsage}
            onChange={(v) => update('showWeeklyUsage', v)}
          />
          <ToggleRow
            label="Show costs"
            value={settings.showCosts}
            onChange={(v) => update('showCosts', v)}
          />
          <ToggleRow
            label="Show reset timers"
            value={settings.showResetTimers}
            onChange={(v) => update('showResetTimers', v)}
          />
        </div>
      </section>

      <section>
        <h3 className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: 'var(--text-dim)' }}>
          About
        </h3>
        <div className="text-xs space-y-1" style={{ color: 'var(--text-dim)' }}>
          <p>CC Manager v0.1.0</p>
          <p>Manage Claude Code profiles and track usage from your menu bar.</p>
          <button
            onClick={() => window.ccManager.app.openExternal('https://github.com/jdanjohnson/my-clawds')}
            className="underline hover:opacity-80 transition-opacity"
            style={{ color: 'var(--accent)' }}
          >
            View on GitHub
          </button>
        </div>
      </section>

      <div className="pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
        <button
          onClick={() => window.ccManager.app.quit()}
          className="text-xs px-3 py-1.5 rounded-md transition-colors"
          style={{ color: 'var(--danger)' }}
        >
          Quit CC Manager
        </button>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-xs">{label}</label>
      <button
        onClick={() => onChange(!value)}
        className="relative w-8 h-[18px] rounded-full transition-colors"
        style={{
          backgroundColor: value ? 'var(--accent)' : 'var(--border)',
        }}
      >
        <div
          className="absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-all"
          style={{
            left: value ? '14px' : '2px',
          }}
        />
      </button>
    </div>
  );
}
