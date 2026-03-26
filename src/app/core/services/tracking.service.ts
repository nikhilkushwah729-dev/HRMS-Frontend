import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { interval, switchMap, filter } from 'rxjs';
import { OrganizationService } from './organization.service';

export interface LocationRecord {
    id: number;
    employeeId: number;
    latitude: number;
    longitude: number;
    address?: string;
    timestamp: string;
    source?: string;
}

@Injectable({
    providedIn: 'root'
})
export class TrackingService {
    private http = inject(HttpClient);
    private orgService = inject(OrganizationService);
    private readonly apiUrl = environment.apiUrl;

    isTrackingActive = signal<boolean>(false);

    constructor() {
        // Start background tracking if the addon is active
        interval(60000) // Every minute
            .pipe(
                filter(() => this.orgService.activeModules().includes('tracking')),
                switchMap(() => this.pulseLocation())
            )
            .subscribe({
                next: () => console.log('Location pulsed successfully'),
                error: (err) => console.error('Tracking pulse failed', err)
            });
    }

    private pulseLocation() {
        // In a real app, we'd use navigator.geolocation
        // For this demo/workable model, we simulate a slight movement
        const lat = 28.6139 + (Math.random() - 0.5) * 0.01;
        const lng = 77.2090 + (Math.random() - 0.5) * 0.01;

        return this.http.post(`${this.apiUrl}/tracking/update`, { latitude: lat, longitude: lng });
    }

    /**
     * Update current location
     */
    updateLocation(data: { latitude: number; longitude: number; address?: string }): Observable<LocationRecord> {
        return this.http.post<any>(`${this.apiUrl}/tracking/update`, data).pipe(
            map(res => res.data)
        );
    }

    /**
     * Get location history within a date range
     */
    getLocationHistory(startDate?: string, endDate?: string): Observable<LocationRecord[]> {
        let params = new HttpParams();
        
        if (startDate) params = params.set('startDate', startDate);
        if (endDate) params = params.set('endDate', endDate);

        return this.http.get<any>(`${this.apiUrl}/tracking/history`, { params }).pipe(
            map(res => (res.data || []).map((item: any) => ({
                id: Number(item.id),
                employeeId: Number(item.employeeId ?? item.employee_id ?? 0),
                latitude: Number(item.latitude),
                longitude: Number(item.longitude),
                address: item.address,
                timestamp: item.timestamp ?? item.created_at,
                source: item.source
            })))
        );
    }

    /**
     * Get current location
     */
    getCurrentLocation(): Observable<LocationRecord | null> {
        return this.http.get<any>(`${this.apiUrl}/tracking/current`).pipe(
            map(res => res.data || null),
            catchError(() =>
                this.getLocationHistory().pipe(
                    map((records) => records[0] || null),
                    catchError(() => of(null))
                )
            )
        );
    }
}
