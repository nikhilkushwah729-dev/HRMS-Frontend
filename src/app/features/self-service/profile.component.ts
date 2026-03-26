import { Component, inject, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { CustomButtonComponent } from '../../core/components/button/custom-button.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, CustomButtonComponent],
  template: `
    <div class="mx-auto max-w-7xl space-y-6 px-1 py-2">
      <section class="app-module-hero overflow-hidden !p-0">
        <div class="grid gap-0 lg:grid-cols-[1.25fr_0.75fr]">
          <div class="relative overflow-hidden p-8 lg:p-10">
            <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.14),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(245,158,11,0.14),_transparent_28%)]"></div>
            <div class="relative">
              <p class="app-module-kicker">Self Service</p>
              <h1 class="app-module-title">Profile workspace</h1>
              <p class="app-module-text max-w-2xl">Review your identity, employment information, contact details, and the profile sections that still need full backend-powered editing.</p>

              <div class="mt-8 flex flex-col gap-5 sm:flex-row sm:items-end">
                <div class="relative h-28 w-28 overflow-hidden rounded-[2rem] border border-white/60 bg-white shadow-xl ring-4 ring-white/70">
                  <img *ngIf="user()?.avatar" [src]="user()?.avatar" class="h-full w-full object-cover" alt="Profile photo">
                  <div *ngIf="!user()?.avatar" class="flex h-full w-full items-center justify-center bg-slate-100 text-3xl font-black uppercase text-slate-500">
                    {{ userInitials() }}
                  </div>
                  <div class="absolute right-3 top-3 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500"></div>
                </div>

                <div>
                  <h2 class="text-3xl font-black tracking-tight text-slate-900">{{ fullName() }}</h2>
                  <div class="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                    <span class="font-semibold text-slate-700">{{ user()?.designation?.name || 'Designation pending' }}</span>
                    <span class="h-1 w-1 rounded-full bg-slate-300"></span>
                    <span>{{ user()?.department?.name || 'Department pending' }}</span>
                    <span class="h-1 w-1 rounded-full bg-slate-300"></span>
                    <span class="rounded-full bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-700 ring-1 ring-slate-200">{{ user()?.employeeCode || 'No Code' }}</span>
                  </div>
                </div>
              </div>

              <div class="mt-8 flex flex-wrap gap-3">
                <app-custom-button class="!w-auto">Edit Profile</app-custom-button>
                <app-custom-button type="secondary" class="!w-auto">Download ID Card</app-custom-button>
              </div>
            </div>
          </div>

          <div class="border-t border-slate-200/70 bg-slate-50/70 p-8 lg:border-l lg:border-t-0 lg:p-10">
            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div class="rounded-md border border-white bg-white p-5 shadow-sm">
                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Profile completion</p>
                <p class="mt-3 text-3xl font-black text-slate-900">{{ profileCompletion() }}%</p>
                <p class="mt-2 text-sm text-slate-600">Core identity and employment details are available for review.</p>
              </div>
              <div class="rounded-md border border-white bg-white p-5 shadow-sm">
                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Account status</p>
                <p class="mt-3 text-xl font-black capitalize text-slate-900">{{ user()?.status || 'active' }}</p>
                <p class="mt-2 text-sm text-slate-600">Email: {{ user()?.email || 'Not available' }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div class="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside class="app-surface-card h-fit p-3 lg:sticky lg:top-8">
          <p class="px-3 pb-3 pt-1 text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Profile Sections</p>
          <div class="space-y-1.5">
            <button *ngFor="let tab of tabs"
                    (click)="currentTab.set(tab.id)"
                    [class.bg-slate-900]="currentTab() === tab.id"
                    [class.text-white]="currentTab() === tab.id"
                    class="flex w-full items-center gap-3 rounded-md px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
              <span class="flex h-10 w-10 items-center justify-center rounded-md" [ngClass]="currentTab() === tab.id ? 'bg-white/15 text-white' : 'bg-white text-slate-700'">
                {{ tab.short }}
              </span>
              <span class="flex-1">{{ tab.label }}</span>
            </button>
          </div>
        </aside>

        <section class="space-y-6">
          <div *ngIf="currentTab() === 'personal'" class="app-surface-card">
            <div class="mb-6 flex items-center justify-between gap-4">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Personal Details</p>
                <h3 class="mt-2 text-2xl font-black text-slate-900">Identity and contact information</h3>
              </div>
              <span class="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">Live profile</span>
            </div>

            <div class="grid gap-4 md:grid-cols-2">
              <div class="rounded-md bg-slate-50 p-5" *ngFor="let item of personalDetails()">
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{{ item.label }}</p>
                <p class="mt-3 text-base font-semibold text-slate-900">{{ item.value }}</p>
              </div>
            </div>
          </div>

          <div *ngIf="currentTab() === 'employment'" class="app-surface-card">
            <div class="mb-6">
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Employment Details</p>
              <h3 class="mt-2 text-2xl font-black text-slate-900">Role, department, and organization context</h3>
            </div>

            <div class="grid gap-4 md:grid-cols-2">
              <div class="rounded-md bg-slate-50 p-5" *ngFor="let item of employmentDetails()">
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{{ item.label }}</p>
                <p class="mt-3 text-base font-semibold text-slate-900">{{ item.value }}</p>
              </div>
            </div>
          </div>

          <div *ngIf="currentTab() !== 'personal' && currentTab() !== 'employment'" class="app-surface-card text-center">
            <div class="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-2xl font-black text-slate-500">
              {{ activeTabShort() }}
            </div>
            <h3 class="mt-6 text-2xl font-black text-slate-900">{{ activeTabLabel() }}</h3>
            <p class="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-600">This section is prepared in the new design system, and the deeper editable experience can be connected as the remaining backend/profile APIs are expanded.</p>
            <div class="mt-8 inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
              <span class="h-2 w-2 rounded-full bg-amber-500"></span>
              Ready for next integration step
            </div>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);

  user = signal<any>(null);
  currentTab = signal('personal');

  tabs = [
    { id: 'personal', label: 'Personal Information', short: 'PI' },
    { id: 'employment', label: 'Employment Details', short: 'ED' },
    { id: 'bank', label: 'Bank & Payment', short: 'BP' },
    { id: 'documents', label: 'Documents', short: 'DO' },
    { id: 'experience', label: 'Experience & Education', short: 'EE' }
  ];

  personalDetails = computed(() => {
    const user = this.user();
    return [
      { label: 'First Name', value: user?.firstName || '--' },
      { label: 'Last Name', value: user?.lastName || '--' },
      { label: 'Email Address', value: user?.email || '--' },
      { label: 'Phone Number', value: user?.phone || '--' },
      { label: 'Date of Birth', value: user?.dateOfBirth || '-- / -- / ----' },
      { label: 'Gender', value: user?.gender || 'Not specified' }
    ];
  });

  employmentDetails = computed(() => {
    const user = this.user();
    return [
      { label: 'Employee ID', value: user?.employeeCode || '--' },
      { label: 'Department', value: user?.department?.name || 'Not assigned' },
      { label: 'Designation', value: user?.designation?.name || 'Not assigned' },
      { label: 'Role ID', value: user?.roleId ? String(user.roleId) : '--' },
      { label: 'Organization ID', value: user?.orgId ? String(user.orgId) : '--' },
      { label: 'Status', value: user?.status || 'active' }
    ];
  });

  ngOnInit() {
    this.user.set(this.authService.getStoredUser());
  }

  fullName(): string {
    const user = this.user();
    return [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Employee Profile';
  }

  userInitials(): string {
    const user = this.user();
    return `${user?.firstName?.charAt(0) || ''}${user?.lastName?.charAt(0) || ''}` || 'HR';
  }

  profileCompletion(): number {
    const user = this.user() || {};
    const fields = [user.firstName, user.lastName, user.email, user.phone, user.employeeCode, user.designation?.name, user.department?.name];
    const completed = fields.filter(Boolean).length;
    return Math.round((completed / fields.length) * 100);
  }

  activeTabLabel(): string {
    return this.tabs.find(tab => tab.id === this.currentTab())?.label || 'Profile Section';
  }

  activeTabShort(): string {
    return this.tabs.find(tab => tab.id === this.currentTab())?.short || 'PS';
  }
}

