import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Announcement {
  id: number;
  org_id: number;
  title: string;
  content: string;
  target: 'all' | 'department' | 'role';
  target_id: number | null;
  published_at: string | null;
  expires_at: string | null;
  created_by: number | null;
  deleted_at: string | null;
  created_at: string;
}

@Injectable({
  providedIn: 'root',
})
export class AnnouncementService {
  private http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;
  private readonly cacheTtlMs = 2 * 60 * 1000;
  private announcementsCache$?: Observable<Announcement[]>;
  private announcementsCacheAt = 0;

  private clearAnnouncementsCache(): void {
    this.announcementsCache$ = undefined;
    this.announcementsCacheAt = 0;
  }

  getAnnouncements(forceRefresh = false): Observable<Announcement[]> {
    if (
      !forceRefresh &&
      this.announcementsCache$ &&
      this.announcementsCacheAt > 0 &&
      Date.now() - this.announcementsCacheAt < this.cacheTtlMs
    ) {
      return this.announcementsCache$;
    }

    this.announcementsCacheAt = Date.now();
    this.announcementsCache$ = this.http
      .get<any>(`${this.apiUrl}/announcements`)
      .pipe(map((res) => res.data), shareReplay(1));
    return this.announcementsCache$;
  }

  getAnnouncement(id: number): Observable<Announcement> {
    return this.http
      .get<any>(`${this.apiUrl}/announcements/${id}`)
      .pipe(map((res) => res.data));
  }

  createAnnouncement(
    announcement: Partial<Announcement>,
  ): Observable<Announcement> {
    return this.http
      .post<any>(`${this.apiUrl}/announcements`, announcement)
      .pipe(tap(() => this.clearAnnouncementsCache()), map((res) => res.data));
  }

  updateAnnouncement(
    id: number,
    announcement: Partial<Announcement>,
  ): Observable<Announcement> {
    return this.http
      .put<any>(`${this.apiUrl}/announcements/${id}`, announcement)
      .pipe(tap(() => this.clearAnnouncementsCache()), map((res) => res.data));
  }

  deleteAnnouncement(id: number): Observable<Announcement> {
    return this.http
      .put<any>(`${this.apiUrl}/announcements/${id}`, {
        deleted_at: new Date().toISOString(),
      })
      .pipe(tap(() => this.clearAnnouncementsCache()), map((res) => res.data));
  }
}
