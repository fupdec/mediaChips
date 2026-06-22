# Changelog

All notable changes to MediaChips are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.13.2] - 2026-06-22

### Added

- **CHANGELOG.md** — release notes for v0.13.1 and later versions

### Fixed

- Release workflow version validation aligned with package version

## [0.13.1] - 2026-06-22

### Added

- **In-app auto-update** for Windows (NSIS), macOS (ZIP), and Linux (AppImage) via GitHub Releases
- **Settings → About** — manual update check and “check for updates at startup” option
- **GitHub Actions** — CI workflow and multi-platform release pipeline (Windows, macOS, Linux)
- **On-demand CLIP model** — video object recognition model (~150 MB) downloads from the import dialog when needed, not bundled in the installer
- **Images media type** — full support across backend and UI
- **Server-side media pagination** and virtual grid utilities for smoother infinite-scroll media lists
- **In-app version history** entry for the v0.13.0 Vue 3 rewrite
- **About dialog** localization and auto-parsed dependency list

### Changed

- **Smaller installers** — CLIP model removed from build artifacts; path parser model (MiniLM, ~23 MB) remains bundled
- **macOS releases** — separate `arm64` and `x64` DMG/ZIP builds instead of a universal binary
- **Windows Electron UI** — unified header bar styling; SystemBar shown only on Windows Electron
- **AppBar** — use default elevation shadow on Windows Electron
- Tracked `package-lock.json` for reproducible CI builds

### Fixed

- Blank white Electron window on Windows 11
- Windows Electron header chrome and SystemBar menus
- About dialog on macOS
- Duplicate import that broke the production build
- List page regressions after pagination changes
- `electron-builder` config (invalid `zip` section for v26)
- Linux CI build — use PNG icon instead of ICNS
- macOS CI build — avoid universal binary failure with native `sharp` modules
- Release publish workflow — single publish job, installer-only uploads, retries, git checkout for `gh release create`

### Upgrade notes

- **From v0.13.0:** install v0.13.1 manually once; in-app auto-update works starting from this version
- **Portable Windows** builds do not support in-app auto-update
- **macOS** builds are unsigned; see [INSTALLATION.md](./INSTALLATION.md) for Gatekeeper steps

## [0.13.0] - 2026-06-19

Major release: full Vue 3 rewrite on Vite, Vuetify 3, Pinia, Electron 39, and Express 5.

See [release notes](https://github.com/fupdec/MediaChips/releases/tag/v0.13.0) and in-app version history for details.
