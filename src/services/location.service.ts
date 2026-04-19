/**
 * Free IP-based geolocation using ip-api.com (free, no API key needed, 45 requests/minute)
 */
export class LocationService {
  static async getLocationFromIP(ip: string): Promise<{
    city: string | null;
    state: string | null;
    country: string | null;
    lat: number | null;
    lon: number | null;
  }> {
    try {
      // Skip private/local IPs
      if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
        return { city: null, state: null, country: null, lat: null, lon: null };
      }

      const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,city,regionName,country,lat,lon`);
      const data = await response.json() as { status: string; city?: string; regionName?: string; country?: string; lat?: number; lon?: number };

      if (data.status === 'success') {
        return {
          city: data.city || null,
          state: data.regionName || null,
          country: data.country || null,
          lat: data.lat || null,
          lon: data.lon || null,
        };
      }

      return { city: null, state: null, country: null, lat: null, lon: null };
    } catch {
      return { city: null, state: null, country: null, lat: null, lon: null };
    }
  }
}
