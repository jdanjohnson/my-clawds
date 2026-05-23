import {
  app,
  BrowserWindow,
  Tray,
  Menu,
  ipcMain,
  nativeImage,
  screen,
  nativeTheme,
  shell,
  type NativeImage,
} from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { profileManager } from './profile-manager';
import { usageTracker } from './usage-tracker';
import { store } from './store';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let tray: Tray | null = null;
let mainWindow: BrowserWindow | null = null;
let settingsWindow: BrowserWindow | null = null;

const WINDOW_WIDTH = 380;
const WINDOW_HEIGHT = 520;

function createTrayIcon(): NativeImage {
  // Simple 22x22 template image for macOS menu bar
  const size = 22;
  const canvas = Buffer.alloc(size * size * 4, 0);
  // Draw a simple "CC" icon shape - a circle with inner detail
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const cx = x - size / 2;
      const cy = y - size / 2;
      const dist = Math.sqrt(cx * cx + cy * cy);
      const idx = (y * size + x) * 4;
      // Outer ring
      if (dist >= 7 && dist <= 9) {
        canvas[idx] = 0;
        canvas[idx + 1] = 0;
        canvas[idx + 2] = 0;
        canvas[idx + 3] = 255;
      }
      // Inner dot
      if (dist <= 3) {
        canvas[idx] = 0;
        canvas[idx + 1] = 0;
        canvas[idx + 2] = 0;
        canvas[idx + 3] = 255;
      }
    }
  }
  const img = nativeImage.createFromBuffer(canvas, { width: size, height: size });
  img.setTemplateImage(true);
  return img;
}

function createMainWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.show();
    mainWindow.focus();
    return;
  }

  const trayBounds = tray?.getBounds();
  const display = screen.getPrimaryDisplay();
  const { width: screenWidth } = display.workAreaSize;

  let x = Math.round(screenWidth / 2 - WINDOW_WIDTH / 2);
  let y = 0;

  if (trayBounds && trayBounds.x > 0) {
    x = Math.round(trayBounds.x + trayBounds.width / 2 - WINDOW_WIDTH / 2);
    y = trayBounds.y + trayBounds.height + 4;
  }

  // Clamp to screen
  x = Math.max(0, Math.min(x, screenWidth - WINDOW_WIDTH));

  mainWindow = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    x,
    y,
    frame: false,
    resizable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    show: false,
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#1e1e1e' : '#f5f5f5',
    vibrancy: 'popover',
    visualEffectState: 'active',
    roundedCorners: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.webContents.on('did-fail-load', (_e, code, desc) => {
    console.error(`[main] Failed to load: ${code} ${desc}`);
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('blur', () => {
    if (!settingsWindow || settingsWindow.isDestroyed()) {
      mainWindow?.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createSettingsWindow() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.show();
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 560,
    height: 480,
    title: 'CC Manager Settings',
    titleBarStyle: 'hiddenInset',
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#1e1e1e' : '#f5f5f5',
    vibrancy: 'window',
    visualEffectState: 'active',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  const settingsUrl = process.env.VITE_DEV_SERVER_URL
    ? `${process.env.VITE_DEV_SERVER_URL}#/settings`
    : path.join(__dirname, '../dist/index.html');

  if (process.env.VITE_DEV_SERVER_URL) {
    settingsWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}#/settings`);
  } else {
    settingsWindow.loadFile(path.join(__dirname, '../dist/index.html'), {
      hash: '/settings',
    });
  }

  settingsWindow.once('ready-to-show', () => {
    settingsWindow?.show();
  });

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

function toggleWindow() {
  if (mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible()) {
    mainWindow.hide();
  } else {
    createMainWindow();
  }
}

// IPC Handlers
function registerIpcHandlers() {
  // Profile management
  ipcMain.handle('profiles:list', () => profileManager.listProfiles());
  ipcMain.handle('profiles:create', (_e, name: string) => profileManager.createProfile(name));
  ipcMain.handle('profiles:delete', (_e, name: string) => profileManager.deleteProfile(name));
  ipcMain.handle('profiles:switch', (_e, name: string) => profileManager.switchProfile(name));
  ipcMain.handle('profiles:getDefault', () => profileManager.getDefaultProfile());
  ipcMain.handle('profiles:setDefault', (_e, name: string) =>
    profileManager.setDefaultProfile(name)
  );
  ipcMain.handle('profiles:getActive', () => profileManager.getActiveProfile());
  ipcMain.handle('profiles:getConfigDir', (_e, name: string) =>
    profileManager.getConfigDir(name)
  );

  // Usage tracking
  ipcMain.handle('usage:getStatus', () => usageTracker.getAuthStatus());
  ipcMain.handle('usage:getUsage', () => usageTracker.getUsage());
  ipcMain.handle('usage:getStats', () => usageTracker.getStats());
  ipcMain.handle('usage:getCosts', () => usageTracker.getCostSummary());
  ipcMain.handle('usage:refresh', () => usageTracker.refreshAll());

  // App actions
  ipcMain.handle('app:openSettings', () => createSettingsWindow());
  ipcMain.handle('app:quit', () => app.quit());
  ipcMain.handle('app:getTheme', () => nativeTheme.shouldUseDarkColors ? 'dark' : 'light');
  ipcMain.handle('app:openExternal', (_e, url: string) => shell.openExternal(url));

  // Settings
  ipcMain.handle('settings:get', (_e, key: string) => store.get(key));
  ipcMain.handle('settings:set', (_e, key: string, value: unknown) => store.set(key, value));

  // Listen for theme changes
  nativeTheme.on('updated', () => {
    const theme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
    mainWindow?.webContents.send('theme-changed', theme);
    settingsWindow?.webContents.send('theme-changed', theme);
  });
}

// Auto-refresh timer
let refreshInterval: ReturnType<typeof setInterval> | null = null;

function startAutoRefresh() {
  const intervalMs = ((store.get('refreshInterval') as number) || 300) * 1000;
  if (refreshInterval) clearInterval(refreshInterval);
  refreshInterval = setInterval(async () => {
    const data = await usageTracker.refreshAll();
    mainWindow?.webContents.send('usage-updated', data);
  }, intervalMs);
}

// App lifecycle
app.dock?.hide(); // Hide dock icon — menu bar app only

app.whenReady().then(() => {
  const icon = createTrayIcon();
  tray = new Tray(icon);
  tray.setToolTip('CC Manager');

  tray.on('click', () => toggleWindow());
  tray.on('right-click', () => {
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Show Panel', click: () => createMainWindow() },
      { label: 'Settings...', click: () => createSettingsWindow() },
      { type: 'separator' },
      { label: 'Quit CC Manager', click: () => app.quit() },
    ]);
    tray?.popUpContextMenu(contextMenu);
  });

  registerIpcHandlers();
  startAutoRefresh();
});

app.on('window-all-closed', () => {
  // Keep running in tray — do nothing
});

app.on('activate', () => {
  createMainWindow();
});
