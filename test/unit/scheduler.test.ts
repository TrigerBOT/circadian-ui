import { describe, it, expect } from 'vitest';
import { getThemeForNow, getNextTransition } from '../../src/scheduler';
import { DEFAULT_CONFIG } from '../../src/config';

describe('scheduler', () => {
  it('delegates to fixed mode', () => {
    const cfg = {
      ...DEFAULT_CONFIG,
      scheduleMode: 'fixed' as const,
      dayStart: '06:00',
      nightStart: '18:00',
    };
    const morning = new Date(2025, 0, 10, 10, 0, 0);
    expect(getThemeForNow(morning, cfg)).toBe(cfg.dayTheme);
    const next = getNextTransition(morning, cfg);
    expect(next?.theme).toBe(cfg.nightTheme);
  });

  it('delegates to solar mode', () => {
    const cfg = { ...DEFAULT_CONFIG, scheduleMode: 'solar' as const };
    const noon = new Date(2025, 5, 21, 12, 0, 0);
    expect(getThemeForNow(noon, cfg)).toBe(cfg.dayTheme);
  });
});
