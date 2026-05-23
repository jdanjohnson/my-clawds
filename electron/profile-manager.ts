import fs from 'fs';
import path from 'path';
import os from 'os';

const PROFILE_NAME_RE = /^[A-Za-z0-9_-]+$/;

function getProfilesDir(): string {
  if (process.platform === 'win32') {
    return path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'), 'claude-profiles');
  }
  const xdg = process.env.XDG_DATA_HOME || path.join(os.homedir(), '.local', 'share');
  return path.join(xdg, 'claude-profiles');
}

function getDefaultFilePath(): string {
  return path.join(getProfilesDir(), '.default');
}

function validateName(name: string): { valid: boolean; error?: string } {
  if (!name) return { valid: false, error: 'Profile name cannot be empty' };
  if (name.startsWith('.')) return { valid: false, error: 'Profile name cannot start with .' };
  if (name.includes('/') || name.includes('\\') || name.includes('..'))
    return { valid: false, error: 'Profile name contains invalid characters' };
  if (!PROFILE_NAME_RE.test(name))
    return { valid: false, error: 'Profile name can only contain letters, digits, hyphens, underscores' };
  return { valid: true };
}

export interface ProfileInfo {
  name: string;
  path: string;
  isDefault: boolean;
  isActive: boolean;
  hasSettings: boolean;
  hasCredentials: boolean;
}

class ProfileManager {
  private activeProfile: string | null = null;

  getProfilesDir(): string {
    return getProfilesDir();
  }

  listProfiles(): ProfileInfo[] {
    const dir = getProfilesDir();
    if (!fs.existsSync(dir)) return [];

    const defaultProfile = this.getDefaultProfile();
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    return entries
      .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
      .map((e) => {
        const profilePath = path.join(dir, e.name);
        return {
          name: e.name,
          path: profilePath,
          isDefault: e.name === defaultProfile,
          isActive: e.name === this.getActiveProfile(),
          hasSettings: fs.existsSync(path.join(profilePath, 'settings.json')),
          hasCredentials: fs.existsSync(path.join(profilePath, '.credentials.json')),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  createProfile(name: string): { success: boolean; error?: string } {
    const validation = validateName(name);
    if (!validation.valid) return { success: false, error: validation.error };

    const profilePath = path.join(getProfilesDir(), name);
    if (fs.existsSync(profilePath)) {
      return { success: false, error: `Profile "${name}" already exists` };
    }

    fs.mkdirSync(profilePath, { recursive: true });

    // If no default exists, set this as default
    if (!this.getDefaultProfile()) {
      this.setDefaultProfile(name);
    }

    return { success: true };
  }

  deleteProfile(name: string): { success: boolean; error?: string } {
    const validation = validateName(name);
    if (!validation.valid) return { success: false, error: validation.error };

    const profilePath = path.join(getProfilesDir(), name);
    if (!fs.existsSync(profilePath)) {
      return { success: false, error: `Profile "${name}" does not exist` };
    }

    fs.rmSync(profilePath, { recursive: true, force: true });

    // Clear default if it was this profile
    if (this.getDefaultProfile() === name) {
      const remaining = this.listProfiles();
      if (remaining.length > 0) {
        this.setDefaultProfile(remaining[0].name);
      } else {
        try {
          fs.unlinkSync(getDefaultFilePath());
        } catch {
          // ignore
        }
      }
    }

    // Clear active if it was this profile
    if (this.activeProfile === name) {
      this.activeProfile = null;
    }

    return { success: true };
  }

  switchProfile(name: string): { success: boolean; error?: string; configDir?: string } {
    const validation = validateName(name);
    if (!validation.valid) return { success: false, error: validation.error };

    const profilePath = path.join(getProfilesDir(), name);
    if (!fs.existsSync(profilePath)) {
      return { success: false, error: `Profile "${name}" does not exist` };
    }

    this.activeProfile = name;
    process.env.CLAUDE_CONFIG_DIR = profilePath;

    return { success: true, configDir: profilePath };
  }

  getDefaultProfile(): string | null {
    const defaultFile = getDefaultFilePath();
    if (!fs.existsSync(defaultFile)) return null;
    try {
      return fs.readFileSync(defaultFile, 'utf-8').trim() || null;
    } catch {
      return null;
    }
  }

  setDefaultProfile(name: string): { success: boolean; error?: string } {
    const validation = validateName(name);
    if (!validation.valid) return { success: false, error: validation.error };

    const profilePath = path.join(getProfilesDir(), name);
    if (!fs.existsSync(profilePath)) {
      return { success: false, error: `Profile "${name}" does not exist` };
    }

    const dir = getProfilesDir();
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(getDefaultFilePath(), name, 'utf-8');
    return { success: true };
  }

  getActiveProfile(): string | null {
    return this.activeProfile || this.getDefaultProfile();
  }

  getConfigDir(name?: string): string | null {
    const profileName = name || this.getActiveProfile();
    if (!profileName) return null;
    const dir = path.join(getProfilesDir(), profileName);
    return fs.existsSync(dir) ? dir : null;
  }

  getActiveConfigDir(): string | null {
    return this.getConfigDir(this.getActiveProfile() || undefined);
  }
}

export const profileManager = new ProfileManager();
