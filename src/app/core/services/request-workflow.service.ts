import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuditAction, AuditLogService, AuditModule } from './audit-log.service';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';
import { PermissionService } from './permission.service';
import { User } from '../models/auth.model';

export type RequestType =
  | 'leave'
  | 'time_off'
  | 'attendance_regularization'
  | 'work_from_home'
  | 'outdoor_duty'
  | 'short_day'
  | 'under_time'
  | 'overtime'
  | 'document'
  | 'asset'
  | 'expense'
  | 'profile_update'
  | 'resignation';

export type RequestStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'sent_back';

export type RequestPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface RequestTimelineEvent {
  id: number;
  action:
    | 'created'
    | 'submitted'
    | 'approved'
    | 'rejected'
    | 'cancelled'
    | 'sent_back'
    | 'commented'
    | 'escalated';
  actorId?: number | null;
  actorName?: string | null;
  note?: string | null;
  createdAt: string;
}

export interface RequestAttachment {
  id: number;
  name: string;
  url?: string | null;
}

export interface RequestRecord {
  id: number;
  orgId?: number | null;
  employeeId: number;
  employeeName: string;
  employeeCode?: string | null;
  department?: string | null;
  designation?: string | null;
  managerId?: number | null;
  approverIds?: number[];
  currentApproverId?: number | null;
  requestType: RequestType;
  title: string;
  reason: string;
  description?: string | null;
  requestDate?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  submittedAt?: string | null;
  dueAt?: string | null;
  escalationAt?: string | null;
  level?: number;
  totalLevels?: number;
  workflowLabel?: string | null;
  priority: RequestPriority;
  status: RequestStatus;
  attachmentCount?: number;
  attachments?: RequestAttachment[];
  rejectionReason?: string | null;
  sentBackReason?: string | null;
  approvalComment?: string | null;
  createdAt: string;
  updatedAt: string;
  timeline: RequestTimelineEvent[];
  syncState?: 'synced' | 'local_only';
}

export interface RequestCreatePayload {
  requestType: RequestType;
  title: string;
  reason: string;
  description?: string | null;
  requestDate?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  priority?: RequestPriority;
  attachments?: RequestAttachment[];
  status?: Extract<RequestStatus, 'draft' | 'pending'>;
}

export interface RequestFilter {
  search?: string;
  requestType?: RequestType | '';
  status?: RequestStatus | '';
  department?: string;
  employeeId?: number | null;
  fromDate?: string;
  toDate?: string;
}

export interface ApprovalWorkflowRule {
  id: number;
  requestType: RequestType;
  workflowName: string;
  autoApprove: boolean;
  escalationHours: number;
  delegationEnabled: boolean;
  levels: Array<{
    level: number;
    actor: 'manager' | 'hr' | 'admin' | 'finance';
    label: string;
  }>;
}

@Injectable({
  providedIn: 'root',
})
export class RequestWorkflowService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly permissionService = inject(PermissionService);
  private readonly auditLogService = inject(AuditLogService);
  private readonly notificationService = inject(NotificationService);
  private readonly apiUrl = environment.apiUrl;
  private readonly essApiUrl = `${environment.apiUrl}/ess`;
  private readonly storageKey = 'hrms_request_center_v1';
  private readonly workflowKey = 'hrms_request_workflow_rules_v1';

  private currentUser(): User | null {
    return this.authService.getStoredUser();
  }

  private readStorage<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  }

  private writeStorage<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  private defaultWorkflowRules(): ApprovalWorkflowRule[] {
    return [
      {
        id: 1,
        requestType: 'leave',
        workflowName: 'Leave Request',
        autoApprove: false,
        escalationHours: 24,
        delegationEnabled: true,
        levels: [
          { level: 1, actor: 'manager', label: 'Reporting Manager' },
          { level: 2, actor: 'hr', label: 'HR Approval' },
        ],
      },
      {
        id: 2,
        requestType: 'attendance_regularization',
        workflowName: 'Attendance Regularization',
        autoApprove: false,
        escalationHours: 12,
        delegationEnabled: true,
        levels: [
          { level: 1, actor: 'manager', label: 'Manager / HR' },
        ],
      },
      {
        id: 3,
        requestType: 'expense',
        workflowName: 'Expense Request',
        autoApprove: false,
        escalationHours: 24,
        delegationEnabled: true,
        levels: [
          { level: 1, actor: 'manager', label: 'Manager Approval' },
          { level: 2, actor: 'finance', label: 'Finance / HR Approval' },
        ],
      },
      {
        id: 4,
        requestType: 'document',
        workflowName: 'Document Request',
        autoApprove: true,
        escalationHours: 0,
        delegationEnabled: false,
        levels: [{ level: 1, actor: 'hr', label: 'HR Auto Route' }],
      },
    ];
  }

  private getWorkflowRulesFallback(): ApprovalWorkflowRule[] {
    const current = this.readStorage<ApprovalWorkflowRule[]>(
      this.workflowKey,
      [],
    );
    if (current.length) return current;
    const seeded = this.defaultWorkflowRules();
    this.writeStorage(this.workflowKey, seeded);
    return seeded;
  }

  private seedRequests(): RequestRecord[] {
    const user = this.currentUser();
    const employeeId = Number(user?.employeeId ?? user?.id ?? 1);
    const employeeName =
      `${user?.firstName ?? 'Employee'} ${user?.lastName ?? 'User'}`.trim();
    const managerId = Number(user?.reportingManagerId ?? user?.managerId ?? 2);
    const orgId = Number(user?.organizationId ?? user?.orgId ?? 1);
    const now = new Date();
    const createdAt = now.toISOString();
    return [
      {
        id: 1001,
        orgId,
        employeeId,
        employeeName,
        employeeCode: user?.employeeCode ?? null,
        department: user?.department?.name ?? 'Operations',
        designation: user?.designation?.name ?? 'Executive',
        managerId,
        approverIds: [managerId],
        currentApproverId: managerId,
        requestType: 'attendance_regularization',
        title: 'Missed punch correction',
        reason: 'Morning biometric was unavailable',
        description: 'Please regularize the morning punch for office entry.',
        startDate: now.toISOString().slice(0, 10),
        endDate: now.toISOString().slice(0, 10),
        submittedAt: createdAt,
        dueAt: new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString(),
        escalationAt: new Date(now.getTime() + 18 * 60 * 60 * 1000).toISOString(),
        level: 1,
        totalLevels: 1,
        workflowLabel: 'Manager / HR',
        priority: 'medium',
        status: 'pending',
        attachmentCount: 0,
        attachments: [],
        createdAt,
        updatedAt: createdAt,
        timeline: [
          {
            id: Date.now(),
            action: 'created',
            actorId: employeeId,
            actorName: employeeName,
            note: 'Request created and submitted.',
            createdAt,
          },
        ],
      },
    ];
  }

  private getRequestsFallback(): RequestRecord[] {
    const current = this.readStorage<RequestRecord[]>(this.storageKey, []);
    if (current.length) return current.map((item) => this.normalizeRequest(item));
    const seeded = this.seedRequests();
    this.writeStorage(this.storageKey, seeded);
    return seeded;
  }

  private getStoredRequests(): RequestRecord[] {
    return this.readStorage<RequestRecord[]>(this.storageKey, []).map((item) =>
      this.normalizeRequest(item),
    );
  }

  private isLikelyLocalOnly(raw: any): boolean {
    if (raw?.syncState === 'local_only') return true;
    if (raw?.meta?.localOnly === true) return true;
    const id = Number(raw?.id ?? 0);
    return Number.isFinite(id) && id > 1000000000000;
  }

  private getStoredRequestsForEmployee(employeeId: number): RequestRecord[] {
    return this.getStoredRequests().filter((item) => item.employeeId === employeeId);
  }

  private toBackendRequestType(
    type: RequestType,
  ):
    | 'leave'
    | 'wfh'
    | 'attendance_correction'
    | 'expense_claim'
    | 'travel_request'
    | 'gate_pass'
    | null {
    switch (type) {
      case 'leave':
      case 'time_off':
      case 'short_day':
        return 'leave';
      case 'work_from_home':
        return 'wfh';
      case 'attendance_regularization':
      case 'under_time':
      case 'overtime':
        return 'attendance_correction';
      case 'expense':
        return 'expense_claim';
      case 'outdoor_duty':
        return 'travel_request';
      case 'document':
      case 'asset':
      case 'profile_update':
      case 'resignation':
        return 'gate_pass';
      default:
        return null;
    }
  }

  private fromBackendRequestType(type: string | null | undefined): RequestType {
    switch (type) {
      case 'leave':
        return 'leave';
      case 'wfh':
        return 'work_from_home';
      case 'attendance_correction':
        return 'attendance_regularization';
      case 'expense_claim':
        return 'expense';
      case 'travel_request':
        return 'outdoor_duty';
      case 'gate_pass':
        return 'document';
      default:
        return 'leave';
    }
  }

  private buildApiDescription(payload: RequestCreatePayload): string | null {
    const parts = [payload.reason?.trim(), payload.description?.trim()].filter(
      Boolean,
    ) as string[];
    if (payload.requestType === 'time_off') {
      if (payload.startTime?.trim()) parts.push(`Start Time: ${payload.startTime.trim()}`);
      if (payload.endTime?.trim()) parts.push(`End Time: ${payload.endTime.trim()}`);
    }
    return parts.length ? parts.join('\n\n') : null;
  }

  private extractAttachmentBase64(payload: RequestCreatePayload): string | undefined {
    const firstUrl = payload.attachments?.[0]?.url ?? undefined;
    return firstUrl?.startsWith('data:') ? firstUrl : undefined;
  }

  private mergeRequests(primary: RequestRecord[], secondary: RequestRecord[]): RequestRecord[] {
    const byId = new Map<number, RequestRecord>();
    [...secondary, ...primary].forEach((item) => {
      const existing = byId.get(item.id);
      byId.set(item.id, existing ? this.normalizeRequest({ ...item, ...existing, timeline: item.timeline?.length ? item.timeline : existing.timeline }) : item);
    });
    return Array.from(byId.values()).sort((a, b) =>
      String(b.createdAt).localeCompare(String(a.createdAt)),
    );
  }

  private appendTimeline(
    request: RequestRecord,
    action: RequestTimelineEvent['action'],
    note?: string | null,
  ): RequestRecord {
    const user = this.currentUser();
    const actorId = Number(user?.employeeId ?? user?.id ?? 0) || null;
    const actorName = user
      ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
      : 'System';
    return {
      ...request,
      updatedAt: new Date().toISOString(),
      timeline: [
        ...request.timeline,
        {
          id: Date.now() + Math.floor(Math.random() * 1000),
          action,
          actorId,
          actorName,
          note: note ?? null,
          createdAt: new Date().toISOString(),
        },
      ],
    };
  }

  private normalizeRequest(raw: any): RequestRecord {
    const user = this.currentUser();
    const fallbackEmployeeId = Number(user?.employeeId ?? user?.id ?? 0);
    const fallbackEmployeeName = user
      ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
      : 'Employee';
    const meta =
      raw?.meta && typeof raw.meta === 'string'
        ? (() => {
            try {
              return JSON.parse(raw.meta);
            } catch {
              return {};
            }
          })()
        : raw?.meta ?? {};
    const resolvedType = raw?.requestType ?? raw?.request_type;
    const attachmentUrl = raw?.attachmentUrl ?? raw?.attachment_url ?? null;
    const baseDescription = raw?.description ?? null;
    const [firstLine, ...remainingDescription] = String(baseDescription ?? '')
      .split('\n')
      .filter((part) => part !== '');
    const descriptionBody = remainingDescription
      .filter((line) => !/^Start Time:\s*/i.test(line) && !/^End Time:\s*/i.test(line))
      .join('\n')
      .trim();
    const startTimeMatch = String(baseDescription ?? '').match(/Start Time:\s*([0-9]{1,2}:[0-9]{2})/i);
    const endTimeMatch = String(baseDescription ?? '').match(/End Time:\s*([0-9]{1,2}:[0-9]{2})/i);

    return {
      id: Number(raw?.id ?? Date.now()),
      orgId: raw?.orgId ?? raw?.org_id ?? null,
      employeeId: Number(raw?.employeeId ?? raw?.employee_id ?? fallbackEmployeeId),
      employeeName:
        raw?.employeeName ??
        raw?.employee_name ??
        raw?.employee?.fullName ??
        raw?.employee?.name ??
        fallbackEmployeeName,
      employeeCode: raw?.employeeCode ?? raw?.employee_code ?? null,
      department: raw?.department ?? raw?.employee?.department?.name ?? null,
      designation:
        raw?.designation ?? raw?.employee?.designation?.name ?? null,
      managerId: raw?.managerId ?? raw?.manager_id ?? null,
      approverIds: Array.isArray(raw?.approverIds)
        ? raw.approverIds.map(Number)
        : Array.isArray(raw?.approver_ids)
          ? raw.approver_ids.map(Number)
          : [],
      currentApproverId:
        raw?.currentApproverId ?? raw?.current_approver_id ?? null,
      requestType:
        resolvedType && typeof resolvedType === 'string'
          ? this.fromBackendRequestType(resolvedType)
          : 'leave',
      title: raw?.title ?? 'Request',
      reason: raw?.reason ?? meta?.reason ?? firstLine ?? '',
      description:
        raw?.reason || meta?.reason
          ? descriptionBody || null
          : baseDescription,
      requestDate: raw?.requestDate ?? raw?.request_date ?? raw?.startDate ?? raw?.start_date ?? raw?.createdAt?.slice?.(0, 10) ?? raw?.created_at?.slice?.(0, 10) ?? null,
      startDate: raw?.startDate ?? raw?.start_date ?? raw?.requestDate ?? raw?.request_date ?? null,
      endDate: raw?.endDate ?? raw?.end_date ?? raw?.requestDate ?? raw?.request_date ?? null,
      startTime: raw?.startTime ?? raw?.start_time ?? meta?.startTime ?? startTimeMatch?.[1] ?? null,
      endTime: raw?.endTime ?? raw?.end_time ?? meta?.endTime ?? endTimeMatch?.[1] ?? null,
      submittedAt: raw?.submittedAt ?? raw?.submitted_at ?? raw?.createdAt ?? raw?.created_at ?? null,
      dueAt: raw?.dueAt ?? raw?.due_at ?? null,
      escalationAt: raw?.escalationAt ?? raw?.escalation_at ?? null,
      level: Number(raw?.level ?? 1),
      totalLevels: Number(raw?.totalLevels ?? raw?.total_levels ?? 1),
      workflowLabel: raw?.workflowLabel ?? raw?.workflow_label ?? null,
      priority: raw?.priority ?? 'medium',
      status: raw?.status ?? 'draft',
      attachmentCount: Number(
        raw?.attachmentCount ??
          raw?.attachment_count ??
          raw?.attachments?.length ??
          0,
      ),
      attachments: Array.isArray(raw?.attachments)
        ? raw.attachments.map((item: any, index: number) => ({
            id: Number(item?.id ?? index + 1),
            name: item?.name ?? item?.fileName ?? `Attachment ${index + 1}`,
            url: item?.url ?? null,
          }))
        : attachmentUrl
          ? [
              {
                id: 1,
                name: 'Attachment 1',
                url: attachmentUrl,
              },
            ]
        : [],
      rejectionReason:
        raw?.rejectionReason ?? raw?.rejection_reason ?? raw?.resolutionNote ?? raw?.resolution_note ?? null,
      sentBackReason: raw?.sentBackReason ?? raw?.sent_back_reason ?? null,
      approvalComment:
        raw?.approvalComment ?? raw?.approval_comment ?? raw?.resolutionNote ?? raw?.resolution_note ?? null,
      createdAt: raw?.createdAt ?? raw?.created_at ?? new Date().toISOString(),
      updatedAt: raw?.updatedAt ?? raw?.updated_at ?? new Date().toISOString(),
      syncState: this.isLikelyLocalOnly(raw) ? 'local_only' : 'synced',
      timeline: Array.isArray(raw?.timeline)
        ? raw.timeline.map((item: any, index: number) => ({
            id: Number(item?.id ?? index + 1),
            action: item?.action ?? 'commented',
            actorId: item?.actorId ?? item?.actor_id ?? null,
            actorName: item?.actorName ?? item?.actor_name ?? null,
            note: item?.note ?? null,
            createdAt:
              item?.createdAt ?? item?.created_at ?? new Date().toISOString(),
          }))
        : [],
    };
  }

  private canSeeRequest(user: User | null, request: RequestRecord): boolean {
    if (!user) return false;
    if (this.permissionService.isSuperAdminUser(user)) return true;
    if (this.permissionService.isAdminUser(user)) return true;

    const currentEmployeeId = Number(user.employeeId ?? user.id ?? 0);
    if (currentEmployeeId === request.employeeId) return true;

    const subordinateIds = Array.isArray(user.subordinateIds)
      ? user.subordinateIds.map(Number)
      : [];
    return subordinateIds.includes(request.employeeId);
  }

  private canApproveRequest(user: User | null, request: RequestRecord): boolean {
    if (!user) return false;
    const currentEmployeeId = Number(user.employeeId ?? user.id ?? 0);
    if (currentEmployeeId === request.employeeId) return false;
    if (this.permissionService.isAdminUser(user)) return true;
    if (this.permissionService.isHrManagerUser(user)) return true;
    if (this.permissionService.getRoleKey(user) === 'manager') {
      const subordinateIds = Array.isArray(user.subordinateIds)
        ? user.subordinateIds.map(Number)
        : [];
      return subordinateIds.includes(request.employeeId);
    }
    return false;
  }

  private filterRequests(
    items: RequestRecord[],
    filter?: RequestFilter,
  ): RequestRecord[] {
    if (!filter) return items;
    return items.filter((item) => {
      if (filter.requestType && item.requestType !== filter.requestType)
        return false;
      if (filter.status && item.status !== filter.status) return false;
      if (
        filter.department &&
        !String(item.department ?? '')
          .toLowerCase()
          .includes(filter.department.toLowerCase())
      ) {
        return false;
      }
      if (filter.employeeId && item.employeeId !== Number(filter.employeeId))
        return false;
      if (filter.fromDate && item.createdAt.slice(0, 10) < filter.fromDate)
        return false;
      if (filter.toDate && item.createdAt.slice(0, 10) > filter.toDate)
        return false;
      if (filter.search) {
        const haystack = [
          item.title,
          item.reason,
          item.description,
          item.employeeName,
          item.department,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(filter.search.toLowerCase())) return false;
      }
      return true;
    });
  }

  getRequestTypes(): Array<{
    key: RequestType;
    label: string;
    description: string;
    routeGroup: 'attendance' | 'people' | 'finance' | 'documents';
  }> {
    return [
      {
        key: 'leave',
        label: 'Leave Request',
        description: 'Full day or half day leave with date range.',
        routeGroup: 'attendance',
      },
      {
        key: 'time_off',
        label: 'Time Off Request',
        description: 'Personal time off request with flexible date range.',
        routeGroup: 'attendance',
      },
      {
        key: 'attendance_regularization',
        label: 'Attendance Regularization',
        description: 'Missed punch, late arrival, or time correction.',
        routeGroup: 'attendance',
      },
      {
        key: 'work_from_home',
        label: 'Work From Home',
        description: 'Remote work approval with date range.',
        routeGroup: 'attendance',
      },
      {
        key: 'outdoor_duty',
        label: 'Outdoor Duty',
        description: 'Client visit or offsite duty request.',
        routeGroup: 'attendance',
      },
      {
        key: 'short_day',
        label: 'Short Day',
        description: 'Short day or short leave request.',
        routeGroup: 'attendance',
      },
      {
        key: 'under_time',
        label: 'Under-time Regularization',
        description: 'Request approval for under-time adjustment.',
        routeGroup: 'attendance',
      },
      {
        key: 'overtime',
        label: 'Overtime Request',
        description: 'Overtime claim with reason and support.',
        routeGroup: 'attendance',
      },
      {
        key: 'document',
        label: 'Document Request',
        description: 'Letter, certificate, or HR document request.',
        routeGroup: 'documents',
      },
      {
        key: 'asset',
        label: 'Asset Request',
        description: 'Request laptop, accessories, or office assets.',
        routeGroup: 'people',
      },
      {
        key: 'expense',
        label: 'Expense / Reimbursement',
        description: 'Expense reimbursement and claim workflow.',
        routeGroup: 'finance',
      },
      {
        key: 'profile_update',
        label: 'Profile Update',
        description: 'Request employee profile information change.',
        routeGroup: 'people',
      },
      {
        key: 'resignation',
        label: 'Resignation Request',
        description: 'Formal resignation and exit workflow.',
        routeGroup: 'people',
      },
    ];
  }

  getMyRequests(filter?: RequestFilter): Observable<RequestRecord[]> {
    const user = this.currentUser();
    const employeeId = Number(user?.employeeId ?? user?.id ?? 0);
    return this.http
      .get<any>(`${this.essApiUrl}/requests`, {
        params: {
          ...(filter?.requestType
            ? { type: this.toBackendRequestType(filter.requestType) ?? '' }
            : {}),
          ...(filter?.status ? { status: filter.status } : {}),
        },
      })
      .pipe(
        map((res) => {
          const apiItems = (
            Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []
          )
            .map((item: any) => this.normalizeRequest(item))
            .filter((item: RequestRecord) => item.employeeId === employeeId);
          const localItems = this.getStoredRequestsForEmployee(employeeId).map((item) =>
            item.syncState === 'local_only' && item.status === 'pending'
              ? this.normalizeRequest({
                  ...item,
                  status: 'draft',
                  workflowLabel: item.workflowLabel || 'Saved locally',
                  description: item.description
                    ? `${item.description}\n\nThis request was saved locally and is not yet submitted for approval.`
                    : 'This request was saved locally and is not yet submitted for approval.',
                })
              : item,
          );
          return this.mergeRequests(apiItems, localItems);
        }),
        map((items) => this.filterRequests(items, filter)),
        catchError(() => {
          const items = this.getStoredRequestsForEmployee(employeeId);
          return of(this.filterRequests(items, filter));
        }),
      );
  }

  getApprovalQueue(filter?: RequestFilter): Observable<RequestRecord[]> {
    const user = this.currentUser();
    return this.http
      .get<any>(`${this.apiUrl}/approval-center`, {
        params: {
          ...(filter?.requestType
            ? { type: this.toBackendRequestType(filter.requestType) ?? '' }
            : {}),
          ...(filter?.status ? { status: filter.status } : {}),
          ...(filter?.employeeId ? { employeeId: String(filter.employeeId) } : {}),
          ...(filter?.department ? { department: filter.department } : {}),
          ...(filter?.search ? { search: filter.search } : {}),
          ...(filter?.fromDate ? { fromDate: filter.fromDate } : {}),
          ...(filter?.toDate ? { toDate: filter.toDate } : {}),
        },
      })
      .pipe(
        map((res) =>
          (Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [])
            .map((item: any) => this.normalizeRequest(item))
            .filter((item: RequestRecord) => this.canApproveRequest(user, item)),
        ),
        map((items) => this.filterRequests(items, filter)),
        catchError(() => {
          const items = this
            .getRequestsFallback()
            .filter((item) => this.canApproveRequest(user, item));
          return of(this.filterRequests(items, filter));
        }),
      );
  }

  getRequestById(id: number): Observable<RequestRecord | null> {
    const user = this.currentUser();
    const canUseApprovalApi =
      !!user &&
      (this.permissionService.isAdminUser(user) ||
        this.permissionService.isHrManagerUser(user) ||
        this.permissionService.getRoleKey(user) === 'manager');

    if (canUseApprovalApi) {
      return this.http.get<any>(`${this.apiUrl}/approval-center/${id}`).pipe(
        map((res) => this.normalizeRequest(res?.data ?? res)),
        map((item) => (item && this.canSeeRequest(user, item) ? item : null)),
        catchError(() =>
          this.getMyRequests().pipe(
            map((items) => items.find((item) => item.id === id) ?? null),
            map((item) => (item && this.canSeeRequest(user, item) ? item : null)),
            catchError(() => {
              const item = this.getStoredRequests().find((request) => request.id === id) ?? null;
              return of(item && this.canSeeRequest(user, item) ? item : null);
            }),
          ),
        ),
      );
    }

    return this.getMyRequests().pipe(
      map((items) => items.find((item) => item.id === id) ?? null),
      map((item) => (item && this.canSeeRequest(user, item) ? item : null)),
      catchError(() => {
        const item = this.getStoredRequests().find((request) => request.id === id) ?? null;
        return of(item && this.canSeeRequest(user, item) ? item : null);
      }),
    );
  }

  createRequest(payload: RequestCreatePayload): Observable<RequestRecord> {
    const user = this.currentUser();
    const employeeId = Number(user?.employeeId ?? user?.id ?? 0);
    const employeeName =
      user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : 'Employee';
    const workflow =
      this.getWorkflowRulesFallback().find(
        (item) => item.requestType === payload.requestType,
      ) ?? null;
    const requestPayload = {
      ...payload,
      status: payload.status ?? 'pending',
    };
    const backendType = this.toBackendRequestType(payload.requestType);
    const shouldUseApi = !!backendType && requestPayload.status !== 'draft';

    if (shouldUseApi) {
      return this.http
        .post<any>(`${this.essApiUrl}/requests`, {
          requestType: backendType,
          title: payload.title,
          description: this.buildApiDescription(payload),
          requestDate: payload.startDate ?? payload.endDate ?? null,
          startDate: payload.startDate ?? null,
          endDate: payload.endDate ?? null,
          attachmentBase64: this.extractAttachmentBase64(payload),
          approverEmployeeId:
            Number(user?.reportingManagerId ?? user?.managerId ?? 0) || null,
        })
        .pipe(
          map((res) => this.normalizeRequest(res?.data ?? res)),
          map((request) => {
            const enriched = this.normalizeRequest({
              ...request,
              requestType: payload.requestType,
              reason: payload.reason,
              description: payload.description,
              requestDate: payload.requestDate ?? payload.startDate ?? payload.endDate ?? null,
              startTime: payload.startTime ?? null,
              endTime: payload.endTime ?? null,
              priority: payload.priority ?? 'medium',
              attachments: payload.attachments ?? [],
            });
            const next = [enriched, ...this.getStoredRequests().filter((item) => item.id !== enriched.id)];
            this.writeStorage(this.storageKey, next);
            return enriched;
          }),
          tap((request) => {
            this.auditLogService
              .logAction(AuditAction.CREATE, AuditModule.ORGANIZATION, {
                entityName: 'Request Center',
                entityId: String(request.id),
                newValues: request,
              })
              .subscribe({ error: () => void 0 });
          }),
          catchError((error) => {
            if (requestPayload.status === 'pending') {
              return throwError(() => error);
            }
            return this.createRequestFallback(payload, requestPayload, user, workflow);
          }),
        );
    }

    return this.createRequestFallback(payload, requestPayload, user, workflow);
  }

  private createRequestFallback(
    payload: RequestCreatePayload,
    requestPayload: RequestCreatePayload & { status: 'draft' | 'pending' },
    user: User | null,
    workflow: ApprovalWorkflowRule | null,
  ): Observable<RequestRecord> {
    const employeeId = Number(user?.employeeId ?? user?.id ?? 0);
    const employeeName =
      user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : 'Employee';
    const now = new Date().toISOString();
    const record: RequestRecord = {
      id: Date.now(),
      orgId: Number(user?.organizationId ?? user?.orgId ?? 0) || null,
      employeeId,
      employeeName,
      employeeCode: user?.employeeCode ?? null,
      department: user?.department?.name ?? null,
      designation: user?.designation?.name ?? null,
      managerId: Number(user?.reportingManagerId ?? user?.managerId ?? 0) || null,
      approverIds:
        workflow?.levels.map(() =>
          Number(user?.reportingManagerId ?? user?.managerId ?? 0) || 0,
        ) ?? [],
      currentApproverId:
        Number(user?.reportingManagerId ?? user?.managerId ?? 0) || null,
      requestType: payload.requestType,
      title: payload.title,
      reason: payload.reason,
      description: payload.description ?? null,
      requestDate: payload.requestDate ?? payload.startDate ?? payload.endDate ?? null,
      startDate: payload.startDate ?? null,
      endDate: payload.endDate ?? null,
      startTime: payload.startTime ?? null,
      endTime: payload.endTime ?? null,
      submittedAt: requestPayload.status === 'pending' ? now : null,
      dueAt: workflow?.escalationHours
        ? new Date(
            Date.now() + workflow.escalationHours * 60 * 60 * 1000,
          ).toISOString()
        : null,
      escalationAt: workflow?.escalationHours
        ? new Date(
            Date.now() + (workflow.escalationHours + 6) * 60 * 60 * 1000,
          ).toISOString()
        : null,
      level: 1,
      totalLevels: workflow?.levels.length ?? 1,
      workflowLabel: workflow?.workflowName ?? 'Standard Workflow',
      priority: payload.priority ?? 'medium',
      status: requestPayload.status,
      attachmentCount: payload.attachments?.length ?? 0,
      attachments: payload.attachments ?? [],
      syncState: 'local_only',
      createdAt: now,
      updatedAt: now,
      timeline: [
        {
          id: Date.now(),
          action: 'created',
          actorId: employeeId,
          actorName: employeeName,
          note:
            requestPayload.status === 'draft'
              ? 'Request saved as draft.'
              : 'Request submitted for approval.',
          createdAt: now,
        },
      ],
    };
    const next = [record, ...this.getStoredRequests()];
    this.writeStorage(this.storageKey, next);
    this.auditLogService
      .logAction(AuditAction.CREATE, AuditModule.ORGANIZATION, {
        entityName: 'Request Center',
        entityId: String(record.id),
        newValues: record,
      })
      .subscribe({ error: () => void 0 });
    return of(record);
  }

  cancelRequest(id: number, reason?: string): Observable<RequestRecord | null> {
    return this.http.post<any>(`${this.essApiUrl}/requests/${id}/cancel`, { reason }).pipe(
      map((res) => this.normalizeRequest(res?.data ?? res)),
      catchError(() => {
        const requests = this.getStoredRequests();
        const target = requests.find((item) => item.id === id);
        if (!target || !['draft', 'pending', 'sent_back'].includes(target.status)) {
          return of(null);
        }
        const updated = this.appendTimeline(
          {
            ...target,
            status: 'cancelled',
          },
          'cancelled',
          reason ?? 'Cancelled by employee before approval.',
        );
        this.writeStorage(
          this.storageKey,
          requests.map((item) => (item.id === id ? updated : item)),
        );
        this.auditLogService
          .logAction(AuditAction.UPDATE, AuditModule.ORGANIZATION, {
            entityName: 'Request Center',
            entityId: String(id),
            oldValues: { status: target.status },
            newValues: { status: 'cancelled', reason },
          })
          .subscribe({ error: () => void 0 });
        return of(updated);
      }),
    );
  }

  processRequest(
    id: number,
    action: 'approved' | 'rejected' | 'sent_back',
    comment?: string,
  ): Observable<RequestRecord | null> {
    return this.http
      .post<any>(`${this.apiUrl}/approval-center/${id}/action`, {
        action,
        comment,
      })
      .pipe(
        map((res) => this.normalizeRequest(res?.data ?? res)),
        catchError(() => {
          const requests = this.getRequestsFallback();
          const target = requests.find((item) => item.id === id);
          if (!target) return of(null);

          const updateBase: Partial<RequestRecord> =
            action === 'approved'
              ? { status: 'approved', approvalComment: comment ?? null }
              : action === 'rejected'
                ? { status: 'rejected', rejectionReason: comment ?? null }
                : { status: 'sent_back', sentBackReason: comment ?? null };
          const updated = this.appendTimeline(
            { ...target, ...updateBase },
            action,
            comment ?? null,
          );
          this.writeStorage(
            this.storageKey,
            requests.map((item) => (item.id === id ? updated : item)),
          );
          const auditAction =
            action === 'approved'
              ? AuditAction.APPROVE
              : action === 'rejected'
                ? AuditAction.REJECT
                : AuditAction.UPDATE;
          this.auditLogService
            .logAction(auditAction, AuditModule.ORGANIZATION, {
              entityName: 'Approval Center',
              entityId: String(id),
              oldValues: { status: target.status },
              newValues: { status: updated.status, comment },
            })
            .subscribe({ error: () => void 0 });
          this.notificationService
            .createNotification({
              type: 'system',
              title: `Request ${action.replace('_', ' ')}`,
              message: `${updated.title} was ${action.replace('_', ' ')}.`,
              data: { requestId: updated.id, status: updated.status },
            })
            .subscribe({ error: () => void 0 });
          return of(updated);
        }),
      );
  }

  bulkProcessRequests(
    ids: number[],
    action: 'approved' | 'rejected',
    comment?: string,
  ): Observable<RequestRecord[]> {
    return this.http
      .post<any>(`${this.apiUrl}/approval-center/bulk-action`, {
        ids,
        action,
        comment,
      })
      .pipe(
        map((res) =>
          (Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []).map(
            (item: any) => this.normalizeRequest(item),
          ),
        ),
        catchError(() => {
          const requests = this.getRequestsFallback();
          const updated: RequestRecord[] = [];
          const next = requests.map((item) => {
            if (!ids.includes(item.id)) return item;
            const patch =
              action === 'approved'
                ? { status: 'approved' as RequestStatus, approvalComment: comment ?? null }
                : { status: 'rejected' as RequestStatus, rejectionReason: comment ?? null };
            const record = this.appendTimeline(
              { ...item, ...patch },
              action,
              comment ?? null,
            );
            updated.push(record);
            return record;
          });
          this.writeStorage(this.storageKey, next);
          return of(updated);
        }),
      );
  }

  getWorkflowRules(): Observable<ApprovalWorkflowRule[]> {
    return this.http.get<any>(`${this.apiUrl}/approval-workflows`).pipe(
      map((res) =>
        (Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []) as ApprovalWorkflowRule[],
      ),
      catchError(() => of(this.getWorkflowRulesFallback())),
    );
  }
}
