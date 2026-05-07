import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CustomButtonComponent } from '../../../../core/components/button/custom-button.component';
import {
  GeofenceCoordinate,
  GeofenceMapResponse,
  GeofenceMapService,
  GeofencePolygonPayload,
  GeofenceSearchResult,
} from './geofence-map.service';

const DEFAULT_CENTER = { lat: 28.6139, lng: 77.209 };

export interface GeofencePolygonInitialValue {
  id?: number | null;
  name?: string | null;
  coordinates?: GeofenceCoordinate[] | null;
}

@Component({
  selector: 'app-geofence-polygon-map',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CustomButtonComponent],
  templateUrl: './geofence-polygon-map.component.html',
  styleUrl: './geofence-polygon-map.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeofencePolygonMapComponent implements AfterViewInit {
  private fb = inject(FormBuilder);
  private geofenceMapService = inject(GeofenceMapService);
  private destroyRef = inject(DestroyRef);

  initialGeofence = input<GeofencePolygonInitialValue | null>(null);
  resetVersion = input(0);
  saved = output<GeofenceMapResponse>();

  readonly mapContainer = viewChild<ElementRef<HTMLDivElement>>('polygonMapContainer');

  readonly showTextbox = signal(true);
  readonly saving = signal(false);
  readonly loadingLocation = signal(false);
  readonly searchLoading = signal(false);
  readonly errorMessage = signal('');
  readonly searchQuery = signal('');
  readonly searchResults = signal<GeofenceSearchResult[]>([]);
  readonly polygonPoints = signal<GeofenceCoordinate[]>([]);
  readonly mapEngine = signal<'google' | 'leaflet'>('leaflet');
  readonly mapStatus = signal('');

  private leafletLib: any = null;
  private googleMapsLib: any = null;
  private mapMode: 'google' | 'leaflet' = 'leaflet';
  private map: any = null;
  private polygonLayer: any = null;
  private polylineLayer: any = null;
  private pointMarkers: any[] = [];
  private searchAbortController: AbortController | null = null;
  private hasSeenResetVersion = false;

  readonly addPolygonGeoForm = this.fb.group({
    centerName: ['', [Validators.required, Validators.maxLength(120), this.noWhitespaceValidator]],
    coordinates: [{ value: '', disabled: true }, [Validators.required]],
  });

  readonly pointCount = computed(() => this.polygonPoints().length);
  readonly coordinatesLabel = computed(() =>
    this.polygonPoints()
      .map((point, index) => `${index + 1}. ${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}`)
      .join('\n'),
  );
  readonly latestLatitudeLabel = computed(() => {
    const latest = this.polygonPoints()[this.polygonPoints().length - 1];
    return latest ? latest.lat.toFixed(6) : 'Not selected';
  });
  readonly latestLongitudeLabel = computed(() => {
    const latest = this.polygonPoints()[this.polygonPoints().length - 1];
    return latest ? latest.lng.toFixed(6) : 'Not selected';
  });
  readonly hasValidPolygon = computed(() => this.pointCount() >= 3);

  constructor() {
    effect(() => {
      const initial = this.initialGeofence();
      const points = Array.isArray(initial?.coordinates)
        ? initial.coordinates.filter(
            (point): point is GeofenceCoordinate =>
              Number.isFinite(point?.lat) && Number.isFinite(point?.lng),
          )
        : [];

      this.addPolygonGeoForm.patchValue(
        {
          centerName: initial?.name?.trim() || '',
          coordinates: points
            .map((point, index) => `${index + 1}. ${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}`)
            .join('\n'),
        },
        { emitEvent: false },
      );
      this.polygonPoints.set(points);
      queueMicrotask(() => this.drawPolygon(true));
    });

    effect(() => {
      const version = this.resetVersion();
      if (!this.hasSeenResetVersion) {
        this.hasSeenResetVersion = true;
        return;
      }
      void version;
      queueMicrotask(() => this.resetShape());
    });
  }

  async ngAfterViewInit(): Promise<void> {
    await this.initializeMap();
    this.drawPolygon(true);

    this.polygonPoints
      .asReadonly();

    this.addPolygonGeoForm.controls.centerName.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.errorMessage.set(''));
  }

  preventEnterKey(event: Event): void {
    event.preventDefault();
    this.createSearch();
  }

  createSearch(): void {
    void this.searchLocation();
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.searchResults.set([]);
    this.errorMessage.set('');
  }

  async searchLocation(): Promise<void> {
    const query = this.searchQuery().trim();
    if (!query) {
      this.searchResults.set([]);
      return;
    }

    if (this.searchAbortController) {
      this.searchAbortController.abort();
    }
    this.searchAbortController = new AbortController();
    this.searchLoading.set(true);
    this.errorMessage.set('');

    try {
      const results = await this.geofenceMapService.searchLocation(query, this.searchAbortController.signal);
      this.searchResults.set(results);
      if (results.length > 0) {
        this.selectSearchResult(results[0]);
      }
    } catch {
      if (!this.searchAbortController.signal.aborted) {
        this.errorMessage.set('Unable to search this location right now.');
      }
      this.searchResults.set([]);
    } finally {
      this.searchAbortController = null;
      this.searchLoading.set(false);
    }
  }

  selectSearchResult(result: GeofenceSearchResult): void {
    const lat = Number(result.lat);
    const lng = Number(result.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return;
    }

    this.searchQuery.set(result.display_name);
    this.searchResults.set([]);
    this.addPolygonPoint(lat, lng);
  }

  async useCurrentLocation(): Promise<void> {
    this.loadingLocation.set(true);
    this.errorMessage.set('');

    try {
      const location = await this.geofenceMapService.getCurrentLocation();
      this.addPolygonPoint(location.latitude, location.longitude);
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Unable to fetch current location.');
    } finally {
      this.loadingLocation.set(false);
    }
  }

  addPolygonPoint(lat: number, lng: number): void {
    this.polygonPoints.update((points) => [...points, { lat, lng }]);
    this.updateCoordinates();
    this.drawPolygon(true);
  }

  drawPolygon(centerMap = false): void {
    if (!this.map) {
      return;
    }

    const points = this.polygonPoints();

    if (this.mapMode === 'google') {
      this.pointMarkers.forEach((marker) => marker.setMap?.(null));
      this.pointMarkers = points.map(
        (point, index) =>
          new (window as any).google.maps.Marker({
            map: this.map,
            position: point,
            label: `${index + 1}`,
          }),
      );

      if (this.polygonLayer) {
        this.polygonLayer.setMap?.(null);
        this.polygonLayer = null;
      }
      if (this.polylineLayer) {
        this.polylineLayer.setMap?.(null);
        this.polylineLayer = null;
      }

      if (points.length >= 3) {
        this.polygonLayer = new (window as any).google.maps.Polygon({
          map: this.map,
          paths: points,
          strokeColor: '#2563eb',
          strokeOpacity: 1,
          strokeWeight: 2,
          fillColor: '#38bdf8',
          fillOpacity: 0.18,
        });
      } else if (points.length >= 2) {
        this.polylineLayer = new (window as any).google.maps.Polyline({
          map: this.map,
          path: points,
          strokeColor: '#2563eb',
          strokeOpacity: 1,
          strokeWeight: 3,
        });
      }

      if (!centerMap) {
        return;
      }

      if (!points.length) {
        this.map?.setCenter?.({ lat: DEFAULT_CENTER.lat, lng: DEFAULT_CENTER.lng });
        this.map?.setZoom?.(14);
        return;
      }

      if (points.length === 1) {
        this.map?.panTo?.(points[0]);
        this.map?.setZoom?.(16);
        return;
      }

      const bounds = new (window as any).google.maps.LatLngBounds();
      points.forEach((point) => bounds.extend(point));
      this.map?.fitBounds?.(bounds, 24);
      return;
    }

    const L = this.leafletLib;

    this.pointMarkers.forEach((marker) => marker.remove());
    this.pointMarkers = points.map((point, index) =>
      L.marker([point.lat, point.lng], {
        icon: this.createPointIcon(index, index === points.length - 1),
        keyboard: false,
      })
        .addTo(this.map)
        .bindTooltip(`Point ${index + 1}`, {
          direction: 'top',
          offset: [0, -16],
          opacity: 0.9,
        }),
    );

    if (this.polygonLayer) {
      this.polygonLayer.remove();
      this.polygonLayer = null;
    }
    if (this.polylineLayer) {
      this.polylineLayer.remove();
      this.polylineLayer = null;
    }

    if (points.length >= 3) {
      this.polygonLayer = L.polygon(
        points.map((point) => [point.lat, point.lng]),
        {
          color: '#2563eb',
          weight: 2,
          fillColor: '#38bdf8',
          fillOpacity: 0.18,
        },
      ).addTo(this.map);
    } else if (points.length >= 2) {
      this.polylineLayer = L.polyline(
        points.map((point) => [point.lat, point.lng]),
        {
          color: '#2563eb',
          weight: 3,
        },
      ).addTo(this.map);
    }

    if (!centerMap) {
      return;
    }

    if (!points.length) {
      this.map.flyTo([DEFAULT_CENTER.lat, DEFAULT_CENTER.lng], 14, { animate: true, duration: 0.35 });
      return;
    }

    if (points.length === 1) {
      this.map.flyTo([points[0].lat, points[0].lng], 16, { animate: true, duration: 0.35 });
      return;
    }

    const bounds = L.latLngBounds(points.map((point) => [point.lat, point.lng]));
    this.map.fitBounds(bounds, { padding: [24, 24], animate: true, duration: 0.35 });
  }

  updateCoordinates(): void {
    this.addPolygonGeoForm.controls.coordinates.setValue(this.coordinatesLabel());
    this.addPolygonGeoForm.markAsDirty();
    this.errorMessage.set('');
  }

  resetShape(): void {
    const initial = this.initialGeofence();
    const points = Array.isArray(initial?.coordinates)
      ? initial.coordinates.filter(
          (point): point is GeofenceCoordinate =>
            Number.isFinite(point?.lat) && Number.isFinite(point?.lng),
        )
      : [];

    this.searchQuery.set('');
    this.searchResults.set([]);
    this.errorMessage.set('');
    this.polygonPoints.set(points);
    this.addPolygonGeoForm.reset(
      {
        centerName: initial?.name?.trim() || '',
        coordinates: points
          .map((point, index) => `${index + 1}. ${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}`)
          .join('\n'),
      },
      { emitEvent: false },
    );

    this.pointMarkers.forEach((marker) => {
      if (this.mapMode === 'google') {
        marker.setMap?.(null);
      } else {
        marker.remove();
      }
    });
    this.pointMarkers = [];
    if (this.polygonLayer) {
      if (this.mapMode === 'google') {
        this.polygonLayer.setMap?.(null);
      } else {
        this.polygonLayer.remove();
      }
      this.polygonLayer = null;
    }
    if (this.polylineLayer) {
      if (this.mapMode === 'google') {
        this.polylineLayer.setMap?.(null);
      } else {
        this.polylineLayer.remove();
      }
      this.polylineLayer = null;
    }
    if (!points.length) {
      if (this.mapMode === 'google') {
        this.map?.setCenter?.({ lat: DEFAULT_CENTER.lat, lng: DEFAULT_CENTER.lng });
        this.map?.setZoom?.(14);
      } else {
        this.map?.flyTo([DEFAULT_CENTER.lat, DEFAULT_CENTER.lng], 14, { animate: true, duration: 0.35 });
      }
      return;
    }
    this.drawPolygon(true);
  }

  removeLastPoint(): void {
    if (!this.pointCount()) {
      return;
    }
    this.polygonPoints.update((points) => points.slice(0, -1));
    this.updateCoordinates();
    this.drawPolygon(true);
  }

  submit(): void {
    if (this.addPolygonGeoForm.invalid) {
      this.addPolygonGeoForm.markAllAsTouched();
      this.errorMessage.set('Please complete the required polygon details.');
      return;
    }

    if (!this.hasValidPolygon()) {
      this.errorMessage.set('Add at least three points to create a polygon boundary.');
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');

    const payload: GeofencePolygonPayload = {
      name: String(this.addPolygonGeoForm.controls.centerName.value).trim(),
      type: 'polygon',
      coordinates: this.polygonPoints(),
    };

    this.geofenceMapService
      .saveGeofence(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.saving.set(false);
          this.saved.emit(result);
          this.addPolygonGeoForm.markAsPristine();
        },
        error: () => {
          this.saving.set(false);
          this.errorMessage.set('Unable to save polygon geofence right now.');
        },
      });
  }

  private async initializeMap(): Promise<void> {
    const host = this.mapContainer()?.nativeElement;
    if (!host) {
      return;
    }

    const initialPoint = this.polygonPoints()[0] ?? DEFAULT_CENTER;
    const googleMaps = await this.geofenceMapService.loadGoogleMaps();
    if (googleMaps) {
      this.googleMapsLib = googleMaps;
      this.mapMode = 'google';
      this.mapEngine.set('google');
      this.mapStatus.set('Google Maps active');
      this.map = new googleMaps.Map(host, {
        center: { lat: initialPoint.lat, lng: initialPoint.lng },
        zoom: 14,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      this.map.addListener('click', (event: any) => {
        const lat = Number(event.latLng?.lat?.().toFixed(6));
        const lng = Number(event.latLng?.lng?.().toFixed(6));
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          this.addPolygonPoint(lat, lng);
        }
      });
      return;
    }

    this.mapStatus.set(
      this.geofenceMapService.hasGoogleMapsKey()
        ? 'Google Maps unavailable for this key or domain. Using fallback map.'
        : 'Google Maps key not configured. Using fallback map.',
    );

    if (!this.leafletLib) {
      this.leafletLib = await this.geofenceMapService.loadLeaflet();
    }

    this.mapMode = 'leaflet';
    this.mapEngine.set('leaflet');
    const L = this.leafletLib;
    this.map = L.map(host, {
      zoomControl: true,
      attributionControl: true,
      preferCanvas: true,
    }).setView([initialPoint.lat, initialPoint.lng], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);

    this.map.on('click', (event: any) => {
      const lat = Number(event.latlng.lat.toFixed(6));
      const lng = Number(event.latlng.lng.toFixed(6));
      this.addPolygonPoint(lat, lng);
    });

    queueMicrotask(() => this.map?.invalidateSize(false));
    setTimeout(() => this.map?.invalidateSize(false), 120);
  }

  private createPointIcon(index: number, isLast: boolean): any {
    const L = this.leafletLib;
    return L.divIcon({
      className: 'hrms-polygon-point-icon',
      html: `
        <div style="
          height: 30px;
          width: 30px;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: ${isLast ? '#2563eb' : '#0f172a'};
          color: white;
          border: 3px solid white;
          box-shadow: 0 8px 20px rgba(15,23,42,0.24);
          font-size: 12px;
          font-weight: 800;
        ">${index + 1}</div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });
  }

  private noWhitespaceValidator(control: { value: string | null }) {
    return String(control.value ?? '').trim().length ? null : { whitespace: true };
  }
}
