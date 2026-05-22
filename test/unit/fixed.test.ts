import { describe, it, expect } from 'vitest';
import {
  parseTime,
  isFixedDaytime,
  getThemeForFixedNow,
  getNextFixedTransition,
} from '../../src/fixed';
import { DEFAULT_CONFIG } from '../../src/config';

describe('parseTime', () => {
  it('parses valid HH:mm', () => {
    expect(parseTime('07:30')).toEqual({ hours: 7, minutes: 30 });
    expect(parseTime('19:00')).toEqual({ hours: 19, minutes: 0 });
  });

  it('throws on invalid input', () => {
    expect(() => parseTime('25:00')).toThrow();
    expect(() => parseTime('ab:cd')).toThrow();
  });
});

describe('fixed schedule', () => {
  const cfg = {
    ...DEFAULT_CONFIG,
    scheduleMode: 'fixed' as const,
    dayStart: '07:00',
    nightStart: '19:00',
    dayTheme: 'Day Theme',
    nightTheme: 'Night Theme',
  };

  it('detects daytime between dayStart and nightStart', () => {
    const noon = new Date(2025, 0, 15, 12, 0, 0);
    expect(isFixedDaytime(noon, cfg.dayStart, cfg.nightStart)).toBe(true);
    expect(getThemeForFixedNow(noon, cfg)).toBe('Day Theme');
  });

  it('detects nighttime after nightStart', () => {
    const evening = new Date(2025, 0, 15, 21, 0, 0);
    expect(isFixedDaytime(evening, cfg.dayStart, cfg.nightStart)).toBe(false);
    expect(getThemeForFixedNow(evening, cfg)).toBe('Night Theme');
  });

  it('next transition from daytime is nightStart', () => {
    const morning = new Date(2025, 0, 15, 10, 0, 0);
    const next = getNextFixedTransition(morning, cfg);
    expect(next.phase).toBe('night');
    expect(next.theme).toBe('Night Theme');
    expect(next.at.getHours()).toBe(19);
    expect(next.at.getMinutes()).toBe(0);
  });

  it('next transition from nighttime is dayStart tomorrow if past midnight', () => {
    const late = new Date(2025, 0, 15, 23, 0, 0);
    const next = getNextFixedTransition(late, cfg);
    expect(next.phase).toBe('day');
    expect(next.theme).toBe('Day Theme');
    expect(next.at.getDate()).toBe(16);
    expect(next.at.getHours()).toBe(7);
  });
});
