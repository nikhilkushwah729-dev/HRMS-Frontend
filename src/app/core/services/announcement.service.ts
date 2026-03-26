import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Announcement {
    id: number;
    title: string;
    content: string;
    date: string;
    author_id: number;
}

@Injectable({
    providedIn: 'root'
})
export class AnnouncementService {
    private http = inject(HttpClient);
    private readonly apiUrl = environment.apiUrl;

    getAnnouncements(): Observable<Announcement[]> {
        return this.http.get<any>(`${this.apiUrl}/announcements`).pipe(
            map(res => res.data)
        );
    }

    createAnnouncement(announcement: Partial<Announcement>): Observable<Announcement> {
        return this.http.post<any>(`${this.apiUrl}/announcements`, announcement).pipe(
            map(res => res.data)
        );
    }
}
