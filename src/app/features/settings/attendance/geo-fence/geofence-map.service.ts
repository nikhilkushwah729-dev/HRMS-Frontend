import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export type GeofenceType = 'circle' | 'polygon';

export interface GeofenceCoordinate {
  lat: number;
  lng: number;
}

export interface GeofenceSearchResult {
  display_name: string;
  lat: string;
  lon: string;
}

export interface GeofenceCirclePayload {
  name: string;
  type: 'circle';
  latitude: number;
  longitude: number;
  radius: number;
  address: string;
}

export interface GeofencePolygonPayload {
  name: string;
  type: 'polygon';
  coordinates: GeofenceCoordinate[];
}

export type GeofenceSavePayload = GeofenceCirclePayload | GeofencePolygonPayload;

export interface GeofenceMapResponse {
  id: number;
  name: string;
  type: GeofenceType;
  latitude?: number;
  longitude?: number;
  radius?: number;
  address?: string;
  coordinates?: GeofenceCoordinate[];
  status?: boolean;
}

@Injectable({ providedIn: 'root' })
export class GeofenceMapService {
  private http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;
  private static leafletPromise: Promise<any> | null = null;
  private static googleMapsPromise: Promise<any | null> | null = null;
  private static readonly googleGeocodeBaseUrl = 'https://maps.googleapis.com/maps/api/geocode/json';
  private static readonly nominatimSearchBaseUrl = 'https://nominatim.openstreetmap.org/search';
  private static readonly nominatimReverseBaseUrl = 'https://nominatim.openstreetmap.org/reverse';

  loadLeaflet(): Promise<any> {
    if (!GeofenceMapService.leafletPromise) {
      GeofenceMapService.leafletPromise = import('leaflet');
    }
    return GeofenceMapService.leafletPromise;
  }

  hasGoogleMapsKey(): boolean {
    return Boolean(environment.googleMapsApiKey?.trim());
  }

  loadGoogleMaps(): Promise<any | null> {
    const apiKey = environment.googleMapsApiKey?.trim();
    if (!apiKey) {
      return Promise.resolve(null);
    }

    if ((window as any).google?.maps) {
      return Promise.resolve((window as any).google.maps);
    }

    if (!GeofenceMapService.googleMapsPromise) {
      GeofenceMapService.googleMapsPromise = new Promise((resolve) => {
        const existing = document.querySelector<HTMLScriptElement>('script[data-hrms-google-maps="true"]');
        if (existing) {
          existing.addEventListener('load', () => resolve((window as any).google?.maps ?? null), { once: true });
          existing.addEventListener('error', () => resolve(null), { once: true });
          return;
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places,marker`;
        script.async = true;
        script.defer = true;
        script.setAttribute('data-hrms-google-maps', 'true');
        script.onload = () => resolve((window as any).google?.maps ?? null);
        script.onerror = () => resolve(null);
        document.head.appendChild(script);
      });
    }

    return GeofenceMapService.googleMapsPromise;
  }

  saveGeofence(payload: GeofenceSavePayload): Observable<GeofenceMapResponse> {
    return this.http.post<any>(`${this.apiUrl}/geofences`, payload).pipe(
      map((res) => this.normalizeResponse(res?.data || res, payload)),
      catchError((error) => {
        if (payload.type !== 'circle') {
          return throwError(() => error);
        }

        return this.http
          .post<any>(`${this.apiUrl}/attendance/zones`, {
            name: payload.name,
            latitude: payload.latitude,
            longitude: payload.longitude,
            radius_meters: payload.radius,
            address: payload.address,
          })
          .pipe(map((res) => this.normalizeResponse(res?.data || res, payload)));
      }),
      catchError((error) => throwError(() => error)),
    );
  }

  searchLocation(query: string, signal?: AbortSignal): Promise<GeofenceSearchResult[]> {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      return Promise.resolve([]);
    }

    return this.searchLocationWithGoogle(normalizedQuery, signal).catch(() =>
      this.searchLocationWithNominatim(normalizedQuery, signal),
    );
  }

  reverseGeocode(latitude: number, longitude: number): Promise<string> {
    return this.reverseGeocodeWithGoogle(latitude, longitude).catch(() =>
      this.reverseGeocodeWithNominatim(latitude, longitude),
    );
  }

  getCurrentLocation(): Promise<{
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: number;
  }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported in this browser.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!Number.isFinite(position.coords.latitude) || !Number.isFinite(position.coords.longitude)) {
            reject(new Error('The detected location is invalid.'));
            return;
          }

          // Browser geolocation does not expose true mock-GPS flags. We reject
          // highly unreliable positions so suspicious or unusable locations do
          // not get saved as real work boundaries.
          if (Number(position.coords.accuracy ?? 0) > 5000) {
            reject(new Error('The detected GPS signal is unreliable. Please retry outdoors or with better location access.'));
            return;
          }

          resolve({
            latitude: Number(position.coords.latitude.toFixed(6)),
            longitude: Number(position.coords.longitude.toFixed(6)),
            accuracy: Number(position.coords.accuracy ?? 0),
            timestamp: Number(position.timestamp),
          });
        },
        () => reject(new Error('Unable to fetch current location.')),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      );
    });
  }

  private normalizeResponse(raw: any, fallback: GeofenceSavePayload): GeofenceMapResponse {
    if (fallback.type === 'polygon') {
      const rawCoordinates = Array.isArray(raw?.coordinates) ? raw.coordinates : fallback.coordinates;
      return {
        id: Number(raw?.id ?? 0),
        name: String(raw?.name ?? fallback.name),
        type: 'polygon',
        coordinates: rawCoordinates
          .map((point: any) => ({
            lat: Number(point?.lat ?? point?.latitude ?? 0),
            lng: Number(point?.lng ?? point?.longitude ?? 0),
          }))
          .filter((point: GeofenceCoordinate) => Number.isFinite(point.lat) && Number.isFinite(point.lng)),
        status: raw?.status,
      };
    }

    return {
      id: Number(raw?.id ?? 0),
      name: String(raw?.name ?? fallback.name),
      type: 'circle',
      latitude: Number(raw?.latitude ?? raw?.center_lat ?? fallback.latitude),
      longitude: Number(raw?.longitude ?? raw?.center_lng ?? fallback.longitude),
      radius: Number(raw?.radius ?? raw?.radius_meters ?? fallback.radius),
      address: String(raw?.address ?? fallback.address ?? ''),
      status: raw?.status,
    };
  }

  private async searchLocationWithGoogle(query: string, signal?: AbortSignal): Promise<GeofenceSearchResult[]> {
    const apiKey = environment.googleMapsApiKey?.trim();
    if (!apiKey) {
      throw new Error('Google Maps API key not configured.');
    }

    const url =
      `${GeofenceMapService.googleGeocodeBaseUrl}?address=${encodeURIComponent(query)}` +
      `&key=${encodeURIComponent(apiKey)}`;

    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal,
    });
    const result = await response.json();

    if (!response.ok || result?.status === 'REQUEST_DENIED' || result?.status === 'OVER_DAILY_LIMIT') {
      throw new Error(result?.error_message || 'Google location search is unavailable.');
    }

    const rawResults = Array.isArray(result?.results) ? result.results : [];
    return rawResults
      .map((item: any) => ({
        display_name: String(item?.formatted_address ?? ''),
        lat: String(item?.geometry?.location?.lat ?? ''),
        lon: String(item?.geometry?.location?.lng ?? ''),
      }))
      .filter(
        (item: GeofenceSearchResult) =>
          item.display_name &&
          Number.isFinite(Number(item.lat)) &&
          Number.isFinite(Number(item.lon)),
      )
      .slice(0, 6);
  }

  private async searchLocationWithNominatim(query: string, signal?: AbortSignal): Promise<GeofenceSearchResult[]> {
    const response = await fetch(
      `${GeofenceMapService.nominatimSearchBaseUrl}?format=jsonv2&limit=6&q=${encodeURIComponent(query)}`,
      {
        headers: { Accept: 'application/json' },
        signal,
      },
    );
    const results = (await response.json()) as GeofenceSearchResult[];
    return Array.isArray(results) ? results : [];
  }

  private async reverseGeocodeWithGoogle(latitude: number, longitude: number): Promise<string> {
    const apiKey = environment.googleMapsApiKey?.trim();
    if (!apiKey) {
      throw new Error('Google Maps API key not configured.');
    }

    const url =
      `${GeofenceMapService.googleGeocodeBaseUrl}?latlng=${encodeURIComponent(`${latitude},${longitude}`)}` +
      `&key=${encodeURIComponent(apiKey)}`;

    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
    });
    const result = await response.json();

    if (!response.ok || result?.status === 'REQUEST_DENIED' || result?.status === 'OVER_DAILY_LIMIT') {
      throw new Error(result?.error_message || 'Google reverse geocoding is unavailable.');
    }

    return String(result?.results?.[0]?.formatted_address ?? '');
  }

  private async reverseGeocodeWithNominatim(latitude: number, longitude: number): Promise<string> {
    const response = await fetch(
      `${GeofenceMapService.nominatimReverseBaseUrl}?format=jsonv2&lat=${encodeURIComponent(String(latitude))}&lon=${encodeURIComponent(String(longitude))}`,
      {
        headers: { Accept: 'application/json' },
      },
    );
    const result = (await response.json()) as { display_name?: string };
    return String(result?.display_name ?? '');
  }
}
