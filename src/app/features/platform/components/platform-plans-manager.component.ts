import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../core/services/toast.service';
import {
  CreatePlanPayload,
  PlatformCatalogAddon,
  PlatformFeatureLimit,
  PlatformPlan,
  PlatformService,
  UpdateAddonPayload,
  UpdatePlanPayload,
} from '../../../core/services/platform.service';

interface ModuleOption {
  key: string;
  label: string;
  isDependent?: boolean;
  category: 'core' | 'attendance' | 'management';
}

const AVAILABLE_MODULES: ModuleOption[] = [
  { key: 'ESS', label: 'Employee Self Service (ESS)', category: 'core' },
  { key: 'Attendance', label: 'Attendance Core', category: 'core' },
  { key: 'Leaves', label: 'Leave & Time Off', category: 'core' },
  { key: 'Payroll', label: 'Payroll Management', category: 'management' },
  { key: 'Visits', label: 'Visit Management', category: 'management' },
  { key: 'Expenses', label: 'Expense Management', category: 'management' },
  { key: 'Timesheets', label: 'Timesheets', category: 'management' },
  { key: 'AuditLogs', label: 'Audit Logs & Compliance', category: 'management' },
  { key: 'Assets', label: 'Asset Management', category: 'management' },
  { key: 'Performance', label: 'Performance & Appraisals', category: 'management' },
  { key: 'Announcements', label: 'Company Announcements', category: 'core' },
  { key: 'Projects', label: 'Project Tracking', category: 'management' },
  // Attendance-dependent modules
  { key: 'FaceRecognition', label: 'Face Recognition Attendance', isDependent: true, category: 'attendance' },
  { key: 'Geofence', label: 'Geofence & Location Punch', isDependent: true, category: 'attendance' },
  { key: 'ShiftPlanner', label: 'Shift Scheduling & Rotas', isDependent: true, category: 'attendance' },
  { key: 'Kiosk', label: 'Kiosk Attendance Device', isDependent: true, category: 'attendance' },
  { key: 'EmployeeTracking', label: 'GPS Employee Tracking', isDependent: false, category: 'attendance' },
];

@Component({
  selector: 'app-platform-plans-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex flex-col gap-6">
      <!-- Catalog Navigation / Sub-header -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 class="text-xl font-black text-slate-900">Subscription Plans & Add-on Catalog</h2>
          <p class="mt-1 text-sm text-slate-500">
            Configure database-driven plans, modules, seat tiers, and optional tenant add-ons.
          </p>
        </div>
        <div class="flex items-center gap-3">
          <div class="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1 text-xs font-bold text-slate-600">
            <button
              type="button"
              (click)="activeSubView.set('plans')"
              [class]="activeSubView() === 'plans' ? 'rounded-md bg-white px-3 py-1.5 text-slate-900 shadow-sm' : 'px-3 py-1.5 hover:text-slate-900'"
            >
              Plans ({{ plans().length }})
            </button>
            <button
              type="button"
              (click)="activeSubView.set('addons')"
              [class]="activeSubView() === 'addons' ? 'rounded-md bg-white px-3 py-1.5 text-slate-900 shadow-sm' : 'px-3 py-1.5 hover:text-slate-900'"
            >
              Add-ons ({{ addons().length }})
            </button>
          </div>
          @if (activeSubView() === 'plans') {
            <button
              type="button"
              (click)="openCreatePlanModal()"
              class="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/>
              </svg>
              Create Plan
            </button>
          }
        </div>
      </div>

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-white p-12 text-center shadow-sm">
          <div class="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900"></div>
          <p class="mt-4 text-sm font-semibold text-slate-600">Loading catalog from database...</p>
        </div>
      }

      <!-- Global Error State -->
      @if (apiError()) {
        <div class="flex items-start justify-between rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <div class="flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0 text-rose-600" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            <span>{{ apiError() }}</span>
          </div>
          <button (click)="apiError.set(null)" class="text-rose-600 hover:text-rose-900 font-bold text-xs uppercase tracking-wider">Dismiss</button>
        </div>
      }

      <!-- ==================== PLANS VIEW ==================== -->
      @if (!isLoading() && activeSubView() === 'plans') {
        <!-- Search & Filter bar -->
        <div class="flex flex-wrap items-center justify-between gap-3">
          <input
            type="text"
            [ngModel]="searchQuery()"
            (ngModelChange)="searchQuery.set($event)"
            placeholder="Search plans by name, slug, or module..."
            class="w-full max-w-sm rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-slate-900"
          />
          <div class="flex items-center gap-2">
            <button
              type="button"
              (click)="filterStatus.set('all')"
              class="rounded-md px-2.5 py-1 text-xs font-bold transition"
              [class]="filterStatus() === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
            >
              All ({{ plans().length }})
            </button>
            <button
              type="button"
              (click)="filterStatus.set('active')"
              class="rounded-md px-2.5 py-1 text-xs font-bold transition"
              [class]="filterStatus() === 'active' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
            >
              Active
            </button>
            <button
              type="button"
              (click)="filterStatus.set('public')"
              class="rounded-md px-2.5 py-1 text-xs font-bold transition"
              [class]="filterStatus() === 'public' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
            >
              Public
            </button>
            <button
              type="button"
              (click)="filterStatus.set('trial')"
              class="rounded-md px-2.5 py-1 text-xs font-bold transition"
              [class]="filterStatus() === 'trial' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
            >
              Trial Plans
            </button>
          </div>
        </div>

        <!-- Plans Grid -->
        <div class="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          @for (plan of filteredPlans(); track plan.id) {
            <article class="flex flex-col justify-between rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md">
              <div>
                <!-- Card Header -->
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <div class="flex items-center gap-2">
                      <h3 class="text-base font-black text-slate-900">{{ plan.name }}</h3>
                      @if (plan.isTrialPlan) {
                        <span class="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-800">
                          Trial
                        </span>
                      }
                    </div>
                    <span class="font-mono text-xs text-slate-400">slug: {{ plan.slug }}</span>
                  </div>
                  <!-- Status Badges -->
                  <div class="flex flex-col items-end gap-1">
                    <span
                      class="rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider"
                      [class]="plan.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'"
                    >
                      {{ plan.isActive ? 'Active' : 'Deactivated' }}
                    </span>
                    <span
                      class="text-[10px] font-bold"
                      [class]="plan.isPublic ? 'text-indigo-600' : 'text-slate-400'"
                    >
                      {{ plan.isPublic ? 'Public' : 'Private' }}
                    </span>
                  </div>
                </div>

                <!-- Price and Limits Overview -->
                <div class="mt-4 rounded-lg bg-slate-50 p-3.5">
                  <div class="flex items-baseline justify-between">
                    <div>
                      <span class="text-2xl font-black text-slate-900">
                        {{ plan.currency }} {{ plan.monthlyPrice | number }}
                      </span>
                      <span class="text-xs font-semibold text-slate-500">/ month</span>
                    </div>
                    @if (plan.yearlyPrice) {
                      <span class="text-xs font-bold text-slate-600">
                        {{ plan.currency }} {{ plan.yearlyPrice | number }} / yr
                      </span>
                    }
                  </div>
                  <div class="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-600">
                    <span class="rounded bg-white px-2 py-1 border border-slate-200">
                      👥 {{ plan.userLimit }} Max Users
                    </span>
                    <span class="rounded bg-white px-2 py-1 border border-slate-200">
                      💾 {{ plan.storageLimitMb }} MB
                    </span>
                    <span class="rounded bg-white px-2 py-1 border border-slate-200">
                      ⏱ {{ plan.durationDays }} Days
                    </span>
                  </div>
                </div>

                <!-- Active Subscribers Count -->
                <div class="mt-3 flex items-center justify-between text-xs font-bold">
                  <span class="text-slate-500">Active Tenant Subscriptions:</span>
                  <span
                    class="rounded px-2 py-0.5"
                    [class]="plan.activeSubscriptionsCount > 0 ? 'bg-indigo-50 text-indigo-700' : 'text-slate-400'"
                  >
                    {{ plan.activeSubscriptionsCount }} active
                  </span>
                </div>

                <!-- Modules Included -->
                <div class="mt-4">
                  <p class="text-[10px] font-black uppercase tracking-wider text-slate-400">Included Modules ({{ plan.modules.length }})</p>
                  <div class="mt-2 flex flex-wrap gap-1.5">
                    @for (mod of plan.modules; track mod) {
                      <span class="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                        {{ mod }}
                      </span>
                    } @empty {
                      <span class="text-xs text-slate-400">No modules attached</span>
                    }
                  </div>
                </div>

                <!-- Feature Limits Preview -->
                @if (plan.featureLimits && plan.featureLimits.length > 0) {
                  <div class="mt-4 border-t border-slate-100 pt-3">
                    <p class="text-[10px] font-black uppercase tracking-wider text-slate-400">Feature Limits ({{ plan.featureLimits.length }})</p>
                    <div class="mt-2 space-y-1">
                      @for (fl of plan.featureLimits.slice(0, 4); track fl.featureKey) {
                        <div class="flex items-center justify-between text-xs">
                          <span class="text-slate-600 font-medium truncate max-w-[150px]">{{ fl.featureLabel || fl.featureKey }}</span>
                          <span class="font-bold text-slate-800">{{ fl.isEnabled ? (fl.limitValue ?? 'Enabled') : 'Disabled' }}</span>
                        </div>
                      }
                      @if (plan.featureLimits.length > 4) {
                        <span class="text-[10px] text-slate-400 font-bold">+{{ plan.featureLimits.length - 4 }} more limits</span>
                      }
                    </div>
                  </div>
                }
              </div>

              <!-- Action Buttons -->
              <div class="mt-5 flex items-center justify-between border-t border-slate-100 pt-3">
                <button
                  type="button"
                  (click)="openEditPlanModal(plan)"
                  class="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                >
                  Edit Plan & Limits
                </button>
                <button
                  type="button"
                  (click)="confirmTogglePlan(plan)"
                  class="rounded-md px-3 py-1.5 text-xs font-bold transition"
                  [class]="plan.isActive ? 'border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-emerald-600 text-white hover:bg-emerald-700'"
                >
                  {{ plan.isActive ? 'Deactivate' : 'Activate' }}
                </button>
              </div>
            </article>
          } @empty {
            <div class="col-span-full rounded-xl border border-slate-100 bg-white p-12 text-center shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 class="mt-3 text-base font-bold text-slate-800">No Plans Found</h3>
              <p class="mt-1 text-sm text-slate-500">No subscription plans match your search or filter criteria.</p>
              <button
                type="button"
                (click)="openCreatePlanModal()"
                class="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
              >
                Create First Plan
              </button>
            </div>
          }
        </div>
      }

      <!-- ==================== ADD-ONS VIEW ==================== -->
      @if (!isLoading() && activeSubView() === 'addons') {
        <section class="rounded-xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          <div class="border-b border-slate-100 p-5">
            <h3 class="text-base font-black text-slate-900">Platform Add-on Modules</h3>
            <p class="mt-1 text-xs text-slate-500">
              Manage optional add-on feature pricing and activation available for tenant purchase or admin override.
            </p>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-100 text-sm">
              <thead class="bg-slate-50 text-left text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                <tr>
                  <th class="px-5 py-3">Add-on Name & Slug</th>
                  <th class="px-5 py-3">Price (₹/month)</th>
                  <th class="px-5 py-3">Active Tenants</th>
                  <th class="px-5 py-3">Status</th>
                  <th class="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (addon of addons(); track addon.id) {
                  <tr class="hover:bg-slate-50/70 transition-colors">
                    <td class="px-5 py-4">
                      <div>
                        <p class="font-bold text-slate-900">{{ addon.name }}</p>
                        <span class="font-mono text-xs text-slate-400">{{ addon.slug }}</span>
                      </div>
                    </td>
                    <td class="px-5 py-4 font-black text-slate-800">
                      ₹{{ addon.price | number }}
                    </td>
                    <td class="px-5 py-4">
                      <span class="rounded bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-700">
                        {{ addon.activeOrganizationsCount }} active
                      </span>
                    </td>
                    <td class="px-5 py-4">
                      <span
                        class="rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider"
                        [class]="addon.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'"
                      >
                        {{ addon.isActive ? 'Active' : 'Inactive' }}
                      </span>
                    </td>
                    <td class="px-5 py-4 text-right">
                      <button
                        type="button"
                        (click)="openEditAddonModal(addon)"
                        class="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-slate-400 hover:bg-slate-50 transition"
                      >
                        Edit Add-on
                      </button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="5" class="px-5 py-10 text-center text-sm font-semibold text-slate-400">
                      No add-on records found in database.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>
      }
    </div>

    <!-- ==================== CREATE PLAN MODAL ==================== -->
    @if (showCreatePlanModal()) {
      <div class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" (click)="closeCreatePlanModal()"></div>
        <div class="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
          <div class="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 class="text-lg font-black text-slate-900">Create New Subscription Plan</h3>
              <p class="text-xs text-slate-500 mt-0.5">Add a new tier to the database-driven subscription catalog.</p>
            </div>
            <button (click)="closeCreatePlanModal()" class="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Modal Error Banner -->
          @if (formError()) {
            <div class="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-800">
              {{ formError() }}
            </div>
          }

          <form (ngSubmit)="submitCreatePlan()" class="mt-5 space-y-4">
            <!-- Name & Slug -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Plan Name *</label>
                <input
                  type="text"
                  [(ngModel)]="createPlanForm.name"
                  name="name"
                  (ngModelChange)="onPlanNameChange($event)"
                  placeholder="e.g. Growth Pro"
                  class="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                  required
                />
              </div>
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Slug (auto / custom)</label>
                <input
                  type="text"
                  [(ngModel)]="createPlanForm.slug"
                  name="slug"
                  placeholder="e.g. growth-pro"
                  class="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                />
              </div>
            </div>

            <!-- Prices & Currency -->
            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Monthly Price *</label>
                <input
                  type="number"
                  [(ngModel)]="createPlanForm.monthlyPrice"
                  name="monthlyPrice"
                  (ngModelChange)="onMonthlyPriceChange($event)"
                  min="0"
                  class="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                  required
                />
              </div>
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Yearly Price</label>
                <input
                  type="number"
                  [(ngModel)]="createPlanForm.yearlyPrice"
                  name="yearlyPrice"
                  min="0"
                  class="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                />
              </div>
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Currency</label>
                <select
                  [(ngModel)]="createPlanForm.currency"
                  name="currency"
                  class="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
            </div>

            <!-- Limits -->
            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Max Users (Seats) *</label>
                <input
                  type="number"
                  [(ngModel)]="createPlanForm.userLimit"
                  name="userLimit"
                  min="1"
                  class="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                  required
                />
              </div>
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Storage (MB) *</label>
                <input
                  type="number"
                  [(ngModel)]="createPlanForm.storageLimitMb"
                  name="storageLimitMb"
                  min="0"
                  class="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                  required
                />
              </div>
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Duration (Days) *</label>
                <input
                  type="number"
                  [(ngModel)]="createPlanForm.durationDays"
                  name="durationDays"
                  min="1"
                  class="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                  required
                />
              </div>
            </div>

            <!-- Modules Selection -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="text-xs font-bold uppercase tracking-wider text-slate-500">Included Modules *</label>
                @if (hasAttendanceDependencyError()) {
                  <span class="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                    ⚠️ Advanced features require Attendance Core
                  </span>
                }
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5 rounded-lg border border-slate-200 bg-slate-50 p-3 max-h-48 overflow-y-auto">
                @for (mod of availableModules; track mod.key) {
                  <label class="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer hover:text-slate-900">
                    <input
                      type="checkbox"
                      [checked]="createPlanModules.has(mod.key)"
                      (change)="toggleCreatePlanModule(mod.key)"
                      class="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                    />
                    <span [class]="mod.isDependent ? 'text-indigo-700 font-semibold' : ''">{{ mod.label }}</span>
                  </label>
                }
              </div>
            </div>

            <!-- Toggles: Public, Trial, Active -->
            <div class="flex flex-wrap items-center gap-6 pt-2">
              <label class="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input type="checkbox" [(ngModel)]="createPlanForm.isPublic" name="isPublic" class="rounded border-slate-300 text-slate-900 focus:ring-slate-900" />
                Public Plan (Visible in Pricing)
              </label>
              <label class="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input type="checkbox" [(ngModel)]="createPlanForm.isTrialPlan" name="isTrialPlan" class="rounded border-slate-300 text-slate-900 focus:ring-slate-900" />
                Default Trial Plan
              </label>
              <label class="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input type="checkbox" [(ngModel)]="createPlanForm.isActive" name="isActive" class="rounded border-slate-300 text-slate-900 focus:ring-slate-900" />
                Active Immediately
              </label>
            </div>

            <!-- Actions -->
            <div class="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                (click)="closeCreatePlanModal()"
                class="rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                [disabled]="isSubmitting() || hasAttendanceDependencyError()"
                class="rounded-lg bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-black disabled:opacity-50"
              >
                {{ isSubmitting() ? 'Creating...' : 'Create Plan' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- ==================== EDIT PLAN MODAL ==================== -->
    @if (showEditPlanModal() && selectedPlan()) {
      <div class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" (click)="closeEditPlanModal()"></div>
        <div class="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
          <div class="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-lg font-black text-slate-900">Edit Plan: {{ selectedPlan()!.name }}</h3>
                <span class="rounded bg-slate-100 px-2 py-0.5 text-xs font-mono text-slate-600">ID #{{ selectedPlan()!.id }}</span>
              </div>
              <p class="text-xs text-slate-500 mt-0.5">Update plan parameters, limits, or feature entitlement flags.</p>
            </div>
            <button (click)="closeEditPlanModal()" class="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Active Subscribers Warning Banner -->
          @if (selectedPlan()!.activeSubscriptionsCount > 0) {
            <div class="mt-4 rounded-lg border border-indigo-200 bg-indigo-50 p-3.5 text-xs text-indigo-900 flex items-start gap-3">
              <span class="text-base">ℹ️</span>
              <div>
                <p class="font-bold">Active Subscriptions Protection ({{ selectedPlan()!.activeSubscriptionsCount }} active tenants)</p>
                <p class="mt-0.5 text-indigo-700">
                  Removing currently enabled modules is prohibited by backend policy to prevent revoking paid customer entitlements. Adding new modules is allowed.
                </p>
              </div>
            </div>
          }

          <!-- Modal Error Banner -->
          @if (formError()) {
            <div class="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-800">
              {{ formError() }}
            </div>
          }

          <form (ngSubmit)="submitEditPlan()" class="mt-5 space-y-4">
            <!-- Name & Slug -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Plan Name *</label>
                <input
                  type="text"
                  [(ngModel)]="editPlanForm.name"
                  name="editName"
                  class="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                  required
                />
              </div>
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Slug</label>
                <input
                  type="text"
                  [(ngModel)]="editPlanForm.slug"
                  name="editSlug"
                  class="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                />
              </div>
            </div>

            <!-- Prices & Currency -->
            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Monthly Price *</label>
                <input
                  type="number"
                  [(ngModel)]="editPlanForm.monthlyPrice"
                  name="editMonthlyPrice"
                  min="0"
                  class="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                  required
                />
              </div>
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Yearly Price</label>
                <input
                  type="number"
                  [(ngModel)]="editPlanForm.yearlyPrice"
                  name="editYearlyPrice"
                  min="0"
                  class="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                />
              </div>
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Currency</label>
                <select
                  [(ngModel)]="editPlanForm.currency"
                  name="editCurrency"
                  class="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
            </div>

            <!-- Limits -->
            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Max Users (Seats) *</label>
                <input
                  type="number"
                  [(ngModel)]="editPlanForm.userLimit"
                  name="editUserLimit"
                  min="1"
                  class="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                  required
                />
              </div>
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Storage (MB) *</label>
                <input
                  type="number"
                  [(ngModel)]="editPlanForm.storageLimitMb"
                  name="editStorageLimitMb"
                  min="0"
                  class="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                  required
                />
              </div>
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Duration (Days) *</label>
                <input
                  type="number"
                  [(ngModel)]="editPlanForm.durationDays"
                  name="editDurationDays"
                  min="1"
                  class="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                  required
                />
              </div>
            </div>

            <!-- Modules Selection -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="text-xs font-bold uppercase tracking-wider text-slate-500">Included Modules *</label>
                @if (hasAttendanceDependencyErrorEdit()) {
                  <span class="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                    ⚠️ Advanced features require Attendance Core
                  </span>
                }
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5 rounded-lg border border-slate-200 bg-slate-50 p-3 max-h-48 overflow-y-auto">
                @for (mod of availableModules; track mod.key) {
                  <label class="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer hover:text-slate-900">
                    <input
                      type="checkbox"
                      [checked]="editPlanModules.has(mod.key)"
                      (change)="toggleEditPlanModule(mod.key)"
                      class="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                    />
                    <span [class]="mod.isDependent ? 'text-indigo-700 font-semibold' : ''">{{ mod.label }}</span>
                  </label>
                }
              </div>
            </div>

            <!-- Editable Feature Limits Section -->
            @if (editPlanFeatureLimits().length > 0) {
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Specific Feature Limits</label>
                <div class="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 max-h-40 overflow-y-auto">
                  @for (fl of editPlanFeatureLimits(); track fl.featureKey; let idx = $index) {
                    <div class="flex items-center justify-between gap-3 text-xs bg-white p-2 rounded border border-slate-100">
                      <div class="flex items-center gap-2">
                        <input
                          type="checkbox"
                          [(ngModel)]="fl.isEnabled"
                          [name]="'fl_enabled_' + idx"
                          class="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                        />
                        <span class="font-bold text-slate-700">{{ fl.featureLabel || fl.featureKey }}</span>
                      </div>
                      <div class="flex items-center gap-2">
                        @if (fl.featureType === 'number') {
                          <input
                            type="text"
                            [(ngModel)]="fl.limitValue"
                            [name]="'fl_val_' + idx"
                            placeholder="Value"
                            class="w-20 rounded border border-slate-200 px-2 py-1 text-right text-xs font-semibold"
                          />
                        }
                        <span class="font-mono text-[10px] text-slate-400">({{ fl.featureKey }})</span>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Toggles: Public, Trial, Active -->
            <div class="flex flex-wrap items-center gap-6 pt-2">
              <label class="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input type="checkbox" [(ngModel)]="editPlanForm.isPublic" name="editIsPublic" class="rounded border-slate-300 text-slate-900 focus:ring-slate-900" />
                Public Plan
              </label>
              <label class="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input type="checkbox" [(ngModel)]="editPlanForm.isTrialPlan" name="editIsTrialPlan" class="rounded border-slate-300 text-slate-900 focus:ring-slate-900" />
                Default Trial Plan
              </label>
              <label class="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input type="checkbox" [(ngModel)]="editPlanForm.isActive" name="editIsActive" class="rounded border-slate-300 text-slate-900 focus:ring-slate-900" />
                Active Plan
              </label>
            </div>

            <!-- Actions -->
            <div class="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                (click)="closeEditPlanModal()"
                class="rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                [disabled]="isSubmitting() || hasAttendanceDependencyErrorEdit()"
                class="rounded-lg bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-black disabled:opacity-50"
              >
                {{ isSubmitting() ? 'Saving...' : 'Save Plan Changes' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- ==================== CONFIRM TOGGLE PLAN MODAL ==================== -->
    @if (showToggleConfirmModal() && targetTogglePlan()) {
      <div class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" (click)="closeToggleModal()"></div>
        <div class="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
          <h3 class="text-lg font-black text-slate-900">
            {{ targetTogglePlan()!.isActive ? 'Deactivate' : 'Activate' }} Plan
          </h3>
          <p class="mt-2 text-sm text-slate-600">
            Are you sure you want to {{ targetTogglePlan()!.isActive ? 'deactivate' : 'activate' }}
            <span class="font-bold text-slate-900">"{{ targetTogglePlan()!.name }}"</span>?
          </p>

          @if (targetTogglePlan()!.isActive && targetTogglePlan()!.activeSubscriptionsCount > 0) {
            <div class="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              ⚠️ Warning: This plan currently has <strong>{{ targetTogglePlan()!.activeSubscriptionsCount }} active subscriber(s)</strong>.
              Deactivating will be prevented by the backend to protect existing customer subscriptions.
            </div>
          }

          @if (targetTogglePlan()!.isActive && targetTogglePlan()!.isTrialPlan) {
            <div class="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
              ⚠️ Warning: This is a configured default trial plan. Deactivation will fail unless another trial plan is active.
            </div>
          }

          <div class="mt-6 flex justify-end gap-3">
            <button
              type="button"
              (click)="closeToggleModal()"
              class="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              (click)="executeTogglePlan()"
              [disabled]="isSubmitting()"
              class="rounded-lg px-4 py-2 text-xs font-bold text-white transition disabled:opacity-50"
              [class]="targetTogglePlan()!.isActive ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'"
            >
              {{ isSubmitting() ? 'Updating...' : (targetTogglePlan()!.isActive ? 'Confirm Deactivation' : 'Confirm Activation') }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- ==================== EDIT ADD-ON MODAL ==================== -->
    @if (showEditAddonModal() && selectedAddon()) {
      <div class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" (click)="closeEditAddonModal()"></div>
        <div class="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
          <div class="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 class="text-lg font-black text-slate-900">Edit Add-on: {{ selectedAddon()!.name }}</h3>
              <span class="font-mono text-xs text-slate-400">slug: {{ selectedAddon()!.slug }}</span>
            </div>
            <button (click)="closeEditAddonModal()" class="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          @if (formError()) {
            <div class="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
              {{ formError() }}
            </div>
          }

          <form (ngSubmit)="submitEditAddon()" class="mt-4 space-y-4">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Add-on Name *</label>
              <input
                type="text"
                [(ngModel)]="editAddonForm.name"
                name="addonName"
                class="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                required
              />
            </div>

            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Monthly Price (₹) *</label>
              <input
                type="number"
                [(ngModel)]="editAddonForm.price"
                name="addonPrice"
                min="0"
                class="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                required
              />
            </div>

            <div class="pt-1">
              <label class="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  [(ngModel)]="editAddonForm.isActive"
                  name="addonIsActive"
                  class="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                Active Add-on Module
              </label>
            </div>

            <div class="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                (click)="closeEditAddonModal()"
                class="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                [disabled]="isSubmitting()"
                class="rounded-lg bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-black disabled:opacity-50"
              >
                {{ isSubmitting() ? 'Saving...' : 'Save Add-on' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
})
export class PlatformPlansManagerComponent implements OnInit {
  private readonly platformService = inject(PlatformService);
  private readonly toast = inject(ToastService);

  readonly availableModules = AVAILABLE_MODULES;

  activeSubView = signal<'plans' | 'addons'>('plans');
  isLoading = signal(false);
  isSubmitting = signal(false);
  apiError = signal<string | null>(null);
  formError = signal<string | null>(null);

  plans = signal<PlatformPlan[]>([]);
  addons = signal<PlatformCatalogAddon[]>([]);

  searchQuery = signal('');
  filterStatus = signal<'all' | 'active' | 'public' | 'trial'>('all');

  filteredPlans = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const status = this.filterStatus();
    let list = this.plans();

    if (status === 'active') list = list.filter((p) => p.isActive);
    else if (status === 'public') list = list.filter((p) => p.isPublic);
    else if (status === 'trial') list = list.filter((p) => p.isTrialPlan);

    if (!q) return list;
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        p.modules.some((m) => m.toLowerCase().includes(q))
    );
  });

  // Modal Signals
  showCreatePlanModal = signal(false);
  showEditPlanModal = signal(false);
  showToggleConfirmModal = signal(false);
  showEditAddonModal = signal(false);

  selectedPlan = signal<PlatformPlan | null>(null);
  targetTogglePlan = signal<PlatformPlan | null>(null);
  selectedAddon = signal<PlatformCatalogAddon | null>(null);

  // Forms State
  createPlanModules = new Set<string>(['ESS', 'Attendance', 'Leaves']);
  createPlanForm: CreatePlanPayload = {
    name: '',
    slug: '',
    monthlyPrice: 999,
    yearlyPrice: 9990,
    currency: 'INR',
    userLimit: 20,
    storageLimitMb: 512,
    durationDays: 30,
    isPublic: true,
    isTrialPlan: false,
    isActive: true,
  };

  editPlanModules = new Set<string>();
  editPlanFeatureLimits = signal<PlatformFeatureLimit[]>([]);
  editPlanForm: UpdatePlanPayload = {
    name: '',
    slug: '',
    monthlyPrice: 0,
    yearlyPrice: 0,
    currency: 'INR',
    userLimit: 10,
    storageLimitMb: 512,
    durationDays: 30,
    isPublic: true,
    isTrialPlan: false,
    isActive: true,
  };

  editAddonForm: UpdateAddonPayload = {
    name: '',
    price: 0,
    isActive: true,
  };

  ngOnInit(): void {
    this.loadCatalog();
  }

  loadCatalog(): void {
    this.isLoading.set(true);
    this.apiError.set(null);

    this.platformService.getPlans().subscribe({
      next: (plans) => {
        this.plans.set(plans);
        this.loadAddons();
      },
      error: (err) => {
        this.isLoading.set(false);
        const msg = err?.error?.message || 'Failed to load subscription plans.';
        this.apiError.set(msg);
      },
    });
  }

  private loadAddons(): void {
    this.platformService.getAddons().subscribe({
      next: (addons) => {
        this.addons.set(addons);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        const msg = err?.error?.message || 'Failed to load catalog add-ons.';
        this.apiError.set(msg);
      },
    });
  }

  // --- Module Attendance Dependency Validations ---
  hasAttendanceDependencyError(): boolean {
    const dependentKeys = ['FaceRecognition', 'Geofence', 'ShiftPlanner', 'Kiosk'];
    const hasDep = dependentKeys.some((k) => this.createPlanModules.has(k));
    return hasDep && !this.createPlanModules.has('Attendance');
  }

  hasAttendanceDependencyErrorEdit(): boolean {
    const dependentKeys = ['FaceRecognition', 'Geofence', 'ShiftPlanner', 'Kiosk'];
    const hasDep = dependentKeys.some((k) => this.editPlanModules.has(k));
    return hasDep && !this.editPlanModules.has('Attendance');
  }

  toggleCreatePlanModule(key: string): void {
    if (this.createPlanModules.has(key)) {
      this.createPlanModules.delete(key);
    } else {
      this.createPlanModules.add(key);
      const dependentKeys = ['FaceRecognition', 'Geofence', 'ShiftPlanner', 'Kiosk'];
      if (dependentKeys.includes(key) && !this.createPlanModules.has('Attendance')) {
        this.createPlanModules.add('Attendance');
        this.toast.info('Attendance Core was automatically enabled as it is required for ' + key);
      }
    }
  }

  toggleEditPlanModule(key: string): void {
    if (this.editPlanModules.has(key)) {
      this.editPlanModules.delete(key);
    } else {
      this.editPlanModules.add(key);
      const dependentKeys = ['FaceRecognition', 'Geofence', 'ShiftPlanner', 'Kiosk'];
      if (dependentKeys.includes(key) && !this.editPlanModules.has('Attendance')) {
        this.editPlanModules.add('Attendance');
        this.toast.info('Attendance Core was automatically enabled as it is required for ' + key);
      }
    }
  }

  onPlanNameChange(name: string): void {
    if (!this.createPlanForm.slug || this.createPlanForm.slug.startsWith('auto-')) {
      const generated = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      this.createPlanForm.slug = generated;
    }
  }

  onMonthlyPriceChange(val: number): void {
    if (val && (!this.createPlanForm.yearlyPrice || this.createPlanForm.yearlyPrice === (val * 10))) {
      this.createPlanForm.yearlyPrice = val * 10;
    }
  }

  // --- Modals Management ---
  openCreatePlanModal(): void {
    this.createPlanModules = new Set(['ESS', 'Attendance', 'Leaves']);
    this.createPlanForm = {
      name: '',
      slug: '',
      monthlyPrice: 999,
      yearlyPrice: 9990,
      currency: 'INR',
      userLimit: 20,
      storageLimitMb: 512,
      durationDays: 30,
      isPublic: true,
      isTrialPlan: false,
      isActive: true,
    };
    this.formError.set(null);
    this.showCreatePlanModal.set(true);
  }

  closeCreatePlanModal(): void {
    this.showCreatePlanModal.set(false);
    this.formError.set(null);
  }

  submitCreatePlan(): void {
    if (this.hasAttendanceDependencyError()) {
      this.formError.set('Face Recognition, Geofence, Shift Planner, and Kiosk require Attendance Core to be enabled.');
      return;
    }

    this.isSubmitting.set(true);
    this.formError.set(null);

    const payload: CreatePlanPayload = {
      ...this.createPlanForm,
      price: this.createPlanForm.monthlyPrice,
      modules: Array.from(this.createPlanModules),
    };

    this.platformService.createPlan(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeCreatePlanModal();
        this.toast.success('Subscription plan created successfully.');
        this.loadCatalog();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const msg = err?.error?.message || 'Failed to create subscription plan.';
        this.formError.set(msg);
      },
    });
  }

  openEditPlanModal(plan: PlatformPlan): void {
    this.selectedPlan.set(plan);
    this.editPlanModules = new Set(plan.modules || []);
    this.editPlanFeatureLimits.set(
      (plan.featureLimits || []).map((fl) => ({ ...fl }))
    );
    this.editPlanForm = {
      name: plan.name,
      slug: plan.slug,
      price: plan.price,
      monthlyPrice: plan.monthlyPrice,
      yearlyPrice: plan.yearlyPrice,
      currency: plan.currency,
      userLimit: plan.userLimit,
      storageLimitMb: plan.storageLimitMb,
      durationDays: plan.durationDays,
      isPublic: plan.isPublic,
      isTrialPlan: plan.isTrialPlan,
      isActive: plan.isActive,
    };
    this.formError.set(null);
    this.showEditPlanModal.set(true);
  }

  closeEditPlanModal(): void {
    this.showEditPlanModal.set(false);
    this.selectedPlan.set(null);
    this.formError.set(null);
  }

  submitEditPlan(): void {
    const plan = this.selectedPlan();
    if (!plan) return;

    if (this.hasAttendanceDependencyErrorEdit()) {
      this.formError.set('Face Recognition, Geofence, Shift Planner, and Kiosk require Attendance Core to be enabled.');
      return;
    }

    this.isSubmitting.set(true);
    this.formError.set(null);

    const payload: UpdatePlanPayload = {
      ...this.editPlanForm,
      price: this.editPlanForm.monthlyPrice,
      modules: Array.from(this.editPlanModules),
      featureLimits: this.editPlanFeatureLimits(),
    };

    this.platformService.updatePlan(plan.id, payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeEditPlanModal();
        this.toast.success(`Plan "${plan.name}" updated successfully.`);
        this.loadCatalog();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const msg = err?.error?.message || 'Failed to update plan.';
        this.formError.set(msg);
      },
    });
  }

  confirmTogglePlan(plan: PlatformPlan): void {
    this.targetTogglePlan.set(plan);
    this.showToggleConfirmModal.set(true);
  }

  closeToggleModal(): void {
    this.showToggleConfirmModal.set(false);
    this.targetTogglePlan.set(null);
  }

  executeTogglePlan(): void {
    const plan = this.targetTogglePlan();
    if (!plan) return;

    this.isSubmitting.set(true);
    this.platformService.togglePlan(plan.id).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeToggleModal();
        const action = plan.isActive ? 'deactivated' : 'activated';
        this.toast.success(`Plan "${plan.name}" was ${action}.`);
        this.loadCatalog();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.closeToggleModal();
        const msg = err?.error?.message || 'Failed to toggle plan status.';
        this.apiError.set(msg);
      },
    });
  }

  openEditAddonModal(addon: PlatformCatalogAddon): void {
    this.selectedAddon.set(addon);
    this.editAddonForm = {
      name: addon.name,
      price: addon.price,
      isActive: addon.isActive,
    };
    this.formError.set(null);
    this.showEditAddonModal.set(true);
  }

  closeEditAddonModal(): void {
    this.showEditAddonModal.set(false);
    this.selectedAddon.set(null);
    this.formError.set(null);
  }

  submitEditAddon(): void {
    const addon = this.selectedAddon();
    if (!addon) return;

    this.isSubmitting.set(true);
    this.formError.set(null);

    this.platformService.updateAddon(addon.id, this.editAddonForm).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeEditAddonModal();
        this.toast.success(`Add-on "${addon.name}" updated successfully.`);
        this.loadCatalog();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const msg = err?.error?.message || 'Failed to update add-on.';
        this.formError.set(msg);
      },
    });
  }
}
