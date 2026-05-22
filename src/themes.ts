import * as vscode from 'vscode';
import {
  collectThemesFromExtensions,
  filterAvailablePresets,
  findThemeByLabel,
  sortThemesForSlot,
  DAY_PRESETS,
  NIGHT_PRESETS,
  type ColorThemeInfo,
  type ExtensionLike,
} from './themesCore';

export {
  collectThemesFromExtensions,
  filterAvailablePresets,
  findThemeByLabel,
  DAY_PRESETS,
  NIGHT_PRESETS,
  type ColorThemeInfo,
};

let themeListCache: ColorThemeInfo[] | null = null;

/** Cached scan of extension themes (full scan is expensive with many extensions). */
export function listInstalledColorThemes(forceRefresh = false): ColorThemeInfo[] {
  if (!forceRefresh && themeListCache) {
    return themeListCache;
  }
  const extensions: ExtensionLike[] = vscode.extensions.all.map((ext) => ({
    id: ext.id,
    packageJSON: ext.packageJSON as ExtensionLike['packageJSON'],
  }));
  themeListCache = collectThemesFromExtensions(extensions);
  return themeListCache;
}

export function invalidateThemeListCache(): void {
  themeListCache = null;
}

async function pickTheme(
  title: string,
  preferDark: boolean,
  currentValue?: string
): Promise<string | undefined> {
  const installed = listInstalledColorThemes();
  if (!installed.length) {
    void vscode.window.showErrorMessage('Circadian UI: No color themes found.');
    return undefined;
  }

  const presets = filterAvailablePresets(
    preferDark ? NIGHT_PRESETS : DAY_PRESETS,
    installed
  );
  const allSorted = sortThemesForSlot(installed, preferDark);

  const items: vscode.QuickPickItem[] = [];

  if (currentValue) {
    items.push({
      label: `$(check) Current: ${currentValue}`,
      description: 'Keep current',
      detail: currentValue,
    });
    items.push({ label: '', kind: vscode.QuickPickItemKind.Separator });
  }

  if (presets.length) {
    items.push({
      label: 'Recommended',
      kind: vscode.QuickPickItemKind.Separator,
    });
    for (const t of presets) {
      items.push({
        label: t.label,
        description: 'Built-in preset',
        detail: t.extensionId,
      });
    }
    items.push({ label: '', kind: vscode.QuickPickItemKind.Separator });
  }

  items.push({
    label: 'All installed themes',
    kind: vscode.QuickPickItemKind.Separator,
  });

  const presetLabels = new Set(presets.map((p) => p.label));
  for (const t of allSorted) {
    if (presetLabels.has(t.label)) {
      continue;
    }
    items.push({
      label: t.label,
      description: t.uiTheme,
      detail: t.extensionId,
    });
  }

  const picked = await vscode.window.showQuickPick(items, {
    title,
    placeHolder: 'Search themes…',
    matchOnDescription: true,
    matchOnDetail: true,
  });

  if (!picked || picked.kind === vscode.QuickPickItemKind.Separator) {
    return undefined;
  }
  if (picked.description === 'Keep current' && currentValue) {
    return currentValue;
  }
  return picked.label;
}

export async function selectDayTheme(): Promise<void> {
  const config = vscode.workspace.getConfiguration('circadianUi');
  const current = config.get<string>('dayTheme');
  const theme = await pickTheme('Circadian UI: Day theme', false, current);
  if (theme) {
    await config.update('dayTheme', theme, vscode.ConfigurationTarget.Global);
    void vscode.window.showInformationMessage(`Circadian UI: Day theme set to "${theme}"`);
  }
}

export async function selectNightTheme(): Promise<void> {
  const config = vscode.workspace.getConfiguration('circadianUi');
  const current = config.get<string>('nightTheme');
  const theme = await pickTheme('Circadian UI: Night theme', true, current);
  if (theme) {
    await config.update('nightTheme', theme, vscode.ConfigurationTarget.Global);
    void vscode.window.showInformationMessage(`Circadian UI: Night theme set to "${theme}"`);
  }
}

export async function selectThemePair(): Promise<void> {
  const day = await pickTheme('Circadian UI: Day theme (step 1/2)', false);
  if (!day) {
    return;
  }
  const night = await pickTheme('Circadian UI: Night theme (step 2/2)', true);
  if (!night) {
    return;
  }
  const config = vscode.workspace.getConfiguration('circadianUi');
  await config.update('dayTheme', day, vscode.ConfigurationTarget.Global);
  await config.update('nightTheme', night, vscode.ConfigurationTarget.Global);
  void vscode.window.showInformationMessage(
    `Circadian UI: Themes set — day "${day}", night "${night}"`
  );
}

export function validateConfiguredThemes(): string[] {
  const installed = listInstalledColorThemes();
  const config = vscode.workspace.getConfiguration('circadianUi');
  const day = config.get<string>('dayTheme') ?? '';
  const night = config.get<string>('nightTheme') ?? '';
  const missing: string[] = [];

  if (day && !findThemeByLabel(installed, day)) {
    missing.push(`day: "${day}"`);
  }
  if (night && !findThemeByLabel(installed, night)) {
    missing.push(`night: "${night}"`);
  }
  return missing;
}
