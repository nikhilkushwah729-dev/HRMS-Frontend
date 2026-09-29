import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../../core/services/toast.service';
import {
  PlatformAddon,
  PlatformModuleSummary,
  PlatformOrganizationSummary,
  PlatformOverview,
  PlatformService,
} from '../../core/services/platform.service';

type PlatformView = 'organizations' | 'modules' | 'subscriptions' | 'analytics';

@Component({
  selector: 'app-platform-control',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="mx-auto flex max-w-7xl flex-col gap-6 pb-10">
      <!-- Super Admin Hero Header -->
      <header class="app-module-hero flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div class="max-w-3xl">
          <div class="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white backdrop-blur">
            <span class="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Super Admin Control Plane
          </div>
          <h1 class="app-module-title mt-3">
            Super Admin Platform Management & Permissions
          </h1>
          <p class="app-module-text mt-3">
            Full control center to create, edit, customize permissions, upgrade/downgrade, or delete organization workspaces across the entire platform.
          </p>
        </div>
        <div class="app-module-highlight min-w-[250px]">
          <span class="app-module-highlight-label">Total Organizations</span>
          <div class="app-module-highlight-value mt-3">{{ totals().organizations }}</div>
          <p class="mt-2 text-sm text-white/80">
            Active workspace tenants managed in system.
          </p>
        </div>
      </header>

      <!-- Stat Cards -->
      <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        @for (card of statCards(); track card.label) {
          <div class="rounded-lg border border-slate-100 bg-white p-5 shadow-sm">
            <p class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{{ card.label }}</p>
            <p class="mt-3 text-3xl font-black tracking-tight text-slate-900">{{ card.value }}</p>
            <p class="mt-2 text-sm text-slate-500">{{ card.help }}</p>
          </div>
        }
      </section>

      <!-- Navigation Tabs -->
      <nav class="app-chip-switch w-fit max-w-full overflow-x-auto">
        @for (tab of tabs; track tab.id) {
          <button
            type="button"
            class="app-chip-button shrink-0"
            (click)="setView(tab.id)"
            [ngClass]="currentView() === tab.id ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-white'"
          >
            {{ tab.label }}
          </button>
        }
      </nav>

      <!-- ORGANIZATIONS TAB -->
      @if (currentView() === 'organizations') {
        <section class="rounded-lg border border-slate-100 bg-white shadow-sm">
          <div class="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 class="text-lg font-black text-slate-900">Organizations</h2>
              <p class="mt-1 text-sm text-slate-500">Super admin management for all organization tenants and module permissions.</p>
            </div>
            <div class="flex flex-wrap items-center gap-3">
              <input
                type="text"
                [ngModel]="searchQuery()"
                (ngModelChange)="searchQuery.set($event)"
                placeholder="Search organization or email..."
                class="rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-slate-900"
              />
              <button type="button" (click)="openCreateModal()" class="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
                New Organization
              </button>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-100 text-sm">
              <thead class="bg-slate-50 text-left text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                <tr>
                  <th class="px-5 py-3">ID & Organization</th>
                  <th class="px-5 py-3">Users</th>
                  <th class="px-5 py-3">Modules</th>
                  <th class="px-5 py-3">Plan / Status</th>
                  <th class="px-5 py-3 text-right">Super Admin Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (org of filteredOrganizations(); track org.id) {
                  <tr class="hover:bg-slate-50/70 transition-colors">
                    <td class="px-5 py-4">
                      <div class="flex items-center gap-3">
                        <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-700">#{{ org.id }}</span>
                        <div>
                          <p class="font-bold text-slate-900">{{ org.name }}</p>
                          <p class="text-xs text-slate-500">{{ org.email || 'No email provided' }}</p>
                        </div>
                      </div>
                    </td>
                    <td class="px-5 py-4 font-semibold text-slate-700">
                      <button type="button" (click)="openUsersModal(org)" class="inline-flex items-center gap-1.5 rounded bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition" title="Inspect Users & Credentials">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                        {{ org.employeeCount }} Users
                      </button>
                    </td>
                    <td class="px-5 py-4 font-semibold text-slate-700">
                      <button type="button" (click)="openPermissionsModal(org)" class="inline-flex items-center gap-1.5 rounded bg-cyan-50 px-2.5 py-1 text-xs font-bold text-cyan-700 hover:bg-cyan-100 transition" title="Edit Permissions">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                        {{ org.activeModules }} Modules
                      </button>
                    </td>
                    <td class="px-5 py-4">
                      <div class="flex flex-col gap-1">
                        <span class="text-xs font-bold text-slate-800">{{ org.planName || 'Enterprise Plan' }}</span>
                        <span class="w-fit rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider" [ngClass]="statusClass(org.subscriptionStatus)">
                          {{ org.subscriptionStatus || org.status || 'inactive' }}
                        </span>
                      </div>
                    </td>
                    <td class="px-5 py-4 text-right">
                      <div class="flex items-center justify-end gap-2">
                        <button type="button" (click)="openUsersModal(org)" title="Inspect Organization Users & Logins" class="rounded-md border border-slate-200 bg-white p-2 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 transition">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                        </button>
                        <button type="button" (click)="openPermissionsModal(org)" title="Edit Module Permissions" class="rounded-md border border-slate-200 bg-white p-2 text-slate-700 hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-600 transition">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                        </button>
                        <button type="button" (click)="openEditModal(org)" title="Edit Organization Details" class="rounded-md border border-slate-200 bg-white p-2 text-slate-700 hover:border-slate-400 hover:bg-slate-100 transition">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                        </button>
                        <button type="button" (click)="openDeleteModal(org)" title="Delete Organization" class="rounded-md border border-rose-200 bg-rose-50 p-2 text-rose-600 hover:bg-rose-600 hover:text-white transition">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="5" class="px-5 py-10 text-center text-sm font-semibold text-slate-400">
                      No matching organization found.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>
      }

      <!-- MODULES TAB -->
      @if (currentView() === 'modules') {
        <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          @for (module of modules(); track module.slug) {
            <article class="rounded-lg border border-slate-100 bg-white p-5 shadow-sm">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <h3 class="text-base font-black text-slate-900">{{ module.name }}</h3>
                  <p class="mt-1 text-sm text-slate-500">Enabled across tenants</p>
                </div>
                <span class="rounded-full bg-cyan-50 px-3 py-1 text-xs font-black text-cyan-700">
                  {{ module.activeOrganizations }}/{{ module.totalOrganizations }}
                </span>
              </div>
              <div class="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
                <div class="h-full rounded-full bg-cyan-500" [style.width.%]="moduleCoverage(module)"></div>
              </div>
            </article>
          }
        </section>
      }

      <!-- SUBSCRIPTIONS TAB -->
      @if (currentView() === 'subscriptions') {
        <section class="grid gap-4 lg:grid-cols-3">
          @for (item of subscriptionCards(); track item.label) {
            <div class="rounded-lg border border-slate-100 bg-white p-6 shadow-sm">
              <p class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{{ item.label }}</p>
              <p class="mt-3 text-4xl font-black text-slate-900">{{ item.value }}</p>
              <p class="mt-2 text-sm text-slate-500">{{ item.help }}</p>
            </div>
          }
        </section>
      }

      <!-- ANALYTICS TAB -->
      @if (currentView() === 'analytics') {
        <section class="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div class="rounded-lg border border-slate-100 bg-white p-6 shadow-sm">
            <h2 class="text-lg font-black text-slate-900">Usage Analytics</h2>
            <p class="mt-2 text-sm leading-6 text-slate-500">
              Live platform metrics across organizations, active employees, enabled features, and confirmed revenue.
            </p>
            <div class="mt-6 grid gap-3 sm:grid-cols-2">
              @for (card of statCards(); track card.label) {
                <div class="rounded-md bg-slate-50 p-4">
                  <p class="text-xs font-bold text-slate-500">{{ card.label }}</p>
                  <p class="mt-2 text-2xl font-black text-slate-900">{{ card.value }}</p>
                </div>
              }
            </div>
          </div>
          <div class="rounded-lg border border-slate-100 bg-white p-6 shadow-sm">
            <h2 class="text-lg font-black text-slate-900">Quick Platform Shortcuts</h2>
            <div class="mt-5 space-y-3">
              <button type="button" (click)="go('/billing')" class="w-full rounded-md border border-slate-200 px-4 py-3 text-left text-sm font-bold text-slate-700 hover:bg-slate-50">
                Manage Gateway & Plans
              </button>
              <button type="button" (click)="go('/admin/roles')" class="w-full rounded-md border border-slate-200 px-4 py-3 text-left text-sm font-bold text-slate-700 hover:bg-slate-50">
                Review RBAC Roles
              </button>
              <button type="button" (click)="go('/admin/settings')" class="w-full rounded-md border border-slate-200 px-4 py-3 text-left text-sm font-bold text-slate-700 hover:bg-slate-50">
                Global System Settings
              </button>
            </div>
          </div>
        </section>
      }
    </div>

    <!-- CREATE ORGANIZATION MODAL -->
    <div *ngIf="showCreateModal()" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" (click)="closeCreateModal()"></div>
      <div class="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate__animated animate__zoomIn">
        <div class="flex items-center justify-between border-b border-slate-100 pb-4">
          <h3 class="text-lg font-black text-slate-900">Create New Organization</h3>
          <button (click)="closeCreateModal()" class="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <form (ngSubmit)="submitCreateOrg()" class="mt-4 space-y-4">
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Company / Organization Name *</label>
            <input type="text" [(ngModel)]="createForm.companyName" name="companyName" class="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-900 focus:border-slate-900 focus:bg-white outline-none" placeholder="e.g. Acme Innovations Ltd." required />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Official Email</label>
              <input type="email" [(ngModel)]="createForm.email" name="email" class="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-900 focus:border-slate-900 focus:bg-white outline-none" placeholder="admin@company.com" />
            </div>
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Industry</label>
              <input type="text" [(ngModel)]="createForm.industry" name="industry" class="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-900 focus:border-slate-900 focus:bg-white outline-none" placeholder="IT / Healthcare" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">User Limit</label>
              <input type="number" [(ngModel)]="createForm.userLimit" name="userLimit" class="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-900 focus:border-slate-900 focus:bg-white outline-none" min="1" max="10000" />
            </div>
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Subscription Status</label>
              <select [(ngModel)]="createForm.subscriptionStatus" name="subscriptionStatus" class="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-900 focus:border-slate-900 focus:bg-white outline-none">
                <option value="active">Active</option>
                <option value="trialing">Trial</option>
                <option value="expired">Expired</option>
                <option value="grace">Grace Period</option>
              </select>
            </div>
          </div>
          <div class="mt-6 flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" (click)="closeCreateModal()" class="rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" [disabled]="isSubmitting()" class="rounded-lg bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-black disabled:opacity-50">
              {{ isSubmitting() ? 'Creating...' : 'Create Organization' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- EDIT ORGANIZATION MODAL -->
    <div *ngIf="showEditModal()" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" (click)="closeEditModal()"></div>
      <div class="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate__animated animate__zoomIn">
        <div class="flex items-center justify-between border-b border-slate-100 pb-4">
          <h3 class="text-lg font-black text-slate-900">Edit Organization #{{ selectedOrg()?.id }}</h3>
          <button (click)="closeEditModal()" class="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <form (ngSubmit)="submitEditOrg()" class="mt-4 space-y-4">
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Company / Organization Name *</label>
            <input type="text" [(ngModel)]="editForm.companyName" name="companyName" class="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-900 focus:border-slate-900 focus:bg-white outline-none" required />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Official Email</label>
              <input type="email" [(ngModel)]="editForm.email" name="email" class="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-900 focus:border-slate-900 focus:bg-white outline-none" />
            </div>
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Industry</label>
              <input type="text" [(ngModel)]="editForm.industry" name="industry" class="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-900 focus:border-slate-900 focus:bg-white outline-none" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">User Limit (Capacity)</label>
              <input type="number" [(ngModel)]="editForm.userLimit" name="userLimit" class="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-900 focus:border-slate-900 focus:bg-white outline-none" />
            </div>
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Subscription Status</label>
              <select [(ngModel)]="editForm.subscriptionStatus" name="subscriptionStatus" class="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-900 focus:border-slate-900 focus:bg-white outline-none">
                <option value="active">Active</option>
                <option value="trialing">Trial</option>
                <option value="expired">Expired</option>
                <option value="grace">Grace Period</option>
              </select>
            </div>
          </div>
          <div class="mt-6 flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" (click)="closeEditModal()" class="rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" [disabled]="isSubmitting()" class="rounded-lg bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-black disabled:opacity-50">
              {{ isSubmitting() ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODULE PERMISSIONS MODAL -->
    <div *ngIf="showPermissionsModal()" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" (click)="closePermissionsModal()"></div>
      <div class="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl animate__animated animate__zoomIn">
        <div class="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 class="text-lg font-black text-slate-900">Module Permissions</h3>
            <p class="text-xs text-slate-500 mt-0.5">Customize active module access for <strong>{{ selectedOrg()?.name }}</strong></p>
          </div>
          <button (click)="closePermissionsModal()" class="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div *ngIf="isLoadingPermissions()" class="py-12 text-center text-sm font-semibold text-slate-500">
          Loading organization permissions...
        </div>

        <div *ngIf="!isLoadingPermissions()" class="mt-4 space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          <div *ngFor="let addon of orgAddons()" class="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50 hover:border-slate-200 transition">
            <div>
              <p class="text-sm font-bold text-slate-900">{{ addon.name }}</p>
              <p class="text-xs text-slate-500">Module Key: <code class="bg-white px-1.5 py-0.5 rounded border text-[11px] font-mono text-slate-700">{{ addon.slug }}</code></p>
            </div>
            <label class="relative inline-flex cursor-pointer items-center">
              <input type="checkbox" [(ngModel)]="addon.enabled" class="peer sr-only" />
              <div class="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-emerald-500 peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
            </label>
          </div>
        </div>

        <div class="mt-6 flex justify-end gap-3 pt-2 border-t border-slate-100">
          <button type="button" (click)="closePermissionsModal()" class="rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
          <button type="button" (click)="submitPermissions()" [disabled]="isSubmitting()" class="rounded-lg bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
            {{ isSubmitting() ? 'Saving Permissions...' : 'Save Permissions' }}
          </button>
        </div>
      </div>
    </div>

    <!-- DELETE CONFIRMATION MODAL -->
    <div *ngIf="showDeleteModal()" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" (click)="closeDeleteModal()"></div>
      <div class="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate__animated animate__zoomIn">
        <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-600">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        </div>
        <h3 class="text-center text-xl font-bold text-slate-900">Delete Organization?</h3>
        <p class="mt-2 text-center text-xs leading-relaxed text-slate-500">
          Are you sure you want to delete <strong>{{ selectedOrg()?.name }}</strong> (#{{ selectedOrg()?.id }})? This action is permanent and will remove associated tenant data.
        </p>
        <div class="mt-6 flex flex-col gap-2">
          <button type="button" (click)="confirmDeleteOrg()" [disabled]="isSubmitting()" class="w-full rounded-xl bg-rose-600 py-3 text-sm font-bold text-white shadow-lg hover:bg-rose-700 disabled:opacity-50">
            {{ isSubmitting() ? 'Deleting...' : 'Yes, Delete Organization' }}
          </button>
          <button type="button" (click)="closeDeleteModal()" class="w-full rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
        </div>
      </div>
    <!-- ORGANIZATION USERS INSPECTION MODAL -->
    <div *ngIf="showUsersModal()" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" (click)="closeUsersModal()"></div>
      <div class="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl animate__animated animate__zoomIn">
        <div class="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 class="text-lg font-black text-slate-900">Organization Users & Login Accounts</h3>
            <p class="text-xs text-slate-500 mt-0.5">Super admin inspection for <strong>{{ selectedOrg()?.name }}</strong></p>
          </div>
          <button (click)="closeUsersModal()" class="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div *ngIf="isLoadingUsers()" class="py-12 text-center text-sm font-semibold text-slate-500">
          Loading tenant users...
        </div>

        <div *ngIf="!isLoadingUsers()" class="mt-4 max-h-[55vh] overflow-y-auto">
          <table class="min-w-full divide-y divide-slate-100 text-xs">
            <thead class="bg-slate-50 text-left font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th class="px-3 py-2.5">User / Code</th>
                <th class="px-3 py-2.5">Email (Username)</th>
                <th class="px-3 py-2.5">Role</th>
                <th class="px-3 py-2.5 text-right">Reset Password</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-medium">
              <tr *ngFor="let user of orgUsers()" class="hover:bg-slate-50">
                <td class="px-3 py-3">
                  <p class="font-bold text-slate-900">{{ user.fullName || 'User #' + user.id }}</p>
                  <p class="text-[11px] text-slate-400">{{ user.employeeCode || 'ID: ' + user.id }}</p>
                </td>
                <td class="px-3 py-3 text-slate-700 font-mono select-all">
                  {{ user.email || 'No email registered' }}
                </td>
                <td class="px-3 py-3">
                  <span class="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 uppercase">
                    {{ user.roleName }}
                  </span>
                </td>
                <td class="px-3 py-3 text-right">
                  <button type="button" (click)="openResetPassword(user)" class="rounded border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700 hover:bg-indigo-600 hover:text-white transition">
                    Set New Password
                  </button>
                </td>
              </tr>
              <tr *ngIf="orgUsers().length === 0">
                <td colspan="4" class="px-4 py-8 text-center text-slate-400">
                  No users found for this organization.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mt-6 flex justify-end border-t border-slate-100 pt-3">
          <button type="button" (click)="closeUsersModal()" class="rounded-lg bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-black">
            Close
          </button>
        </div>
      </div>
    </div>

    <!-- RESET PASSWORD MODAL -->
    <div *ngIf="showResetPasswordModal()" class="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" (click)="closeResetPasswordModal()"></div>
      <div class="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate__animated animate__zoomIn">
        <h3 class="text-lg font-black text-slate-900">Reset User Password</h3>
        <p class="text-xs text-slate-500 mt-1">
          Setting new login password for <strong>{{ selectedUser()?.email }}</strong>
        </p>
        <div class="mt-4 space-y-3">
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">New Password</label>
            <input type="text" [(ngModel)]="newPasswordInput" class="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm font-mono text-slate-900 focus:border-slate-900 focus:bg-white outline-none" placeholder="Enter min 6 chars" />
          </div>
        </div>
        <div class="mt-6 flex justify-end gap-2">
          <button type="button" (click)="closeResetPasswordModal()" class="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
          <button type="button" (click)="submitResetPassword()" [disabled]="isSubmitting()" class="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50">
            {{ isSubmitting() ? 'Updating...' : 'Update Password' }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class PlatformControlComponent implements OnInit {
  private readonly platformService = inject(PlatformService);
  private readonly toastService = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  overview = signal<PlatformOverview | null>(null);
  currentView = signal<PlatformView>('organizations');
  searchQuery = signal<string>('');

  // Modals & Submissions
  showCreateModal = signal(false);
  showEditModal = signal(false);
  showPermissionsModal = signal(false);
  showDeleteModal = signal(false);
  isSubmitting = signal(false);
  isLoadingPermissions = signal(false);

  selectedOrg = signal<PlatformOrganizationSummary | null>(null);
  orgAddons = signal<PlatformAddon[]>([]);

  createForm = {
    companyName: '',
    email: '',
    industry: 'Information Technology',
    userLimit: 10,
    subscriptionStatus: 'active',
  };

  editForm = {
    companyName: '',
    email: '',
    industry: '',
    userLimit: 10,
    subscriptionStatus: 'active',
  };

  tabs: Array<{ id: PlatformView; label: string }> = [
    { id: 'organizations', label: 'Organizations' },
    { id: 'modules', label: 'Modules' },
    { id: 'subscriptions', label: 'Subscriptions' },
    { id: 'analytics', label: 'Analytics' },
  ];

  totals = computed(() => this.overview()?.totals ?? {
    organizations: 0,
    activeUsers: 0,
    modulesEnabled: 0,
    subscriptions: 0,
  });
  organizations = computed<PlatformOrganizationSummary[]>(() => this.overview()?.organizations ?? []);
  filteredOrganizations = computed<PlatformOrganizationSummary[]>(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const list = this.organizations();
    if (!q) return list;
    return list.filter(
      org => org.name.toLowerCase().includes(q) || (org.email || '').toLowerCase().includes(q)
    );
  });
  modules = computed<PlatformModuleSummary[]>(() => this.overview()?.modules ?? []);
  subscription = computed(() => this.overview()?.subscription ?? {
    active: 0,
    trial: 0,
    expired: 0,
    revenue: 0,
    currency: 'INR',
  });

  statCards = computed(() => [
    { label: 'Organizations', value: this.totals().organizations, help: 'Tenant workspaces' },
    { label: 'Active Users', value: this.totals().activeUsers, help: 'Active employees' },
    { label: 'Enabled Modules', value: this.totals().modulesEnabled, help: 'Total enabled module links' },
    { label: 'Subscriptions', value: this.totals().subscriptions, help: 'Active paid/trial subscriptions' },
  ]);

  subscriptionCards = computed(() => [
    { label: 'Active', value: this.subscription().active, help: 'Organizations currently active' },
    { label: 'Trial', value: this.subscription().trial, help: 'Organizations evaluating the platform' },
    { label: 'Expired', value: this.subscription().expired, help: 'Organizations needing billing action' },
    { label: 'Revenue', value: `${this.subscription().currency} ${this.subscription().revenue}`, help: 'Confirmed billing total' },
  ]);

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const view = params.get('view');
      if (this.isPlatformView(view)) {
        this.currentView.set(view);
      }
    });
    this.loadData();
  }

  loadData(): void {
    this.platformService.getOverview().subscribe((overview) => this.overview.set(overview));
  }

  setView(view: PlatformView): void {
    this.currentView.set(view);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { view },
      queryParamsHandling: 'merge',
    });
  }

  go(route: string): void {
    this.router.navigateByUrl(route);
  }

  moduleCoverage(module: PlatformModuleSummary): number {
    if (!module.totalOrganizations) return 0;
    return Math.min(100, Math.round((module.activeOrganizations / module.totalOrganizations) * 100));
  }

  statusClass(status: string): string {
    const normalized = String(status || '').toLowerCase();
    if (normalized.includes('active')) return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200';
    if (normalized.includes('trial')) return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200';
    if (normalized.includes('expired') || normalized.includes('grace')) return 'bg-rose-50 text-rose-700 ring-1 ring-rose-200';
    return 'bg-slate-100 text-slate-600 ring-1 ring-slate-200';
  }

  private isPlatformView(view: string | null): view is PlatformView {
    return view === 'organizations' || view === 'modules' || view === 'subscriptions' || view === 'analytics';
  }

  // MODAL HANDLERS
  openCreateModal(): void {
    this.createForm = {
      companyName: '',
      email: '',
      industry: 'Information Technology',
      userLimit: 10,
      subscriptionStatus: 'active',
    };
    this.showCreateModal.set(true);
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
  }

  submitCreateOrg(): void {
    if (!this.createForm.companyName.trim()) {
      this.toastService.error('Organization name is required.');
      return;
    }

    this.isSubmitting.set(true);
    this.platformService.createOrganization(this.createForm).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeCreateModal();
        this.toastService.success('New Organization created successfully!');
        this.loadData();
      },
      error: () => {
        this.isSubmitting.set(false);
        this.toastService.error('Failed to create organization.');
      },
    });
  }

  openEditModal(org: PlatformOrganizationSummary): void {
    this.selectedOrg.set(org);
    this.editForm = {
      companyName: org.name,
      email: org.email || '',
      industry: 'Information Technology',
      userLimit: 10,
      subscriptionStatus: org.subscriptionStatus || 'active',
    };
    this.showEditModal.set(true);
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
    this.selectedOrg.set(null);
  }

  submitEditOrg(): void {
    const org = this.selectedOrg();
    if (!org) return;

    this.isSubmitting.set(true);
    this.platformService.updateOrganization(org.id, this.editForm).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeEditModal();
        this.toastService.success(`Organization #${org.id} updated successfully!`);
        this.loadData();
      },
      error: () => {
        this.isSubmitting.set(false);
        this.toastService.error('Failed to update organization.');
      },
    });
  }

  openPermissionsModal(org: PlatformOrganizationSummary): void {
    this.selectedOrg.set(org);
    this.showPermissionsModal.set(true);
    this.isLoadingPermissions.set(true);

    this.platformService.getOrganizationAddons(org.id).subscribe({
      next: (addons) => {
        this.orgAddons.set(addons);
        this.isLoadingPermissions.set(false);
      },
      error: () => {
        this.isLoadingPermissions.set(false);
        this.toastService.error('Failed to load organization permissions.');
      },
    });
  }

  closePermissionsModal(): void {
    this.showPermissionsModal.set(false);
    this.selectedOrg.set(null);
  }

  submitPermissions(): void {
    const org = this.selectedOrg();
    if (!org) return;

    this.isSubmitting.set(true);
    const addonsPayload = this.orgAddons().map((a) => ({ id: a.id, enabled: a.enabled }));
    this.platformService.updateOrganizationAddons(org.id, addonsPayload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closePermissionsModal();
        this.toastService.success(`Permissions for ${org.name} saved!`);
        this.loadData();
      },
      error: () => {
        this.isSubmitting.set(false);
        this.toastService.error('Failed to update permissions.');
      },
    });
  }

  openDeleteModal(org: PlatformOrganizationSummary): void {
    this.selectedOrg.set(org);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.selectedOrg.set(null);
  }

  confirmDeleteOrg(): void {
    const org = this.selectedOrg();
    if (!org) return;

    this.isSubmitting.set(true);
    this.platformService.deleteOrganization(org.id).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeDeleteModal();
        this.toastService.success(`Organization ${org.name} deleted successfully.`);
        this.loadData();
      },
      error: () => {
        this.isSubmitting.set(false);
        this.toastService.error('Failed to delete organization.');
      },
    });
  }

  // USER INSPECTION & PASSWORD RESET HANDLERS
  showUsersModal = signal(false);
  isLoadingUsers = signal(false);
  orgUsers = signal<any[]>([]);
  showResetPasswordModal = signal(false);
  selectedUser = signal<any | null>(null);
  newPasswordInput = '';

  openUsersModal(org: PlatformOrganizationSummary): void {
    this.selectedOrg.set(org);
    this.showUsersModal.set(true);
    this.isLoadingUsers.set(true);

    this.platformService.getOrganizationUsers(org.id).subscribe({
      next: (users) => {
        this.orgUsers.set(users);
        this.isLoadingUsers.set(false);
      },
      error: () => {
        this.isLoadingUsers.set(false);
        this.toastService.error('Failed to load organization users.');
      },
    });
  }

  closeUsersModal(): void {
    this.showUsersModal.set(false);
    this.selectedOrg.set(null);
  }

  openResetPassword(user: any): void {
    this.selectedUser.set(user);
    this.newPasswordInput = '';
    this.showResetPasswordModal.set(true);
  }

  closeResetPasswordModal(): void {
    this.showResetPasswordModal.set(false);
    this.selectedUser.set(null);
    this.newPasswordInput = '';
  }

  submitResetPassword(): void {
    const user = this.selectedUser();
    if (!user) return;
    if (!this.newPasswordInput || this.newPasswordInput.length < 6) {
      this.toastService.error('Please enter a password with at least 6 characters.');
      return;
    }

    this.isSubmitting.set(true);
    this.platformService.resetUserPassword(user.id, this.newPasswordInput).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeResetPasswordModal();
        this.toastService.success(`Password updated for ${user.email}!`);
      },
      error: () => {
        this.isSubmitting.set(false);
        this.toastService.error('Failed to reset user password.');
      },
    });
  }
}
