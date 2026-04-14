import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideStore } from '@ngrx/store';
import { AppComponent } from './app.component';
import { AuthService } from './core/services/auth.service';
import { TopLoaderService } from './core/services/top-loader.service';
import { UserLimitService } from './core/services/user-limit.service';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        provideStore({}),
        {
          provide: AuthService,
          useValue: {
            getStoredToken: () => null,
            getStoredUser: () => null,
            getMe: () => ({ subscribe: () => ({ unsubscribe() {} }) }),
            setStoredUser: () => undefined,
            clearAuthStorage: () => undefined,
          },
        },
        {
          provide: TopLoaderService,
          useValue: {
            loadingSignal: signal(false),
            show: () => undefined,
            hide: () => undefined,
          },
        },
        {
          provide: UserLimitService,
          useValue: {
            upgrade: () => undefined,
          },
        },
      ],
    }).compileComponents();
  });

  it('creates the application shell', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
