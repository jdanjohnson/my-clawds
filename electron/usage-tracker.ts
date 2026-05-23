import { execFile } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { profileManager } from './profile-manager';

interface AuthStatus {
  loggedIn: boolean;
  email: string | null;
  orgName: string | null;
  subscriptionType: string | null;
}

interface UsageWindow {
  utilization: number | null;
  resetsAt: string | null;
}

interface UsageData {
  fiveHour: UsageWindow | null;
  sevenDay: UsageWindow | null;
  extraUsage: {
    isEnabled: boolean;
    monthlyLimit: number | null;
    usedCredits: number | null;
    utilization: number | null;
  } | null;
}

interface StatsData {
  totalMessages: number;
  totalSessions: number;
  todayMessages: number;
  todayToolCalls: number;
  weeklyMessages: number;
  recentActivity: Array<{
    date: string;
    messageCount: number;
    sessionCount: number;
    toolCallCount: number;
  }>;
}

interface CostEntry {
  costUsd: number;
  model: string;
  durationMs: number;
}

interface CostSummary {
  todayCost: number;
  weekCost: number;
  modelBreakdown: Record<string, number>;
}

function getClaudeDir(): string {
  const configDir = profileManager.getActiveConfigDir();
  if (configDir) return configDir;
  return path.join(os.homedir(), '.claude');
}

function runClaude(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const claudePath = process.platform === 'win32' ? 'claude.exe' : 'claude';
    const env = { ...process.env };

    const activeDir = profileManager.getActiveConfigDir();
    if (activeDir) env.CLAUDE_CONFIG_DIR = activeDir;

    execFile(claudePath, args, { env, timeout: 15000 }, (err, stdout, stderr) => {
      if (err) {
        reject(new Error(stderr || err.message));
        return;
      }
      resolve(stdout.trim());
    });
  });
}

class UsageTracker {
  async getAuthStatus(): Promise<AuthStatus> {
    try {
      const output = await runClaude(['auth', 'status', '--json']);
      const data = JSON.parse(output);
      return {
        loggedIn: data.loggedIn ?? data.authenticated ?? false,
        email: data.email ?? null,
        orgName: data.orgName ?? null,
        subscriptionType: data.subscriptionType ?? null,
      };
    } catch {
      return { loggedIn: false, email: null, orgName: null, subscriptionType: null };
    }
  }

  async getUsage(): Promise<UsageData | null> {
    try {
      // Read from the usage cache file that Claude CLI maintains
      const claudeDir = getClaudeDir();
      const usagePath = path.join(claudeDir, 'usage-cache.json');

      if (fs.existsSync(usagePath)) {
        const raw = fs.readFileSync(usagePath, 'utf-8');
        const data = JSON.parse(raw);
        return {
          fiveHour: data.five_hour
            ? { utilization: data.five_hour.utilization, resetsAt: data.five_hour.resets_at }
            : null,
          sevenDay: data.seven_day
            ? { utilization: data.seven_day.utilization, resetsAt: data.seven_day.resets_at }
            : null,
          extraUsage: data.extra_usage
            ? {
                isEnabled: data.extra_usage.is_enabled,
                monthlyLimit: data.extra_usage.monthly_limit,
                usedCredits: data.extra_usage.used_credits,
                utilization: data.extra_usage.utilization,
              }
            : null,
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  getStats(): StatsData {
    try {
      const claudeDir = getClaudeDir();
      const statsPath = path.join(claudeDir, 'stats-cache.json');

      if (!fs.existsSync(statsPath)) {
        return this.emptyStats();
      }

      const raw = fs.readFileSync(statsPath, 'utf-8');
      const data = JSON.parse(raw);
      const dailyActivity: Array<{
        date: string;
        messageCount: number;
        sessionCount: number;
        toolCallCount: number;
      }> = data.dailyActivity || [];

      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

      const todayEntry = dailyActivity.find((d) => d.date === today);
      const weekEntries = dailyActivity.filter((d) => d.date >= weekAgo);

      return {
        totalMessages: data.totalMessages || 0,
        totalSessions: data.totalSessions || 0,
        todayMessages: todayEntry?.messageCount || 0,
        todayToolCalls: todayEntry?.toolCallCount || 0,
        weeklyMessages: weekEntries.reduce((sum, d) => sum + d.messageCount, 0),
        recentActivity: dailyActivity.slice(-7),
      };
    } catch {
      return this.emptyStats();
    }
  }

  getCostSummary(): CostSummary {
    try {
      const claudeDir = getClaudeDir();
      const projectsDir = path.join(claudeDir, 'projects');

      if (!fs.existsSync(projectsDir)) {
        return { todayCost: 0, weekCost: 0, modelBreakdown: {} };
      }

      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
      let todayCost = 0;
      let weekCost = 0;
      const modelBreakdown: Record<string, number> = {};

      // Walk project directories for JSONL session files
      this.walkJsonlFiles(projectsDir, (line: string) => {
        try {
          const entry = JSON.parse(line) as CostEntry & { timestamp?: string };
          if (!entry.costUsd || !entry.timestamp) return;

          const entryDate = entry.timestamp.split('T')[0];
          if (entryDate >= weekAgo) {
            weekCost += entry.costUsd;
            if (entryDate === today) todayCost += entry.costUsd;
            const model = entry.model || 'unknown';
            modelBreakdown[model] = (modelBreakdown[model] || 0) + entry.costUsd;
          }
        } catch {
          // skip malformed lines
        }
      });

      return { todayCost, weekCost, modelBreakdown };
    } catch {
      return { todayCost: 0, weekCost: 0, modelBreakdown: {} };
    }
  }

  async refreshAll() {
    const [status, usage, stats, costs] = await Promise.all([
      this.getAuthStatus(),
      this.getUsage(),
      Promise.resolve(this.getStats()),
      Promise.resolve(this.getCostSummary()),
    ]);

    return { status, usage, stats, costs };
  }

  private emptyStats(): StatsData {
    return {
      totalMessages: 0,
      totalSessions: 0,
      todayMessages: 0,
      todayToolCalls: 0,
      weeklyMessages: 0,
      recentActivity: [],
    };
  }

  private walkJsonlFiles(dir: string, lineHandler: (line: string) => void) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          this.walkJsonlFiles(fullPath, lineHandler);
        } else if (entry.name.endsWith('.jsonl')) {
          try {
            const content = fs.readFileSync(fullPath, 'utf-8');
            for (const line of content.split('\n')) {
              if (line.trim()) lineHandler(line);
            }
          } catch {
            // skip unreadable files
          }
        }
      }
    } catch {
      // skip unreadable dirs
    }
  }
}

export const usageTracker = new UsageTracker();
