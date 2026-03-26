import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterOutlet, Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { Store } from '@ngrx/store';
import * as AuthActions from './core/state/auth/auth.actions';
import { AuthService } from './core/services/auth.service';
import { ToastComponent } from './core/components/toast/toast.component';
import { ConfirmModalComponent } from './core/components/modal/confirm-modal.component';
import { TopLoaderComponent } from './core/components/top-loader/top-loader.component';
import { TopLoaderService } from './core/services/top-loader.service';
import { UserLimitService } from './core/services/user-limit.service';
import { filter } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop';
import { CommonModule, AsyncPipe } from '@angular/common';
import { MainLoaderComponent } from './core/components/main-loader/main-loader.component';
import { CustomModalComponent } from './core/components/modal/custom-modal.component';
import { CustomButtonComponent } from './core/components/button/custom-button.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    AsyncPipe,
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
  private authService = inject(AuthService);
  private store = inject(Store);
  private router = inject(Router);
  
  title = 'HRNexus';
  showRefreshStrip = signal(false);
  loading$ = toObservable(this.topLoaderService.loadingSignal);
  
  isOnline = true;

  ngOnInit() {
    const token = this.authService.getStoredToken();
    const user = this.authService.getStoredUser();
    if (token && user) {
      this.store.dispatch(AuthActions.restoreUser({ user, token }));

      this.authService.getMe().subscribe({
        next: (freshUser) => {
          this.authService.setStoredUser(freshUser);
          this.store.dispatch(AuthActions.restoreUser({ user: freshUser, token }));
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
        this.topLoaderService.show();
      } else {
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
    this.userLimitService.upgrade();
  }
}
