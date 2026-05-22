import { describe, it, expect } from 'vitest';
import {
  parseIpWhoIs,
  parseGeoJs,
  parseIpApiCom,
  parseIpApiCo,
} from '../../src/geolocationCore';

describe('geolocationCore parsers', () => {
  it('parses ipwho.is', () => {
    const r = parseIpWhoIs({
      success: true,
      latitude: 55.75,
      longitude: 37.62,
      city: 'Moscow',
      country: 'Russia',
    });
    expect(r?.lat).toBe(55.75);
    expect(r?.lon).toBe(37.62);
    expect(r?.city).toBe('Moscow');
  });

  it('parses geojs.io string coordinates', () => {
    const r = parseGeoJs({
      latitude: '40.7128',
      longitude: '-74.0060',
      city: 'New York',
      country: 'United States',
    });
    expect(r?.lat).toBeCloseTo(40.7128);
    expect(r?.lon).toBeCloseTo(-74.006);
  });

  it('parses ip-api.com', () => {
    const r = parseIpApiCom({
      status: 'success',
      lat: 48.85,
      lon: 2.35,
      city: 'Paris',
      country: 'France',
    });
    expect(r?.lat).toBe(48.85);
    expect(r?.country).toBe('France');
  });

  it('rejects ip-api.com fail', () => {
    expect(parseIpApiCom({ status: 'fail', message: 'quota' })).toBeNull();
  });

  it('parses ipapi.co', () => {
    const r = parseIpApiCo({
      latitude: 51.5,
      longitude: -0.12,
      city: 'London',
      country_name: 'United Kingdom',
    });
    expect(r?.lat).toBe(51.5);
  });

  it('rejects ipapi.co error', () => {
    expect(parseIpApiCo({ error: true, reason: 'RateLimited' })).toBeNull();
  });
});
