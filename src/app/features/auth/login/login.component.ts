import {
  Component,
  OnInit,
  signal,
  computed,
  inject,
  ViewChild,
  ViewChildren,
  QueryList,
  ElementRef,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';
import { LanguageService } from '../../../core/services/language.service';
import * as AuthActions from '../../../core/state/auth/auth.actions';
import {
  COUNTRIES as countryCodes,
  type CountryCodeData,
} from '../../../core/constants/countries';

import { UiPhoneInputComponent } from '../../../core/components/ui';
import { AuthLanguageSwitcherComponent } from '../auth-language-switcher.component';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from 'firebase/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, UiPhoneInputComponent, AuthLanguageSwitcherComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit {
  loginMethod = signal<'email' | 'phone'>('email');
  stage = signal<'credentials' | 'otp'>('credentials');
  credentialsStep = signal<'identify' | 'password'>('identify');

  private el = inject(ElementRef);
  private authService = inject(AuthService);
  private languageService = inject(LanguageService);
  private store = inject(Store);
  private router = inject(Router);

  loading = signal(false);
  error = signal('');
  info = signal('');
  showPassword = signal(false);

  identifier = '';
  showSignupPrompt = signal(false);
  signupPromptText = signal('');

  recaptchaVerifier: any;
  confirmationResult: any;

  // These signals are now managed inside UiPhoneInputComponent
  // dropdownOpen = signal(false);
  // countrySearch = signal('');

  loginForm = {
    email: '',
    password: '',
    rememberMe: false,
  };
  otpCode = '';
  selectedCountryCode = '+91'; // Default, will be updated by countryChange event

  phoneForm = {
    fullNumber: '',
  };

  otpReference = '';

  countryCodes: CountryCodeData[] = countryCodes; // Initial fallback

  // Replaced by UiPhoneInputComponent
  /*
  private getSelectedCountry() { ... }
  private loadCountries() { ... }
  private applyFallbackMapping() { ... }
  getSelectedCountryCode(): string { ... }
  toggleDropdown(event: Event) { ... }
  selectCountry(id: string) { ... }
  onDocumentClick(event: MouseEvent) { ... }
  getEmojiFlag(countryCode: string): string { ... }
  private detectCountry() { ... }
  */

  private firebaseApp: any;
  private auth: any;

  @ViewChildren('otpDigitInput') otpDigitInputs!: QueryList<
    ElementRef<HTMLInputElement>
  >;

  otpDigits = signal<string[]>(['', '', '', '', '', '']);

  constructor() {
    // Auto-focus first OTP input when stage changes to 'otp'
    effect(() => {
      if (this.stage() === 'otp') {
        setTimeout(() => {
          this.otpDigitInputs.first?.nativeElement?.focus();
        }, 100);
      }
    });
  }

  ngOnInit() {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    try {
      if (getApps().length === 0) {
        this.firebaseApp = initializeApp(environment.firebase);
      } else {
        this.firebaseApp = getApp();
      }
      this.auth = getAuth(this.firebaseApp);

      this.setupRecaptchaVerifier();
    } catch (err) {
      console.error('Firebase init error:', err);
      // Don't show error immediately as it might be a double-init that we can recover from
    }
  }

  private setupRecaptchaVerifier() {
    // Only create if it doesn't exist or was cleared
    if (!this.recaptchaVerifier) {
      this.recaptchaVerifier = new RecaptchaVerifier(
        this.auth,
        'recaptcha-container',
        {
          size: 'invisible',
          callback: (response: any) => {
            // reCAPTCHA solved
          },
          'expired-callback': () => {
            // Response expired. Ask user to solve reCAPTCHA again.
            this.setupRecaptchaVerifier();
          },
        },
      );

      this.recaptchaVerifier.render().catch((err: any) => {
        console.error('Recaptcha render error:', err);
      });
    }
  }

  private looksLikeEmail(value: string): boolean {
    const email = (value || '').trim().toLowerCase();
    if (!email) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private inferCountryCodeFromE164Digits(e164Digits: string): string | null {
    const digits = (e164Digits || '').replace(/\D/g, '');
    if (!digits) return null;

    const uniqueCodes = Array.from(
      new Set(
        this.countryCodes
          .map((c) => String(c.code || '').trim())
          .filter(Boolean),
      ),
    );
    uniqueCodes.sort((a, b) => b.length - a.length);

    return uniqueCodes.find((code) => digits.startsWith(code)) ?? null;
  }

  private buildE164Phone(rawValue?: string): string {
    const rawInput = String(
      rawValue ?? this.phoneForm.fullNumber ?? this.identifier ?? '',
    ).trim();
    if (!rawInput) return '';

    if (rawInput.startsWith('+')) {
      return `+${rawInput.substring(1).replace(/\D/g, '')}`;
    }

    const digitsOnly = rawInput.replace(/\D/g, '');
    const prefix = (this.selectedCountryCode || '+91').startsWith('+')
      ? this.selectedCountryCode
      : `+${this.selectedCountryCode}`;

    return digitsOnly ? `${prefix}${digitsOnly}` : '';
  }

  identifierHint = computed(() => {
    if (this.credentialsStep() === 'password') {
      return this.t('auth.login.identifierHintPassword');
    }

    return this.loginMethod() === 'phone'
      ? this.t('auth.login.identifierHintPhone')
      : this.t('auth.login.identifierHintEmail');
  });

  otpTargetHint = computed(() => {
    if (this.loginMethod() === 'phone') {
      return this.buildE164Phone() || 'your phone number';
      
    }

    return (
      (this.identifier || this.loginForm.email || '').trim().toLowerCase() ||
      this.t('auth.login.yourEmail')
    );
  });

  t(key: string, params?: Record<string, string | number | null | undefined>): string {
    return this.languageService.t(key, params);
  }

  onIdentifierChange(value: string) {
    if (this.loading()) return;

    const raw = String(value ?? '');
    const trimmed = raw.trim();

    // Check if the input looks like email vs phone
    const hasAt = trimmed.includes('@');
    const hasLetters = /[a-zA-Z]/.test(trimmed);
    const digitCount = trimmed.replace(/\D/g, '').length;

    // Default back to email if input is completely empty (blank)
    const nextMethod: 'email' | 'phone' =
      hasAt || hasLetters ? 'email' : digitCount > 0 ? 'phone' : 'email';

    if (nextMethod !== this.loginMethod()) {
      this.loginMethod.set(nextMethod);
      this.stage.set('credentials');
      this.credentialsStep.set('identify');
      this.otpReference = '';
      this.otpCode = '';
      this.error.set('');
      this.info.set('');

      // Auto-focus the newly created input after DOM updates
      setTimeout(() => {
        if (nextMethod === 'phone') {
          const phoneInput = this.el.nativeElement.querySelector(
            'app-ui-phone-input input',
          );
          if (phoneInput) phoneInput.focus();
        } else {
          const emailInput =
            this.el.nativeElement.querySelector('#emailIdentifier');
          if (emailInput) emailInput.focus();
        }
      }, 0);
    }

    if (nextMethod === 'email') {
      this.loginForm.email = trimmed.toLowerCase();
    } else {
      // Phone: If we are in phone mode, sync the value
      // Only set phoneForm.fullNumber if it's not already correct, to avoid re-triggering child updates
      if (this.phoneForm.fullNumber !== trimmed) {
        this.phoneForm.fullNumber = trimmed;
      }
    }

    // Keep the identifier model in sync across all modes to prevent truncation on button click
    if (this.identifier !== raw) {
      this.identifier = raw;
    }
  }

  onCountryChange(country: any) {
    if (country && country.code) {
      this.selectedCountryCode = country.code.startsWith('+')
        ? country.code
        : `+${country.code}`;
    }
  }

  private openSignupPrompt(message: string) {
    this.signupPromptText.set(message);
    this.showSignupPrompt.set(true);
  }

  closeSignupPrompt() {
    this.showSignupPrompt.set(false);
    this.signupPromptText.set('');
  }

  goToSignup() {
    const identifier = (
      this.loginMethod() === 'phone'
        ? this.buildE164Phone()
        : (this.identifier || this.loginForm.email || '').trim()
    ).trim();
    this.closeSignupPrompt();
    this.router.navigate(['/auth/signup'], {
      queryParams: identifier
        ? { identifier, type: this.loginMethod() }
        : undefined,
    });
  }

  nextFromIdentifier() {
    if (this.loading()) return;
    this.error.set('');
    this.info.set('');
    // Check signup prompt etc.
    this.closeSignupPrompt();

    // The method is already kept up to date by onIdentifierChange on every keystroke.
    // Calling it again with potentially stale this.identifier can reset the phone number.

    if (this.loginMethod() === 'email') {
      const email = (this.identifier || '').trim().toLowerCase();
      if (!email) {
        this.error.set(this.t('auth.login.enterEmail'));
        return;
      }
      if (!this.looksLikeEmail(email)) {
        this.error.set(this.t('auth.login.validEmail'));
        return;
      }

      this.info.set(this.t('auth.login.checkingAccount'));
      this.loading.set(true);
      this.authService.checkIdentifier(email).subscribe({
        next: (res: any) => {
          this.loading.set(false);
          this.info.set('');
          if (res?.exists) {
            this.credentialsStep.set('password');
            return;
          }
          this.openSignupPrompt(
            this.t('auth.login.noEmailAccount'),
          );
        },
        error: () => {
          this.loading.set(false);
          this.info.set('');
          // If backend doesn't support the check endpoint, fall back to old behavior
          this.credentialsStep.set('password');
        },
      });

      return;
    }

    const phoneNumber = this.buildE164Phone();
    if (!phoneNumber || !/^\+[1-9]\d{1,14}$/.test(phoneNumber)) {
      this.error.set(this.t('auth.login.validPhone'));
      return;
    }

    this.info.set(this.t('auth.login.checkingAccount'));
    this.loading.set(true);
    this.authService.checkIdentifier(phoneNumber).subscribe({
      next: (res: any) => {
        this.loading.set(false);
        this.info.set('');
        if (res?.exists) {
          this.requestPhoneOtp(phoneNumber);
          return;
        }
        this.openSignupPrompt(
          this.t('auth.login.noPhoneAccount'),
        );
      },
      error: () => {
        this.loading.set(false);
        this.info.set('');
        this.requestPhoneOtp(phoneNumber);
      },
    });
  }

  setMethod(method: 'email' | 'phone') {
    if (this.loading()) return;
    this.loginMethod.set(method);
    this.stage.set('credentials');
    this.credentialsStep.set('identify');
    this.otpReference = '';
    this.otpCode = '';
    this.error.set('');
    this.info.set('');
  }

  backToIdentifier() {
    if (this.loading()) return;
    this.credentialsStep.set('identify');
    this.loginForm.password = '';
    this.showPassword.set(false);
    this.error.set('');
    this.info.set('');
  }

  goBackToCredentials() {
    if (this.loading()) return;
    this.stage.set('credentials');
    this.credentialsStep.set('identify');
    this.otpReference = '';
    this.otpCode = '';
    this.error.set('');
    this.info.set('');
  }

  signInWithOAuth(provider: 'google' | 'microsoft') {
    const backendUrl = environment.apiUrl.replace('/api', '');
    if (provider === 'google') {
      window.location.href = `${backendUrl}/api/auth/google`;
    } else if (provider === 'microsoft') {
      window.location.href = `${backendUrl}/api/auth/microsoft`;
    }
  }

  togglePassword() {
    this.showPassword.update((v) => !v);
  }

  onSubmit() {
    this.error.set('');
    this.info.set('');

    if (this.stage() === 'credentials') {
      if (this.credentialsStep() === 'identify') {
        this.nextFromIdentifier();
        return;
      }

      // Password step (email only)
      this.submitEmailPassword();
      return;
    }

    this.verifyOtp();
  }

  private submitEmailPassword() {
    const email = (this.identifier || this.loginForm.email || '')
      .trim()
      .toLowerCase();
    const password = this.loginForm.password || '';

    const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!email) {
      this.error.set(this.t('auth.login.enterEmail'));
      return;
    }
    if (!emailLooksValid) {
      this.error.set(this.t('auth.login.validEmail'));
      return;
    }
    if (!password) {
      this.error.set(this.t('auth.login.enterPassword'));
      return;
    }

    this.loading.set(true);

    this.authService.login({ email, password, loginType: 'email' }).subscribe({
      next: (res: any) => {
        this.loading.set(false);

        if (res?.token) {
          if (res?.user) {
            this.store.dispatch(
              AuthActions.loginSuccess({ user: res.user, token: res.token }),
            );
          }
          this.fetchFreshUser();
          this.router.navigateByUrl('/dashboard', { replaceUrl: true });
          return;
        }

        if (res?.requiresOtp || res?.requires2fa) {
          const ref = res?.otpReference ?? '';
          if (res?.emailDelivered === false && !ref) {
            this.error.set(
              res?.message ||
                this.t('auth.login.otpEmailDeliveryFailed'),
            );
            return;
          }
          if (!ref) {
            this.error.set(
              res?.message ||
                this.t('auth.login.otpMissingReference'),
            );
            return;
          }
          this.otpReference = String(ref);
          this.stage.set('otp');
          this.otpCode = '';
          this.info.set(
            res?.emailDelivered === false
              ? res?.message ||
                  this.t('auth.login.otpGeneratedForEmail', { email })
              : this.t('auth.login.otpSentToEmail', { email }),
          );
          return;
        }

        this.error.set(res?.message || this.t('auth.login.failed'));
      },
      error: (err) => {
        this.loading.set(false);
        const message =
          err?.error?.message || this.t('auth.login.failed');
        this.error.set(message);
        if (err?.status === 401 || err?.status === 404) {
          this.openSignupPrompt(
            this.t('auth.login.invalidCredentialsSignup'),
          );
        }
      },
    });
  }

  onDigitInput(index: number, event: any) {
    const value = event.target.value;
    // Only allow numbers
    const cleanValue = value.replace(/\D/g, '').substring(0, 1);

    const newDigits = [...this.otpDigits()];
    newDigits[index] = cleanValue;
    this.otpDigits.set(newDigits);
    this.otpCode = newDigits.join('');

    // Move to next input if value is entered
    if (cleanValue && index < 5) {
      this.otpDigitInputs.toArray()[index + 1].nativeElement.focus();
    }
  }

  onDigitKeyDown(index: number, event: KeyboardEvent) {
    if (event.key === 'Backspace' && !this.otpDigits()[index] && index > 0) {
      // Focus previous input on backspace if current is empty
      this.otpDigitInputs.toArray()[index - 1].nativeElement.focus();
    }
  }

  onDigitPaste(event: ClipboardEvent) {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text') || '';
    const digits = pastedData.replace(/\D/g, '').substring(0, 6).split('');

    const newDigits = [...this.otpDigits()];
    digits.forEach((digit, i) => {
      if (i < 6) newDigits[i] = digit;
    });

    this.otpDigits.set(newDigits);
    this.otpCode = newDigits.join('');

    // Focus the last filled input or the first empty one
    const focusIndex = Math.min(digits.length, 5);
    this.otpDigitInputs.toArray()[focusIndex].nativeElement.focus();
  }

  private requestPhoneOtp(phoneValue?: string) {
    const phoneNumber = this.buildE164Phone(phoneValue);

    // Double check E.164 format for Firebase: +[country code][number]
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    if (!phoneNumber || !e164Regex.test(phoneNumber)) {
      this.error.set(this.t('auth.login.validPhoneLong'));
      this.loading.set(false);
      return;
    }

    // Ensure reCAPTCHA is ready
    if (!this.recaptchaVerifier) {
      this.setupRecaptchaVerifier();
    }

    if (!this.auth || !this.recaptchaVerifier) {
      this.error.set(this.t('auth.login.firebaseNotReady'));
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.info.set(this.t('auth.login.sendingPhoneOtp'));

    // Wait a tiny bit to ensure Recaptcha is rendered if it was just created
    setTimeout(() => {
      signInWithPhoneNumber(this.auth, phoneNumber, this.recaptchaVerifier)
        .then((confirmationResult: any) => {
          this.loading.set(false);
          this.confirmationResult = confirmationResult;
          this.stage.set('otp');
          this.otpCode = '';
          this.info.set(this.t('auth.login.otpSentSuccess', { phone: phoneNumber }));
        })
        .catch((error: any) => {
          this.loading.set(false);
          console.error('Firebase Phone Auth Error:', error);

          let errorMsg = this.t('auth.login.failedSendOtp');
          if (error.code === 'auth/invalid-phone-number') {
            errorMsg = this.t('auth.login.invalidPhoneNumber');
          } else if (error.code === 'auth/too-many-requests') {
            errorMsg = this.t('auth.login.tooManyRequests');
          } else if (error.code === 'auth/quota-exceeded') {
            errorMsg = this.t('auth.login.smsQuotaExceeded');
          } else if (error.code === 'auth/internal-error') {
            errorMsg = this.t('auth.login.internalFirebase');
            // Try to reset the verifier on internal error
            if (this.recaptchaVerifier) {
              this.recaptchaVerifier.clear();
              this.recaptchaVerifier = null;
            }
          } else if (error.code === 'auth/billing-not-enabled') {
            errorMsg = this.t('auth.login.billingNotEnabled');
          } else {
            errorMsg += ': ' + (error.message || 'Unknown error');
          }
          this.error.set(errorMsg);
        });
    }, 100);
  }

  resendOtp() {
    if (this.loading()) return;
    this.error.set('');
    this.info.set('');

    if (this.loginMethod() === 'phone') {
      // For phone, recreate verifier and resend
      this.setupRecaptchaVerifier();
      setTimeout(() => this.requestPhoneOtp(), 500);
      return;
    }

    const email = (this.identifier || this.loginForm.email || '')
      .trim()
      .toLowerCase();
    if (!email) {
      this.error.set(this.t('auth.login.missingEmail'));
      this.stage.set('credentials');
      return;
    }

    this.loading.set(true);
    this.authService.requestEmailOtp(email).subscribe({
      next: (res: any) => {
        this.loading.set(false);
        const ref = res?.otpReference ?? '';
        if (res?.emailDelivered === false && !ref) {
          this.error.set(
            res?.message ||
              this.t('auth.login.otpEmailDeliveryFailed'),
          );
          return;
        }
        if (ref) this.otpReference = String(ref);
        this.info.set(
          res?.emailDelivered === false
            ? res?.message ||
                this.t('auth.login.otpGeneratedFresh')
            : res?.message || this.t('auth.login.otpResent'),
        );
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || this.t('auth.login.failedResendOtp'));
      },
    });
  }

  private verifyOtp() {
    const otp = (this.otpCode || '').replace(/\D/g, '').trim();
    if (otp.length !== 6) {
      this.error.set(this.t('auth.login.enterSixDigitOtp'));
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.info.set('');

    if (this.loginMethod() === 'phone') {
      if (!this.confirmationResult) {
        this.loading.set(false);
        this.error.set(this.t('auth.login.sessionExpired'));
        this.stage.set('credentials');
        return;
      }

      const phone = this.phoneForm.fullNumber || this.identifier;

      this.confirmationResult
        .confirm(otp)
        .then((result: any) => {
          return result.user.getIdToken();
        })
        .then((idToken: string) => {
          // Send to backend
          this.authService.verifyPhoneOtp(phone, otp, idToken).subscribe({
            next: (res: any) => {
              this.loading.set(false);
              if (res?.token) {
                if (res?.user) {
                  this.store.dispatch(
                    AuthActions.loginSuccess({
                      user: res.user,
                      token: res.token,
                    }),
                  );
                }
                this.fetchFreshUser();
                this.router.navigateByUrl('/dashboard', { replaceUrl: true });
                return;
              }
              this.error.set(
                res?.message || 'Login failed after OTP verification.',
              );
            },
            error: (err: any) => {
              this.loading.set(false);
              this.error.set(
                err?.error?.message || 'Login failed after OTP verification.',
              );
            },
          });
        })
        .catch((err: any) => {
          this.loading.set(false);
          this.error.set('Invalid OTP code. Please try again.');
          console.error(err);
        });
      return;
    }

    const otpRefNumber = Number(this.otpReference);
    if (!Number.isFinite(otpRefNumber)) {
      this.loading.set(false);
      this.error.set('Invalid OTP reference. Please request OTP again.');
      this.stage.set('credentials');
      return;
    }

    this.authService
      .verifyOtp({ otpReference: otpRefNumber, code: otp })
      .subscribe({
        next: (res: any) => {
          this.loading.set(false);
          if (res?.token) {
            if (res?.user) {
              this.store.dispatch(
                AuthActions.loginSuccess({ user: res.user, token: res.token }),
              );
            }
            this.fetchFreshUser();
            this.router.navigateByUrl('/dashboard', { replaceUrl: true });
            return;
          }
          this.error.set(res?.message || 'OTP verification failed.');
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(err?.error?.message || 'OTP verification failed.');
        },
      });
  }

  private fetchFreshUser() {
    const token = this.authService.getStoredToken();
    if (!token) return;
    this.authService.getMe().subscribe({
      next: (freshUser) => {
        this.authService.setStoredUser(freshUser);
        this.store.dispatch(AuthActions.updateUser({ user: freshUser }));
      },
      error: () => {},
    });
  }
}
