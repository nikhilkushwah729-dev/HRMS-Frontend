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
  GeofenceCirclePayload,
  GeofenceMapResponse,
  GeofenceMapService,
  GeofenceSearchResult,
} from './geofence-map.service';

export interface GeofenceMapInitialValue {
  id?: number | null;
  name?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  radius?: number | null;
  address?: string | null;
}

const DEFAULT_CENTER = { lat: 28.6139, lng: 77.209 };
const DEFAULT_RADIUS_METERS = 150;

@Component({
  selector: 'app-geofence-map',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CustomButtonComponent],
  templateUrl: './geofence-map.component.html',
  styleUrl: './geofence-map.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeofenceMapComponent implements AfterViewInit {
  private fb = inject(FormBuilder);
  private geofenceMapService = inject(GeofenceMapService);
  private destroyRef = inject(DestroyRef);

  initialGeofence = input<GeofenceMapInitialValue | null>(null);
  resetVersion = input(0);
  saved = output<GeofenceMapResponse>();

  readonly mapContainer = viewChild<ElementRef<HTMLDivElement>>('mapContainer');

  readonly showTextbox = signal(true);
  readonly saving = signal(false);
  readonly loadingLocation = signal(false);
  readonly searchLoading = signal(false);
  readonly errorMessage = signal('');
  readonly address = signal('');
  readonly searchQuery = signal('');
  readonly searchResults = signal<GeofenceSearchResult[]>([]);
  readonly selected = signal(false);
  readonly mapEngine = signal<'google' | 'leaflet'>('leaflet');
  readonly mapStatus = signal('');
  readonly selectedLatitude = signal<string>('');
  readonly selectedLongitude = signal<string>('');

  private leafletLib: any = null;
  private googleMapsLib: any = null;
  private mapMode: 'google' | 'leaflet' = 'leaflet';
  private map: any = null;
  private marker: any = null;
  private circle: any = null;
  private searchAbortController: AbortController | null = null;
  private hasSeenResetVersion = false;

  readonly addCircularGeoForm = this.fb.group({
    centerName: ['', [Validators.required, Validators.maxLength(120), this.noWhitespaceValidator]],
    address: ['', [Validators.required, Validators.maxLength(400), this.noWhitespaceValidator]],
    radiusKm: ['0.15', [Validators.required, Validators.maxLength(8), this.decimalValidator]],
    latitude: [{ value: '', disabled: true }],
    longitude: [{ value: '', disabled: true }],
  });

  readonly radiusMeters = computed(() => {
    const raw = Number(this.addCircularGeoForm.controls.radiusKm.value || '0');
    if (!Number.isFinite(raw) || raw <= 0) {
      return DEFAULT_RADIUS_METERS;
    }
    return Math.round(raw * 1000);
  });

  readonly latitudeLabel = computed(() => this.selectedLatitude() || 'Not selected');
  readonly longitudeLabel = computed(() => this.selectedLongitude() || 'Not selected');
  readonly editMode = computed(() => Boolean(this.initialGeofence()?.id));

  constructor() {
    effect(() => {
      const initial = this.initialGeofence();
      const radiusMeters = Number(initial?.radius ?? DEFAULT_RADIUS_METERS);
      const radiusKm = (radiusMeters / 1000).toFixed(2);
      const latitude = Number(initial?.latitude ?? DEFAULT_CENTER.lat);
      const longitude = Number(initial?.longitude ?? DEFAULT_CENTER.lng);
      const hasSelection = Number.isFinite(initial?.latitude) && Number.isFinite(initial?.longitude);

      this.addCircularGeoForm.patchValue(
        {
          centerName: initial?.name?.trim() || '',
          address: initial?.address?.trim() || '',
          radiusKm,
          latitude: hasSelection ? latitude.toFixed(6) : '',
          longitude: hasSelection ? longitude.toFixed(6) : '',
        },
        { emitEvent: false },
      );

      this.address.set(initial?.address?.trim() || '');
      this.selected.set(Boolean(hasSelection));
      this.selectedLatitude.set(hasSelection ? latitude.toFixed(6) : '');
      this.selectedLongitude.set(hasSelection ? longitude.toFixed(6) : '');
      queueMicrotask(() => this.syncMapFromForm(true));
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

    this.addCircularGeoForm.controls.radiusKm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.syncMapFromForm(false));
  }

  async ngAfterViewInit(): Promise<void> {
    await this.initializeMap();
    this.syncMapFromForm(true);
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
    this.address.set(result.display_name);
    this.addCircularGeoForm.controls.address.setValue(result.display_name);
    this.addMarker(lat, lng);
  }

  async useCurrentLocation(): Promise<void> {
    this.loadingLocation.set(true);
    this.errorMessage.set('');

    try {
      const location = await this.geofenceMapService.getCurrentLocation();
      this.addMarker(location.latitude, location.longitude);
      await this.populateAddress(location.latitude, location.longitude);
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Unable to fetch current location.');
    } finally {
      this.loadingLocation.set(false);
    }
  }

  addMarker(lat: number, lng: number): void {
    this.resetShape(false);
    this.selected.set(true);
    this.updateCoordinates(lat, lng);

    if (!this.map) {
      return;
    }

    if (this.mapMode === 'google') {
      const position = { lat, lng };
      this.marker = new (window as any).google.maps.Marker({
        map: this.map,
        position,
        draggable: true,
      });

      this.marker.addListener('drag', () => {
        const position = this.marker.getPosition?.();
        const nextLat = Number(position?.lat?.().toFixed(6) ?? lat);
        const nextLng = Number(position?.lng?.().toFixed(6) ?? lng);
        this.updateCoordinates(nextLat, nextLng);
        this.drawCircle(nextLat, nextLng, this.radiusMeters());
      });

      this.drawCircle(lat, lng, this.radiusMeters());
      this.map.panTo(position);
      this.map.setZoom(Math.max(Number(this.map.getZoom?.() ?? 16), 16));
      return;
    }

    const L = this.leafletLib;
    const latLng = L.latLng(lat, lng);
    this.marker = L.marker(latLng, {
      draggable: true,
      icon: this.createMarkerIcon(),
    }).addTo(this.map);

    this.marker.on('drag', (event: any) => {
      const position = event.target.getLatLng();
      const nextLat = Number(position.lat.toFixed(6));
      const nextLng = Number(position.lng.toFixed(6));
      this.updateCoordinates(nextLat, nextLng);
      this.drawCircle(nextLat, nextLng, this.radiusMeters());
    });

    this.drawCircle(lat, lng, this.radiusMeters());
    this.map.flyTo(latLng, Math.max(Number(this.map.getZoom?.() ?? 16), 16), {
      animate: true,
      duration: 0.35,
    });
  }

  drawCircle(lat: number, lng: number, radius: number): void {
    if (!this.map) {
      return;
    }

    if (this.mapMode === 'google') {
      const center = { lat, lng };
      if (!this.circle) {
        this.circle = new (window as any).google.maps.Circle({
          map: this.map,
          center,
          radius,
          strokeColor: '#0f766e',
          strokeOpacity: 1,
          strokeWeight: 2,
          fillColor: '#14b8a6',
          fillOpacity: 0.18,
        });
        return;
      }

      this.circle.setCenter(center);
      this.circle.setRadius(radius);
      return;
    }

    const L = this.leafletLib;
    const latLng = L.latLng(lat, lng);
    if (!this.circle) {
      this.circle = L.circle(latLng, {
        radius,
        color: '#0f766e',
        fillColor: '#14b8a6',
        fillOpacity: 0.18,
        weight: 2,
      }).addTo(this.map);
      return;
    }

    this.circle.setLatLng(latLng);
    this.circle.setRadius(radius);
  }

  updateCoordinates(lat: number, lng: number): void {
    const latitudeValue = lat.toFixed(6);
    const longitudeValue = lng.toFixed(6);
    this.addCircularGeoForm.patchValue(
      {
        latitude: latitudeValue,
        longitude: longitudeValue,
      },
      { emitEvent: false },
    );
    this.selectedLatitude.set(latitudeValue);
    this.selectedLongitude.set(longitudeValue);
    this.errorMessage.set('');
    void this.populateAddress(lat, lng);
  }

  resetShape(resetForm = true): void {
    this.selected.set(false);
    this.errorMessage.set('');

    if (this.marker) {
      if (this.mapMode === 'google') {
        this.marker.setMap?.(null);
      } else {
        this.map?.removeLayer(this.marker);
      }
      this.marker = null;
    }
    if (this.circle) {
      if (this.mapMode === 'google') {
        this.circle.setMap?.(null);
      } else {
        this.map?.removeLayer(this.circle);
      }
      this.circle = null;
    }

    if (resetForm) {
      const initial = this.initialGeofence();
      const hasSelection = Number.isFinite(initial?.latitude) && Number.isFinite(initial?.longitude);
      this.searchQuery.set('');
      this.searchResults.set([]);
      this.address.set(initial?.address?.trim() || '');
      this.selectedLatitude.set(hasSelection ? Number(initial?.latitude).toFixed(6) : '');
      this.selectedLongitude.set(hasSelection ? Number(initial?.longitude).toFixed(6) : '');
      this.addCircularGeoForm.reset(
        {
          centerName: initial?.name?.trim() || '',
          address: initial?.address?.trim() || '',
          radiusKm: ((Number(initial?.radius ?? DEFAULT_RADIUS_METERS) || DEFAULT_RADIUS_METERS) / 1000).toFixed(2),
          latitude: hasSelection ? Number(initial?.latitude).toFixed(6) : '',
          longitude: hasSelection ? Number(initial?.longitude).toFixed(6) : '',
        },
        { emitEvent: false },
      );
      if (this.mapMode === 'google') {
        this.map?.setCenter?.({ lat: DEFAULT_CENTER.lat, lng: DEFAULT_CENTER.lng });
        this.map?.setZoom?.(14);
      } else {
        this.map?.setView([DEFAULT_CENTER.lat, DEFAULT_CENTER.lng], 14);
      }
    }
  }

  submit(): void {
    if (!this.selected()) {
      this.errorMessage.set('Please select a location on the map before saving.');
      return;
    }

    if (this.addCircularGeoForm.invalid) {
      this.addCircularGeoForm.markAllAsTouched();
      this.errorMessage.set('Please complete the required geofence details.');
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');

    const raw = this.addCircularGeoForm.getRawValue();
    const payload: GeofenceCirclePayload = {
      name: String(raw.centerName).trim(),
      type: 'circle',
      latitude: Number(raw.latitude),
      longitude: Number(raw.longitude),
      radius: this.radiusMeters(),
      address: String(raw.address).trim(),
    };

    this.geofenceMapService
      .saveGeofence(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.saving.set(false);
          this.saved.emit(result);
          this.addCircularGeoForm.markAsPristine();
        },
        error: () => {
          this.saving.set(false);
          this.errorMessage.set('Unable to save geofence right now.');
        },
      });
  }

  private async initializeMap(): Promise<void> {
    const host = this.mapContainer()?.nativeElement;
    if (!host) {
      return;
    }

    const googleMaps = await this.geofenceMapService.loadGoogleMaps();
    if (googleMaps) {
      this.googleMapsLib = googleMaps;
      this.mapMode = 'google';
      this.mapEngine.set('google');
      this.mapStatus.set('Google Maps active');
      this.map = new googleMaps.Map(host, {
        center: { lat: DEFAULT_CENTER.lat, lng: DEFAULT_CENTER.lng },
        zoom: 14,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      this.map.addListener('click', (event: any) => {
        const lat = Number(event.latLng?.lat?.().toFixed(6));
        const lng = Number(event.latLng?.lng?.().toFixed(6));
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          this.addMarker(lat, lng);
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
    }).setView([DEFAULT_CENTER.lat, DEFAULT_CENTER.lng], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);

    this.map.on('click', (event: any) => {
      const lat = Number(event.latlng.lat.toFixed(6));
      const lng = Number(event.latlng.lng.toFixed(6));
      this.addMarker(lat, lng);
    });

    queueMicrotask(() => this.map?.invalidateSize(false));
    setTimeout(() => this.map?.invalidateSize(false), 120);
  }

  private syncMapFromForm(centerMap: boolean): void {
    if (!this.selected()) {
      return;
    }

    const latitude = Number(this.addCircularGeoForm.controls.latitude.value);
    const longitude = Number(this.addCircularGeoForm.controls.longitude.value);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return;
    }

    if (!this.marker) {
      this.addMarker(latitude, longitude);
      return;
    }

    if (this.mapMode === 'google') {
      const position = { lat: latitude, lng: longitude };
      this.marker.setPosition?.(position);
      this.drawCircle(latitude, longitude, this.radiusMeters());

      if (centerMap) {
        this.map?.panTo?.(position);
        this.map?.setZoom?.(Math.max(Number(this.map.getZoom?.() ?? 16), 16));
      }
      return;
    }

    this.marker.setLatLng([latitude, longitude]);
    this.drawCircle(latitude, longitude, this.radiusMeters());

    if (centerMap) {
      this.map?.flyTo([latitude, longitude], Math.max(Number(this.map.getZoom?.() ?? 16), 16), {
        animate: true,
        duration: 0.35,
      });
    }
  }

  private async populateAddress(lat: number, lng: number): Promise<void> {
    const resolved = await this.geofenceMapService.reverseGeocode(lat, lng).catch(() => '');
    if (!resolved) {
      return;
    }
    this.address.set(resolved);
    this.addCircularGeoForm.controls.address.setValue(resolved);
  }

  private createMarkerIcon(): any {
    const L = this.leafletLib;
    return L.divIcon({
      className: 'hrms-geofence-marker-icon',
      html: `
        <div style="
          position: relative;
          width: 34px;
          height: 34px;
          border-radius: 9999px;
          background: radial-gradient(circle at center, #14b8a6 0%, #0f766e 72%);
          border: 4px solid white;
          box-shadow: 0 10px 22px rgba(15,118,110,0.30);
        ">
          <span style="
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            width: 8px;
            height: 8px;
            border-radius: 9999px;
            background: white;
          "></span>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });
  }

  private noWhitespaceValidator(control: { value: string | null }) {
    return String(control.value ?? '').trim().length ? null : { whitespace: true };
  }

  private decimalValidator(control: { value: string | null }) {
    const value = String(control.value ?? '').trim();
    return /^\d+(\.\d{1,3})?$/.test(value) ? null : { decimal: true };
  }
}
