import type { UsageData, StatsData, CostSummary, AuthStatus } from '../types';
import { UsageBar } from './UsageBar';

interface UsagePanelProps {
  usage: UsageData | null;
  stats: StatsData | null;
  costs: CostSummary | null;
  authStatus: AuthStatus | null;
}

function formatResetTime(resetsAt: string | null): string {
  if (!resetsAt) return '';
  const date = new Date(resetsAt);
  const remaining = date.getTime() - Date.now();
  if (remaining <= 0) return 'now';

  const hours = Math.floor(remaining / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${Math.max(minutes, 1)}m`;
}

export function UsagePanel({ usage, stats, costs, authStatus }: UsagePanelProps) {
  if (!authStatus?.loggedIn) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 px-6 text-center">
        <svg className="w-10 h-10 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
        <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
          Not logged in. Run <code className="font-mono text-xs px-1 py-0.5 rounded" style={{ background: 'var(--surface-hover)' }}>claude auth login</code> in your terminal.
        </p>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-3">
      {/* Rate Limits */}
      <section>
        <h3 className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: 'var(--text-dim)' }}>
          Rate Limits
        </h3>
        <div className="space-y-2">
          <UsageBar
            label="5-Hour Session"
            utilization={usage?.fiveHour?.utilization ?? null}
            resetTime={formatResetTime(usage?.fiveHour?.resetsAt ?? null)}
          />
          <UsageBar
            label="Weekly"
            utilization={usage?.sevenDay?.utilization ?? null}
            resetTime={formatResetTime(usage?.sevenDay?.resetsAt ?? null)}
          />
          {usage?.extraUsage?.isEnabled && (
            <UsageBar
              label="Extra Usage"
              utilization={usage.extraUsage.utilization ?? null}
              resetTime={usage.extraUsage.usedCredits != null && usage.extraUsage.monthlyLimit != null
                ? `$${usage.extraUsage.usedCredits.toFixed(2)} / $${usage.extraUsage.monthlyLimit.toFixed(0)}`
                : ''}
              color="#8b5cf6"
            />
          )}
        </div>
      </section>

      {/* Cost */}
      {costs && (costs.todayCost > 0 || costs.weekCost > 0) && (
        <section>
          <h3 className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: 'var(--text-dim)' }}>
            Estimated Cost
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <StatCard label="Today" value={`$${costs.todayCost.toFixed(2)}`} />
            <StatCard label="This Week" value={`$${costs.weekCost.toFixed(2)}`} />
          </div>
          {Object.keys(costs.modelBreakdown).length > 0 && (
            <div className="mt-2 space-y-1">
              {Object.entries(costs.modelBreakdown)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([model, cost]) => (
                  <div key={model} className="flex justify-between text-[11px]" style={{ color: 'var(--text-dim)' }}>
                    <span className="truncate mr-2">{model}</span>
                    <span className="font-mono">${cost.toFixed(2)}</span>
                  </div>
                ))}
            </div>
          )}
        </section>
      )}

      {/* Activity Stats */}
      {stats && (
        <section>
          <h3 className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: 'var(--text-dim)' }}>
            Activity
          </h3>
          <div className="grid grid-cols-3 gap-2">
            <StatCard label="Today" value={String(stats.todayMessages)} sublabel="messages" />
            <StatCard label="Weekly" value={String(stats.weeklyMessages)} sublabel="messages" />
            <StatCard label="Tool Calls" value={String(stats.todayToolCalls)} sublabel="today" />
          </div>

          {/* Mini activity chart */}
          {stats.recentActivity.length > 0 && (
            <div className="mt-3">
              <ActivityChart data={stats.recentActivity} />
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function StatCard({ label, value, sublabel }: { label: string; value: string; sublabel?: string }) {
  return (
    <div
      className="rounded-lg px-2.5 py-2 text-center"
      style={{ backgroundColor: 'var(--surface-hover)' }}
    >
      <div className="text-[10px] font-medium" style={{ color: 'var(--text-dim)' }}>
        {label}
      </div>
      <div className="text-lg font-semibold leading-tight">{value}</div>
      {sublabel && (
        <div className="text-[9px]" style={{ color: 'var(--text-dim)' }}>
          {sublabel}
        </div>
      )}
    </div>
  );
}

function ActivityChart({
  data,
}: {
  data: Array<{ date: string; messageCount: number }>;
}) {
  const max = Math.max(...data.map((d) => d.messageCount), 1);

  return (
    <div className="flex items-end gap-1 h-12">
      {data.map((d) => {
        const height = (d.messageCount / max) * 100;
        const dayLabel = new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', {
          weekday: 'short',
        });
        return (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-0.5">
            <div
              className="w-full rounded-sm transition-all"
              style={{
                height: `${Math.max(height, 4)}%`,
                backgroundColor: d.messageCount > 0 ? 'var(--accent)' : 'var(--border)',
                opacity: d.messageCount > 0 ? 0.8 : 0.3,
              }}
              title={`${d.date}: ${d.messageCount} messages`}
            />
            <span className="text-[8px]" style={{ color: 'var(--text-dim)' }}>
              {dayLabel.charAt(0)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
