import { ApplicationConfig, provideZoneChangeDetection, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';

import { routes } from './app.routes';
import { reducers } from './core/state/app.state';
import { AuthEffects } from './core/state/auth/auth.effects';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { auditInterceptor } from './core/interceptors/audit.interceptor';
import { LoadingInterceptor } from './core/interceptors/loading.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor, auditInterceptor])),
    { provide: HTTP_INTERCEPTORS, useClass: LoadingInterceptor, multi: true },
    provideStore(reducers),
    provideEffects([AuthEffects]),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() })
  ]
};
