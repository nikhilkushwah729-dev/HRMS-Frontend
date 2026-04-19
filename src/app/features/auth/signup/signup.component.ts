import { Component, inject, signal, Input, OnInit, computed, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';
import { COUNTRIES as countryCodes, type CountryCodeData } from '../../../core/constants/countries';
import { LanguageService } from '../../../core/services/language.service';

import { UiPhoneInputComponent } from '../../../core/components/ui';
import { AuthLanguageSwitcherComponent } from '../auth-language-switcher.component';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, UiPhoneInputComponent, AuthLanguageSwitcherComponent],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css'
})
export class SignupComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private el = inject(ElementRef);
  private languageService = inject(LanguageService);

  loading = signal(false);
  error = signal('');
  success = signal('');
  showPassword = signal(false);
  showConfirmPassword = false;
  termsAccepted = false;
  confirmPassword = '';

  // These signals are now managed inside UiPhoneInputComponent
  // dropdownOpen = signal(false);
  // countrySearch = signal('');

  form = {
    companyName: '',
    adminFirstName: '',
    adminLastName: '',
    email: '',
    adminPassword: '',
    phone: ''
  };

  selectedCountry: CountryCodeData | null = null;

  phoneForm = {
    selectedCountryId: '140', // India
    number: ''
  };

  countryCodes: CountryCodeData[] = countryCodes;

  ngOnInit() {
    this.route.queryParamMap.subscribe(params => {
      const identifier = (params.get('identifier') || '').trim();
      const type = params.get('type');

      if (!identifier) return;

      if (type === 'phone' || identifier.startsWith('+') || /^\d+$/.test(identifier)) {
        this.form.phone = identifier.startsWith('+') ? identifier.replace(/^\+\d{1,4}/, '').replace(/\D/g, '') : identifier.replace(/\D/g, '');
      } else {
        this.form.email = identifier.toLowerCase();
      }
    });
  }


  togglePassword() {
    this.showPassword.set(!this.showPassword());
  }

  signInWithOAuth(provider: 'google' | 'microsoft') {
    const backendUrl = environment.apiUrl.replace('/api', '');
    if (provider === 'google') {
      window.location.href = `${backendUrl}/api/auth/google`;
    } else {
      window.location.href = `${backendUrl}/api/auth/microsoft`;
    }
  }

  onCountryChange(country: CountryCodeData) {
    this.selectedCountry = country;
  }

  private extractErrorMessage(err: any): string {
    const backendError = err?.error;

    if (Array.isArray(backendError?.errors) && backendError.errors.length > 0) {
      return backendError.errors[0]?.message || this.t('auth.signup.failed');
    }

    return backendError?.message || this.t('auth.signup.failed');
  }

  onSubmit() {
    this.error.set('');
    this.success.set('');

    const companyName = this.form.companyName.trim();
    const adminFirstName = this.form.adminFirstName.trim();
    const adminLastName = this.form.adminLastName.trim();
    const email = this.form.email.trim().toLowerCase();
    const adminPassword = this.form.adminPassword;
    const phone = this.form.phone.replace(/\D/g, '');

    if (!companyName || !adminFirstName || !email || !adminPassword) {
      this.error.set(this.t('auth.signup.failed'));
      return;
    }

    if (adminPassword.length < 8) {
      this.error.set(this.t('auth.signup.passwordMin'));
      return;
    }

    if (adminPassword !== this.confirmPassword) {
      this.error.set(this.t('auth.signup.passwordsNoMatch'));
      return;
    }

    if (!this.termsAccepted) {
      this.error.set(this.t('auth.signup.agreePrefix'));
      return;
    }

    if (this.selectedCountry && phone) {
      if (phone.length !== this.selectedCountry.phoneNumberLength) {
        this.error.set(this.t('auth.signup.phoneDigits', {
          country: this.selectedCountry.name,
          digits: this.selectedCountry.phoneNumberLength,
        }));
        return;
      }
    }

    this.loading.set(true);

    const payload: Record<string, unknown> = {
      companyName,
      adminFirstName,
      email,
      adminPassword,
    };

    if (adminLastName) {
      payload['adminLastName'] = adminLastName;
    }

    if (phone) {
      payload['phone'] = phone;
    }

    if (this.selectedCountry) {
      payload['countryCode'] = this.selectedCountry.flag;
      payload['countryName'] = this.selectedCountry.name;
      payload['dialCode'] = this.selectedCountry.code;
      payload['country'] = this.selectedCountry.name;
    }

    this.authService.register(payload).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.success.set(this.t('auth.signup.successMessage'));
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(this.extractErrorMessage(err));
      }
    });
  }

  t(key: string, params?: Record<string, string | number | null | undefined>): string {
    return this.languageService.t(key, params);
  }
}
