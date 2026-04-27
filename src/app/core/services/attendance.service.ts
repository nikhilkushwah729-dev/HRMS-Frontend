import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject, catchError, map, of, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AttendanceRecord {
    id: number;
    employee_id: number;
    employee_code?: string;
    date: string;
    check_in: string | null;
    check_out: string | null;
    work_hours: number | null;
    net_work_hours?: number | null;
    total_break_min?: number;
    status: 'present' | 'absent' | 'half_day' | 'late' | 'on_leave' | 'holiday' | 'weekend';
    selfie_url: string | null;
    is_late: boolean;
    is_half_day: boolean;
    shift_id?: number;
    shift_name?: string;
    source?: string;
    attendance_method?: string | null;
    kiosk_name?: string | null;
    device_info?: string | null;
    latitude?: number;
    longitude?: number;
    location_address?: string;
    notes?: string;
    created_at?: string;
    updated_at?: string;
    employee?: {
        id: number;
        firstName: string;
        lastName: string;
        email: string;
        avatar?: string;
        department?: string;
    };
}

export interface TodayAttendance {
    id?: number;
    is_clocked_in: boolean;
    is_clocked_out: boolean;
    check_in?: string | null;
    check_out?: string | null;
    current_status: 'working' | 'on_break' | 'offline';
    break_time_minutes: number;
    total_work_hours: number;
    overtime_hours: number;
    shift?: {
        id: number;
        name: string;
        start_time: string;
        end_time: string;
    };
    last_location?: {
        lat: number;
        lng: number;
        address?: string;
    };
}

export interface AttendanceStats {
    total_present: number;
    total_absent: number;
    total_late: number;
    total_half_day: number;
    total_leave: number;
    total_holiday: number;
    total_weekend: number;
    total_work_hours: number;
    average_arrival_time: string;
    punctuality_percentage: number;
    overtime_hours: number;
}

export interface BreakRecord {
    id: number;
    attendance_id: number;
    start_time: string;
    end_time?: string;
    duration_minutes: number;
    type: 'break' | 'lunch' | 'short_break';
}

export interface ManualAttendanceRequest {
    id?: number;
    employee_id: number;
    date: string;
    check_in: string;
    check_out?: string;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    approved_by?: number;
    approved_at?: string;
    created_at: string;
}

export interface GeoFenceZone {
    id: number;
    name: string;
    center_lat: number;
    center_lng: number;
    radius_meters: number;
    is_active: boolean;
}

export interface AttendanceShift {
    id: number;
    name: string;
    start_time: string;
    end_time: string;
    grace_time: number;
    working_hours: number;
    shift_type: string;
    is_active: boolean;
}

export interface GeoFenceSettings {
    geofence_enabled: boolean;
    zones: GeoFenceZone[];
    require_geofence_for_all: boolean;
}

export interface AttendanceFilter {
    startDate?: string;
    endDate?: string;
    employeeId?: number;
    departmentId?: number;
    status?: string;
}

export interface AttendanceDashboardSummary {
    totalRecords: number;
    present: number;
    absent: number;
    late: number;
    halfDay: number;
    onLeave: number;
    holiday: number;
    weekend: number;
    totalWorkHours: number;
    averageWorkHours: number;
    attendancePercentage: number;
}

export interface AttendanceDashboardStatusBreakdown {
    status: AttendanceRecord['status'];
    label: string;
    count: number;
    percent: number;
}

export interface AttendanceDashboardDepartmentBreakdown {
    departmentId: number | null;
    departmentName: string;
    count: number;
    totalWorkHours: number;
    present: number;
    late: number;
    halfDay: number;
    onLeave: number;
    averageWorkHours: number;
    percent: number;
}

export interface AttendanceDashboardLeaderboardItem {
    employeeId: number;
    employeeName: string;
    employeeCode: string;
    department: string;
    avatar: string | null;
    records: number;
    present: number;
    late: number;
    halfDay: number;
    onLeave: number;
    totalWorkHours: number;
    averageWorkHours: number;
    latestDate: string;
}

export interface AttendanceDashboardResponse {
    range: {
        startDate: string | null;
        endDate: string | null;
    };
    summary: AttendanceDashboardSummary;
    records: AttendanceRecord[];
    leaderboard: AttendanceDashboardLeaderboardItem[];
    statusBreakdown: AttendanceDashboardStatusBreakdown[];
    departmentBreakdown: AttendanceDashboardDepartmentBreakdown[];
    recentRecords: AttendanceRecord[];
}

@Injectable({
    providedIn: 'root'
})
export class AttendanceService {
    private http = inject(HttpClient);
    private readonly apiUrl = environment.apiUrl;
    private readonly localShiftKey = 'hrms_attendance_shifts';
    private readonly localZoneKey = 'hrms_attendance_zones';
    private readonly localGeoFenceSettingsKey = 'hrms_attendance_geofence_settings';
    private readonly sharedCacheTtlMs = 5 * 60 * 1000;
    private shiftsCache$?: Observable<AttendanceShift[]>;
    private shiftsCacheAt = 0;

    private pollingSubject = new Subject<boolean>();
    private statusUpdateSubject = new Subject<TodayAttendance>();

    get statusUpdates$() {
        return this.statusUpdateSubject.asObservable();
    }

    get pollingActive$() {
        return this.pollingSubject.asObservable();
    }

    private normalizeShift(raw: any): AttendanceShift {
        const start = raw?.start_time ?? raw?.startTime ?? raw?.timeIn ?? '09:00';
        const end = raw?.end_time ?? raw?.endTime ?? raw?.timeOut ?? '18:00';
        const workingHoursRaw = raw?.working_hours ?? raw?.workingHours;

        return {
            id: Number(raw?.id ?? Date.now()),
            name: raw?.name ?? raw?.shiftName ?? 'General Shift',
            start_time: String(start),
            end_time: String(end),
            grace_time: Number(raw?.grace_time ?? raw?.graceTime ?? 0),
            working_hours: Number(
                workingHoursRaw ?? this.calculateWorkingHours(String(start), String(end))
            ),
            shift_type: raw?.shift_type ?? raw?.shiftType ?? (String(start).toLowerCase() === 'flexible' ? 'Flexi' : 'Fixed'),
            is_active: Boolean(raw?.is_active ?? raw?.isActive ?? true)
        };
    }

    private normalizeZone(raw: any): GeoFenceZone {
        return {
            id: Number(raw?.id ?? Date.now()),
            name: raw?.name ?? raw?.location_name ?? 'Attendance Zone',
            center_lat: Number(raw?.center_lat ?? raw?.centerLat ?? raw?.latitude ?? 0),
            center_lng: Number(raw?.center_lng ?? raw?.centerLng ?? raw?.longitude ?? 0),
            radius_meters: Number(raw?.radius_meters ?? raw?.radiusMeters ?? 100),
            is_active: Boolean(raw?.is_active ?? raw?.isActive ?? true)
        };
    }

    private calculateWorkingHours(start: string, end: string): number {
        const parseTime = (value: string) => {
            const match = value.match(/^(\d{1,2}):(\d{2})/);
            if (!match) return 0;
            return Number(match[1]) * 60 + Number(match[2]);
        };

        const startMinutes = parseTime(start);
        const endMinutes = parseTime(end);
        const diff = endMinutes >= startMinutes ? endMinutes - startMinutes : (24 * 60 - startMinutes) + endMinutes;
        return Math.max(1, Math.round((diff / 60) * 10) / 10);
    }

    private readLocalState<T>(key: string, fallback: T): T {
        try {
            const stored = localStorage.getItem(key);
            return stored ? JSON.parse(stored) as T : fallback;
        } catch {
            return fallback;
        }
    }

    private saveLocalState<T>(key: string, value: T): void {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch {
            // Ignore storage quota issues and keep UI functional.
        }
    }

    private getLocalShifts(): AttendanceShift[] {
        const stored = this.readLocalState<any[]>(this.localShiftKey, []);
        if (stored.length > 0) {
            return stored.map((item) => this.normalizeShift(item));
        }

        return [
            this.normalizeShift({ id: 9001, name: 'General Shift', start_time: '09:00', end_time: '18:00', grace_time: 15, working_hours: 9, shift_type: 'Fixed', is_active: true }),
            this.normalizeShift({ id: 9002, name: 'Morning Shift', start_time: '06:00', end_time: '14:00', grace_time: 10, working_hours: 8, shift_type: 'Fixed', is_active: true }),
            this.normalizeShift({ id: 9003, name: 'Night Shift', start_time: '20:00', end_time: '05:00', grace_time: 20, working_hours: 9, shift_type: 'Fixed', is_active: true })
        ];
    }

    private getLocalZones(): GeoFenceZone[] {
        const stored = this.readLocalState<any[]>(this.localZoneKey, []);
        if (stored.length > 0) {
            return stored.map((item) => this.normalizeZone(item));
        }

        return [
            this.normalizeZone({ id: 9101, name: 'HQ Campus', latitude: 28.6139, longitude: 77.209, radius_meters: 150, is_active: true }),
            this.normalizeZone({ id: 9102, name: 'Warehouse Yard', latitude: 28.5355, longitude: 77.391, radius_meters: 250, is_active: true })
        ];
    }

    private getLocalGeoFenceSettings(): GeoFenceSettings {
        return this.readLocalState<GeoFenceSettings>(this.localGeoFenceSettingsKey, {
            geofence_enabled: true,
            require_geofence_for_all: false,
            zones: this.getLocalZones()
        });
    }

    private mergeZones(serverZones: GeoFenceZone[], localZones: GeoFenceZone[]): GeoFenceZone[] {
        const mapById = new Map<number, GeoFenceZone>();
        [...serverZones, ...localZones].forEach((zone) => {
            mapById.set(zone.id, this.normalizeZone(zone));
        });
        return Array.from(mapById.values());
    }

    private normalizeAttendanceRecord(raw: any): AttendanceRecord {
        let parsedDeviceInfo: any = null;
        const rawDeviceInfo = raw?.deviceInfo ?? raw?.device_info ?? null;

        if (typeof rawDeviceInfo === 'string') {
            try {
                parsedDeviceInfo = JSON.parse(rawDeviceInfo);
            } catch {
                parsedDeviceInfo = null;
            }
        } else if (rawDeviceInfo && typeof rawDeviceInfo === 'object') {
            parsedDeviceInfo = rawDeviceInfo;
        }

        const employeeName = String(
            raw?.employeeName ??
            raw?.employee_name ??
            raw?.employee?.name ??
            `${raw?.employee?.firstName ?? raw?.employee?.first_name ?? ''} ${raw?.employee?.lastName ?? raw?.employee?.last_name ?? ''}`
        ).trim();
        const [firstName, ...rest] = employeeName ? employeeName.split(' ') : ['Employee'];
        const lastName =
            rest.join(' ') ||
            String(raw?.employeeCode ?? raw?.employee_code ?? raw?.employee?.employeeCode ?? raw?.employee?.employee_code ?? '').trim() ||
            '';
        const employeeDepartment = String(
            raw?.department ??
            raw?.employee?.department ??
            raw?.employee?.departmentName ??
            raw?.employee?.department_name ??
            ''
        ).trim();

        return {
            id: Number(raw?.id ?? Date.now()),
            employee_id: Number(raw?.employeeId ?? raw?.employee_id ?? raw?.employee?.id ?? 0),
            employee_code: String(
                raw?.employeeCode ??
                raw?.employee_code ??
                raw?.employee?.employeeCode ??
                raw?.employee?.employee_code ??
                ''
            ).trim() || undefined,
            date: String(raw?.date ?? raw?.attendance_date ?? new Date().toISOString().slice(0, 10)),
            check_in: raw?.checkInTime ?? raw?.check_in ?? raw?.checkIn ?? null,
            check_out: raw?.checkOutTime ?? raw?.check_out ?? raw?.checkOut ?? null,
            work_hours: raw?.workHours ?? raw?.work_hours ?? null,
            net_work_hours: raw?.netWorkHours ?? raw?.net_work_hours ?? null,
            total_break_min: Number(raw?.totalBreakMin ?? raw?.total_break_min ?? 0),
            status: raw?.status ?? 'present',
            selfie_url: raw?.selfieUrl ?? raw?.selfie_url ?? null,
            is_late: Boolean(raw?.lateMinutes ?? raw?.isLate ?? raw?.status === 'late'),
            is_half_day: Boolean(raw?.isHalfDay ?? raw?.status === 'half_day'),
            shift_id: raw?.shiftId ?? raw?.shift_id,
            shift_name: raw?.shiftName ?? raw?.shift_name,
            source: raw?.source ?? parsedDeviceInfo?.source ?? undefined,
            attendance_method: raw?.attendanceMethod ?? raw?.attendance_method ?? parsedDeviceInfo?.method ?? null,
            kiosk_name: raw?.kioskName ?? raw?.kiosk_name ?? parsedDeviceInfo?.kioskName ?? null,
            device_info: typeof rawDeviceInfo === 'string' ? rawDeviceInfo : rawDeviceInfo ? JSON.stringify(rawDeviceInfo) : null,
            latitude: raw?.latitude,
            longitude: raw?.longitude,
            location_address: raw?.locationAddress ?? raw?.location_address,
            notes: raw?.notes ?? undefined,
            created_at: raw?.createdAt ?? raw?.created_at,
            updated_at: raw?.updatedAt ?? raw?.updated_at,
            employee: {
                id: Number(raw?.employeeId ?? raw?.employee_id ?? raw?.employee?.id ?? 0),
                firstName: (raw?.employee?.firstName ?? raw?.employee?.first_name ?? firstName) || 'Employee',
                lastName: raw?.employee?.lastName ?? raw?.employee?.last_name ?? lastName,
                email: raw?.email ?? raw?.employee?.email ?? '',
                avatar: raw?.avatar ?? raw?.employee?.avatar ?? null,
                department: employeeDepartment || undefined,
            },
        };
    }

    private normalizeDashboardResponse(raw: any): AttendanceDashboardResponse {
        const payload = raw?.data || raw || {};
        return {
            range: {
                startDate: payload?.range?.startDate ?? payload?.range?.start_date ?? null,
                endDate: payload?.range?.endDate ?? payload?.range?.end_date ?? null,
            },
            summary: {
                totalRecords: Number(payload?.summary?.totalRecords ?? payload?.summary?.total_records ?? 0),
                present: Number(payload?.summary?.present ?? 0),
                absent: Number(payload?.summary?.absent ?? 0),
                late: Number(payload?.summary?.late ?? 0),
                halfDay: Number(payload?.summary?.halfDay ?? payload?.summary?.half_day ?? 0),
                onLeave: Number(payload?.summary?.onLeave ?? payload?.summary?.on_leave ?? 0),
                holiday: Number(payload?.summary?.holiday ?? 0),
                weekend: Number(payload?.summary?.weekend ?? 0),
                totalWorkHours: Number(payload?.summary?.totalWorkHours ?? payload?.summary?.total_work_hours ?? 0),
                averageWorkHours: Number(payload?.summary?.averageWorkHours ?? payload?.summary?.average_work_hours ?? 0),
                attendancePercentage: Number(payload?.summary?.attendancePercentage ?? payload?.summary?.attendance_percentage ?? 0),
            },
            records: Array.isArray(payload?.records) ? payload.records.map((record: any) => this.normalizeAttendanceRecord(record)) : [],
            leaderboard: Array.isArray(payload?.leaderboard)
                ? payload.leaderboard.map((item: any) => ({
                    employeeId: Number(item?.employeeId ?? item?.employee_id ?? 0),
                    employeeName: String(item?.employeeName ?? item?.employee_name ?? 'Employee'),
                    employeeCode: String(item?.employeeCode ?? item?.employee_code ?? 'N/A'),
                    department: String(item?.department ?? 'General'),
                    avatar: item?.avatar ?? null,
                    records: Number(item?.records ?? 0),
                    present: Number(item?.present ?? 0),
                    late: Number(item?.late ?? 0),
                    halfDay: Number(item?.halfDay ?? item?.half_day ?? 0),
                    onLeave: Number(item?.onLeave ?? item?.on_leave ?? 0),
                    totalWorkHours: Number(item?.totalWorkHours ?? item?.total_work_hours ?? 0),
                    averageWorkHours: Number(item?.averageWorkHours ?? item?.average_work_hours ?? 0),
                    latestDate: String(item?.latestDate ?? item?.latest_date ?? ''),
                }))
                : [],
            statusBreakdown: Array.isArray(payload?.statusBreakdown)
                ? payload.statusBreakdown.map((item: any) => ({
                    status: item?.status,
                    label: String(item?.label ?? ''),
                    count: Number(item?.count ?? 0),
                    percent: Number(item?.percent ?? 0),
                }))
                : [],
            departmentBreakdown: Array.isArray(payload?.departmentBreakdown)
                ? payload.departmentBreakdown.map((item: any) => ({
                    departmentId: item?.departmentId ?? item?.department_id ?? null,
                    departmentName: String(item?.departmentName ?? item?.department_name ?? 'General'),
                    count: Number(item?.count ?? 0),
                    totalWorkHours: Number(item?.totalWorkHours ?? item?.total_work_hours ?? 0),
                    present: Number(item?.present ?? 0),
                    late: Number(item?.late ?? 0),
                    halfDay: Number(item?.halfDay ?? item?.half_day ?? 0),
                    onLeave: Number(item?.onLeave ?? item?.on_leave ?? 0),
                    averageWorkHours: Number(item?.averageWorkHours ?? item?.average_work_hours ?? 0),
                    percent: Number(item?.percent ?? 0),
                }))
                : [],
            recentRecords: Array.isArray(payload?.recentRecords)
                ? payload.recentRecords.map((record: any) => this.normalizeAttendanceRecord(record))
                : [],
        };
    }

    getAttendanceHistory(filters?: AttendanceFilter): Observable<AttendanceRecord[]> {
        let params = new HttpParams();

        if (filters) {
            if (filters.startDate) params = params.set('start_date', filters.startDate);
            if (filters.endDate) params = params.set('end_date', filters.endDate);
            if (filters.employeeId) params = params.set('employee_id', filters.employeeId.toString());
            if (filters.departmentId) params = params.set('department_id', filters.departmentId.toString());
            if (filters.status) params = params.set('status', filters.status);
        }

        return this.http.get<any>(`${this.apiUrl}/attendance/history`, { params }).pipe(
            map((res) => {
                const records = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
                return records.map((record: any) => this.normalizeAttendanceRecord(record));
            })
        );
    }

    getAttendanceDashboard(filters?: AttendanceFilter): Observable<AttendanceDashboardResponse> {
        let params = new HttpParams();

        if (filters) {
            if (filters.startDate) params = params.set('startDate', filters.startDate);
            if (filters.endDate) params = params.set('endDate', filters.endDate);
            if (filters.employeeId) params = params.set('employeeId', filters.employeeId.toString());
            if (filters.departmentId) params = params.set('departmentId', filters.departmentId.toString());
            if (filters.status) params = params.set('status', filters.status);
        }

        return this.http.get<any>(`${this.apiUrl}/reports/attendance-dashboard`, { params }).pipe(
            map((res) => this.normalizeDashboardResponse(res))
        );
    }

    getTodayAttendance(): Observable<TodayAttendance> {
        return this.http.get<any>(`${this.apiUrl}/attendance/today`).pipe(
            map((res) => res.data || res)
        );
    }

    checkIn(data: {
        source?: string;
        latitude?: number;
        longitude?: number;
        shiftId?: number;
        deviceInfo?: string;
        selfieUrl?: string;
        notes?: string;
    }): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/attendance/check-in`, data).pipe(
            map((res) => res.data || res)
        );
    }

    checkOut(data: {
        source?: string;
        latitude?: number;
        longitude?: number;
        selfieUrl?: string;
        notes?: string;
    }): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/attendance/check-out`, data).pipe(
            map((res) => res.data || res)
        );
    }

    startBreak(data: { type?: 'break' | 'lunch' | 'short_break' } = {}): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/attendance/break/start`, data).pipe(
            map((res) => res.data || res)
        );
    }

    endBreak(): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/attendance/break/end`, {}).pipe(
            map((res) => res.data || res)
        );
    }

    getTodayBreaks(): Observable<BreakRecord[]> {
        return this.http.get<any>(`${this.apiUrl}/attendance/breaks/today`).pipe(
            map((res) => res.data || res)
        );
    }

    getAttendanceStats(period: 'week' | 'month' | 'year' = 'month'): Observable<AttendanceStats> {
        const params = new HttpParams().set('period', period);
        return this.http.get<any>(`${this.apiUrl}/attendance/stats`, { params }).pipe(
            map((res) => res.data || res)
        );
    }

    getMonthlyAttendance(year: number, month: number): Observable<AttendanceRecord[]> {
        const params = new HttpParams()
            .set('year', year.toString())
            .set('month', month.toString());

        return this.http.get<any>(`${this.apiUrl}/attendance/monthly`, { params }).pipe(
            map((res) => {
                const records = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
                return records.map((record: any) => this.normalizeAttendanceRecord(record));
            })
        );
    }

    requestManualAttendance(data: {
        date: string;
        check_in: string;
        check_out?: string;
        reason: string;
    }): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/attendance/manual/request`, data).pipe(
            map((res) => res.data || res)
        );
    }

    getManualAttendanceRequests(): Observable<ManualAttendanceRequest[]> {
        return this.http.get<any>(`${this.apiUrl}/attendance/manual/requests`).pipe(
            map((res) => res.data || res)
        );
    }

    requestOvertime(data: {
        date: string;
        hours: number;
        reason: string;
    }): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/attendance/overtime/request`, data).pipe(
            map((res) => res.data || res)
        );
    }

    getOvertimeRecords(): Observable<any[]> {
        return this.http.get<any>(`${this.apiUrl}/attendance/overtime`).pipe(
            map((res) => res.data || res)
        );
    }

    validateLocation(lat: number, lng: number): Observable<{ valid: boolean; zone?: GeoFenceZone; distance?: number }> {
        const params = new HttpParams()
            .set('lat', lat.toString())
            .set('lng', lng.toString());

        return this.http.get<any>(`${this.apiUrl}/attendance/validate-location`, { params }).pipe(
            map((res) => res.data || res)
        );
    }

    getGeoFenceZones(): Observable<GeoFenceZone[]> {
        const localZones = this.getLocalZones();
        return this.http.get<any>(`${this.apiUrl}/attendance/zones`).pipe(
            map((res) => {
                const zones = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
                const normalized = zones.map((zone: any) => this.normalizeZone(zone));
                return this.mergeZones(normalized, localZones);
            }),
            catchError(() => of(localZones))
        );
    }

    createGeoFenceZone(data: {
        name: string;
        latitude: number;
        longitude: number;
        radius_meters: number;
    }): Observable<GeoFenceZone> {
        const fallbackZone = this.normalizeZone({
            id: Date.now(),
            name: data.name,
            latitude: data.latitude,
            longitude: data.longitude,
            radius_meters: data.radius_meters,
            is_active: true
        });

        return this.http.post<any>(`${this.apiUrl}/attendance/zones`, data).pipe(
            map((res) => this.normalizeZone(res?.data || res)),
            catchError(() => {
                const nextZones = [fallbackZone, ...this.getLocalZones()];
                this.saveLocalState(this.localZoneKey, nextZones);
                return of(fallbackZone);
            })
        );
    }

    updateGeoFenceZone(id: number, data: {
        name?: string;
        latitude?: number;
        longitude?: number;
        radius_meters?: number;
        is_active?: boolean;
    }): Observable<GeoFenceZone> {
        return this.http.put<any>(`${this.apiUrl}/attendance/zones/${id}`, data).pipe(
            map((res) => this.normalizeZone(res?.data || res)),
            catchError(() => {
                const nextZones = this.getLocalZones().map((zone) => zone.id === id
                    ? this.normalizeZone({ ...zone, ...data })
                    : zone);
                this.saveLocalState(this.localZoneKey, nextZones);
                const updatedZone = nextZones.find((zone) => zone.id === id) ?? this.normalizeZone({ id, ...data });
                return of(updatedZone);
            })
        );
    }

    deleteGeoFenceZone(id: number): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/attendance/zones/${id}`).pipe(
            catchError(() => {
                const nextZones = this.getLocalZones().filter((zone) => zone.id !== id);
                this.saveLocalState(this.localZoneKey, nextZones);
                return of({ success: true });
            })
        );
    }

    getGeoFenceSettings(): Observable<GeoFenceSettings> {
        const fallback = this.getLocalGeoFenceSettings();
        return this.http.get<any>(`${this.apiUrl}/attendance/geofence-settings`).pipe(
            map((res) => {
                const payload = res?.data || res || {};
                return {
                    geofence_enabled: Boolean(payload.geofence_enabled ?? payload.geofenceEnabled ?? fallback.geofence_enabled),
                    require_geofence_for_all: Boolean(payload.require_geofence_for_all ?? payload.requireGeofenceForAll ?? fallback.require_geofence_for_all),
                    zones: this.mergeZones(
                        Array.isArray(payload.zones) ? payload.zones.map((zone: any) => this.normalizeZone(zone)) : [],
                        this.getLocalZones()
                    )
                };
            }),
            catchError(() => of(fallback))
        );
    }

    updateGeoFenceSettings(data: {
        geofence_enabled?: boolean;
        require_geofence_for_all?: boolean;
    }): Observable<GeoFenceSettings> {
        const fallback = {
            ...this.getLocalGeoFenceSettings(),
            ...data,
            zones: this.getLocalZones()
        };

        return this.http.put<any>(`${this.apiUrl}/attendance/geofence-settings`, data).pipe(
            map((res) => {
                const payload = res?.data || res || fallback;
                const settings: GeoFenceSettings = {
                    geofence_enabled: Boolean(payload.geofence_enabled ?? payload.geofenceEnabled ?? fallback.geofence_enabled),
                    require_geofence_for_all: Boolean(payload.require_geofence_for_all ?? payload.requireGeofenceForAll ?? fallback.require_geofence_for_all),
                    zones: this.getLocalZones()
                };
                this.saveLocalState(this.localGeoFenceSettingsKey, settings);
                return settings;
            }),
            catchError(() => {
                this.saveLocalState(this.localGeoFenceSettingsKey, fallback);
                return of(fallback);
            })
        );
    }

    getEmployeeGeofence(employeeId: number): Observable<{ geofence_zone_id: number | null; requires_geofence: boolean }> {
        return this.http.get<any>(`${this.apiUrl}/employees/${employeeId}/geofence`).pipe(
            map((res) => res.data || res)
        );
    }

    setEmployeeGeofence(employeeId: number, data: {
        geofence_zone_id: number | null;
        requires_geofence: boolean;
    }): Observable<any> {
        return this.http.put<any>(`${this.apiUrl}/employees/${employeeId}/geofence`, data).pipe(
            map((res) => res.data || res)
        );
    }

    getAllAttendance(filters?: AttendanceFilter): Observable<AttendanceRecord[]> {
        let params = new HttpParams();

        if (filters) {
            if (filters.startDate) params = params.set('start_date', filters.startDate);
            if (filters.endDate) params = params.set('end_date', filters.endDate);
            if (filters.employeeId) params = params.set('employee_id', filters.employeeId.toString());
            if (filters.departmentId) params = params.set('department_id', filters.departmentId.toString());
            if (filters.status) params = params.set('status', filters.status);
        }

        return this.http.get<any>(`${this.apiUrl}/attendance/all`, { params }).pipe(
            map((res) => {
                const records = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
                return records.map((record: any) => this.normalizeAttendanceRecord(record));
            })
        );
    }

    getTodayAllAttendance(): Observable<AttendanceRecord[]> {
        return this.http.get<any>(`${this.apiUrl}/attendance/all/today`).pipe(
            map((res) => {
                const records = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
                return records.map((record: any) => this.normalizeAttendanceRecord(record));
            })
        );
    }

    processManualAttendance(requestId: number, action: 'approved' | 'rejected', reason?: string): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/attendance/manual/process`, {
            request_id: requestId,
            action,
            reason
        }).pipe(
            map((res) => res.data || res)
        );
    }

    startPolling(): void {
        this.pollingSubject.next(true);
    }

    stopPolling(): void {
        this.pollingSubject.next(false);
    }

    private clearShiftsCache(): void {
        this.shiftsCache$ = undefined;
        this.shiftsCacheAt = 0;
    }

    refreshStatus(): void {
        this.getTodayAttendance().subscribe({
            next: (status) => {
                this.statusUpdateSubject.next(status);
            },
            error: (err) => console.error('Failed to refresh attendance status', err)
        });
    }

    getShifts(forceRefresh = false): Observable<AttendanceShift[]> {
        if (
            !forceRefresh &&
            this.shiftsCache$ &&
            this.shiftsCacheAt > 0 &&
            Date.now() - this.shiftsCacheAt < this.sharedCacheTtlMs
        ) {
            return this.shiftsCache$;
        }

        const localShifts = this.getLocalShifts();
        this.shiftsCacheAt = Date.now();
        this.shiftsCache$ = this.http.get<any>(`${this.apiUrl}/attendance/shifts`).pipe(
            map((res) => {
                const shifts = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
                const normalized = shifts.map((shift: any) => this.normalizeShift(shift));
                const merged = new Map<number, AttendanceShift>();
                [...normalized, ...localShifts].forEach((shift) => merged.set(shift.id, shift));
                return Array.from(merged.values());
            }),
            catchError(() => of(localShifts)),
            shareReplay(1)
        );
        return this.shiftsCache$;
    }

    createShift(data: Partial<AttendanceShift>): Observable<AttendanceShift> {
        const fallbackShift = this.normalizeShift({ id: Date.now(), ...data });
        return this.http.post<any>(`${this.apiUrl}/attendance/shifts`, data).pipe(
            map((res) => this.normalizeShift(res?.data || res)),
            map((shift) => {
                this.clearShiftsCache();
                return shift;
            }),
            catchError(() => {
                const nextShifts = [fallbackShift, ...this.getLocalShifts()];
                this.saveLocalState(this.localShiftKey, nextShifts);
                this.clearShiftsCache();
                return of(fallbackShift);
            })
        );
    }

    updateShift(id: number, data: Partial<AttendanceShift>): Observable<AttendanceShift> {
        return this.http.put<any>(`${this.apiUrl}/attendance/shifts/${id}`, data).pipe(
            map((res) => this.normalizeShift(res?.data || res)),
            map((shift) => {
                this.clearShiftsCache();
                return shift;
            }),
            catchError(() => {
                const nextShifts = this.getLocalShifts().map((shift) => shift.id === id
                    ? this.normalizeShift({ ...shift, ...data })
                    : shift);
                this.saveLocalState(this.localShiftKey, nextShifts);
                const updatedShift = nextShifts.find((shift) => shift.id === id) ?? this.normalizeShift({ id, ...data });
                this.clearShiftsCache();
                return of(updatedShift);
            })
        );
    }

    deleteShift(id: number): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/attendance/shifts/${id}`).pipe(
            map((res) => {
                this.clearShiftsCache();
                return res;
            }),
            catchError(() => {
                const nextShifts = this.getLocalShifts().filter((shift) => shift.id !== id);
                this.saveLocalState(this.localShiftKey, nextShifts);
                this.clearShiftsCache();
                return of({ success: true });
            })
        );
    }

    getShiftPlannerHistory(params: {
        start?: number;
        end?: number;
        search?: string;
        fromDate?: string;
        toDate?: string;
    }): Observable<any> {
        let httpParams = new HttpParams();
        if (params.start !== undefined) httpParams = httpParams.set('start', params.start.toString());
        if (params.end !== undefined) httpParams = httpParams.set('end', params.end.toString());
        if (params.search) httpParams = httpParams.set('search', params.search);
        if (params.fromDate) httpParams = httpParams.set('from_date', params.fromDate);
        if (params.toDate) httpParams = httpParams.set('to_date', params.toDate);

        return this.http.get<any>(`${this.apiUrl}/attendance/shift-planner`, { params: httpParams }).pipe(
            map((res) => res.data || res)
        );
    }

    createShiftAssignment(data: {
        empList: number[];
        shiftRotArray: Array<{
            scheduledate: string;
            scheduledateto: string;
            shiftid: number;
        }>;
    }): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/attendance/shift-planner`, data).pipe(
            map((res) => res.data || res)
        );
    }

    deleteShiftAssignment(id: number): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/attendance/shift-planner/${id}`);
    }

    importShiftPlanner(file: File): Observable<any> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<any>(`${this.apiUrl}/attendance/shift-planner/import`, formData).pipe(
            map((res) => res.data || res)
        );
    }
}
