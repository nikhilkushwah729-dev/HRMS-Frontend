import { Injectable, inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable, finalize } from 'rxjs';
import { TopLoaderService } from '../services/top-loader.service';

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  private topLoaderService = inject(TopLoaderService);
  private activeRequests = 0;

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Skip for certain requests
    const skipLoading = req.headers.has('X-Skip-Loading');
    if (skipLoading) {
      return next.handle(req);
    }

    this.activeRequests++;
    this.topLoaderService.show();

    return next.handle(req).pipe(
      finalize(() => {
        this.activeRequests--;
        if (this.activeRequests === 0) {
          this.topLoaderService.hide();
        }
      })
    );
  }
}
