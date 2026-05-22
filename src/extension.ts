import * as vscode from 'vscode';
import { loadConfig } from './configLoader';
import type { CircadianConfig } from './config';
import { detectLocationByIp } from './geolocation';
import { getNextTransition, getThemeForNow } from './scheduler';
import { StatusBarController } from './statusBar';
import {
  selectDayTheme,
  selectNightTheme,
  selectThemePair,
  validateConfiguredThemes,
} from './themes';

const STATE_KEY_LAST_APPLIED = 'circadianUi.lastAppliedTheme';
const STATE_KEY_PAUSED = 'circadianUi.paused';

let schedulerTimer: ReturnType<typeof setTimeout> | undefined;
let rescheduleDebounceTimer: ReturnType<typeof setTimeout> | undefined;
let settingsCooldownTimer: ReturnType<typeof setTimeout> | undefined;
let statusBar: StatusBarController | undefined;
let paused = false;
let isApplyingTheme = false;
let configHandlersPaused = false;

const RESCHEDULE_DEBOUNCE_MS = 800;
const SETTINGS_COOLDOWN_MS = 8000;

function getContext(): vscode.ExtensionContext {
  return (globalThis as { circadianContext?: vscode.ExtensionContext }).circadianContext!;
}

async function applyTheme(themeName: string): Promise<void> {
  const current = vscode.workspace.getConfiguration('workbench').get<string>('colorTheme');
  if (current === themeName) {
    await getContext().globalState.update(STATE_KEY_LAST_APPLIED, themeName);
    return;
  }
  isApplyingTheme = true;
  try {
    await vscode.workspace
      .getConfiguration('workbench')
      .update('colorTheme', themeName, vscode.ConfigurationTarget.Global);
    await getContext().globalState.update(STATE_KEY_LAST_APPLIED, themeName);
  } finally {
    isApplyingTheme = false;
  }
}

function clearScheduler(): void {
  if (schedulerTimer !== undefined) {
    clearTimeout(schedulerTimer);
    schedulerTimer = undefined;
  }
}

function refreshStatusBar(config: CircadianConfig): void {
  const next = config.enabled ? getNextTransition(new Date(), config) : null;
  statusBar?.update(config, next, paused);
}

async function applyNow(config: CircadianConfig): Promise<boolean> {
  const theme = getThemeForNow(new Date(), config);
  if (!theme) {
    void vscode.window.showWarningMessage(
      'Circadian UI: Could not determine theme for current time. Check schedule settings.'
    );
    return false;
  }
  await applyTheme(theme);
  return true;
}

function scheduleNext(config: CircadianConfig): void {
  clearScheduler();
  if (!config.enabled || paused) {
    refreshStatusBar(config);
    return;
  }

  const now = new Date();
  const next = getNextTransition(now, config);
  refreshStatusBar(config);

  if (!next) {
    return;
  }

  const delay = Math.max(0, next.at.getTime() - now.getTime());
  schedulerTimer = setTimeout(async () => {
    if (!paused) {
      await applyTheme(next.theme);
    }
    scheduleNext(loadConfig());
  }, delay);
}

/** Lightweight: update status bar + timer only (no theme switch). Safe while editing settings. */
function rescheduleOnly(): void {
  const config = loadConfig();
  refreshStatusBar(config);

  if (!config.enabled || paused) {
    clearScheduler();
    return;
  }

  scheduleNext(config);
}

function requestRescheduleOnly(): void {
  if (configHandlersPaused) {
    return;
  }
  if (rescheduleDebounceTimer !== undefined) {
    clearTimeout(rescheduleDebounceTimer);
  }
  rescheduleDebounceTimer = setTimeout(() => {
    rescheduleDebounceTimer = undefined;
    rescheduleOnly();
  }, RESCHEDULE_DEBOUNCE_MS);
}

/** Full sync: apply correct theme now + schedule next switch. */
async function syncSchedule(): Promise<void> {
  const config = loadConfig();
  refreshStatusBar(config);

  if (!config.enabled || paused) {
    clearScheduler();
    return;
  }

  const theme = getThemeForNow(new Date(), config);
  const current = vscode.workspace.getConfiguration('workbench').get<string>('colorTheme');
  if (theme && theme !== current) {
    await applyTheme(theme);
  }

  scheduleNext(config);
}

function pauseConfigHandlersForSettingsUi(): void {
  configHandlersPaused = true;
  if (settingsCooldownTimer !== undefined) {
    clearTimeout(settingsCooldownTimer);
  }
  settingsCooldownTimer = setTimeout(() => {
    settingsCooldownTimer = undefined;
    configHandlersPaused = false;
    rescheduleOnly();
  }, SETTINGS_COOLDOWN_MS);
}

function checkAutoDetectConflict(): void {
  const auto = vscode.workspace
    .getConfiguration('workbench')
    .get<boolean>('autoDetectColorScheme');
  if (auto) {
    void vscode.window.showWarningMessage(
      'Circadian UI: "workbench.autoDetectColorScheme" is enabled and may conflict. Consider disabling it.',
      'Open Settings'
    ).then((choice) => {
      if (choice === 'Open Settings') {
        pauseConfigHandlersForSettingsUi();
        void vscode.commands.executeCommand(
          'workbench.action.openSettings',
          'workbench.autoDetectColorScheme'
        );
      }
    });
  }
}

async function validateThemesOnStart(): Promise<void> {
  const missing = validateConfiguredThemes();
  if (missing.length === 0) {
    return;
  }
  const choice = await vscode.window.showWarningMessage(
    `Circadian UI: Theme not found (${missing.join(', ')}). Select themes again?`,
    'Select Themes',
    'Dismiss'
  );
  if (choice === 'Select Themes') {
    await selectThemePair();
  }
}

function setupManualThemeListener(): void {
  let manualDebounce: ReturnType<typeof setTimeout> | undefined;

  const sub = vscode.workspace.onDidChangeConfiguration((e) => {
    if (!e.affectsConfiguration('workbench.colorTheme') || isApplyingTheme) {
      return;
    }

    if (manualDebounce !== undefined) {
      clearTimeout(manualDebounce);
    }
    manualDebounce = setTimeout(() => {
      manualDebounce = undefined;
      void (async () => {
        const cfg = loadConfig();
        if (!cfg.respectManualTheme || !cfg.enabled) {
          return;
        }
        const lastApplied = getContext().globalState.get<string>(STATE_KEY_LAST_APPLIED);
        const current = vscode.workspace.getConfiguration('workbench').get<string>('colorTheme');
        if (
          lastApplied &&
          current &&
          current !== lastApplied &&
          current !== cfg.dayTheme &&
          current !== cfg.nightTheme
        ) {
          paused = true;
          await getContext().globalState.update(STATE_KEY_PAUSED, true);
          clearScheduler();
          refreshStatusBar(cfg);
          void vscode.window.showInformationMessage(
            'Circadian UI: Auto theme paused after manual theme change. Run "Resume Auto Theme" to continue.'
          );
        }
      })();
    }, 500);
  });
  getContext().subscriptions.push(sub);
}

export function activate(context: vscode.ExtensionContext): void {
  (globalThis as { circadianContext?: vscode.ExtensionContext }).circadianContext = context;

  paused = context.globalState.get<boolean>(STATE_KEY_PAUSED) ?? false;

  statusBar = new StatusBarController(
    () => void vscode.commands.executeCommand('circadianUi.toggle'),
    () => void selectDayTheme(),
    () => void selectNightTheme()
  );
  context.subscriptions.push(statusBar);

  setupManualThemeListener();
  checkAutoDetectConflict();

  setTimeout(() => {
    void validateThemesOnStart().then(() => syncSchedule());
  }, 2000);

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('circadianUi')) {
        requestRescheduleOnly();
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('circadianUi.toggle', async () => {
      const cfg = vscode.workspace.getConfiguration('circadianUi');
      const current = cfg.get<boolean>('enabled') ?? true;
      const target = vscode.workspace.workspaceFolders?.length
        ? vscode.ConfigurationTarget.Workspace
        : vscode.ConfigurationTarget.Global;
      await cfg.update('enabled', !current, target);
      if (!current) {
        await syncSchedule();
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('circadianUi.applyNow', async () => {
      await applyNow(loadConfig());
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('circadianUi.selectDayTheme', () => selectDayTheme())
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('circadianUi.selectNightTheme', () => selectNightTheme())
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('circadianUi.selectThemePair', () => selectThemePair())
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('circadianUi.detectLocation', () => detectLocationByIp())
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('circadianUi.openSettings', () => {
      pauseConfigHandlersForSettingsUi();
      void vscode.commands.executeCommand('workbench.action.openSettings', 'circadianUi');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('circadianUi.resume', async () => {
      paused = false;
      await context.globalState.update(STATE_KEY_PAUSED, false);
      await syncSchedule();
      void vscode.window.showInformationMessage('Circadian UI: Auto theme resumed.');
    })
  );
}

export function deactivate(): void {
  clearScheduler();
  if (rescheduleDebounceTimer !== undefined) {
    clearTimeout(rescheduleDebounceTimer);
    rescheduleDebounceTimer = undefined;
  }
  if (settingsCooldownTimer !== undefined) {
    clearTimeout(settingsCooldownTimer);
    settingsCooldownTimer = undefined;
  }
  statusBar?.dispose();
  statusBar = undefined;
}

export { getThemeForNow, getNextTransition } from './scheduler';
