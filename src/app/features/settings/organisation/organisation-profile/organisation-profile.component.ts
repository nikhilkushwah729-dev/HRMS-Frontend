import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { UiInputComponent } from '../../../../core/components/ui/ui-input.component';
import { UiPhoneInputComponent } from '../../../../core/components/ui/ui-phone-input.component';
import { OrganizationService } from '../../../../core/services/organization.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AuthService } from '../../../../core/services/auth.service';
import * as AuthActions from '../../../../core/state/auth/auth.actions';
import { User } from '../../../../core/models/auth.model';
import { compressImageDataUrl } from '../../../../core/utils/image-compression.util';

interface Step {
  id: number;
  title: string;
  description: string;
}

@Component({
  selector: 'app-organisation-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, UiInputComponent, UiPhoneInputComponent],
  template: `
    <div class="mx-auto max-w-7xl space-y-6">
      <section class="app-module-hero gap-6">
        <div class="min-w-0">
          <p class="app-module-kicker">Organisation Settings</p>
          <h1 class="app-module-title">Organisation profile</h1>
          <p class="app-module-text max-w-2xl">Manage company identity, operational address, billing details, and timezone preferences from one aligned admin workspace.</p>
        </div>
        <div class="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          @if (loading()) {
            <span class="inline-flex items-center justify-center rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-amber-700">Loading profile</span>
          } @else if (loadError()) {
            <span class="inline-flex items-center justify-center rounded-full bg-rose-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-rose-700">Sync needed</span>
          } @else {
            <span class="inline-flex items-center justify-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Connected</span>
          }
          <button type="button" (click)="reloadProfile()" class="rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60" [disabled]="loading()">Refresh</button>
          <button type="button" (click)="resetForm()" class="rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Discard Changes</button>
          <button type="button" (click)="saveProfile()" [disabled]="loading() || saving() || !isFormValid()" class="rounded-md bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50">
            {{ saving() ? 'Saving...' : 'Save Profile' }}
          </button>
        </div>
      </section>

      @if (loadError()) {
        <div class="rounded-md border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p class="font-bold">Organisation data properly fetch nahi ho pa raha tha.</p>
              <p class="mt-1 text-xs text-rose-600">{{ loadError() }}</p>
            </div>
            <button type="button" (click)="reloadProfile(true)" class="rounded-md bg-rose-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-700">
              Retry Sync
            </button>
          </div>
        </div>
      }

      <div class="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside class="space-y-4 xl:sticky xl:top-8 xl:self-start">
          <div class="app-surface-card overflow-hidden p-0">
            <div class="bg-slate-900 px-5 py-5 text-white">
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">Profile Snapshot</p>
              <div class="mt-4 flex items-center gap-4">
                <div class="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-white/15 bg-white/10">
                  @if (logoPreview()) {
                    <img [src]="logoPreview()" alt="Organization logo preview" class="h-full w-full object-cover">
                  } @else {
                    <span class="text-2xl font-black uppercase text-white">{{ organizationInitial() }}</span>
                  }
                </div>
                <div class="min-w-0">
                  <p class="truncate text-lg font-black">{{ profileForm.get('organizationName')?.value || 'Your organisation' }}</p>
                  <p class="truncate text-sm text-slate-300">{{ profileForm.get('email')?.value || 'Add your official email' }}</p>
                </div>
              </div>
            </div>
            <div class="space-y-4 px-5 py-5">
              <div>
                <div class="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  <span>Progress</span>
                  <span>{{ currentStep() + 1 }}/{{ steps.length }}</span>
                </div>
                <div class="h-2 rounded-full bg-slate-100">
                  <div class="h-2 rounded-full bg-slate-900 transition-all" [style.width.%]="stepProgress()"></div>
                </div>
              </div>

              <div class="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Current Section</p>
                <p class="mt-2 text-sm font-bold text-slate-900">{{ steps[currentStep()].title }}</p>
                <p class="mt-1 text-xs text-slate-600">{{ steps[currentStep()].description }}</p>
              </div>
            </div>
          </div>

          <div class="app-surface-card p-3">
            @for (step of steps; track step.id; let idx = $index) {
              <button
                type="button"
                (click)="goToStep(idx)"
                class="mb-2 flex w-full items-center gap-3 rounded-md border px-4 py-3 text-left transition"
                [ngClass]="currentStep() === idx ? 'border-slate-900 bg-slate-900 text-white shadow-sm' : 'border-transparent bg-white text-slate-700 hover:border-slate-200 hover:bg-slate-50'"
              >
                <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-md font-bold" [ngClass]="currentStep() === idx ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-700'">{{ step.id }}</span>
                <span class="min-w-0">
                  <span class="block text-sm font-bold">{{ step.title }}</span>
                  <span class="mt-0.5 block text-xs leading-5" [ngClass]="currentStep() === idx ? 'text-slate-200' : 'text-slate-500'">{{ step.description }}</span>
                </span>
              </button>
            }
          </div>
        </aside>

        <section class="app-surface-card overflow-hidden p-0">
          <form [formGroup]="profileForm" class="space-y-8">
            @if (currentStep() === 0) {
              <div class="space-y-6 px-6 py-6 md:px-8 md:py-8">
                <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Identity</p>
                    <h2 class="mt-2 text-2xl font-black text-slate-900">Organization details</h2>
                    <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Keep your company branding, primary email, and business identity updated so the same details appear correctly across sidebar, profile, and admin views.</p>
                  </div>
                  <div class="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    <p class="font-bold text-slate-900">Branding status</p>
                    <p class="mt-1">{{ logoPreview() ? 'Logo uploaded and ready to use.' : 'No logo yet, initial fallback will be used.' }}</p>
                  </div>
                </div>

                <div class="rounded-md border border-slate-200 bg-slate-50/80 p-5 md:p-6">
                  <div class="flex flex-col gap-6 lg:flex-row lg:items-center">
                    <div class="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
                      @if (logoPreview()) {
                        <img [src]="logoPreview()" alt="Organization logo preview" class="h-full w-full object-cover">
                      } @else {
                        <span class="text-4xl font-black uppercase text-slate-500">{{ organizationInitial() }}</span>
                      }
                    </div>
                    <div class="flex-1 space-y-4">
                      <div>
                        <p class="text-sm font-bold text-slate-900">Organization logo</p>
                        <p class="mt-1 text-sm leading-6 text-slate-500">Upload PNG, JPG, WEBP, or SVG. Square logos work best for the sidebar card and compact profile surfaces.</p>
                      </div>
                      <div class="flex flex-wrap gap-3">
                        <label class="inline-flex cursor-pointer items-center rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">
                          Upload Logo
                          <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" class="hidden" (change)="onLogoSelected($event)">
                        </label>
                        <button type="button" (click)="removeLogo()" class="rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100" [disabled]="!logoPreview()">Remove</button>
                      </div>
                      @if (logoError()) {
                        <p class="text-xs font-semibold text-rose-600">{{ logoError() }}</p>
                      }
                    </div>
                  </div>
                </div>

                <div class="rounded-md border border-slate-100 bg-white p-1">
                  <div class="grid gap-5 rounded-md bg-white p-4 md:grid-cols-2 md:p-5">
                    <app-ui-input class="block min-w-0" formControlName="organizationName" label="Organization Name" placeholder="Enter legal entity name" [required]="true"></app-ui-input>
                    <app-ui-input class="block min-w-0" formControlName="industry" label="Industry" placeholder="Information Technology"></app-ui-input>
                    <app-ui-input class="block min-w-0 md:col-span-2" formControlName="email" label="Official Email Address" type="email" placeholder="contact@company.com" [required]="true"></app-ui-input>
                  </div>
                </div>
              </div>
            }

            @if (currentStep() === 1) {
              <div class="space-y-6 px-6 py-6 md:px-8 md:py-8">
                <div>
                  <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Operations</p>
                  <h2 class="mt-2 text-2xl font-black text-slate-900">Operational address</h2>
                  <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-500">This address becomes the primary operational location used for company records and general communication details.</p>
                </div>

                <div class="rounded-md border border-slate-100 bg-white p-1">
                  <div class="grid gap-5 rounded-md bg-white p-4 md:grid-cols-2 md:p-5">
                    <app-ui-input class="block min-w-0 md:col-span-2" formControlName="orgStreet1" label="Street Address Line 1" placeholder="Building, floor, street" [required]="true"></app-ui-input>
                    <app-ui-input class="block min-w-0 md:col-span-2" formControlName="orgStreet2" label="Street Address Line 2" placeholder="Landmark, suite, area"></app-ui-input>
                    <app-ui-input class="block min-w-0" formControlName="orgCity" label="City" placeholder="Enter city" [required]="true"></app-ui-input>
                    <app-ui-input class="block min-w-0" formControlName="orgPinCode" label="ZIP / Pin Code" placeholder="Postal code" [required]="true"></app-ui-input>
                    <app-ui-phone-input class="block min-w-0 md:col-span-2" formControlName="orgContactNumber" label="Contact Phone Number"></app-ui-phone-input>
                    <app-ui-input class="block min-w-0 md:col-span-2" formControlName="timeZone" label="Time Zone" placeholder="Asia/Kolkata" [required]="true"></app-ui-input>
                  </div>
                </div>
              </div>
            }

            @if (currentStep() === 2) {
              <div class="space-y-6 px-6 py-6 md:px-8 md:py-8">
                <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Billing</p>
                    <h2 class="mt-2 text-2xl font-black text-slate-900">Billing address</h2>
                    <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Use a separate billing address only when invoices should go to a different location than your operational office.</p>
                  </div>
                  <label class="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                    <input type="checkbox" [checked]="sameAddressChecked()" (change)="toggleSameAddress($event)" class="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900">
                    Same as operational address
                  </label>
                </div>

                <div class="rounded-md border border-slate-100 bg-white p-1" [class.opacity-70]="sameAddressChecked()">
                  <div class="grid gap-5 rounded-md bg-white p-4 md:grid-cols-2 md:p-5">
                    <app-ui-input class="block min-w-0 md:col-span-2" formControlName="billStreet1" label="Street Address Line 1" placeholder="Billing address"></app-ui-input>
                    <app-ui-input class="block min-w-0 md:col-span-2" formControlName="billStreet2" label="Street Address Line 2" placeholder="Landmark, suite, area"></app-ui-input>
                    <app-ui-input class="block min-w-0" formControlName="billCity" label="City" placeholder="Enter city"></app-ui-input>
                    <app-ui-input class="block min-w-0" formControlName="billPinCode" label="ZIP / Pin Code" placeholder="Postal code"></app-ui-input>
                    <app-ui-phone-input class="block min-w-0 md:col-span-2" formControlName="billContactNumber" label="Billing Contact Number"></app-ui-phone-input>
                  </div>
                </div>
              </div>
            }

            <div class="flex flex-col gap-3 border-t border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between md:px-8">
              <button type="button" (click)="previousStep()" class="rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50" [class.invisible]="currentStep() === 0">Previous Step</button>
              <div class="flex flex-col gap-3 sm:flex-row">
                <button type="button" (click)="nextStep()" class="rounded-md bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800" [class.invisible]="currentStep() === steps.length - 1">Next Step</button>
              </div>
            </div>
          </form>
        </section>
      </div>
    </div>
  `
})
export class OrganisationProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private orgService = inject(OrganizationService);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);
  private store = inject(Store);

  currentStep = signal(0);
  sameAddressChecked = signal(false);
  saving = signal(false);
  loading = signal(false);
  loadError = signal('');
  logoPreview = signal('');
  logoError = signal('');
  private initialData: any = null;

  steps: Step[] = [
    { id: 1, title: 'Organization Details', description: 'Basic company info' },
    { id: 2, title: 'Operational Address', description: 'Main headquarters' },
    { id: 3, title: 'Billing Address', description: 'Invoicing details' }
  ];

  profileForm: FormGroup = this.fb.group({
    organizationName: ['', Validators.required],
    logo: [''],
    industry: [''],
    email: ['', [Validators.required, Validators.email]],
    orgStreet1: ['', Validators.required],
    orgStreet2: [''],
    orgCity: ['', Validators.required],
    orgPinCode: ['', [Validators.required, Validators.maxLength(10)]],
    orgContactNumber: ['', Validators.required],
    timeZone: ['', Validators.required],
    billStreet1: ['', Validators.required],
    billStreet2: [''],
    billCity: ['', Validators.required],
    billPinCode: ['', [Validators.required, Validators.maxLength(10)]],
    billContactNumber: ['', Validators.required]
  });

  ngOnInit() {
    this.loadOrganizationProfile();
  }

  reloadProfile(refreshUser = false) {
    this.loadOrganizationProfile(refreshUser);
  }

  private loadOrganizationProfile(refreshUser = false) {
    this.loading.set(true);
    this.loadError.set('');

    if (refreshUser) {
      this.authService.getMe().subscribe({
        next: (user) => {
          this.authService.setStoredUser(user);
          this.fetchOrganizationProfile(true);
        },
        error: () => this.fetchOrganizationProfile(true)
      });
      return;
    }

    this.fetchOrganizationProfile(false);
  }

  private fetchOrganizationProfile(retriedFromUserSync: boolean) {
    this.orgService.getOrganization().subscribe({
      next: (organization) => {
        const hasRealData = this.hasUsableOrganizationData(organization);
        if (!hasRealData && !retriedFromUserSync) {
          this.loadOrganizationProfile(true);
          return;
        }

        this.initialData = {
          organizationName: organization.name || '',
          logo: organization.logo || '',
          industry: organization.industry || '',
          email: organization.email || '',
          orgStreet1: organization.orgStreet1 || organization.address || '',
          orgStreet2: organization.orgStreet2 || '',
          orgCity: organization.orgCity || organization.city || '',
          orgPinCode: organization.orgPinCode || organization.postalCode || '',
          orgContactNumber: organization.orgContactNumber || organization.phone || '',
          timeZone: organization.timeZone || '',
          billStreet1: organization.billStreet1 || organization.orgStreet1 || organization.address || '',
          billStreet2: organization.billStreet2 || '',
          billCity: organization.billCity || organization.orgCity || organization.city || '',
          billPinCode: organization.billPinCode || organization.orgPinCode || organization.postalCode || '',
          billContactNumber: organization.billContactNumber || organization.orgContactNumber || organization.phone || ''
        };
        this.profileForm.patchValue(this.initialData);
        this.logoPreview.set(this.initialData.logo || '');
        this.sameAddressChecked.set(this.isBillingSameAsOperational(this.initialData));
        this.loading.set(false);
        this.loadError.set(hasRealData ? '' : 'Saved session se minimal organization data mila, lekin organization API complete details nahi de rahi thi.');
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set('Organization endpoint response nahi de raha tha. Fallback mode active hai.');
        this.toastService.error('Failed to load organisation profile');
      }
    });
  }

  private hasUsableOrganizationData(organization: any): boolean {
    return Boolean(
      (organization?.name || '').trim() ||
      (organization?.email || '').trim() ||
      (organization?.phone || '').trim() ||
      (organization?.orgContactNumber || '').trim()
    );
  }

  private isBillingSameAsOperational(value: any): boolean {
    return (
      (value?.billStreet1 || '') === (value?.orgStreet1 || '') &&
      (value?.billStreet2 || '') === (value?.orgStreet2 || '') &&
      (value?.billCity || '') === (value?.orgCity || '') &&
      (value?.billPinCode || '') === (value?.orgPinCode || '') &&
      (value?.billContactNumber || '') === (value?.orgContactNumber || '')
    );
  }

  organizationInitial(): string {
    const name = (this.profileForm.get('organizationName')?.value || '').trim();
    return (name.charAt(0) || 'O').toUpperCase();
  }

  stepProgress(): number {
    return ((this.currentStep() + 1) / this.steps.length) * 100;
  }

  async onLogoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.logoError.set('');

    if (!file) {
      return;
    }

    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      this.logoError.set('Please upload PNG, JPG, WEBP, or SVG image.');
      input.value = '';
      return;
    }

    const maxSizeBytes = 8 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      this.logoError.set('Logo image must be 8 MB or smaller.');
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      void this.applyCompressedLogo(result);
    };
    reader.onerror = () => {
      this.logoError.set('Unable to read selected image. Please try another file.');
    };
    reader.readAsDataURL(file);
  }

  private async applyCompressedLogo(source: string) {
    const compressed = await compressImageDataUrl(source, {
      maxWidth: 1400,
      maxHeight: 1400,
      quality: 0.84,
      mimeType: 'image/webp'
    });

    this.profileForm.get('logo')?.setValue(compressed);
    this.logoPreview.set(compressed);
  }

  removeLogo() {
    this.logoError.set('');
    this.profileForm.get('logo')?.setValue('');
    this.logoPreview.set('');
  }

  isStepValid(stepIndex: number): boolean {
    const groupMap = [
      ['organizationName', 'email'],
      ['orgStreet1', 'orgCity', 'orgPinCode', 'orgContactNumber', 'timeZone'],
      this.sameAddressChecked() ? [] : ['billStreet1', 'billCity', 'billPinCode', 'billContactNumber']
    ];
    return groupMap[stepIndex].every(name => this.profileForm.get(name)?.valid);
  }

  isFormValid(): boolean {
    return this.isStepValid(0) && this.isStepValid(1) && this.isStepValid(2);
  }

  goToStep(index: number) {
    this.currentStep.set(index);
  }

  nextStep() {
    if (this.currentStep() < this.steps.length - 1 && this.isStepValid(this.currentStep())) {
      this.currentStep.update((value) => value + 1);
    } else {
      this.profileForm.markAllAsTouched();
    }
  }

  previousStep() {
    if (this.currentStep() > 0) {
      this.currentStep.update((value) => value - 1);
    }
  }

  toggleSameAddress(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.sameAddressChecked.set(checked);

    const mappings = [
      ['billStreet1', 'orgStreet1'],
      ['billStreet2', 'orgStreet2'],
      ['billCity', 'orgCity'],
      ['billPinCode', 'orgPinCode'],
      ['billContactNumber', 'orgContactNumber']
    ] as const;

    mappings.forEach(([billKey, orgKey]) => {
      const control = this.profileForm.get(billKey);
      if (!control) return;
      if (checked) {
        control.setValue(this.profileForm.get(orgKey)?.value);
        control.disable();
      } else {
        control.enable();
        if (this.isBillingSameAsOperational(this.profileForm.getRawValue())) {
          control.setValue('');
        }
      }
    });
  }

  resetForm() {
    if (this.initialData) {
      this.profileForm.reset(this.initialData);
      this.sameAddressChecked.set(this.isBillingSameAsOperational(this.initialData));
      this.logoError.set('');
      this.logoPreview.set(this.initialData.logo || '');
      ['billStreet1', 'billStreet2', 'billCity', 'billPinCode', 'billContactNumber'].forEach((key) => this.profileForm.get(key)?.enable());
      if (this.sameAddressChecked()) {
        ['billStreet1', 'billStreet2', 'billCity', 'billPinCode', 'billContactNumber'].forEach((key) => this.profileForm.get(key)?.disable());
      }
      this.toastService.success('Form reset to saved values');
    }
  }

  saveProfile() {
    if (!this.isFormValid()) {
      this.profileForm.markAllAsTouched();
      this.toastService.error('Please complete all required organisation fields');
      return;
    }

    this.saving.set(true);
    const payload = this.profileForm.getRawValue();
    this.orgService.updateOrganization({
      name: payload.organizationName,
      logo: payload.logo,
      industry: payload.industry,
      email: payload.email,
      address: payload.orgStreet1,
      city: payload.orgCity,
      postalCode: payload.orgPinCode,
      phone: payload.orgContactNumber,
      orgStreet1: payload.orgStreet1,
      orgStreet2: payload.orgStreet2,
      orgCity: payload.orgCity,
      orgPinCode: payload.orgPinCode,
      orgContactNumber: payload.orgContactNumber,
      timeZone: payload.timeZone,
      billStreet1: payload.billStreet1,
      billStreet2: payload.billStreet2,
      billCity: payload.billCity,
      billPinCode: payload.billPinCode,
      billContactNumber: payload.billContactNumber
    }).subscribe({
      next: (savedOrganization) => {
        const savedLogo = savedOrganization?.logo || payload.logo || '';
        this.initialData = {
          ...payload,
          logo: savedLogo
        };
        this.profileForm.patchValue({ logo: savedLogo });
        this.logoPreview.set(savedLogo);

        const storedUser = this.authService.getStoredUser();
        if (storedUser) {
          const updatedUser: User = {
            ...storedUser,
            organizationLogo: savedLogo,
            companyLogo: savedLogo,
            organizationName: savedOrganization?.name || storedUser.organizationName,
            companyName: savedOrganization?.name || storedUser.companyName
          };
          this.authService.setStoredUser(updatedUser);

          const token = this.authService.getStoredToken();
          if (token) {
            this.store.dispatch(AuthActions.restoreUser({ user: updatedUser, token }));
          }
        }

        this.toastService.success('Organisation profile saved successfully');
        // Refresh global session to sync branding across all components
        this.authService.getMe().subscribe((meUser) => {
          const existingUser = this.authService.getStoredUser();
          if (existingUser) {
            this.authService.setStoredUser({
              ...existingUser,
              ...meUser,
              organizationLogo: existingUser.organizationLogo || existingUser.companyLogo || meUser.organizationLogo || meUser.companyLogo,
              companyLogo: existingUser.companyLogo || existingUser.organizationLogo || meUser.companyLogo || meUser.organizationLogo
            });
          } else {
            this.authService.setStoredUser(meUser);
          }
        });
      },
      error: () => this.toastService.error('Failed to save organisation profile'),
      complete: () => this.saving.set(false)
    });
  }
}
