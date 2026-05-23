export interface ProfileInfo {
  name: string;
  path: string;
  isDefault: boolean;
  isActive: boolean;
  hasSettings: boolean;
  hasCredentials: boolean;
}

export interface AuthStatus {
  loggedIn: boolean;
  email: string | null;
  orgName: string | null;
  subscriptionType: string | null;
}

export interface UsageWindow {
  utilization: number | null;
  resetsAt: string | null;
}

export interface UsageData {
  fiveHour: UsageWindow | null;
  sevenDay: UsageWindow | null;
  extraUsage: {
    isEnabled: boolean;
    monthlyLimit: number | null;
    usedCredits: number | null;
    utilization: number | null;
  } | null;
}

export interface StatsData {
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

export interface CostSummary {
  todayCost: number;
  weekCost: number;
  modelBreakdown: Record<string, number>;
}

export interface RefreshData {
  status: AuthStatus;
  usage: UsageData | null;
  stats: StatsData;
  costs: CostSummary;
}

export interface CCManagerAPI {
  profiles: {
    list: () => Promise<ProfileInfo[]>;
    create: (name: string) => Promise<{ success: boolean; error?: string }>;
    delete: (name: string) => Promise<{ success: boolean; error?: string }>;
    switch: (name: string) => Promise<{ success: boolean; error?: string; configDir?: string }>;
    getDefault: () => Promise<string | null>;
    setDefault: (name: string) => Promise<{ success: boolean; error?: string }>;
    getActive: () => Promise<string | null>;
    getConfigDir: (name: string) => Promise<string | null>;
  };
  usage: {
    getStatus: () => Promise<AuthStatus>;
    getUsage: () => Promise<UsageData | null>;
    getStats: () => Promise<StatsData>;
    getCosts: () => Promise<CostSummary>;
    refresh: () => Promise<RefreshData>;
  };
  app: {
    openSettings: () => Promise<void>;
    quit: () => Promise<void>;
    getTheme: () => Promise<'dark' | 'light'>;
    openExternal: (url: string) => Promise<void>;
  };
  settings: {
    get: (key: string) => Promise<unknown>;
    set: (key: string, value: unknown) => Promise<void>;
  };
  on: (channel: string, callback: (...args: unknown[]) => void) => () => void;
}

declare global {
  interface Window {
    ccManager: CCManagerAPI;
  }
}
