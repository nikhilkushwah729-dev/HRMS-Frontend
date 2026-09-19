import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface KioskDeviceConfig {
  orgId: number;
  orgLocationId?: number | null;
  name: string;
  location: string;
  deviceId: string;
  deviceToken?: string | null;
}

export interface KioskSummary {
  id: number;
  orgId: number;
  orgLocationId: number | null;
  name: string;
  location: string;
  deviceId: string;
  status: 'pending' | 'active' | 'inactive' | 'blocked';
  lastSeenAt?: string | null;
  approvedAt?: string | null;
  deviceToken?: string | null;
}

export interface AttendanceLogItem {
  id: number;
  attendanceDate: string;
  type: 'check_in' | 'check_out';
  method: 'face' | 'pin' | 'qr';
  status: 'success' | 'failed' | 'suspicious';
  lateMinutes: number;
  earlyExitMinutes: number;
  overtimeMinutes: number;
  timestamp: string;
  failureReason?: string | null;
  employee?: {
    id: number;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    employeeCode?: string;
  } | null;
  kiosk?: {
    id: number;
    name: string;
    location: string;
  } | null;
}

export interface FaceProfileApproval {
  id: number;
  status: 'pending' | 'active' | 'inactive' | 'rejected';
  referenceImageUrl?: string | null;
  createdAt: string;
  employee?: {
    id: number;
    firstName?: string;
    lastName?: string;
    employeeCode?: string;
  } | null;
}

export interface EmployeeKioskQrToken {
  employeeCode: string;
  token: string;
  expiresAt: string;
}

@Injectable({ providedIn: 'root' })
export class KioskService {
  private http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;
  private readonly localConfigKey = 'hrms_kiosk_device_config';
  private readonly fallbackDeviceKey = 'hrms_kiosk_fallback_device_id';

  createFallbackDeviceId(): string {
    const existing = localStorage.getItem(this.fallbackDeviceKey);
    if (existing) {
      return existing;
    }

    const value = `kiosk-${crypto.randomUUID()}`;
    localStorage.setItem(this.fallbackDeviceKey, value);
    return value;
  }

  getStoredConfig(): KioskDeviceConfig | null {
    const raw = localStorage.getItem(this.localConfigKey);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as KioskDeviceConfig;
    } catch {
      return null;
    }
  }

  saveStoredConfig(config: KioskDeviceConfig) {
    localStorage.setItem(this.localConfigKey, JSON.stringify(config));
  }

  clearStoredConfig() {
    localStorage.removeItem(this.localConfigKey);
  }

  registerKiosk(payload: KioskDeviceConfig): Observable<KioskSummary> {
    return this.http
      .post<any>(`${this.apiUrl}/kiosks/register`, payload)
      .pipe(map((response) => response?.data ?? response));
  }

  validateKiosk(
    deviceId: string,
    deviceToken: string,
  ): Observable<KioskSummary> {
    return this.http
      .post<any>(`${this.apiUrl}/kiosks/validate`, { deviceId, deviceToken })
      .pipe(
        map((response) => ({
          deviceId,
          deviceToken,
          ...(response?.data ?? response),
        })),
      );
  }

  getKiosks(status?: string): Observable<KioskSummary[]> {
    const suffix = status ? `?status=${encodeURIComponent(status)}` : '';
    return this.http
      .get<any>(`${this.apiUrl}/kiosks${suffix}`)
      .pipe(map((response) => response?.data ?? []));
  }

  getKiosk(id: number): Observable<KioskSummary | null> {
    return this.http
      .get<any>(`${this.apiUrl}/kiosks/${id}`)
      .pipe(map((response) => response?.data ?? null));
  }

  approveKiosk(
    id: number,
    payload: { orgLocationId?: number | null } = {},
  ): Observable<KioskSummary> {
    return this.http
      .patch<any>(`${this.apiUrl}/kiosks/${id}/approve`, payload)
      .pipe(map((response) => response?.data ?? response));
  }

  blockKiosk(id: number): Observable<KioskSummary> {
    return this.http
      .patch<any>(`${this.apiUrl}/kiosks/${id}/block`, {})
      .pipe(map((response) => response?.data ?? response));
  }

  toggleKiosk(id: number): Observable<KioskSummary> {
    return this.http
      .patch<any>(`${this.apiUrl}/kiosks/${id}/toggle`, {})
      .pipe(map((response) => response?.data ?? response));
  }

  resetToken(id: number): Observable<KioskSummary> {
    return this.http
      .patch<any>(`${this.apiUrl}/kiosks/${id}/reset-token`, {})
      .pipe(map((response) => response?.data ?? response));
  }

  getAttendanceLogs(filters: Record<string, string | number> = {}): Observable<{
    data: AttendanceLogItem[];
    meta?: any;
  }> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, String(value));
      }
    });

    const query = params.toString();
    return this.http
      .get<any>(
        `${this.apiUrl}/kiosk/attendance/logs${query ? `?${query}` : ''}`,
      )
      .pipe(
        map((response) => ({
          data: response?.data ?? [],
          meta: response?.meta,
        })),
      );
  }

  getPendingFaceProfiles(): Observable<FaceProfileApproval[]> {
    return this.http
      .get<any>(`${this.apiUrl}/face-profiles/pending`)
      .pipe(map((response) => response?.data ?? []));
  }

  approveFaceProfile(id: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/face-profiles/${id}/approve`, {});
  }

  rejectFaceProfile(id: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/face-profiles/${id}/reject`, {});
  }

  getMyKioskQrToken(): Observable<EmployeeKioskQrToken | null> {
    return this.http
      .get<any>(`${this.apiUrl}/ess/kiosk-qr`)
      .pipe(map((response) => response?.data ?? null));
  }

  getCompanyNameFromUser(): Observable<string> {
    const rawUser = localStorage.getItem('hrms_user_data');
    if (!rawUser) {
      return of('HRMS Kiosk');
    }

    try {
      const user = JSON.parse(rawUser);
      return of(
        user?.organizationName ||
          user?.companyName ||
          user?.organization?.name ||
          'HRMS Kiosk',
      );
    } catch {
      return of('HRMS Kiosk');
    }
  }
}
