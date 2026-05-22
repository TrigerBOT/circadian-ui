const SunCalc = require("suncalc") as typeof import("suncalc");

import type { CircadianConfig } from "./config";
import { isValidCoordinates } from "./config";
import type { Transition } from "./fixed";

export interface SolarTimes {
  sunrise: Date;
  sunset: Date;
}

function isValidDate(d: Date): boolean {
  return d instanceof Date && !Number.isNaN(d.getTime());
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

/** Solar times for a calendar day at the given coordinates (local timezone). */
export function getSolarTimesForDate(
  date: Date,
  latitude: number,
  longitude: number,
  offsetMinutes: number,
): SolarTimes | null {
  if (!isValidCoordinates(latitude, longitude)) {
    return null;
  }

  const times = SunCalc.getTimes(date, latitude, longitude);
  if (!isValidDate(times.sunrise) || !isValidDate(times.sunset)) {
    return null;
  }

  return {
    sunrise: addMinutes(times.sunrise, offsetMinutes),
    sunset: addMinutes(times.sunset, offsetMinutes),
  };
}

export function isSolarDaytime(
  now: Date,
  latitude: number,
  longitude: number,
  offsetMinutes: number,
): boolean | null {
  const today = getSolarTimesForDate(now, latitude, longitude, offsetMinutes);
  if (!today) {
    return null;
  }

  const { sunrise, sunset } = today;

  if (now < sunrise || now >= sunset) {
    return false;
  }

  return true;
}

export function getThemeForSolarNow(
  now: Date,
  config: Pick<
    CircadianConfig,
    "dayTheme" | "nightTheme" | "latitude" | "longitude" | "solarOffsetMinutes"
  >,
): string | null {
  const isDay = isSolarDaytime(
    now,
    config.latitude,
    config.longitude,
    config.solarOffsetMinutes,
  );
  if (isDay === null) {
    return null;
  }
  return isDay ? config.dayTheme : config.nightTheme;
}

export function getNextSolarTransition(
  now: Date,
  config: Pick<
    CircadianConfig,
    "dayTheme" | "nightTheme" | "latitude" | "longitude" | "solarOffsetMinutes"
  >,
): Transition | null {
  const isDay = isSolarDaytime(
    now,
    config.latitude,
    config.longitude,
    config.solarOffsetMinutes,
  );
  if (isDay === null) {
    return null;
  }

  const today = getSolarTimesForDate(
    now,
    config.latitude,
    config.longitude,
    config.solarOffsetMinutes,
  );
  if (!today) {
    return null;
  }

  let at: Date;
  let theme: string;
  let phase: "day" | "night";

  if (isDay) {
    at = today.sunset;
    theme = config.nightTheme;
    phase = "night";
    if (at.getTime() <= now.getTime()) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const next = getSolarTimesForDate(
        tomorrow,
        config.latitude,
        config.longitude,
        config.solarOffsetMinutes,
      );
      if (!next) {
        return null;
      }
      at = next.sunset;
    }
  } else {
    at = today.sunrise;
    theme = config.dayTheme;
    phase = "day";
    if (at.getTime() <= now.getTime()) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const next = getSolarTimesForDate(
        tomorrow,
        config.latitude,
        config.longitude,
        config.solarOffsetMinutes,
      );
      if (!next) {
        return null;
      }
      at = next.sunrise;
    }
  }

  if (at.getTime() <= now.getTime()) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextDay = getSolarTimesForDate(
      tomorrow,
      config.latitude,
      config.longitude,
      config.solarOffsetMinutes,
    );
    if (!nextDay) {
      return null;
    }
    if (isDay) {
      at = nextDay.sunset;
    } else {
      at = nextDay.sunrise;
    }
  }

  return { at, theme, phase };
}
