import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
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

  getAnnouncements(): Observable<Announcement[]> {
    return this.http
      .get<any>(`${this.apiUrl}/announcements`)
      .pipe(map((res) => res.data));
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
      .pipe(map((res) => res.data));
  }

  updateAnnouncement(
    id: number,
    announcement: Partial<Announcement>,
  ): Observable<Announcement> {
    return this.http
      .put<any>(`${this.apiUrl}/announcements/${id}`, announcement)
      .pipe(map((res) => res.data));
  }

  deleteAnnouncement(id: number): Observable<Announcement> {
    return this.http
      .put<any>(`${this.apiUrl}/announcements/${id}`, {
        deleted_at: new Date().toISOString(),
      })
      .pipe(map((res) => res.data));
  }
}
