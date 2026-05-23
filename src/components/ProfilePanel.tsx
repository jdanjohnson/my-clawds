import { useState } from 'react';
import type { ProfileInfo } from '../types';

interface ProfilePanelProps {
  profiles: ProfileInfo[];
  onRefresh: () => void;
}

export function ProfilePanel({ profiles, onRefresh }: ProfilePanelProps) {
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [switching, setSwitching] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setError(null);
    setCreating(true);
    const result = await window.ccManager.profiles.create(newName.trim());
    if (!result.success) {
      setError(result.error || 'Failed to create profile');
    } else {
      setNewName('');
    }
    setCreating(false);
    onRefresh();
  };

  const handleSwitch = async (name: string) => {
    setSwitching(name);
    await window.ccManager.profiles.switch(name);
    setSwitching(null);
    onRefresh();
  };

  const handleSetDefault = async (name: string) => {
    await window.ccManager.profiles.setDefault(name);
    onRefresh();
  };

  const handleDelete = async (name: string) => {
    const result = await window.ccManager.profiles.delete(name);
    if (!result.success) {
      setError(result.error || 'Failed to delete profile');
    }
    onRefresh();
  };

  return (
    <div className="p-3 space-y-3">
      {/* Create profile */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          placeholder="New profile name..."
          className="flex-1 text-xs rounded-md px-2.5 py-1.5 border outline-none transition-colors"
          style={{
            backgroundColor: 'var(--surface-hover)',
            borderColor: 'var(--border)',
            color: 'var(--text)',
          }}
        />
        <button
          onClick={handleCreate}
          disabled={creating || !newName.trim()}
          className="text-xs font-medium px-3 py-1.5 rounded-md transition-colors disabled:opacity-40"
          style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
        >
          {creating ? '...' : 'Create'}
        </button>
      </div>

      {error && (
        <div className="text-[11px] px-2 py-1 rounded" style={{ color: 'var(--danger)', backgroundColor: 'rgba(239,68,68,0.1)' }}>
          {error}
        </div>
      )}

      {/* Profile list */}
      {profiles.length === 0 ? (
        <div className="text-center py-8" style={{ color: 'var(--text-dim)' }}>
          <p className="text-sm">No profiles yet</p>
          <p className="text-xs mt-1">Create one to get started</p>
        </div>
      ) : (
        <div className="space-y-1">
          {profiles.map((profile) => (
            <ProfileRow
              key={profile.name}
              profile={profile}
              isSwitching={switching === profile.name}
              onSwitch={() => handleSwitch(profile.name)}
              onSetDefault={() => handleSetDefault(profile.name)}
              onDelete={() => handleDelete(profile.name)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProfileRow({
  profile,
  isSwitching,
  onSwitch,
  onSetDefault,
  onDelete,
}: {
  profile: ProfileInfo;
  isSwitching: boolean;
  onSwitch: () => void;
  onSetDefault: () => void;
  onDelete: () => void;
}) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      className="group flex items-center gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer"
      style={{
        backgroundColor: profile.isActive ? 'rgba(217, 119, 6, 0.1)' : 'transparent',
      }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onClick={onSwitch}
    >
      {/* Active indicator */}
      <div
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{
          backgroundColor: profile.isActive ? 'var(--accent)' : 'transparent',
        }}
      />

      {/* Name + badges */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium truncate">
            {isSwitching ? 'Switching...' : profile.name}
          </span>
          {profile.isDefault && (
            <span
              className="text-[9px] px-1 py-0.5 rounded font-medium"
              style={{ backgroundColor: 'var(--surface-hover)', color: 'var(--text-dim)' }}
            >
              default
            </span>
          )}
          {profile.hasCredentials && (
            <span className="text-[9px]" style={{ color: 'var(--success)' }} title="Has credentials">
              ●
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {!profile.isDefault && (
            <button
              onClick={onSetDefault}
              className="text-[10px] px-1.5 py-0.5 rounded transition-colors hover:opacity-80"
              style={{ backgroundColor: 'var(--surface-hover)', color: 'var(--text-dim)' }}
              title="Set as default"
            >
              ★
            </button>
          )}
          <button
            onClick={onDelete}
            className="text-[10px] px-1.5 py-0.5 rounded transition-colors hover:opacity-80"
            style={{ color: 'var(--danger)' }}
            title="Delete profile"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
