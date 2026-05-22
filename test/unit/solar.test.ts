import { describe, it, expect } from 'vitest';
import {
  getSolarTimesForDate,
  isSolarDaytime,
  getThemeForSolarNow,
  getNextSolarTransition,
} from '../../src/solar';
import { DEFAULT_CONFIG } from '../../src/config';

// Moscow coordinates
const LAT = 55.7558;
const LON = 37.6173;

describe('solar', () => {
  const cfg = {
    ...DEFAULT_CONFIG,
    latitude: LAT,
    longitude: LON,
    solarOffsetMinutes: 0,
    dayTheme: 'Day',
    nightTheme: 'Night',
  };

  it('returns valid sunrise and sunset', () => {
    const date = new Date(2025, 5, 21, 12, 0, 0); // summer solstice-ish
    const times = getSolarTimesForDate(date, LAT, LON, 0);
    expect(times).not.toBeNull();
    expect(times!.sunrise.getTime()).toBeLessThan(times!.sunset.getTime());
  });

  it('detects daytime at noon in summer', () => {
    const noon = new Date(2025, 5, 21, 12, 0, 0);
    expect(isSolarDaytime(noon, LAT, LON, 0)).toBe(true);
    expect(getThemeForSolarNow(noon, cfg)).toBe('Day');
  });

  it('detects nighttime before sunrise and after sunset', () => {
    const anchor = new Date(2025, 5, 21, 12, 0, 0);
    const times = getSolarTimesForDate(anchor, LAT, LON, 0);
    expect(times).not.toBeNull();

    const beforeSunrise = new Date(times!.sunrise.getTime() - 60_000);
    expect(isSolarDaytime(beforeSunrise, LAT, LON, 0)).toBe(false);
    expect(getThemeForSolarNow(beforeSunrise, cfg)).toBe('Night');

    const afterSunset = new Date(times!.sunset.getTime() + 60_000);
    expect(isSolarDaytime(afterSunset, LAT, LON, 0)).toBe(false);
    expect(getThemeForSolarNow(afterSunset, cfg)).toBe('Night');
  });

  it('applies solar offset', () => {
    const times = getSolarTimesForDate(new Date(2025, 5, 21), LAT, LON, 30);
    const base = getSolarTimesForDate(new Date(2025, 5, 21), LAT, LON, 0);
    expect(times!.sunrise.getTime() - base!.sunrise.getTime()).toBe(30 * 60_000);
  });

  it('returns next transition to night during day', () => {
    const noon = new Date(2025, 5, 21, 12, 0, 0);
    const next = getNextSolarTransition(noon, cfg);
    expect(next).not.toBeNull();
    expect(next!.phase).toBe('night');
    expect(next!.theme).toBe('Night');
    expect(next!.at.getTime()).toBeGreaterThan(noon.getTime());
  });

  it('rejects invalid coordinates', () => {
    expect(getSolarTimesForDate(new Date(), 999, 0, 0)).toBeNull();
  });
});
