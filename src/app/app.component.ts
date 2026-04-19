import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterOutlet, Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { Store } from '@ngrx/store';
import * as AuthActions from './core/state/auth/auth.actions';
import { AuthService } from './core/services/auth.service';
import { ToastComponent } from './core/components/toast/toast.component';
import { ConfirmModalComponent } from './core/components/modal/confirm-modal.component';
import { TopLoaderComponent } from './core/components/top-loader/top-loader.component';
import { TopLoaderService } from './core/services/top-loader.service';
import { UserLimitService } from './core/services/user-limit.service';
import { SubscriptionService, SubscriptionStatusPayload } from './core/services/subscription.service';
import { LanguageService } from './core/services/language.service';
import { filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { MainLoaderComponent } from './core/components/main-loader/main-loader.component';
import { CustomModalComponent } from './core/components/modal/custom-modal.component';
import { CustomButtonComponent } from './core/components/button/custom-button.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    ToastComponent,
    ConfirmModalComponent,
    TopLoaderComponent,
    MainLoaderComponent,
    CustomModalComponent,
    CustomButtonComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  public topLoaderService = inject(TopLoaderService);
  public userLimitService = inject(UserLimitService);
  public subscriptionService = inject(SubscriptionService);
  public languageService = inject(LanguageService);
  private authService = inject(AuthService);
  private store = inject(Store);
  private router = inject(Router);
  
  title = 'HRNexus';
  showRefreshStrip = signal(false);
  currentUrl = signal(this.router.url || '/');
  routeLoading = signal(false);
  subscriptionStatus = signal<SubscriptionStatusPayload | null>(null);
  isAuthRoute = computed(() => this.currentUrl().startsWith('/auth'));
  trialBannerMessage = computed(() => {
    this.languageService.currentLanguage();
    const status = this.subscriptionStatus();
    if (!status) return '';
    if (status.organization.isTrialActive) {
      const days = Math.max(0, status.trialDaysRemaining ?? 0);
      return this.languageService.t('app.freeTrialActive', {
        days,
        suffix: days === 1 ? '' : 's',
      });
    }
    if (status.organization.readOnlyMode) {
      return this.languageService.t('app.subscriptionExpired');
    }
    return '';
  });
  
  isOnline = true;

  ngOnInit() {
    const token = this.authService.getStoredToken();
    const user = this.authService.getStoredUser();
    const initialUrl = this.router.url || '/';
    const isInitialAuthRoute = initialUrl.startsWith('/auth');
    
    // Immediate hydration from storage for instant UI
    if (token && user) {
      this.store.dispatch(AuthActions.restoreUser({ user, token }));
    }

    // Keep auth pages lightweight; refresh session only on non-auth routes.
    if (token && !isInitialAuthRoute) {
      this.authService.getMe({ skipLoading: true }).subscribe({
        next: (freshUser) => {
          this.authService.setStoredUser(freshUser);
          this.store.dispatch(AuthActions.restoreUser({ user: freshUser, token }));
          this.subscriptionService.getStatus().subscribe({
            next: (status) => this.subscriptionStatus.set(status),
            error: () => this.subscriptionStatus.set(null),
          });
        },
        error: (err) => {
          if (err?.status === 401 || err?.status === 404) {
            this.authService.clearAuthStorage();
            this.router.navigate(['/auth/login']);
          }
        }
      });
    }

    // Handle routing loader
    this.router.events.pipe(
      filter(event => 
        event instanceof NavigationStart || 
        event instanceof NavigationEnd || 
        event instanceof NavigationCancel || 
        event instanceof NavigationError
      )
    ).subscribe(event => {
      if (event instanceof NavigationStart) {
        this.currentUrl.set(event.url);
        this.routeLoading.set(true);
        this.topLoaderService.show();
      } else if (event instanceof NavigationEnd) {
        this.currentUrl.set(event.urlAfterRedirects);
        this.routeLoading.set(false);
        this.topLoaderService.hide();
      } else {
        this.routeLoading.set(false);
        this.topLoaderService.hide();
      }
    });
    
    // Online/Offline detection
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine;
      window.addEventListener('online', () => {
        this.isOnline = true;
      });
      window.addEventListener('offline', () => {
        this.isOnline = false;
      });
    }
  }

  reload() {
    window.location.reload();
  }

  upgrade() {
    this.router.navigateByUrl('/billing');
  }

  t(key: string, params?: Record<string, string | number | null | undefined>): string {
    this.languageService.currentLanguage();
    return this.languageService.t(key, params);
  }
}
