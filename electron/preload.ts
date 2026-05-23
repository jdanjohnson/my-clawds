import { contextBridge, ipcRenderer } from 'electron';

const api = {
  // Profile management
  profiles: {
    list: () => ipcRenderer.invoke('profiles:list'),
    create: (name: string) => ipcRenderer.invoke('profiles:create', name),
    delete: (name: string) => ipcRenderer.invoke('profiles:delete', name),
    switch: (name: string) => ipcRenderer.invoke('profiles:switch', name),
    getDefault: () => ipcRenderer.invoke('profiles:getDefault'),
    setDefault: (name: string) => ipcRenderer.invoke('profiles:setDefault', name),
    getActive: () => ipcRenderer.invoke('profiles:getActive'),
    getConfigDir: (name: string) => ipcRenderer.invoke('profiles:getConfigDir', name),
  },

  // Usage tracking
  usage: {
    getStatus: () => ipcRenderer.invoke('usage:getStatus'),
    getUsage: () => ipcRenderer.invoke('usage:getUsage'),
    getStats: () => ipcRenderer.invoke('usage:getStats'),
    getCosts: () => ipcRenderer.invoke('usage:getCosts'),
    refresh: () => ipcRenderer.invoke('usage:refresh'),
  },

  // App
  app: {
    openSettings: () => ipcRenderer.invoke('app:openSettings'),
    quit: () => ipcRenderer.invoke('app:quit'),
    getTheme: () => ipcRenderer.invoke('app:getTheme'),
    openExternal: (url: string) => ipcRenderer.invoke('app:openExternal', url),
  },

  // Settings
  settings: {
    get: (key: string) => ipcRenderer.invoke('settings:get', key),
    set: (key: string, value: unknown) => ipcRenderer.invoke('settings:set', key, value),
  },

  // Events
  on: (channel: string, callback: (...args: unknown[]) => void) => {
    const subscription = (_event: Electron.IpcRendererEvent, ...args: unknown[]) =>
      callback(...args);
    ipcRenderer.on(channel, subscription);
    return () => {
      ipcRenderer.removeListener(channel, subscription);
    };
  },
};

contextBridge.exposeInMainWorld('ccManager', api);
