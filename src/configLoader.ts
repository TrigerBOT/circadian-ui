import * as vscode from 'vscode';
import type { CircadianConfig, ScheduleMode } from './config';
import { DEFAULT_CONFIG } from './config';

export function loadConfig(): CircadianConfig {
  const cfg = vscode.workspace.getConfiguration('circadianUi');
  return {
    enabled: cfg.get<boolean>('enabled') ?? DEFAULT_CONFIG.enabled,
    scheduleMode: (cfg.get<ScheduleMode>('scheduleMode') ?? DEFAULT_CONFIG.scheduleMode),
    dayTheme: cfg.get<string>('dayTheme') ?? DEFAULT_CONFIG.dayTheme,
    nightTheme: cfg.get<string>('nightTheme') ?? DEFAULT_CONFIG.nightTheme,
    latitude: cfg.get<number>('latitude') ?? DEFAULT_CONFIG.latitude,
    longitude: cfg.get<number>('longitude') ?? DEFAULT_CONFIG.longitude,
    solarOffsetMinutes:
      cfg.get<number>('solarOffsetMinutes') ?? DEFAULT_CONFIG.solarOffsetMinutes,
    dayStart: cfg.get<string>('dayStart') ?? DEFAULT_CONFIG.dayStart,
    nightStart: cfg.get<string>('nightStart') ?? DEFAULT_CONFIG.nightStart,
    respectManualTheme:
      cfg.get<boolean>('respectManualTheme') ?? DEFAULT_CONFIG.respectManualTheme,
  };
}
