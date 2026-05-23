# my-clawds

A macOS menu bar app for managing Claude Code profiles and tracking usage — built with Electron, React, and TypeScript.

Inspired by [claude-code-profiles](https://github.com/quinnjr/claude-code-profiles), [PaceBar](https://github.com/cbnsndwch/pacebar), and [CCSwitcher](https://github.com/XueshiQiao/CCSwitcher/).

## Features

- **Profile Management** — Create, switch, and delete isolated Claude Code configuration profiles. Each profile gets its own `CLAUDE_CONFIG_DIR` with separate settings, credentials, and MCP servers.
- **Usage Dashboard** — Real-time monitoring of 5-hour session and weekly rate limits, with progress bars and reset countdowns.
- **Cost Tracking** — Estimated API-equivalent costs parsed from local JSONL session logs, with per-model breakdowns.
- **Activity Stats** — Messages, tool calls, and session counts at a glance with a 7-day activity chart.
- **Menu Bar Native** — Lives in your macOS menu bar. Click the tray icon to toggle the panel. Right-click for quick actions.
- **Dark Mode** — Follows your system appearance automatically.
- **Auto-Refresh** — Configurable refresh interval (1–30 minutes).
- **Settings Window** — Toggle which modules to display, set refresh intervals, configure launch-at-login.

## Install

Download the latest `.dmg` from [Releases](https://github.com/jdanjohnson/my-clawds/releases).

Or build from source:

```sh
npm install
npm run build
```

The built app will be in `release/`.

## Development

```sh
npm install
npm run dev
```

## How It Works

### Profiles

Profile data is stored at `~/.local/share/claude-profiles/` (macOS/Linux). Each subdirectory is a complete Claude Code config directory. A `.default` file stores the default profile name.

When you switch profiles, CC Manager sets `CLAUDE_CONFIG_DIR` so Claude Code reads from the selected profile's directory.

### Usage Tracking

CC Manager reads local files that the Claude CLI maintains:
- `usage-cache.json` — Rate limit utilization and reset times
- `stats-cache.json` — Message counts, session counts, daily activity
- `projects/` — JSONL session files for cost estimation

No network requests are made to Claude's servers — all data is read locally.

## Tech Stack

- **Electron** — Cross-platform desktop app runtime
- **React 18** — UI components
- **TypeScript** — Type-safe code
- **Vite** — Fast builds and HMR
- **Tailwind CSS** — Utility-first styling
- **electron-store** — Persistent settings

## License

MIT
