import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

export const GOOGLE_MAPS_API_KEY =
  (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) ||
  'AIzaSyC0NsNf01nVkN3waTtzD390ZQstYZLQfqo';

let isConfigured = false;
let loadPromise: Promise<any> | null = null;

export async function loadGoogleMaps(): Promise<any> {
  if (
    typeof window !== 'undefined' &&
    (window as any).google?.maps?.importLibrary &&
    (window as any).google?.maps?.marker
  ) {
    return (window as any).google;
  }

  if (!loadPromise) {
    loadPromise = (async () => {
      try {
        if (!isConfigured) {
          setOptions({
            key: GOOGLE_MAPS_API_KEY,
            v: 'weekly',
            libraries: ['places', 'marker', 'geometry', 'routes'],
          });
          isConfigured = true;
        }

        // Import modern modular libraries without deprecated legacy classes
        await importLibrary('maps');
        await importLibrary('marker');
        await importLibrary('places');

        // Optional modern routes & geometry
        try {
          await importLibrary('routes');
        } catch {
          // Non-blocking fallback
        }
        try {
          await importLibrary('geometry');
        } catch {
          // Non-blocking fallback
        }

        return (window as any).google;
      } catch (err) {
        console.warn('Google Maps modular libraries load error:', err);
        throw err;
      }
    })();
  }

  return loadPromise;
}

// Austin Home Base coordinates (South Congress / 78704)
export const SARAH_HOME_BASE = {
  lat: 30.245,
  lng: -97.753,
  address: '1401 S Congress Ave, Austin, TX 78704',
  name: "Sarah's Central Austin Home Base",
};

// Austin Zone Centers
export const ZONE_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'Central Austin': { lat: 30.2672, lng: -97.7431 },
  'South Austin': { lat: 30.215, lng: -97.785 },
  'North Austin': { lat: 30.392, lng: -97.728 },
  'East Austin': { lat: 30.272, lng: -97.708 },
  'Cedar Park': { lat: 30.505, lng: -97.82 },
  'Round Rock': { lat: 30.508, lng: -97.678 },
  'Oak Hill/West': { lat: 30.235, lng: -97.86 },
  'Oak Hill': { lat: 30.235, lng: -97.86 },
};
