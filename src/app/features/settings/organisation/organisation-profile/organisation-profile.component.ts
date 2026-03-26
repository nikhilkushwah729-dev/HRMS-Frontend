import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UiInputComponent } from '../../../../core/components/ui/ui-input.component';
import { UiPhoneInputComponent } from '../../../../core/components/ui/ui-phone-input.component';
import { OrganizationService } from '../../../../core/services/organization.service';
import { ToastService } from '../../../../core/services/toast.service';

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
    <div class="mx-auto max-w-7xl space-y-6 px-1 py-2">
      <section class="app-module-hero">
        <div>
          <p class="app-module-kicker">Organisation Settings</p>
          <h1 class="app-module-title">Organisation profile</h1>
          <p class="app-module-text max-w-2xl">Manage company identity, operational address, billing details, and timezone preferences from a cleaner multi-step admin flow.</p>
        </div>
        <div class="flex flex-wrap gap-3">
          <button (click)="resetForm()" class="rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Discard Changes</button>
          <button (click)="saveProfile()" [disabled]="saving() || !isFormValid()" class="rounded-md bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50">
            {{ saving() ? 'Saving...' : 'Save Profile' }}
          </button>
        </div>
      </section>

      <div class="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside class="app-surface-card h-fit p-3 xl:sticky xl:top-8">
          @for (step of steps; track step.id; let idx = $index) {
            <button (click)="goToStep(idx)" class="mb-2 flex w-full items-center gap-3 rounded-md px-4 py-3 text-left transition" [ngClass]="currentStep() === idx ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'">
              <span class="flex h-10 w-10 items-center justify-center rounded-md font-bold" [ngClass]="currentStep() === idx ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-700'">{{ step.id }}</span>
              <span>
                <span class="block text-sm font-bold">{{ step.title }}</span>
                <span class="mt-0.5 block text-xs" [ngClass]="currentStep() === idx ? 'text-slate-200' : 'text-slate-500'">{{ step.description }}</span>
              </span>
            </button>
          }
        </aside>

        <section class="app-surface-card">
          <form [formGroup]="profileForm" class="space-y-8">
            @if (currentStep() === 0) {
              <div class="space-y-6">
                <div>
                  <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Identity</p>
                  <h2 class="mt-2 text-2xl font-black text-slate-900">Organization details</h2>
                </div>

                <div class="grid gap-5 md:grid-cols-2">
                  <app-ui-input formControlName="organizationName" label="Organization Name" placeholder="Enter legal entity name" [required]="true"></app-ui-input>
                  <app-ui-input formControlName="industry" label="Industry" placeholder="Information Technology"></app-ui-input>
                  <app-ui-input class="md:col-span-2" formControlName="email" label="Official Email Address" type="email" placeholder="contact@company.com" [required]="true"></app-ui-input>
                </div>
              </div>
            }

            @if (currentStep() === 1) {
              <div class="space-y-6">
                <div>
                  <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Operations</p>
                  <h2 class="mt-2 text-2xl font-black text-slate-900">Operational address</h2>
                </div>

                <div class="grid gap-5 md:grid-cols-2">
                  <app-ui-input class="md:col-span-2" formControlName="orgStreet1" label="Street Address Line 1" placeholder="Building, floor, street" [required]="true"></app-ui-input>
                  <app-ui-input class="md:col-span-2" formControlName="orgStreet2" label="Street Address Line 2" placeholder="Landmark, suite, area"></app-ui-input>
                  <app-ui-input formControlName="orgCity" label="City" placeholder="Enter city" [required]="true"></app-ui-input>
                  <app-ui-input formControlName="orgPinCode" label="ZIP / Pin Code" placeholder="Postal code" [required]="true"></app-ui-input>
                  <app-ui-phone-input class="md:col-span-2" formControlName="orgContactNumber" label="Contact Phone Number"></app-ui-phone-input>
                  <app-ui-input class="md:col-span-2" formControlName="timeZone" label="Time Zone" placeholder="Asia/Kolkata" [required]="true"></app-ui-input>
                </div>
              </div>
            }

            @if (currentStep() === 2) {
              <div class="space-y-6">
                <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Billing</p>
                    <h2 class="mt-2 text-2xl font-black text-slate-900">Billing address</h2>
                  </div>
                  <label class="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <input type="checkbox" [checked]="sameAddressChecked()" (change)="toggleSameAddress($event)" class="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900">
                    Same as operational address
                  </label>
                </div>

                <div class="grid gap-5 md:grid-cols-2" [class.opacity-70]="sameAddressChecked()">
                  <app-ui-input class="md:col-span-2" formControlName="billStreet1" label="Street Address Line 1" placeholder="Billing address"></app-ui-input>
                  <app-ui-input class="md:col-span-2" formControlName="billStreet2" label="Street Address Line 2" placeholder="Landmark, suite, area"></app-ui-input>
                  <app-ui-input formControlName="billCity" label="City" placeholder="Enter city"></app-ui-input>
                  <app-ui-input formControlName="billPinCode" label="ZIP / Pin Code" placeholder="Postal code"></app-ui-input>
                  <app-ui-phone-input class="md:col-span-2" formControlName="billContactNumber" label="Billing Contact Number"></app-ui-phone-input>
                </div>
              </div>
            }

            <div class="flex items-center justify-between border-t border-slate-100 pt-6">
              <button type="button" (click)="previousStep()" class="rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50" [class.invisible]="currentStep() === 0">Previous Step</button>
              <button type="button" (click)="nextStep()" class="rounded-md bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800" [class.invisible]="currentStep() === steps.length - 1">Next Step</button>
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

  currentStep = signal(0);
  sameAddressChecked = signal(false);
  saving = signal(false);
  private initialData: any = null;

  steps: Step[] = [
    { id: 1, title: 'Organization Details', description: 'Basic company info' },
    { id: 2, title: 'Operational Address', description: 'Main headquarters' },
    { id: 3, title: 'Billing Address', description: 'Invoicing details' }
  ];

  profileForm: FormGroup = this.fb.group({
    organizationName: ['', Validators.required],
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
    this.orgService.getOrganization().subscribe({
      next: (organization) => {
        this.initialData = {
          organizationName: organization.name || '',
          industry: organization.industry || '',
          email: organization.email || '',
          orgStreet1: organization.orgStreet1 || organization.address || '',
          orgStreet2: organization.orgStreet2 || '',
          orgCity: organization.orgCity || '',
          orgPinCode: organization.orgPinCode || '',
          orgContactNumber: organization.orgContactNumber || organization.phone || '',
          timeZone: organization.timeZone || '',
          billStreet1: organization.billStreet1 || '',
          billStreet2: organization.billStreet2 || '',
          billCity: organization.billCity || '',
          billPinCode: organization.billPinCode || '',
          billContactNumber: organization.billContactNumber || ''
        };
        this.profileForm.patchValue(this.initialData);
      },
      error: () => this.toastService.error('Failed to load organisation profile')
    });
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
      }
    });
  }

  resetForm() {
    if (this.initialData) {
      this.profileForm.reset(this.initialData);
      this.sameAddressChecked.set(false);
      ['billStreet1', 'billStreet2', 'billCity', 'billPinCode', 'billContactNumber'].forEach((key) => this.profileForm.get(key)?.enable());
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
      industry: payload.industry,
      email: payload.email,
      address: payload.orgStreet1,
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
      next: () => {
        this.initialData = payload;
        this.toastService.success('Organisation profile saved successfully');
      },
      error: () => this.toastService.error('Failed to save organisation profile'),
      complete: () => this.saving.set(false)
    });
  }
}
