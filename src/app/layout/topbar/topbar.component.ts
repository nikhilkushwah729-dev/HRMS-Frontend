import { Component, HostListener, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { NavigationEnd, Router } from '@angular/router';
import { selectUser } from '../../core/state/auth/auth.selectors';
import { LayoutService } from '../../core/services/layout.service';
import * as AuthActions from '../../core/state/auth/auth.actions';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/services/auth.service';
import { EmployeeService } from '../../core/services/employee.service';
import { Project, ProjectService } from '../../core/services/project.service';
import { OrganizationService, Designation } from '../../core/services/organization.service';
import { User } from '../../core/models/auth.model';
import { catchError, forkJoin, of } from 'rxjs';
import { PermissionService } from '../../core/services/permission.service';
import { filter } from 'rxjs/operators';
import { WorkspaceCatalogService } from '../../core/access/workspace-catalog.service';
import {
  SubscriptionService,
  SubscriptionStatusPayload,
} from '../../core/services/subscription.service';

type SearchCategory = 'Quick Link' | 'Employee' | 'Project';
type SearchResult = {
  title: string;
  subtitle: string;
  route: string;
  category: SearchCategory;
  tone: string;
};

type ModuleTab = {
  label: string;
  route: string;
  accent: string;
  isLocked: boolean;
  description?: string;
  lockReason?: string | null;
};

type AddonLauncherItem = {
  id: number;
  name: string;
  slug: string;
  description: string;
  route: string;
  isActive: boolean;
  accent: string;
};

type GuidePreview = {
  key: string;
  title: string;
  duration: string;
  audience: string;
  addonSlug: string;
  outcome: string;
  steps: string[];
};

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="app-topbar-surface sticky top-0 z-50 w-full border-b border-white/40 px-2 sm:px-3 lg:px-4">
      <div class="flex min-h-[58px] items-center justify-between gap-3 py-2 md:min-h-[66px]">
      <div class="flex min-w-0 flex-1 flex-col gap-1">
        <div class="flex min-w-0 items-center gap-2 sm:gap-2.5 lg:gap-3">
        <button (click)="layoutService.toggleSidebar()" class="lg:hidden p-1.5 text-slate-600 hover:bg-white/80 rounded-md transition-colors border border-stone-200/70 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
        </button>

        <div class="min-w-0 flex-1 lg:hidden">
          <p class="truncate text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{{ headerKicker() }}</p>
          <h1 class="truncate text-sm font-black tracking-tight text-slate-900">{{ headerTitle() }}</h1>
        </div>

        <div class="hidden lg:flex min-w-0 flex-col flex-1">
          <span class="app-page-kicker">{{ headerKicker() }}</span>
          <h1 class="app-page-title truncate max-w-[12rem] xl:max-w-[16rem]">{{ headerTitle() }}</h1>
          <p class="app-page-subtitle truncate hidden xl:block">{{ headerSubtitle() }}</p>
        </div>

        <div class="relative hidden md:block">
          <button
            type="button"
            (click)="openSearch()"
            class="search-launcher"
            aria-label="Open search"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <span class="hidden lg:inline text-[10px] font-black tracking-[0.16em]">Search</span>
            <span class="search-launcher-key">Ctrl K</span>
          </button>

          @if (showSearchPanel()) {
            <div class="absolute left-0 right-0 mt-3 bg-white rounded-md shadow-2xl border border-stone-100 overflow-hidden z-[70] w-[min(28rem,calc(100vw-2rem))]">
              <div class="px-4 py-3 border-b border-stone-100 bg-gradient-to-r from-amber-50/80 via-white to-teal-50/70 flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-slate-400"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                <input
                  type="text"
                  [value]="searchQuery()"
                  (input)="onSearchInput(($any($event.target).value || '').toString())"
                  placeholder="Search anything..."
                  class="w-full bg-transparent text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none"
                  autofocus
                >
                <span class="search-launcher-key">Ctrl K</span>
              </div>
              <div class="max-h-[min(55vh,22rem)] overflow-y-auto">
                @if (searchResults().length === 0) {
                  <div class="px-4 py-8 text-center">
                    <p class="text-sm font-semibold text-slate-400">No matching results</p>
                    <p class="text-xs text-slate-400 mt-1">Try employee name, project, or module name</p>
                  </div>
                } @else {
                  @for (result of searchResults(); track result.route + result.title) {
                    <button
                      (click)="goToSearchResult(result.route)"
                      class="w-full text-left px-4 py-3 border-b border-slate-50 last:border-b-0 hover:bg-slate-50 transition-colors"
                    >
                      <div class="flex items-start justify-between gap-3">
                        <div class="min-w-0">
                          <p class="text-sm font-bold text-slate-900 truncate">{{ result.title }}</p>
                          <p class="text-xs text-slate-500 truncate">{{ result.subtitle }}</p>
                        </div>
                        <span class="shrink-0 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md"
                              [ngClass]="result.tone">
                          {{ result.category }}
                        </span>
                      </div>
                    </button>
                  }
                }
              </div>
            </div>
          }
        </div>

        </div>

        <div class="hidden lg:flex items-center relative">
          <button type="button" (click)="toggleModuleSwitcher()" class="module-switcher-btn" [class.module-switcher-btn-active]="showModuleSwitcher()">
            <span class="module-switcher-dot" [ngClass]="activeModuleAccent()"></span>
            <span class="hidden xl:inline">{{ activeWorkspaceLabel() }}</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="opacity-70"><path d="m6 9 6 6 6-6"/></svg>
          </button>

          @if (showModuleSwitcher()) {
            <div class="absolute left-0 top-full mt-3 w-[min(32rem,calc(100vw-4rem))] rounded-2xl border border-slate-100 bg-white shadow-2xl z-[70] overflow-hidden">
              <div class="grid gap-0 md:grid-cols-2">
                <div class="p-3 border-b md:border-b-0 md:border-r border-slate-100 bg-slate-50/60">
                  <p class="px-2 pb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Self Service</p>
                  <div class="space-y-1">
                    @for (module of selfServiceTabs(); track module.route) {
                      <button
                        type="button"
                        (click)="module.isLocked ? openLockedModule(module) : goToSearchResult(module.route)"
                        class="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors"
                        [ngClass]="module.isLocked ? 'cursor-not-allowed bg-rose-50 text-rose-700' : (isActiveRoute(module.route) ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-white hover:text-slate-900')"
                      >
                        <span class="h-2.5 w-2.5 rounded-full" [ngClass]="module.accent"></span>
                        <span class="truncate min-w-0 flex-1">{{ module.label }}</span>
                        @if (module.isLocked) {
                          <span class="ml-auto rounded-full border border-rose-200 bg-white px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] text-rose-700">
                            Lock
                          </span>
                        }
                      </button>
                    }
                  </div>
                </div>
                <div class="p-3 bg-white">
                  <p class="px-2 pb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Admin & HR</p>
                  <div class="space-y-1">
                    @for (module of adminTabs(); track module.route) {
                      <button
                        type="button"
                        (click)="module.isLocked ? openLockedModule(module) : goToSearchResult(module.route)"
                        class="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors"
                        [ngClass]="module.isLocked ? 'cursor-not-allowed bg-rose-50 text-rose-700' : (isActiveRoute(module.route) ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900')"
                      >
                        <span class="h-2.5 w-2.5 rounded-full" [ngClass]="module.accent"></span>
                        <span class="truncate min-w-0 flex-1">{{ module.label }}</span>
                        @if (module.isLocked) {
                          <span class="ml-auto rounded-full border border-rose-200 bg-white px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] text-rose-700">
                            Lock
                          </span>
                        }
                      </button>
                    }
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      </div>

      <div class="flex shrink-0 items-center gap-1.5 sm:gap-3 md:gap-4">
        <div class="relative hidden lg:block">
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            (click)="goToSearchResult('/add-ons')"
          >
            <span class="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-700">+</span>
            <span>Add-ons</span>
            <span class="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] text-slate-600">{{ addonLauncherItems().length }}</span>
          </button>

          @if (showAddonsPanel()) {
            <div class="absolute right-0 top-full mt-3 w-[min(62rem,calc(100vw-4rem))] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl z-[70]">
              <div class="grid lg:grid-cols-[1.2fr_0.8fr]">
                <div class="border-b border-slate-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5 lg:border-b-0 lg:border-r">
                  <div class="flex items-start justify-between gap-4">
                    <div class="max-w-xl">
                      <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Module Launcher</p>
                      <h3 class="mt-2 text-2xl font-black tracking-tight text-slate-900">Open add-ons, see suggestions, and learn before buying</h3>
                      <p class="mt-2 text-sm leading-6 text-slate-500">
                        This launcher keeps active modules, premium suggestions, and guided walkthroughs together so users do not have to jump across many screens.
                      </p>
                    </div>
                    <button type="button" (click)="closeAll()" class="rounded-full border border-slate-200 px-3 py-2 text-xs font-bold text-slate-500 transition hover:bg-slate-50">Close</button>
                  </div>

                  <div class="mt-5 grid gap-3 sm:grid-cols-3">
                    <div class="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4">
                      <p class="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">Active</p>
                      <p class="mt-2 text-2xl font-black text-emerald-900">{{ activeAddonCount() }}</p>
                    </div>
                    <div class="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-4">
                      <p class="text-[10px] font-black uppercase tracking-[0.18em] text-amber-700">Suggested</p>
                      <p class="mt-2 text-2xl font-black text-amber-900">{{ lockedAddonCount() }}</p>
                    </div>
                    <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                      <p class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Guides</p>
                      <p class="mt-2 text-2xl font-black text-slate-900">{{ moduleGuides().length }}</p>
                    </div>
                  </div>

                  <div class="mt-5 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      (click)="addonPanelMode.set('all')"
                      class="rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition"
                      [ngClass]="addonPanelMode() === 'all' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'"
                    >
                      All
                    </button>
                    <button
                      type="button"
                      (click)="addonPanelMode.set('active')"
                      class="rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition"
                      [ngClass]="addonPanelMode() === 'active' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'"
                    >
                      Active
                    </button>
                    <button
                      type="button"
                      (click)="addonPanelMode.set('learn')"
                      class="rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition"
                      [ngClass]="addonPanelMode() === 'learn' ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'"
                    >
                      Learn & Buy
                    </button>
                    <div class="flex flex-wrap gap-2 lg:ml-auto">
                      <span class="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-600">ESS</span>
                      <span class="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-600">HR Ops</span>
                      <span class="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-600">Billing Ready</span>
                    </div>
                  </div>

                  <div class="mt-6 space-y-4">
                    <div>
                      <div class="flex items-center justify-between gap-3">
                        <h4 class="text-sm font-black uppercase tracking-[0.18em] text-slate-500">
                          {{ addonPanelMode() === 'active' ? 'Active Modules' : addonPanelMode() === 'learn' ? 'Learn & Buy Modules' : 'Featured Modules' }}
                        </h4>
                        <button type="button" (click)="goToSearchResult('/add-ons')" class="text-xs font-bold text-slate-600 hover:text-slate-900">Open full hub</button>
                      </div>
                      <div class="mt-3 grid gap-3 md:grid-cols-2">
                        @for (addon of featuredLauncherAddons(); track addon.id) {
                          <button type="button" (click)="openAddonLauncherItem(addon)" class="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm">
                            <div class="flex items-center justify-between gap-3">
                              <span class="rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em]" [ngClass]="addon.accent">{{ addon.isActive ? 'Live' : 'Premium' }}</span>
                              <span class="text-xs font-bold text-slate-400">{{ addon.route }}</span>
                            </div>
                            <p class="mt-3 text-base font-black text-slate-900">{{ addon.name }}</p>
                            <p class="mt-2 text-sm leading-6 text-slate-500">{{ addon.description }}</p>
                            <div class="mt-4 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-700">
                              <span>{{ addon.isActive ? 'Open workspace' : 'Upgrade now' }}</span>
                              <span>→</span>
                            </div>
                          </button>
                        }
                      </div>
                    </div>

                    <div *ngIf="lockedAddons().length > 0">
                      <h4 class="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Suggested Upgrades</h4>
                      <div class="mt-3 grid gap-3 md:grid-cols-2">
                        @for (addon of lockedAddons(); track addon.id) {
                          <button type="button" (click)="openAddonLauncherItem(addon)" class="rounded-2xl border border-amber-200 bg-[linear-gradient(180deg,#fff7ed_0%,#ffffff_100%)] px-4 py-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm">
                            <div class="flex items-center justify-between gap-3">
                              <span class="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-amber-700">Upgrade</span>
                              <span class="text-xs font-bold text-amber-600">Billing</span>
                            </div>
                            <p class="mt-3 text-base font-black text-slate-900">{{ addon.name }}</p>
                            <p class="mt-2 text-sm leading-6 text-slate-500">{{ addon.description }}</p>
                            <div class="mt-4 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-amber-700">
                              <span>Review plan</span>
                              <span>→</span>
                            </div>
                          </button>
                        }
                      </div>
                    </div>
                  </div>
                </div>

                <div class="bg-slate-50/70 p-5">
                  <div class="flex items-center justify-between gap-3">
                    <div>
                      <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Guided Demos</p>
                      <h4 class="mt-2 text-xl font-black tracking-tight text-slate-900">How to use modules</h4>
                    </div>
                    <span class="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">User help</span>
                  </div>

                  <div class="mt-5 space-y-3">
                    @for (guide of moduleGuides(); track guide.key) {
                      <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div class="flex items-start justify-between gap-3">
                          <div>
                            <p class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{{ guide.duration }} demo</p>
                            <h5 class="mt-1 text-base font-black text-slate-900">{{ guide.title }}</h5>
                          </div>
                          <span class="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-600">{{ guide.audience }}</span>
                        </div>
                        <p class="mt-2 text-sm leading-6 text-slate-500">{{ guide.outcome }}</p>
                        <div class="mt-3 space-y-2">
                          @for (step of guide.steps; track step) {
                            <div class="flex items-start gap-2 text-xs text-slate-600">
                              <span class="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                              <span>{{ step }}</span>
                            </div>
                          }
                        </div>
                        <div class="mt-4 flex gap-2">
                          <button type="button" (click)="watchGuideDemo(guide)" class="rounded-full bg-slate-900 px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-white transition hover:bg-slate-800">
                            Watch Demo
                          </button>
                          <button type="button" (click)="openGuideBilling(guide)" class="rounded-full border border-slate-200 bg-white px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-700 transition hover:bg-slate-50">
                            Buy Flow
                          </button>
                        </div>
                      </article>
                    }
                  </div>
                </div>
              </div>
            </div>
          }
        </div>

        <button
          type="button"
          class="hidden lg:inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition"
          [ngClass]="billingChipTone()"
          (click)="goToSearchResult('/billing')"
        >
          <span class="h-2 w-2 rounded-full" [ngClass]="billingDotTone()"></span>
          <span>{{ billingChipLabel() }}</span>
        </button>

        <div class="hidden 2xl:flex items-center">
          <span class="app-page-header-chip">{{ currentDateLabel() }}</span>
        </div>

        <!-- Notification Bell -->
        @if (canViewNotifications()) {
        <div class="relative">
          <button (click)="toggleNotifications()" class="relative text-slate-500 p-2 rounded-full hover:bg-slate-100/80 hover:text-indigo-600 transition-colors border border-transparent hover:border-slate-200/50">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
            @if (notifService.unreadCount() > 0) {
              <span class="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-white shadow-sm">
                {{ notifService.unreadCount() > 9 ? '9+' : notifService.unreadCount() }}
              </span>
            }
          </button>

          <!-- Notification Panel -->
          @if (showNotifications()) {
            <div class="fixed left-2 right-2 top-[4.5rem] sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-3 w-auto sm:w-80 sm:max-w-80 bg-white rounded-md shadow-2xl border border-stone-100 overflow-hidden z-[60]">
              <div class="flex items-center justify-between px-4 py-3 border-b border-stone-100">
                <h4 class="font-bold text-slate-900 text-sm">Notifications</h4>
                @if (notifService.unreadCount() > 0) {
                  <button (click)="markAllRead()" class="text-[11px] font-bold text-primary-600 hover:underline">Mark all read</button>
                }
              </div>
              <div class="max-h-[min(70vh,26rem)] overflow-y-auto">
                @if (notifService.notifications().length === 0) {
                  <div class="flex flex-col items-center justify-center py-10 text-center px-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-slate-300 mb-2"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                    <p class="text-sm text-slate-400 font-medium">No notifications</p>
                  </div>
                }
                @for (notif of notifService.notifications(); track notif.id) {
                  <div class="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-50 last:border-0"
                       [ngClass]="{ 'bg-primary-50/30': !notif.isRead }"
                       (click)="markRead(notif.id)">
                    <div class="w-2 h-2 rounded-full mt-2 shrink-0 transition-colors"
                         [ngClass]="!notif.isRead ? 'bg-primary-500' : 'bg-transparent'"></div>
                    <div class="flex flex-col gap-0.5 flex-1 min-w-0">
                      <span class="text-sm font-bold text-slate-800 leading-tight">{{ notif.title }}</span>
                      <span class="text-xs text-slate-500 line-clamp-2">{{ notif.message }}</span>
                      <span class="text-[10px] text-slate-400 font-medium mt-1">{{ notif.createdAt | date:'short' }}</span>
                    </div>
                  </div>
                }
              </div>
            </div>
          }
        </div>
        }

        <!-- User Profile Dropdown -->
        <div class="relative">
          @if (currentUser(); as user) {
            <div (click)="showDropdown = !showDropdown; showNotifications.set(false)" class="flex items-center gap-2 rounded-full cursor-pointer border border-slate-200/70 bg-slate-50/70 p-1 pr-2 hover:border-slate-300/80 hover:bg-white hover:shadow-sm transition-all group">
              <div class="w-8 h-8 overflow-hidden bg-gradient-to-br from-indigo-500 to-teal-500 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] group-hover:scale-105 transition-transform ring-2 ring-white">
                @if (user.avatar) {
                  <img [src]="user.avatar" class="h-full w-full object-cover" alt="Profile photo">
                } @else {
                  <span>{{ userInitial() }}</span>
                }
              </div>
              <div class="hidden min-w-0 md:flex md:flex-col">
                <span class="max-w-[8rem] truncate text-[11px] font-black tracking-tight text-slate-800">{{ user.firstName }} {{ user.lastName }}</span>
                <span class="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">{{ userRoleLabel() }}</span>
              </div>
            </div>
          }

          <!-- Profile Dropdown -->
          @if (showDropdown && currentUser(); as user) {
            <div class="fixed left-2 right-2 top-[4.5rem] sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-3 w-auto sm:w-64 sm:max-w-64 bg-white rounded-xl shadow-2xl border border-slate-100 p-2 z-[60] ring-1 ring-slate-900/5">
              <div class="px-3 py-3 border-b border-slate-100/80 mb-1 flex items-center gap-3 bg-slate-50/50 rounded-lg">
                <div class="w-10 h-10 overflow-hidden bg-gradient-to-br from-indigo-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-inner ring-2 ring-white">
                  @if (user.avatar) {
                    <img [src]="user.avatar" class="h-full w-full object-cover">
                  } @else {
                    <span>{{ userInitial() }}</span>
                  }
                </div>
                <div class="min-w-0">
                  <p class="text-[13px] font-bold text-slate-900 truncate">{{ user.firstName }} {{ user.lastName }}</p>
                  <p class="text-[11px] font-medium text-slate-500 truncate mt-0.5">{{ user.email }}</p>
                </div>
              </div>
              <button (click)="goToSearchResult('/profile')" class="w-full flex items-center gap-3 px-3 py-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 rounded-lg transition-all group">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-slate-400 group-hover:text-indigo-500 transition-colors"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <span>My Profile</span>
              </button>
              @if (canAccess('/settings')) {
                <button (click)="goToSearchResult('/settings')" class="w-full flex items-center gap-3 px-3 py-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 rounded-lg transition-all group mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-slate-400 group-hover:text-indigo-500 transition-colors"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                  <span>Profile Settings</span>
                </button>
              }
              @if (canAccess('/admin/settings')) {
                <div class="my-1.5 border-t border-slate-100"></div>
                <button (click)="goToSearchResult('/admin/settings')" class="w-full flex items-center gap-3 px-3 py-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 rounded-lg transition-all group">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-slate-400 group-hover:text-indigo-500 transition-colors"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                  <span>Admin Settings</span>
                </button>
              }
              <div class="my-1.5 border-t border-slate-100"></div>
              <button (click)="logout()" class="w-full flex items-center gap-3 px-3 py-2 text-[13px] font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-all group">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="group-hover:translate-x-0.5 transition-transform"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                <span>Sign Out</span>
              </button>
            </div>
          }
        </div>
      </div>
      </div>
    </header>

    <!-- Click outside overlay to close dropdowns -->
    @if (showDropdown || showNotifications() || showSearchPanel() || showAddonsPanel()) {
      <div (click)="closeAll()" class="fixed inset-0 z-30"></div>
    }

  `,
  styles: [
    `
      .module-switcher-btn {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        padding: 7px 10px;
        border-radius: 9999px;
        border: 1px solid rgba(226, 232, 240, 0.95);
        background: rgba(255, 255, 255, 0.88);
        color: #334155;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        transition: transform 0.2s ease, border-color 0.2s ease, background-color 0.2s ease, color 0.2s ease;
      }

      .module-switcher-btn:hover {
        transform: translateY(-1px);
      }

      .module-switcher-btn-active {
        background: rgba(15, 23, 42, 0.96);
        color: #f8fafc;
        border-color: rgba(15, 23, 42, 0.96);
        box-shadow: 0 14px 30px -18px rgba(15, 23, 42, 0.7);
      }

      .module-switcher-btn svg {
        flex: 0 0 auto;
      }

      .module-switcher-dot {
        width: 8px;
        height: 8px;
        border-radius: 9999px;
        flex: 0 0 auto;
      }

      .search-launcher {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-height: 38px;
        padding: 6px 10px;
        border-radius: 9999px;
        border: 1px solid rgba(226, 232, 240, 0.95);
        background: rgba(255, 255, 255, 0.9);
        color: #334155;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        transition: transform 0.2s ease, border-color 0.2s ease, background-color 0.2s ease, color 0.2s ease;
      }

      .search-launcher:hover {
        transform: translateY(-1px);
        box-shadow: 0 16px 28px -24px rgba(15, 23, 42, 0.45);
      }

      .search-launcher svg {
        flex: 0 0 auto;
      }

      .search-launcher-key {
        font-size: 9px;
        font-weight: 800;
        padding: 2px 6px;
        border-radius: 9999px;
        background: rgba(148, 163, 184, 0.12);
        color: #64748b;
      }
    `,
  ]
})
export class TopbarComponent implements OnInit {
  private store = inject(Store);
  private router = inject(Router);
  private authService = inject(AuthService);
  private employeeService = inject(EmployeeService);
  private projectService = inject(ProjectService);
  private permissionService = inject(PermissionService);
  private workspaceCatalog = inject(WorkspaceCatalogService);
  private organizationService = inject(OrganizationService);
  private subscriptionService = inject(SubscriptionService);
  layoutService = inject(LayoutService);
  notifService = inject(NotificationService);

  user$ = this.store.select(selectUser);
  showDropdown = false;
  showNotifications = signal(false);
  showSearchPanel = signal(false);
  showModuleSwitcher = signal(false);
  showAddonsPanel = signal(false);
  addonPanelMode = signal<'all' | 'active' | 'learn'>('all');
  searchQuery = signal('');
  searchResults = signal<SearchResult[]>([]);
  loggingOut = signal(false);
  currentUser = signal<User | null>(null);
  private currentPath = signal('/');
  private employeeCache = signal<User[]>([]);
  private projectCache = signal<Project[]>([]);
  private designations = signal<Designation[]>([]);
  subscriptionStatus = signal<SubscriptionStatusPayload | null>(null);
  userDesignation = signal<string>('');
  userRoleLabel = signal<string>('Employee');
  addonLauncherItems = signal<AddonLauncherItem[]>([]);
  moduleGuides = signal<GuidePreview[]>([
    {
      key: 'attendance',
      title: 'Attendance daily workflow',
      duration: '2 min',
      audience: 'Employee',
      addonSlug: 'attendance',
      outcome: 'Learn how to clock in, view today status, and track attendance history.',
      steps: ['Open attendance workspace', 'Review today status and shift', 'Complete check-in or check-out', 'Verify history before leaving'],
    },
    {
      key: 'leave',
      title: 'Leave request walkthrough',
      duration: '3 min',
      audience: 'ESS',
      addonSlug: 'leave',
      outcome: 'Understand how to apply leave, track approvals, and check balances.',
      steps: ['Open leave workspace', 'Choose date range and reason', 'Submit request with attachment if needed', 'Track approval status from requests'],
    },
    {
      key: 'visit',
      title: 'Visit Management quick guide',
      duration: '3 min',
      audience: 'Manager',
      addonSlug: 'visit-management',
      outcome: 'See how scheduled visits, check-ins, and follow-ups work before buying.',
      steps: ['Open visit dashboard', 'Review planned and active visits', 'Check-in using visit actions', 'Track follow-up and completion'],
    },
    {
      key: 'payroll',
      title: 'Payroll access preview',
      duration: '2 min',
      audience: 'Admin',
      addonSlug: 'payroll',
      outcome: 'Preview how payroll summaries, history, and upgrade value fit into the workspace.',
      steps: ['Open payroll workspace', 'Review summary cards', 'Check processed periods or slips', 'Use billing when module is locked'],
    },
  ]);
  readonly selfServiceTabs = computed<ModuleTab[]>(() => {
    return this.workspaceCatalog
      .getSectionViews(this.currentUser() ?? this.authService.getStoredUser(), 'self-service', {
        includeLocked: true,
      })
      .map((module) => ({
        label: module.label,
        route: module.route,
        accent: module.accent ?? 'bg-slate-400',
        isLocked: module.isLocked,
        description: module.description,
        lockReason: module.lockReason,
      }));
  });
  readonly adminTabs = computed<ModuleTab[]>(() => {
    return ['people', 'system'].flatMap((sectionId) =>
      this.workspaceCatalog
        .getSectionViews(this.currentUser() ?? this.authService.getStoredUser(), sectionId, {
          includeLocked: true,
        })
        .map((module) => ({
          label: module.label,
          route: module.route,
          accent: module.accent ?? 'bg-slate-400',
          isLocked: module.isLocked,
          description: module.description,
          lockReason: module.lockReason,
        })),
    );
  });
  readonly activeAddons = computed(() => this.addonLauncherItems().filter((item) => item.isActive).slice(0, 4));
  readonly lockedAddons = computed(() => this.addonLauncherItems().filter((item) => !item.isActive).slice(0, 4));
  readonly featuredLauncherAddons = computed(() => {
    if (this.addonPanelMode() === 'active') {
      return this.activeAddons();
    }
    if (this.addonPanelMode() === 'learn') {
      return this.lockedAddons().length > 0 ? this.lockedAddons() : this.activeAddons();
    }
    return [...this.activeAddons(), ...this.lockedAddons()].slice(0, 4);
  });

  ngOnInit() {
    this.currentPath.set(this.router.url || '/');
    this.currentUser.set(this.authService.getStoredUser());
    this.permissionService.syncForUser(this.currentUser());
    this.updateRoleLabel(this.currentUser()?.roleId);
    
    this.router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd)).subscribe((event) => {
      this.currentPath.set(event.urlAfterRedirects || event.url || '/');
      this.closeAll();
    });

    // Subscribe to user$ observable to get the latest user data reactively from the store
    this.user$.subscribe(user => {
      if (user) {
        this.currentUser.set(user);
        this.permissionService.syncForUser(user);
        this.updateRoleLabel(user.roleId);
      }
    });

    this.notifService.getNotifications().subscribe();
    this.loadSearchData();
    this.searchResults.set(this.getVisibleQuickLinks().slice(0, 6));
    this.loadUserDesignation();
    this.loadAddonLauncher();
    this.subscriptionService.getStatus().subscribe({
      next: (status) => this.subscriptionStatus.set(status),
      error: () => this.subscriptionStatus.set(null),
    });
  }

  private updateRoleLabel(roleId?: number) {
    switch (roleId) {
      case 1: 
        this.userRoleLabel.set('Super Admin');
        break;
      case 2: 
        this.userRoleLabel.set('Admin');
        break;
      case 3: 
        this.userRoleLabel.set('HR Manager');
        break;
      case 4:
        this.userRoleLabel.set('Manager');
        break;
      case 5:
        this.userRoleLabel.set('Employee');
        break;
      default: 
        this.userRoleLabel.set('Employee');
    }
  }

  private loadUserDesignation() {
    const user = this.currentUser() ?? this.authService.getStoredUser();
    if (user?.designationId) {
      this.organizationService.getDesignations().subscribe({
        next: (designations) => {
          const designation = designations.find(d => d.id === user.designationId);
          if (designation) {
            this.userDesignation.set(designation.name);
          }
        },
        error: () => {
          // Silently handle error
        }
      });
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent) {
    const key = event.key.toLowerCase();
    if ((event.ctrlKey || event.metaKey) && key === 'k') {
      event.preventDefault();
      this.openSearch();
      return;
    }
    if (key === 'escape') {
      this.closeAll();
    }
  }

  private loadSearchData() {
    const canSearchEmployees = this.permissionService.hasPermission(this.currentUser(), 'search.employees');
    const canSearchProjects = this.permissionService.hasPermission(this.currentUser(), 'search.projects');

    forkJoin({
      employees: canSearchEmployees
        ? this.employeeService.getEmployees().pipe(catchError(() => of([] as User[])))
        : of([] as User[]),
      projects: canSearchProjects
        ? this.projectService.getProjects().pipe(catchError(() => of([] as Project[])))
        : of([] as Project[])
    }).subscribe(({ employees, projects }) => {
      this.employeeCache.set(employees);
      this.projectCache.set(projects);
    });
  }

  openSearch() {
    if (!this.canUseSearch()) return;
    this.showDropdown = false;
    this.showNotifications.set(false);
    this.showModuleSwitcher.set(false);
    this.showAddonsPanel.set(false);
    this.showSearchPanel.set(true);
    if (!this.searchQuery().trim()) {
      this.searchResults.set(this.getVisibleQuickLinks().slice(0, 8));
    }
  }

  onSearchInput(value: string) {
    this.searchQuery.set(value);
    this.showSearchPanel.set(true);
    const query = value.trim().toLowerCase();
    const visibleQuickLinks = this.getVisibleQuickLinks();
    if (!query) {
      this.searchResults.set(visibleQuickLinks.slice(0, 8));
      return;
    }

    const links = visibleQuickLinks
      .filter((item) => (item.title + ' ' + item.subtitle).toLowerCase().includes(query))
      .slice(0, 6);

    const employees = this.employeeCache()
      .filter((emp) =>
        `${emp.firstName || ''} ${emp.lastName || ''} ${emp.email || ''}`.toLowerCase().includes(query)
      )
      .slice(0, 6)
      .map((emp) => ({
        title: `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.email,
        subtitle: emp.email,
        route: '/employees',
        category: 'Employee' as const,
        tone: 'bg-blue-50 text-blue-700'
      }));

    const projects = this.projectCache()
      .filter((project) =>
        `${project.name || ''} ${project.description || ''}`.toLowerCase().includes(query)
      )
      .slice(0, 6)
      .map((project) => ({
        title: project.name,
        subtitle: project.description || 'Project',
        route: '/projects',
        category: 'Project' as const,
        tone: 'bg-purple-50 text-purple-700'
      }));

    this.searchResults.set([...links, ...employees, ...projects].slice(0, 12));
  }

  goToSearchResult(route: string) {
    this.closeAll();
    this.router.navigateByUrl(route);
  }

  openLockedModule(module: ModuleTab) {
    this.closeAll();
    this.router.navigateByUrl('/billing');
  }

  toggleAddonsPanel() {
    this.showSearchPanel.set(false);
    this.showDropdown = false;
    this.showNotifications.set(false);
    this.showModuleSwitcher.set(false);
    this.addonPanelMode.set('all');
    this.showAddonsPanel.update((value) => !value);
  }

  toggleModuleSwitcher() {
    this.showSearchPanel.set(false);
    this.showDropdown = false;
    this.showNotifications.set(false);
    this.showAddonsPanel.set(false);
    this.showModuleSwitcher.update((value) => !value);
  }

  toggleNotifications() {
    if (!this.canViewNotifications()) return;
    this.showSearchPanel.set(false);
    this.showDropdown = false;
    this.showModuleSwitcher.set(false);
    this.showAddonsPanel.set(false);
    this.showNotifications.update(v => !v);
  }

  markRead(id: number) {
    this.notifService.markAsRead(id).subscribe();
  }

  markAllRead() {
    this.notifService.markAllAsRead().subscribe();
  }

  closeAll() {
    this.showDropdown = false;
    this.showNotifications.set(false);
    this.showSearchPanel.set(false);
    this.showModuleSwitcher.set(false);
    this.showAddonsPanel.set(false);
  }

  activeAddonCount(): number {
    return this.addonLauncherItems().filter((item) => item.isActive).length;
  }

  lockedAddonCount(): number {
    return this.addonLauncherItems().filter((item) => !item.isActive).length;
  }

  openAddonLauncherItem(addon: AddonLauncherItem) {
    this.closeAll();
    if (addon.isActive) {
      if (!this.canAccess(addon.route)) {
        this.router.navigateByUrl(`/add-ons/guide/${addon.slug}`);
        return;
      }
      this.router.navigateByUrl(addon.route);
      return;
    }

    this.router.navigate(['/billing'], {
      queryParams: {
        source: 'addon',
        addon: addon.slug,
        mode: 'upgrade',
      },
    });
  }

  openGuideTarget(guide: GuidePreview) {
    this.closeAll();
    this.router.navigateByUrl(`/add-ons/guide/${guide.addonSlug}`);
  }

  openGuideBilling(guide: GuidePreview) {
    this.closeAll();
    this.router.navigate(['/billing'], {
      queryParams: {
        source: 'guide',
        addon: guide.addonSlug,
        mode: 'upgrade',
      },
    });
  }

  watchGuideDemo(guide: GuidePreview) {
    this.closeAll();
    this.router.navigateByUrl(`/add-ons/guide/${guide.addonSlug}`);
  }

  canAccess(route: string): boolean {
    const user = this.currentUser() ?? this.authService.getStoredUser();
    return this.permissionService.canAccessRoute(user, route);
  }

  canViewNotifications(): boolean {
    const user = this.currentUser() ?? this.authService.getStoredUser();
    return this.permissionService.hasPermission(user, 'notifications.view');
  }

  canUseSearch(): boolean {
    return this.getVisibleQuickLinks().length > 0;
  }

  activeModuleAccent(): string {
    const currentRoute = this.currentPath();
    const allTabs = [...this.selfServiceTabs(), ...this.adminTabs()];
    return allTabs.find((module) => this.isActiveRoute(module.route) || currentRoute.startsWith(module.route))
      ?.accent ?? 'bg-slate-400';
  }

  activeWorkspaceLabel(): string {
    const currentRoute = this.currentPath();
    const allTabs = [...this.selfServiceTabs(), ...this.adminTabs()];
    return allTabs.find((module) => this.isActiveRoute(module.route) || currentRoute.startsWith(module.route))
      ?.label ?? 'Workspace';
  }

  currentDateLabel(): string {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }

  billingChipLabel(): string {
    const status = this.subscriptionStatus();
    if (!status) return 'Billing';
    if (status.organization.readOnlyMode) return 'Billing Locked';
    if (status.organization.isTrialActive) {
      const days = Math.max(0, status.trialDaysRemaining ?? 0);
      return `${days}d Trial Left`;
    }
    return status.plan?.name ? `${status.plan.name} Active` : 'Billing Active';
  }

  billingChipTone(): string {
    const status = this.subscriptionStatus();
    if (status?.organization.readOnlyMode) {
      return 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100';
    }
    if (status?.organization.isTrialActive) {
      return 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100';
    }
    return 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100';
  }

  billingDotTone(): string {
    const status = this.subscriptionStatus();
    if (status?.organization.readOnlyMode) return 'bg-rose-500';
    if (status?.organization.isTrialActive) return 'bg-amber-500';
    return 'bg-emerald-500';
  }

  userInitial(): string {
    const user = this.currentUser() ?? this.authService.getStoredUser();
    return (user?.firstName?.charAt(0) || user?.email?.charAt(0) || 'U').toUpperCase();
  }

  headerKicker(): string {
    if (this.currentPath() === '/' || this.currentPath() === '/dashboard' || this.currentPath() === '/self-service') {
      const roleId = this.getRoleId();
      if (roleId === 1 || roleId === 2) return 'Operations Command Center';
      if (roleId === 3 || roleId === 4) return 'Team Workspace';
      return 'Self-Service Workspace';
    }
    return 'HR Workspace';
  }

  headerTitle(): string {
    const path = this.currentPath();
    if (path === '/' || path === '/dashboard' || path === '/self-service') {
      return 'Dashboard';
    }
    if (path.startsWith('/employees')) return 'Employee Management';
    if (path.startsWith('/attendance')) return 'Attendance Hub';
    if (path.startsWith('/leaves')) return 'Leave Workspace';
    if (path.startsWith('/reports')) return 'Reports and Insights';
    if (path.startsWith('/projects')) return 'Projects';
    if (path.startsWith('/payroll')) return 'Payroll Center';
    if (path.startsWith('/expenses')) return 'Expense Claims';
    if (path.startsWith('/timesheets')) return 'Timesheets';
    if (path.startsWith('/settings') || path.startsWith('/admin')) return 'Administration';
    return 'HRMS Workspace';
  }

  headerSubtitle(): string {
    const path = this.currentPath();
    if (path === '/' || path === '/dashboard' || path === '/self-service') {
      const roleId = this.getRoleId();
      if (roleId === 1 || roleId === 2) {
          return 'Monitor workforce operations, approvals, compliance, and system controls from one workspace.';
      }
      if (roleId === 3 || roleId === 4) {
          return 'Track team attendance, review requests, and keep daily operations close at hand.';
      }
        return 'Access attendance, leave, profile, and daily self-service tools from one dashboard.';
    }
    if (path.startsWith('/employees')) return 'Maintain employee records, invitations, and profile updates.';
    if (path.startsWith('/attendance')) return 'Track clock-ins, review regularization, and monitor live status.';
    if (path.startsWith('/leaves')) return 'Manage balances, requests, approvals, and holiday planning.';
    if (path.startsWith('/reports')) return 'Review trends, exports, and operational insights.';
    if (path.startsWith('/settings') || path.startsWith('/admin')) return 'Control permissions, policies, documents, and system settings.';
    return 'Everything important stays organized, fast, and easier to operate.';
  }

  roleLabel(): string {
    // First try to get from observable, then fallback to stored user
    let roleId: number | undefined;
    
    // Subscribe synchronously to get current value
    this.user$.subscribe(user => {
      if (user) {
        roleId = user.roleId;
      }
    }).unsubscribe();
    
    // Fallback to stored user if not found in store
    if (!roleId) {
      const storedUser = this.authService.getStoredUser();
      roleId = storedUser?.roleId;
    }
    
    switch (roleId) {
      case 1: return 'Super Admin';
      case 2: return 'Admin';
      case 3: return 'HR Manager';
      case 4: return 'Manager';
      case 5: return 'Employee';
      default: return 'Employee';
    }
  }

  private getRoleId(): number | undefined {
    return this.currentUser()?.roleId ?? this.authService.getStoredUser()?.roleId;
  }

  isActiveRoute(route: string): boolean {
    const currentPath = this.currentPath();
    if (route === '/dashboard') {
      return currentPath === '/' || currentPath === '/dashboard' || currentPath === '/self-service';
    }
    if (route === '/settings') {
      return currentPath.startsWith('/settings') || currentPath.startsWith('/admin');
    }
    return currentPath === route || currentPath.startsWith(`${route}/`);
  }

  private getVisibleQuickLinks(): SearchResult[] {
    return this.workspaceCatalog
      .getAllViews(this.currentUser() ?? this.authService.getStoredUser())
      .map((item) => ({
        title: item.label,
        subtitle: item.description ?? 'Workspace module',
        route: item.route,
        category: 'Quick Link' as const,
        tone: item.quickLinkTone ?? 'bg-slate-100 text-slate-700',
      }));
  }

  private loadAddonLauncher() {
    this.organizationService.getAddons().pipe(catchError(() => of([] as any[]))).subscribe((addons) => {
      this.addonLauncherItems.set((addons || []).map((addon) => this.toAddonLauncherItem(addon)));
    });
  }

  private toAddonLauncherItem(raw: any): AddonLauncherItem {
    const slug = String(raw?.slug ?? raw?.name ?? '').trim().toLowerCase();
    return {
      id: Number(raw?.id ?? 0),
      name: String(raw?.name ?? 'Add-on'),
      slug,
      description: String(raw?.description ?? `Open ${raw?.name ?? 'module'} workspace or review upgrade journey.`),
      route: this.addonRouteFor(slug),
      isActive: Boolean(raw?.isActive),
      accent: Boolean(raw?.isActive) ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700',
    };
  }

  private addonRouteFor(slug: string): string {
    const routes: Record<string, string> = {
      analytics: '/reports',
      payroll: '/payroll',
      geofence: '/admin/geofence',
      'face-recognition': '/face-registration',
      face_recognition: '/face-registration',
      'visitor-management': '/visit-management',
      visitor_management: '/visit-management',
      visitormanagement: '/visit-management',
      attendance: '/attendance',
      leave: '/leaves',
      leaves: '/leaves',
      projects: '/projects',
      expenses: '/expenses',
      timesheets: '/timesheets',
    };

    return routes[slug] ?? '/add-ons';
  }

  private normalizeAddonKey(value: string): string {
    return (value || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
  }

  logout() {
    if (this.loggingOut()) return;
    this.loggingOut.set(true);
    this.showDropdown = false;
    const token = this.authService.getStoredToken();
    this.authService.clearAuthStorage();
    this.store.dispatch(AuthActions.logout());
    this.router.navigateByUrl('/auth/login', { replaceUrl: true });
    this.authService.logout(token).subscribe({
      next: () => this.loggingOut.set(false),
      error: () => this.loggingOut.set(false)
    });
  }
}
