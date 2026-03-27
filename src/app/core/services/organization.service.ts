import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, map, catchError, of, tap } from 'rxjs';
import { AuthService } from './auth.service';

export interface Organization {
    id: number;
    name: string;
    logo?: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    industry?: string;
    timeZone?: string;
    orgStreet1?: string;
    orgStreet2?: string;
    orgCity?: string;
    orgPinCode?: string;
    orgContactNumber?: string;
    billStreet1?: string;
    billStreet2?: string;
    billCity?: string;
    billPinCode?: string;
    billContactNumber?: string;
}

export interface Department {
    id: number;
    name: string;
    orgId: number;
    parentId?: number | null;
    description?: string | null;
    isActive?: boolean;
}

export interface Designation {
    id: number;
    name: string;
    orgId: number;
    departmentId?: number | null;
}

export interface OfficeLocation {
    id: number;
    name: string;
    zone?: string;
    address?: string;
    city?: string;
    pinCode?: string;
    contactNumber?: string;
    noOfEmployees?: number;
    isActive?: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class OrganizationService {
    private http = inject(HttpClient);
    private authService = inject(AuthService);
    private apiUrl = `${environment.apiUrl}/organization`;
    private readonly orgDraftKey = 'hrms_org_profile_draft';
    private readonly locationsKey = 'hrms_org_locations';

    private _activeModules = signal<string[]>([]);
    /**
     * Public signal of active module slugs
     */
    public activeModules = this._activeModules.asReadonly();

    /**
     * Check if a module is active (Helper)
     */
    isModuleEnabled(slug: string): boolean {
        return this._activeModules().includes(slug);
    }

    private normalizeDepartment(item: any): Department {
        return {
            id: Number(item?.id ?? 0),
            name: item?.name ?? item?.departmentName ?? item?.department_name ?? 'Unnamed Department',
            orgId: Number(item?.orgId ?? item?.org_id ?? 0),
            parentId: item?.parentId ?? item?.parent_id ?? null,
            description: item?.description ?? null,
            isActive: Boolean(item?.isActive ?? item?.is_active ?? 1)
        };
    }

    private normalizeDesignation(item: any): Designation {
        return {
            id: Number(item?.id ?? 0),
            name: item?.name ?? item?.designationName ?? item?.designation_name ?? 'Unnamed Designation',
            orgId: Number(item?.orgId ?? item?.org_id ?? 0),
            departmentId: item?.departmentId ?? item?.department_id ?? null
        };
    }

    private normalizeOrganization(item: any): Organization {
        return {
            id: Number(item?.id ?? 1),
            name: item?.name ?? item?.organizationName ?? item?.organization_name ?? item?.companyName ?? item?.company_name ?? '',
            logo: item?.logo ?? item?.logoUrl ?? item?.logo_url ?? item?.organizationLogo ?? item?.organization_logo ?? item?.companyLogo ?? item?.company_logo ?? '',
            email: item?.email ?? '',
            phone: item?.phone ?? item?.orgContactNumber ?? item?.org_contact_number ?? '',
            address: item?.address ?? item?.orgStreet1 ?? '',
            city: item?.city ?? item?.orgCity ?? item?.org_city ?? '',
            state: item?.state ?? '',
            country: item?.country ?? '',
            postalCode: item?.postalCode ?? item?.postal_code ?? item?.orgPinCode ?? item?.org_pin_code ?? '',
            industry: item?.industry ?? '',
            timeZone: item?.timeZone ?? item?.time_zone ?? item?.timezone ?? '',
            orgStreet1: item?.orgStreet1 ?? item?.org_street1 ?? item?.address ?? '',
            orgStreet2: item?.orgStreet2 ?? item?.org_street2 ?? '',
            orgCity: item?.orgCity ?? item?.org_city ?? item?.city ?? '',
            orgPinCode: item?.orgPinCode ?? item?.org_pin_code ?? item?.postalCode ?? item?.postal_code ?? '',
            orgContactNumber: item?.orgContactNumber ?? item?.org_contact_number ?? item?.phone ?? '',
            billStreet1: item?.billStreet1 ?? item?.bill_street1 ?? '',
            billStreet2: item?.billStreet2 ?? item?.bill_street2 ?? '',
            billCity: item?.billCity ?? item?.bill_city ?? '',
            billPinCode: item?.billPinCode ?? item?.bill_pin_code ?? '',
            billContactNumber: item?.billContactNumber ?? item?.bill_contact_number ?? ''
        };
    }

    private normalizeLocation(item: any): OfficeLocation {
        return {
            id: Number(item?.id ?? 0),
            name: item?.name ?? item?.locationName ?? item?.location_name ?? 'Unnamed Location',
            zone: item?.zone ?? item?.region ?? '',
            address: item?.address ?? item?.street ?? '',
            city: item?.city ?? '',
            pinCode: item?.pinCode ?? item?.pin_code ?? '',
            contactNumber: item?.contactNumber ?? item?.contact_number ?? '',
            noOfEmployees: Number(item?.noOfEmployees ?? item?.employeeCount ?? item?.employee_count ?? 0),
            isActive: Boolean(item?.isActive ?? item?.is_active ?? true)
        };
    }

    private readLocalDraft(): Partial<Organization> {
        const user = this.authService.getStoredUser();
        const orgId = user?.orgId ?? user?.organizationId;
        const scopedKey = orgId ? `${this.orgDraftKey}_${orgId}` : this.orgDraftKey;

        try {
            const raw = localStorage.getItem(scopedKey);
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    }

    private saveLocalDraft(data: Partial<Organization>): void {
        const user = this.authService.getStoredUser();
        const orgId = user?.orgId ?? user?.organizationId ?? data?.id;
        const scopedKey = orgId ? `${this.orgDraftKey}_${orgId}` : this.orgDraftKey;

        try {
            localStorage.setItem(scopedKey, JSON.stringify(data));
        } catch {}
    }

    private getOrganizationFromUser(): Partial<Organization> {
        const user = this.authService.getStoredUser();
        return this.normalizeOrganization({
            id: user?.orgId ?? user?.organizationId ?? 0,
            name: user?.organizationName ?? user?.companyName ?? '',
            logo: user?.organizationLogo ?? user?.companyLogo ?? ''
        });
    }

    private mergeDefinedOrganization(base: Partial<Organization>, override: Partial<Organization>): Organization {
        const result: Record<string, any> = { ...base };

        Object.entries(override || {}).forEach(([key, value]) => {
            if (value === undefined || value === null) return;
            if (typeof value === 'string' && !value.trim()) return;
            result[key] = value;
        });

        return this.normalizeOrganization(result);
    }

    private readLocalLocations(): OfficeLocation[] {
        try {
            const raw = localStorage.getItem(this.locationsKey);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    }

    private saveLocalLocations(locations: OfficeLocation[]): void {
        try {
            localStorage.setItem(this.locationsKey, JSON.stringify(locations));
        } catch {}
    }

    getOrganization(): Observable<Organization> {
        const userOrg = this.getOrganizationFromUser();
        return this.http.get<any>(this.apiUrl).pipe(
            map(res => this.normalizeOrganization(res?.data ?? res)),
            map((org) => this.mergeDefinedOrganization(userOrg, org)),
            map((org) => this.mergeDefinedOrganization(org, this.readLocalDraft())),
            catchError(() => of(this.mergeDefinedOrganization(userOrg, this.readLocalDraft())))
        );
    }

    updateOrganization(data: Partial<Organization>): Observable<Organization> {
        const payload = {
            ...data,
            name: data.name,
            companyName: data.name,
            company_name: data.name,
            logo: data.logo,
            email: data.email,
            phone: data.phone ?? data.orgContactNumber,
            address: data.address ?? data.orgStreet1,
            city: data.city ?? data.orgCity,
            postalCode: data.postalCode ?? data.orgPinCode,
            postal_code: data.postalCode ?? data.orgPinCode,
            state: data.state,
            country: data.country,
            timeZone: data.timeZone,
            time_zone: data.timeZone,
            timezone: data.timeZone,
            orgStreet1: data.orgStreet1 ?? data.address,
            orgStreet2: data.orgStreet2,
            orgCity: data.orgCity ?? data.city,
            orgPinCode: data.orgPinCode ?? data.postalCode,
            orgContactNumber: data.orgContactNumber ?? data.phone,
            billStreet1: data.billStreet1,
            billStreet2: data.billStreet2,
            billCity: data.billCity,
            billPinCode: data.billPinCode,
            billContactNumber: data.billContactNumber
        };

        return this.http.put<any>(this.apiUrl, payload).pipe(
            map(res => this.normalizeOrganization(res?.data ?? res)),
            tap((org) => this.saveLocalDraft(org)),
            catchError(() => {
                const merged = this.normalizeOrganization({ ...this.readLocalDraft(), ...payload });
                this.saveLocalDraft(merged);
                return of(merged);
            })
        );
    }

    getDepartments(): Observable<Department[]> {
        return this.http.get<any>(`${this.apiUrl}/departments`).pipe(
            map(res => (res?.data ?? []).map((d: any) => this.normalizeDepartment(d)))
        );
    }

    createDepartment(payload: { name: string; parentId?: number | null; description?: string | null; isActive?: boolean }): Observable<Department> {
        const body = {
            // Keep multiple key styles so backend/controller can map any of them.
            name: payload.name,
            departmentName: payload.name,
            department_name: payload.name,
            parentId: payload.parentId ?? null,
            parent_id: payload.parentId ?? null,
            description: payload.description ?? null,
            isActive: payload.isActive ?? true,
            is_active: payload.isActive ?? true
        };
        return this.http.post<any>(`${this.apiUrl}/departments`, body).pipe(
            map(res => this.normalizeDepartment(res?.data ?? res))
        );
    }

    getDesignations(): Observable<Designation[]> {
        return this.http.get<any>(`${this.apiUrl}/designations`).pipe(
            map(res => (res?.data ?? []).map((d: any) => this.normalizeDesignation(d))),
            catchError(() =>
                this.http.get<any>(`${environment.apiUrl}/designations`).pipe(
                    map(res => (res?.data ?? []).map((d: any) => this.normalizeDesignation(d)))
                )
            )
        );
    }

    createDesignation(payload: { name: string; departmentId?: number | null }): Observable<Designation> {
        const body = { name: payload.name, departmentId: payload.departmentId ?? null };
        return this.http.post<any>(`${this.apiUrl}/designations`, body).pipe(
            map(res => this.normalizeDesignation(res?.data ?? res)),
            catchError(() =>
                this.http.post<any>(`${environment.apiUrl}/designations`, body).pipe(
                    map(res => this.normalizeDesignation(res?.data ?? res))
                )
            )
        );
    }

    getLocations(): Observable<OfficeLocation[]> {
        return this.http.get<any>(`${this.apiUrl}/locations`).pipe(
            map(res => {
                const records = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
                const normalized = records.map((item: any) => this.normalizeLocation(item));
                if (normalized.length) {
                    this.saveLocalLocations(normalized);
                }
                return normalized;
            }),
            catchError(() => of(this.readLocalLocations()))
        );
    }

    createLocation(payload: Partial<OfficeLocation>): Observable<OfficeLocation> {
        return this.http.post<any>(`${this.apiUrl}/locations`, payload).pipe(
            map(res => this.normalizeLocation(res?.data ?? res)),
            tap((location) => this.saveLocalLocations([location, ...this.readLocalLocations().filter(item => item.id !== location.id)])),
            catchError(() => {
                const localLocation = this.normalizeLocation({
                    ...payload,
                    id: Date.now()
                });
                this.saveLocalLocations([localLocation, ...this.readLocalLocations()]);
                return of(localLocation);
            })
        );
    }

    deleteLocation(locationId: number): Observable<boolean> {
        return this.http.delete<any>(`${this.apiUrl}/locations/${locationId}`).pipe(
            map(() => true),
            tap(() => this.saveLocalLocations(this.readLocalLocations().filter(item => item.id !== locationId))),
            catchError(() => {
                this.saveLocalLocations(this.readLocalLocations().filter(item => item.id !== locationId));
                return of(true);
            })
        );
    }

    getAddons(): Observable<any[]> {
        return this.http.get<any>(`${this.apiUrl}/addons`).pipe(
            map(res => {
                const addons = res.data;
                const activeSlugs = addons.filter((a: any) => a.isActive).map((a: any) => a.slug);
                this._activeModules.set(activeSlugs);
                return addons;
            })
        );
    }

    toggleAddon(addonId: number, isActive: boolean): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/addons/toggle`, { addonId, isActive }).pipe(
            map(res => {
                // Refresh local signal
                this.getAddons().subscribe();
                return res;
            })
        );
    }
}
