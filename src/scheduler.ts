import type { CircadianConfig } from './config';
import { getThemeForFixedNow, getNextFixedTransition, type Transition } from './fixed';
import { getThemeForSolarNow, getNextSolarTransition } from './solar';

export type { Transition };

export function getThemeForNow(now: Date, config: CircadianConfig): string | null {
  if (config.scheduleMode === 'fixed') {
    return getThemeForFixedNow(now, config);
  }
  return getThemeForSolarNow(now, config);
}

export function getNextTransition(now: Date, config: CircadianConfig): Transition | null {
  if (config.scheduleMode === 'fixed') {
    return getNextFixedTransition(now, config);
  }
  return getNextSolarTransition(now, config);
}

export function formatTransitionTime(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}
