import type { CircadianConfig } from './config';

export interface TimeOfDay {
  hours: number;
  minutes: number;
}

export interface Transition {
  at: Date;
  theme: string;
  phase: 'day' | 'night';
}

/** Parse "HH:mm" into hours and minutes. Throws on invalid input. */
export function parseTime(value: string): TimeOfDay {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) {
    throw new Error(`Invalid time "${value}", expected HH:mm`);
  }
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  if (hours > 23 || minutes > 59) {
    throw new Error(`Invalid time "${value}"`);
  }
  return { hours, minutes };
}

function atTime(base: Date, time: TimeOfDay): Date {
  const d = new Date(base);
  d.setHours(time.hours, time.minutes, 0, 0);
  return d;
}

function minutesSinceMidnight(t: TimeOfDay): number {
  return t.hours * 60 + t.minutes;
}

/** True when local time is in the day window [dayStart, nightStart). */
export function isFixedDaytime(now: Date, dayStart: string, nightStart: string): boolean {
  const day = parseTime(dayStart);
  const night = parseTime(nightStart);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const dayMin = minutesSinceMidnight(day);
  const nightMin = minutesSinceMidnight(night);

  if (dayMin < nightMin) {
    return nowMin >= dayMin && nowMin < nightMin;
  }
  // day window wraps midnight (e.g. day 22:00 – night 06:00)
  return nowMin >= dayMin || nowMin < nightMin;
}

export function getThemeForFixedNow(
  now: Date,
  config: Pick<CircadianConfig, 'dayTheme' | 'nightTheme' | 'dayStart' | 'nightStart'>
): string {
  return isFixedDaytime(now, config.dayStart, config.nightStart)
    ? config.dayTheme
    : config.nightTheme;
}

export function getNextFixedTransition(
  now: Date,
  config: Pick<CircadianConfig, 'dayTheme' | 'nightTheme' | 'dayStart' | 'nightStart'>
): Transition {
  const day = parseTime(config.dayStart);
  const night = parseTime(config.nightStart);
  const isDay = isFixedDaytime(now, config.dayStart, config.nightStart);

  const targetTime = isDay ? night : day;
  let at = atTime(now, targetTime);

  if (at.getTime() <= now.getTime()) {
    at = new Date(at);
    at.setDate(at.getDate() + 1);
  }

  return {
    at,
    theme: isDay ? config.nightTheme : config.dayTheme,
    phase: isDay ? 'night' : 'day',
  };
}
