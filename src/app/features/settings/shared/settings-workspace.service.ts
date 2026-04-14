import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class SettingsWorkspaceService {
  private readonly authService = inject(AuthService);
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/organization/settings`;

  private scopedKey(storageKey: string): string {
    const user = this.authService.getStoredUser();
    const orgId = user?.orgId ?? user?.organizationId ?? 'global';
    return `${storageKey}_${orgId}`;
  }

  private readLocalCollection<T>(storageKey: string, fallback: T[] = []): T[] {
    try {
      const raw = localStorage.getItem(this.scopedKey(storageKey));
      return raw ? (JSON.parse(raw) as T[]) : fallback;
    } catch {
      return fallback;
    }
  }

  private saveLocalCollection<T>(storageKey: string, items: T[]): void {
    try {
      localStorage.setItem(this.scopedKey(storageKey), JSON.stringify(items));
    } catch {
      // Ignore local storage issues and keep the page interactive.
    }
  }

  getCollection<T>(storageKey: string, fallback: T[] = []): Observable<T[]> {
    const localFallback = this.readLocalCollection(storageKey, fallback);
    return this.http.get<any>(`${this.apiUrl}/${storageKey}`).pipe(
      map((res) => {
        const items = Array.isArray(res?.data) ? (res.data as T[]) : localFallback;
        this.saveLocalCollection(storageKey, items);
        return items;
      }),
      catchError(() => of(localFallback)),
    );
  }

  saveCollection<T>(storageKey: string, items: T[]): Observable<T[]> {
    this.saveLocalCollection(storageKey, items);
    return this.http.put<any>(`${this.apiUrl}/${storageKey}`, { items }).pipe(
      map((res) => {
        const saved = Array.isArray(res?.data) ? (res.data as T[]) : items;
        this.saveLocalCollection(storageKey, saved);
        return saved;
      }),
      tap({
        error: () => {
          this.saveLocalCollection(storageKey, items);
        },
      }),
      catchError(() => of(items)),
    );
  }
}
