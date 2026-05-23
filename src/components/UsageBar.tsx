interface UsageBarProps {
  label: string;
  utilization: number | null;
  resetTime: string;
  color?: string;
}

function getBarColor(utilization: number, customColor?: string): string {
  if (customColor) return customColor;
  if (utilization >= 0.9) return '#ef4444';
  if (utilization >= 0.7) return '#f59e0b';
  return '#22c55e';
}

export function UsageBar({ label, utilization, resetTime, color }: UsageBarProps) {
  const pct = utilization != null ? Math.min(utilization * 100, 100) : 0;
  const barColor = utilization != null ? getBarColor(utilization, color) : 'var(--border)';
  const displayPct = utilization != null ? `${Math.round(pct)}%` : '—';

  return (
    <div
      className="rounded-lg px-3 py-2"
      style={{ backgroundColor: 'var(--surface-hover)' }}
    >
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-medium">{label}</span>
        <div className="flex items-center gap-2">
          {resetTime && (
            <span className="text-[10px] font-mono" style={{ color: 'var(--text-dim)' }}>
              {resetTime}
            </span>
          )}
          <span className="text-xs font-semibold font-mono" style={{ color: barColor }}>
            {displayPct}
          </span>
        </div>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            backgroundColor: barColor,
          }}
        />
      </div>
    </div>
  );
}
