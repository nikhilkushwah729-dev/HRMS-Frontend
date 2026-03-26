import { Injectable } from '@angular/core';
import { fromEvent, merge, Observable, timer } from 'rxjs';
import { auditTime, filter, map } from 'rxjs/operators';

export type LiveRefreshTrigger = 'interval' | 'focus' | 'visibility';

@Injectable({
  providedIn: 'root'
})
export class LiveRefreshService {
  createStream(intervalMs = 30000): Observable<LiveRefreshTrigger> {
    const interval$ = timer(intervalMs, intervalMs).pipe(
      map(() => 'interval' as const)
    );

    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return interval$;
    }

    const focus$ = fromEvent(window, 'focus').pipe(
      map(() => 'focus' as const)
    );

    const visibility$ = fromEvent(document, 'visibilitychange').pipe(
      filter(() => document.visibilityState === 'visible'),
      map(() => 'visibility' as const)
    );

    return merge(interval$, focus$, visibility$).pipe(auditTime(400));
  }
}
