export interface GeoResult {
  lat: number;
  lon: number;
  city?: string;
  country?: string;
  provider: string;
}

export interface GeoProvider {
  name: string;
  url: string;
  parse: (data: unknown) => GeoResult | null;
}

function num(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function result(
  provider: string,
  lat: unknown,
  lon: unknown,
  city?: string,
  country?: string
): GeoResult | null {
  const la = num(lat);
  const lo = num(lon);
  if (la === null || lo === null || la < -90 || la > 90 || lo < -180 || lo > 180) {
    return null;
  }
  return { lat: la, lon: lo, city, country, provider };
}

/** ipwho.is — free, no API key */
export function parseIpWhoIs(data: unknown): GeoResult | null {
  const d = data as Record<string, unknown>;
  if (d.success === false) {
    return null;
  }
  return result(
    'ipwho.is',
    d.latitude,
    d.longitude,
    typeof d.city === 'string' ? d.city : undefined,
    typeof d.country === 'string' ? d.country : undefined
  );
}

/** geojs.io — free, no API key */
export function parseGeoJs(data: unknown): GeoResult | null {
  const d = data as Record<string, unknown>;
  return result(
    'geojs.io',
    d.latitude,
    d.longitude,
    typeof d.city === 'string' ? d.city : undefined,
    typeof d.country === 'string' ? d.country : undefined
  );
}

/** ip-api.com — free tier (HTTP); HTTPS may work for light use */
export function parseIpApiCom(data: unknown): GeoResult | null {
  const d = data as Record<string, unknown>;
  if (d.status === 'fail') {
    return null;
  }
  return result(
    'ip-api.com',
    d.lat,
    d.lon,
    typeof d.city === 'string' ? d.city : undefined,
    typeof d.country === 'string' ? d.country : undefined
  );
}

/** ipapi.co — strict free tier (often 429) */
export function parseIpApiCo(data: unknown): GeoResult | null {
  const d = data as Record<string, unknown>;
  if (d.error === true) {
    return null;
  }
  return result(
    'ipapi.co',
    d.latitude,
    d.longitude,
    typeof d.city === 'string' ? d.city : undefined,
    typeof d.country_name === 'string' ? d.country_name : undefined
  );
}

export const GEO_PROVIDERS: GeoProvider[] = [
  { name: 'ipwho.is', url: 'https://ipwho.is/', parse: parseIpWhoIs },
  { name: 'geojs.io', url: 'https://get.geojs.io/v1/ip/geo.json', parse: parseGeoJs },
  {
    name: 'ip-api.com',
    url: 'https://ip-api.com/json/?fields=status,message,lat,lon,city,country',
    parse: parseIpApiCom,
  },
  { name: 'ipapi.co', url: 'https://ipapi.co/json/', parse: parseIpApiCo },
];

export function parseProviderResponse(
  provider: GeoProvider,
  data: unknown
): GeoResult | null {
  const parsed = provider.parse(data);
  if (parsed) {
    return { ...parsed, provider: provider.name };
  }
  return null;
}
