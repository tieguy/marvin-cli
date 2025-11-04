# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

marvin-cli is a command-line interface for the Amazing Marvin task management app. It supports two operational modes:

1. **Desktop API mode**: Communicates with the local API server running in the Amazing Marvin desktop app (default port 12082)
2. **Public API mode**: Communicates with Marvin's cloud API (serv.amazingmarvin.com:443)

By default, the tool attempts desktop first and falls back to public API. Users can force one or the other with `--desktop` or `--public` flags.

## Build System

This is a Deno-based TypeScript project. All dependencies are imported via URLs in `src/deps.ts`.

**Build commands:**
- `./build` - Build for current platform (outputs `marvin-cli` in repo root)
- `./build-all` - Cross-compile for all platforms (Linux, macOS x64, macOS ARM, Windows)
- `BUILD.bat` - Windows build script

The build uses `deno compile` with these required permissions:
- `--allow-env` - Read environment variables for config paths
- `--allow-net` - Make HTTP requests to Marvin APIs
- `--allow-read` - Read config files and user-specified input files
- `--allow-write` - Write to config file
- `--location 'https://cli.amazingmarvin.com'` - Set origin for web APIs

## Architecture

### Command Dispatch Pattern

The entry point (`src/index.ts`) uses a command registry pattern:

```typescript
const commands: Record<string, (params: Params, options: Options) => Promise<void>> = {
  add, api, backup, config, due, get, help, list, ping,
  profile, quickAdd, restore, today, tracking
};
```

Each command is implemented as a separate module in `src/commands/`. Commands receive:
- `params`: Positional arguments after the command name
- `options`: Parsed flags/options from command line

### API Communication Flow

The `src/apiCall.ts` module handles all API communication with this logic:

1. Check if endpoint needs full access token (currently only `/api/doc*`)
2. If `target !== "public"`, try desktop API first
3. If desktop fails or `target === "public"`, fallback to public API
4. Return first successful response or reject with error

This allows seamless fallback between desktop and cloud modes.

### Configuration System

Configuration uses a two-layer system:

1. **Persistent storage** (`src/localStorage.ts`): Platform-specific config file
   - Linux: `~/.config/marvin-cli.json` (or `$XDG_CONFIG_HOME/marvin-cli.json`)
   - macOS: `~/Library/Preferences/marvin-cli.json`
   - Windows: `%FOLDERID_RoamingAppData%/marvin-cli.json`

2. **Runtime options** (`src/options.ts`): Config file values overridden by CLI flags
   - `setOptions(cmdOpt)` merges saved config with command-line options
   - `getOptions()` returns the resolved configuration

### Desktop-Only Commands

Commands like `quickAdd`, `list`, `backup`, and `restore` only work with the desktop API. The main index enforces this by checking the command against the `desktopOnly` array and setting `opt.target = "desktop"` if needed.

## Adding New Commands

To add a new command:

1. Create `src/commands/yourcommand.ts` with this signature:
   ```typescript
   export default async function yourcommand(params: Params, options: Options) {
     // Implementation
   }
   ```

2. Import and register in `src/index.ts`:
   ```typescript
   import yourcommand from "./commands/yourcommand.ts";
   const commands = { ..., yourcommand };
   ```

3. If desktop-only, add to the `desktopOnly` array in `src/index.ts`

4. Update help text in the `printHelp()` function

## Testing

There is currently no automated test suite. Manual testing is done by:

1. Building with `./build`
2. Running commands against test data
3. Verifying with both `--desktop` and `--public` modes

## Version Management

Version is hardcoded in `src/index.ts` as `const VERSION = "0.5.1"`. Update this constant when releasing new versions. Use the `./tag` script for git tagging.
