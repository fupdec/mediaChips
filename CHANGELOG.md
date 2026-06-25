# Changelog

All notable changes to MediaChips are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.14.0-beta] - 2026-06-25

### Added

- **Redesigned home page** with configurable widgets (stats, extended stats, continue watching, favorites, top views, markers, health alerts, top tags, quick actions)
- **Audio media type** — full support across backend and UI: metadata, filters, playback, and home widgets
- **Text media type** — previews, editing, and “open file” actions
- **SFW mode** — optional blur for images in the main content area
- **Persistent interface zoom** — keyboard shortcuts, settings UI, and sync with Electron on desktop
- **Markers page** — filtering, sorting, infinite scroll, and thumbnail generation
- **Settings → Video** tab for video-related options (moved out of scattered sections)
- **Field pinning settings** — drag-reorder and consistent card display order for pinned metadata
- **Database maintenance tools** — faster media library operations and batch video image generation in database settings
- **Meta sort mode** with view counts in tag-related settings
- **Mute toggle** on fullscreen video hover preview
- **Feedback form** — includes OS info and system details in the footer
- **Lowercase API path normalization** on the server (`/api/media` → `/api/Media`, etc.) for consistent routing in production builds
- **In-app documentation** updates for the Video settings section

### Changed

- **Settings** reorganized into focused sidebar tabs: General, Appearance, Library, Files, Video, About
- **Library settings** streamlined — media types, metadata, scraper, and quick tags grouped under one tab
- **Items pagination** refactored with improved infinite-scroll loading and virtual grid behavior
- **Smart playlists** and **saved filters** UI polished; playlist page loads faster
- **Settings lists** show database sizes; tools layout uses inline hints and section cards
- **Filters drawer** — higher background opacity for readability
- **Settings page layout** — unified width via shared `v-container`, nested sections scroll correctly
- **Item context menu** labels localized across all locales
- **Theme colors** apply immediately when changed in settings

### Fixed

- **Production builds (macOS DMG and installers)** — Media and Tag API routes failed to register because server code imported from excluded `src/`; tags and media lists appeared empty while other DB stats still worked
- API routing gaps (`bulk-meta` routes, dev config loading, installer excludes)
- **macOS auto-update** for unsigned builds — updater offers download instead of blocked in-place install
- **License activation** — stable hardware fingerprint; path handling and thumbnail crop regressions from v0.13
- **Tag page** tabs — lazy rendering, correct ordering, refresh after tag removal
- **Player** playback error layout when no playable file is found
- **Import** duplicate detection and skipped-file messaging
- **System player** launch on Windows 11 via `shell.openPath`
- **Country flags** for tag names that contain commas
- **Documentation tree** — highlight and expand the active article
- **Image viewer** loading and conflicting pinch-zoom gestures
- **List page** regressions after pagination changes
- **Settings page** flex layout so nested content scrolls on smaller windows

### Upgrade notes

- **From v0.13.1:** in-app auto-update should deliver this beta if you are already on v0.13.1; otherwise install manually once
- **From v0.13.0 or older:** install v0.13.1 or v0.14.0-beta manually first
- **Portable Windows** builds do not support in-app auto-update
- **macOS** builds are unsigned; see [INSTALLATION.md](./INSTALLATION.md) for Gatekeeper steps and manual DMG update flow
- This is a **beta** — report issues on GitHub before the stable v0.14.0 release

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
- **macOS auto-update** — unsigned builds cannot use in-place install; updater offers **Download DMG** instead of ShipIt install
- macOS DMG window layout for drag-to-Applications install

### Upgrade notes

- **From v0.13.0:** install v0.13.1 manually once; in-app auto-update works starting from this version (Windows/Linux fully; macOS checks for updates and opens DMG)
- **Portable Windows** builds do not support in-app auto-update
- **macOS** builds are unsigned; see [INSTALLATION.md](./INSTALLATION.md) for Gatekeeper and manual update steps

## [0.13.0] - 2026-06-19

Major release: full Vue 3 rewrite on Vite, Vuetify 3, Pinia, Electron 39, and Express 5.

See [release notes](https://github.com/fupdec/MediaChips/releases/tag/v0.13.0) and in-app version history for details.
