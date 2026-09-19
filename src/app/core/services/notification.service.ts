import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, finalize, map, of, shareReplay, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Notification {
  id: number;
  userId: number;
  type: 'late_arrival' | 'leave_approval' | 'leave_rejection' | 'attendance_reminder' | 'system' | 'announcement';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  data?: any;
}

export interface NotificationPayload {
  type: string;
  title: string;
  message: string;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/notifications`;
  private readonly cacheTtlMs = 60 * 1000;
  private notificationsLoadedAt = 0;
  private notificationsRequest$?: Observable<Notification[]>;

  // Signals for reactive state
  private _notifications = signal<Notification[]>([]);
  private _unreadCount = signal<number>(0);

  // Public readonly signals
  notifications = this._notifications.asReadonly();
  unreadCount = this._unreadCount.asReadonly();

  // Computed values
  hasUnread = computed(() => this._unreadCount() > 0);
  recentNotifications = computed(() => this._notifications().slice(0, 10));

  /**
   * Load notifications for the current user
   */
  loadNotifications(forceRefresh = false): void {
    this.fetchNotifications(forceRefresh).subscribe({
      next: (res) => {
        this._notifications.set(res);
        this.updateUnreadCount();
      },
      error: (err) => console.error('Failed to load notifications', err)
    });
  }

  /**
   * Get notifications with pagination
   */
  getNotifications(page: number = 1, limit: number = 20, forceRefresh = false): Observable<Notification[]> {
    if (page === 1 && limit === 20) {
      return this.fetchNotifications(forceRefresh);
    }

    return this.http.get<any>(`${this.apiUrl}?page=${page}&limit=${limit}`).pipe(
      map(res => this.normalizeNotifications(res?.data || res || []))
    );
  }

  /**
   * Mark a notification as read
   */
  markAsRead(id: number): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/read`, {}).pipe(
      tap(() => {
        const notifications = this._notifications().map(n => 
          n.id === id ? { ...n, isRead: true } : n
        );
        this._notifications.set(notifications);
        this.updateUnreadCount();
        this.notificationsLoadedAt = Date.now();
      })
    );
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/read-all`, {}).pipe(
      tap(() => {
        const notifications = this._notifications().map(n => ({ ...n, isRead: true }));
        this._notifications.set(notifications);
        this._unreadCount.set(0);
        this.notificationsLoadedAt = Date.now();
      })
    );
  }

  /**
   * Delete a notification
   */
  deleteNotification(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const notifications = this._notifications().filter(n => n.id !== id);
        this._notifications.set(notifications);
        this.updateUnreadCount();
        this.notificationsLoadedAt = Date.now();
      })
    );
  }

  /**
   * Create a notification (usually from backend)
   */
  createNotification(payload: NotificationPayload): Observable<Notification> {
    return this.http.post<any>(this.apiUrl, payload).pipe(
      map(res => this.normalizeNotification(res?.data || res))
    );
  }

  /**
   * Get notifications by type
   */
  getNotificationsByType(type: string): Observable<Notification[]> {
    return this.http.get<any>(`${this.apiUrl}?type=${type}`).pipe(
      map(res => this.normalizeNotifications(res?.data || res || []))
    );
  }

  /**
   * Get unread notifications
   */
  getUnreadNotifications(): Observable<Notification[]> {
    return this.http.get<any>(`${this.apiUrl}?unread=true`).pipe(
      map(res => this.normalizeNotifications(res?.data || res || []))
    );
  }

  /**
   * Send a notification to a user (admin only)
   */
  sendNotificationToUser(userId: number, payload: NotificationPayload): Observable<Notification> {
    return this.http.post<any>(`${this.apiUrl}/send/${userId}`, payload).pipe(
      map(res => this.normalizeNotification(res?.data || res))
    );
  }

  /**
   * Send notification to multiple users
   */
  sendNotificationToUsers(userIds: number[], payload: NotificationPayload): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/send-bulk`, { userIds, ...payload });
  }

  /**
   * Send notification to all users in organization
   */
  broadcastNotification(payload: NotificationPayload): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/broadcast`, payload);
  }

  /**
   * Get notification preferences
   */
  getPreferences(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/preferences`);
  }

  /**
   * Update notification preferences
   */
  updatePreferences(preferences: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/preferences`, preferences);
  }

  // Private helper methods

  private fetchNotifications(forceRefresh = false): Observable<Notification[]> {
    const hasFreshCache =
      !forceRefresh &&
      this.notificationsLoadedAt > 0 &&
      Date.now() - this.notificationsLoadedAt < this.cacheTtlMs;

    if (hasFreshCache) {
      return of(this._notifications());
    }

    if (!forceRefresh && this.notificationsRequest$) {
      return this.notificationsRequest$;
    }

    this.notificationsRequest$ = this.http.get<any>(this.apiUrl).pipe(
      map((res) => this.normalizeNotifications(res?.data || res || [])),
      tap((notifications) => {
        this._notifications.set(notifications);
        this.updateUnreadCount();
        this.notificationsLoadedAt = Date.now();
      }),
      finalize(() => {
        this.notificationsRequest$ = undefined;
      }),
      shareReplay(1)
    );

    return this.notificationsRequest$;
  }

  private normalizeNotifications(items: any[]): Notification[] {
    return Array.isArray(items) ? items.map(item => this.normalizeNotification(item)) : [];
  }

  private normalizeNotification(item: any): Notification {
    return {
      id: Number(item?.id || 0),
      userId: Number(item?.userId || item?.user_id || item?.recipientId || item?.recipient_id || 0),
      type: item?.type || 'system',
      title: item?.title || 'Notification',
      message: item?.message || '',
      isRead: Boolean(item?.isRead || item?.is_read || item?.read || false),
      createdAt: item?.createdAt || item?.created_at || new Date().toISOString(),
      data: item?.data || item?.metadata || null
    };
  }

  private updateUnreadCount(): void {
    const unread = this._notifications().filter(n => !n.isRead).length;
    this._unreadCount.set(unread);
  }

  // Utility methods for checking notification types

  isLateArrivalNotification(notification: Notification): boolean {
    return notification.type === 'late_arrival';
  }

  isLeaveApprovalNotification(notification: Notification): boolean {
    return notification.type === 'leave_approval';
  }

  isLeaveRejectionNotification(notification: Notification): boolean {
    return notification.type === 'leave_rejection';
  }

  isAttendanceReminder(notification: Notification): boolean {
    return notification.type === 'attendance_reminder';
  }

  isAnnouncement(notification: Notification): boolean {
    return notification.type === 'announcement';
  }

  // Get icon for notification type
  getNotificationIcon(type: string): string {
    const icons: Record<string, string> = {
      'late_arrival': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
      'leave_approval': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
      'leave_rejection': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
      'attendance_reminder': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>',
      'system': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
      'announcement': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/></svg>'
    };
    return icons[type] || icons['system'];
  }

  // Get color for notification type
  getNotificationColor(type: string): string {
    const colors: Record<string, string> = {
      'late_arrival': 'text-amber-600 bg-amber-50',
      'leave_approval': 'text-green-600 bg-green-50',
      'leave_rejection': 'text-red-600 bg-red-50',
      'attendance_reminder': 'text-blue-600 bg-blue-50',
      'system': 'text-slate-600 bg-slate-50',
      'announcement': 'text-purple-600 bg-purple-50'
    };
    return colors[type] || colors['system'];
  }

  // Format relative time
  getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }
}

