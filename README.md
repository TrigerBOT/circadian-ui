# Circadian UI

**Circadian UI** automatically switches your VS Code color theme on a circadian schedule — like macOS dynamic appearance, but for your editor.

- **Solar mode** — switch at local sunrise and sunset (uses your latitude/longitude).
- **Fixed mode** — switch at two times you choose (e.g. 07:00 / 19:00).
- **Theme picker** — quick built-in presets plus every theme from installed extensions.

## Quick start

1. Install **Circadian UI** from the Marketplace.
2. Open Command Palette → **Circadian UI: Select Day and Night Themes…**
3. For solar mode: set coordinates in Settings, or run **Circadian UI: Detect Location by IP**.
4. Themes switch automatically. Click the status bar item to toggle auto mode.

## Commands

| Command | Description |
|---------|-------------|
| Circadian UI: Toggle Auto Theme | Enable/disable scheduling |
| Circadian UI: Apply Theme for Current Time | Apply day or night theme now |
| Circadian UI: Select Day Theme… | Pick day theme (presets + installed) |
| Circadian UI: Select Night Theme… | Pick night theme |
| Circadian UI: Select Day and Night Themes… | Setup wizard |
| Circadian UI: Detect Location by IP | Set latitude/longitude (tries several free geo APIs) |
| Circadian UI: Resume Auto Theme | Resume after manual theme change |
| Circadian UI: Open Settings | Open extension settings |

## Settings (`circadianUi.*`)

| Setting | Default | Description |
|---------|---------|-------------|
| `enabled` | `true` | Auto-switch on/off |
| `scheduleMode` | `solar` | `solar` or `fixed` |
| `dayTheme` | Default Light Modern | Day color theme |
| `nightTheme` | Default Dark Modern | Night color theme |
| `latitude` / `longitude` | Moscow (55.76, 37.62) | For solar mode |
| `solarOffsetMinutes` | `0` | Shift transitions ± minutes |
| `dayStart` / `nightStart` | `07:00` / `19:00` | Fixed mode (HH:mm) |
| `respectManualTheme` | `true` | Pause when you pick a theme manually |

## Privacy

**Detect Location by IP** runs only when you use the command. It tries [ipwho.is](https://ipwho.is), [geojs.io](https://www.geojs.io/), [ip-api.com](https://ip-api.com/), then [ipapi.co](https://ipapi.co) as fallback. No location data is sent otherwise.

## Tips

- Disable `workbench.autoDetectColorScheme` if you use OS light/dark sync — it can conflict with Circadian UI.
- Works in **VS Code** and **Cursor** (VS Code–compatible).

## Development

```bash
npm install
npm run compile
# Press F5 to launch Extension Development Host
npm run test:unit
npm run test:integration
npm run package
```

## Author

[Kирилл (TrigerBOT)](https://github.com/TrigerBOT)

## License

MIT
