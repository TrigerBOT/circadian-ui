export type ScheduleMode = 'solar' | 'fixed';

export interface CircadianConfig {
  enabled: boolean;
  scheduleMode: ScheduleMode;
  dayTheme: string;
  nightTheme: string;
  latitude: number;
  longitude: number;
  solarOffsetMinutes: number;
  dayStart: string;
  nightStart: string;
  respectManualTheme: boolean;
}

export const DEFAULT_CONFIG: CircadianConfig = {
  enabled: true,
  scheduleMode: 'solar',
  dayTheme: 'Default Light Modern',
  nightTheme: 'Default Dark Modern',
  latitude: 55.7558,
  longitude: 37.6173,
  solarOffsetMinutes: 0,
  dayStart: '07:00',
  nightStart: '19:00',
  respectManualTheme: true,
};

export function isValidCoordinates(lat: number, lon: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
}
