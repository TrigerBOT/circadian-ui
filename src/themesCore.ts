export type UiThemeKind = 'vs' | 'vs-dark' | 'hc-black' | 'hc-light';

export interface ColorThemeInfo {
  id: string;
  label: string;
  uiTheme: UiThemeKind;
  extensionId: string;
}

export interface ExtensionThemeContribution {
  label: string;
  uiTheme?: string;
  id?: string;
}

export interface ExtensionPackageLike {
  name?: string;
  publisher?: string;
  contributes?: {
    themes?: ExtensionThemeContribution[];
  };
}

export interface ExtensionLike {
  id: string;
  packageJSON: ExtensionPackageLike;
}

export const DAY_PRESETS = [
  'Default Light Modern',
  'Light+ (default light)',
  'Quiet Light',
  'Solarized Light',
] as const;

export const NIGHT_PRESETS = [
  'Default Dark Modern',
  'Dark+ (default dark)',
  'Monokai',
  'Solarized Dark',
] as const;

export function buildThemeId(extensionId: string, label: string): string {
  return `${extensionId}:${label}`;
}

/** Collect color themes from extension manifests (pure, testable). */
export function collectThemesFromExtensions(
  extensions: ExtensionLike[]
): ColorThemeInfo[] {
  const byLabel = new Map<string, ColorThemeInfo[]>();

  for (const ext of extensions) {
    const themes = ext.packageJSON.contributes?.themes;
    if (!themes?.length) {
      continue;
    }

    for (const t of themes) {
      if (!t.label) {
        continue;
      }
      const uiTheme = (t.uiTheme ?? 'vs-dark') as UiThemeKind;
      const info: ColorThemeInfo = {
        id: buildThemeId(ext.id, t.label),
        label: t.label,
        uiTheme,
        extensionId: ext.id,
      };
      const list = byLabel.get(t.label) ?? [];
      list.push(info);
      byLabel.set(t.label, list);
    }
  }

  const result: ColorThemeInfo[] = [];
  for (const [, items] of byLabel) {
    if (items.length === 1) {
      result.push(items[0]);
    } else {
      for (const item of items) {
        const pub = item.extensionId.split('.')[0] ?? item.extensionId;
        result.push({
          ...item,
          label: `${item.label} (${pub})`,
        });
      }
    }
  }

  return result.sort((a, b) => a.label.localeCompare(b.label));
}

export function filterAvailablePresets(
  presets: readonly string[],
  installed: ColorThemeInfo[]
): ColorThemeInfo[] {
  const labels = new Set(installed.map((t) => t.label));
  const originalLabels = new Map<string, string>();
  for (const t of installed) {
    const base = t.label.replace(/ \([^)]+\)$/, '');
    originalLabels.set(base, t.label);
  }

  const out: ColorThemeInfo[] = [];
  for (const preset of presets) {
    if (labels.has(preset)) {
      const found = installed.find((t) => t.label === preset);
      if (found) {
        out.push(found);
      }
    } else if (originalLabels.has(preset)) {
      const found = installed.find((t) => t.label === originalLabels.get(preset));
      if (found) {
        out.push({ ...found, label: preset });
      }
    }
  }
  return out;
}

export function findThemeByLabel(
  installed: ColorThemeInfo[],
  label: string
): ColorThemeInfo | undefined {
  const exact = installed.find((t) => t.label === label);
  if (exact) {
    return exact;
  }
  return installed.find((t) => t.label.replace(/ \([^)]+\)$/, '') === label);
}

export function sortThemesForSlot(
  themes: ColorThemeInfo[],
  preferDark: boolean
): ColorThemeInfo[] {
  return [...themes].sort((a, b) => {
    const aDark = a.uiTheme === 'vs-dark' || a.uiTheme === 'hc-black';
    const bDark = b.uiTheme === 'vs-dark' || b.uiTheme === 'hc-black';
    if (preferDark && aDark !== bDark) {
      return aDark ? -1 : 1;
    }
    if (!preferDark && aDark !== bDark) {
      return aDark ? 1 : -1;
    }
    return a.label.localeCompare(b.label);
  });
}
