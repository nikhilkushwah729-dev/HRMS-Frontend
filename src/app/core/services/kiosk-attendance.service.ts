import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { KioskDeviceConfig } from './kiosk.service';

export interface KioskAttendanceResult {
  employee: {
    id: number;
    employeeCode?: string;
    name: string;
  };
  kiosk: {
    id: number;
    name: string;
    location: string;
  };
  attendance: {
    id: number;
    type: 'check_in' | 'check_out';
    status: string;
    method: 'face' | 'pin' | 'qr';
    timestamp: string;
    lateMinutes: number;
    earlyExitMinutes: number;
    overtimeMinutes: number;
  };
  message: string;
}

@Injectable({ providedIn: 'root' })
export class KioskAttendanceService {
  private http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  submitFaceAttendance(
    config: KioskDeviceConfig,
    payload: {
      embedding: number[];
      imageUrl?: string;
      type?: 'check_in' | 'check_out';
      clientReference?: string;
      liveness?: {
        confirmed?: boolean;
        blinkDetected?: boolean;
        headMovementDetected?: boolean;
      };
    },
  ): Observable<KioskAttendanceResult> {
    return this.http
      .post<any>(
        `${this.apiUrl}/kiosk/attendance/face`,
        this.withDeviceCredentials(config, payload),
        {
        headers: this.createKioskHeaders(config),
        },
      )
      .pipe(map((response) => response?.data ?? response));
  }

  submitPinAttendance(
    config: KioskDeviceConfig,
    payload: {
      employeeCode: string;
      pin: string;
      type?: 'check_in' | 'check_out';
      clientReference?: string;
    },
  ): Observable<KioskAttendanceResult> {
    return this.http
      .post<any>(
        `${this.apiUrl}/kiosk/attendance/pin`,
        this.withDeviceCredentials(config, payload),
        {
        headers: this.createKioskHeaders(config),
        },
      )
      .pipe(map((response) => response?.data ?? response));
  }

  submitQrAttendance(
    config: KioskDeviceConfig,
    payload: {
      qrToken: string;
      type?: 'check_in' | 'check_out';
      clientReference?: string;
    },
  ): Observable<KioskAttendanceResult> {
    return this.http
      .post<any>(
        `${this.apiUrl}/kiosk/attendance/qr`,
        this.withDeviceCredentials(config, payload),
        {
        headers: this.createKioskHeaders(config),
        },
      )
      .pipe(map((response) => response?.data ?? response));
  }

  submitOfflineSync(config: KioskDeviceConfig, records: any[]) {
    return this.http
      .post<any>(
        `${this.apiUrl}/kiosk/offline-sync`,
        this.withDeviceCredentials(config, { records }),
        { headers: this.createKioskHeaders(config) },
      )
      .pipe(map((response) => response?.data ?? []));
  }

  submitFaceProfile(
    employeeId: number,
    payload: {
      embedding: number[];
      referenceImageUrl?: string;
    },
  ) {
    return this.http.post(`${this.apiUrl}/employees/${employeeId}/face-profile`, payload);
  }

  private createKioskHeaders(config: KioskDeviceConfig) {
    return new HttpHeaders({
      Authorization: `Bearer ${config.deviceToken ?? ''}`,
      'X-Kiosk-Token': config.deviceToken ?? '',
      'X-Device-Id': config.deviceId,
    });
  }

  private withDeviceCredentials<T extends Record<string, unknown>>(
    config: KioskDeviceConfig,
    payload: T,
  ) {
    return {
      ...payload,
      deviceId: config.deviceId,
      deviceToken: config.deviceToken ?? '',
      device_id: config.deviceId,
      device_token: config.deviceToken ?? '',
    };
  }
}
