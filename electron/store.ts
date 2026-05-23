import Store from 'electron-store';

export const store = new Store({
  name: 'cc-manager-settings',
  defaults: {
    refreshInterval: 300,
    launchAtLogin: false,
    showSessionUsage: true,
    showWeeklyUsage: true,
    showCosts: true,
    showResetTimers: true,
  },
});
