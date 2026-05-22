# Changelog

All notable changes to **Circadian UI** are documented in this file.

## [0.1.1] - 2025-05-17

### Fixed

- Settings no longer triggers theme switches on every keystroke (reschedule timer only).
- 8s cooldown while the settings panel is open; cached theme list scan.
- Removed focus-based resync that fired when opening Settings.

## [0.1.0] - 2025-05-17

### Fixed

- Settings UI no longer freezes: debounced config updates and guarded theme application.

### Added

- Solar schedule (sunrise/sunset via coordinates and suncalc).
- Fixed schedule (two daily times, local timezone).
- Day/night theme selection with built-in presets and all installed extension themes.
- Status bar indicator with next transition time.
- IP geolocation command with fallback providers (ipwho.is, geojs.io, ip-api.com, ipapi.co).
- Pause auto-switching when theme is changed manually (`respectManualTheme`).
- Unit and integration tests.
