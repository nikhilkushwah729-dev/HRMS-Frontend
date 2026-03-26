import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { VisitManagementService } from '../../core/services/visit-management.service';
import { Visitor } from '../../core/services/visit-management.service';

@Component({
  selector: 'app-visit-management',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="max-w-7xl mx-auto p-6 space-y-8">
      <header class="app-module-hero flex flex-col xl:flex-row xl:items-end xl:justify-between gap-5">
        <div class="max-w-2xl">
          <p class="app-module-kicker">Visitor Operations</p>
          <h1 class="app-module-title mt-3">Reception, check-in, and visitor flow</h1>
          <p class="app-module-text mt-3">Manage invites, active visitors, check-ins, and front-desk movement with a dedicated visit-management workspace.</p>
        </div>
        <div class="flex flex-col gap-3 xl:items-end">
          <div class="app-module-highlight min-w-[240px]">
            <span class="app-module-highlight-label">Navigation</span>
            <div class="app-module-highlight-value mt-3">4 zones</div>
            <p class="mt-2 text-sm text-white/80">Dashboard, active visitors, check-in flow, and invite management stay grouped together.</p>
          </div>
          <a routerLink="add-visitors" routerLinkActive="bg-primary-600 text-white" class="btn-primary px-6 py-3 font-bold rounded-md">
            + Add Visitor
          </a>
        </div>
      </header>

      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <div class="lg:col-span-1">
          <nav class="app-surface-card p-2 space-y-1">
            <a routerLink="." routerLinkActive="bg-primary-50 text-primary-600 font-bold" class="flex items-center gap-3 px-4 py-3 rounded-md">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
              Dashboard
            </a>
            <a routerLink="active-visitors" routerLinkActive="bg-primary-50 text-primary-600 font-bold" class="flex items-center gap-3 px-4 py-3 rounded-md">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
              </svg>
              Active Visitors
            </a>
            <a routerLink="check-in-out" routerLinkActive="bg-primary-50 text-primary-600 font-bold" class="flex items-center gap-3 px-4 py-3 rounded-md">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Check In/Out
            </a>
            <a routerLink="invite-visitors" routerLinkActive="bg-primary-50 text-primary-600 font-bold" class="flex items-center gap-3 px-4 py-3 rounded-md">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
              Invite Visitors
            </a>
          </nav>
        </div>

        <div class="lg:col-span-3">
          <router-outlet></router-outlet>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card {
      @apply bg-white rounded-md border border-slate-200 shadow-sm;
    }
    .btn-primary {
      @apply bg-primary-600 text-white hover:bg-primary-700 transition-colors font-semibold;
    }
  `]
})
export class VisitManagementComponent {
  visitService = inject(VisitManagementService);
}
