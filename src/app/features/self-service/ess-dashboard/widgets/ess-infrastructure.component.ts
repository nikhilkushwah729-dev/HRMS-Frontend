import { Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

export interface ModuleCard {
  key: string;
  name: string;
  icon: string;
  route: string;
  description: string;
  color: string;
  locked?: boolean;
}

@Component({
  selector: 'app-ess-infrastructure',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col h-full overflow-hidden">
      <div class="mb-8 flex items-center gap-5">
        <div class="flex h-14 w-14 items-center justify-center rounded-md bg-indigo-50/50 text-indigo-600 shadow-sm ring-1 ring-indigo-100 backdrop-blur-md">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.1 6.27a2 2 0 0 0 0 3.66l9.07 4.09a2 2 0 0 0 1.66 0l9.07-4.09a2 2 0 0 0 0-3.66Z"/><path d="m2.1 11.74 9.07 4.09a2 2 0 0 0 1.66 0l9.07-4.09"/><path d="m2.1 16.81 9.07 4.09a2 2 0 0 0 1.66 0l9.07-4.09"/></svg>
        </div>
        <div>
          <h2 class="text-xl font-black text-slate-900 tracking-tight leading-none">Infrastructure</h2>
          <p class="text-xs font-medium text-slate-500 mt-2">Authorized HRMS modules and organizational tools.</p>
        </div>
      </div>
      
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        @for (module of modules(); track module.key) {
          <button (click)="navigate.emit(module.route)" class="group relative flex flex-col rounded-md border border-slate-100 bg-white p-6 transition-all hover:-translate-y-1 hover:border-indigo-200 hover:shadow-2xl ring-1 ring-slate-200/50 hover:ring-indigo-300 backdrop-blur-sm h-full">
            <div class="flex items-center justify-between gap-4 mb-6">
              <div class="h-16 w-16 rounded-md bg-indigo-50/40 p-4 text-indigo-600 transition-all group-hover:bg-indigo-600 group-hover:text-white ring-4 ring-white shadow-md flex items-center justify-center backdrop-blur-sm">
                <div class="h-10 w-10" [innerHTML]="getIcon(module.key)"></div>
              </div>
              <span class="rounded-full bg-slate-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-500 transition-colors border border-slate-100">
                {{ contextLabel(module.key) }}
              </span>
            </div>
            
            <div class="flex-1 min-w-0">
              <h3 class="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors truncate">{{ module.name }}</h3>
              <p class="mt-2 text-sm leading-relaxed text-slate-500 group-hover:text-slate-600 transition-colors line-clamp-2">{{ module.description }}</p>
            </div>
            
            <div class="flex h-10 w-10 items-center justify-center rounded-md bg-slate-50 text-slate-400 opacity-0 transition-all group-hover:bg-indigo-600 group-hover:text-white group-hover:opacity-100 shadow-sm">
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>

            <!-- Locked Premium Overlay (Faded) -->
            @if (module.locked) {
              <button
                type="button"
                (click)="$event.stopPropagation(); navigate.emit('/billing')"
                class="absolute inset-0 z-20 rounded-md bg-gradient-to-t from-white via-white/90 to-transparent flex flex-col items-center justify-end pb-8 pointer-events-auto"
              >
                 <div class="flex items-center gap-2.5 rounded-full bg-slate-900 px-5 py-2.5 text-white shadow-2xl ring-4 ring-white/50 transform transition-transform group-hover:scale-105">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    <span class="text-[10px] font-black uppercase tracking-[0.15em]">Upgrade Required</span>
                 </div>
              </button>
            }
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; width: 100%; }
  `]
})
export class EssInfrastructureComponent {
  private sanitizer = inject(DomSanitizer);
  modules = input<ModuleCard[]>([]);
  navigate = output<string>();

  contextLabel(key: string): string {
    if (['employees', 'profile', 'documents'].includes(key)) return 'People Ops';
    if (['attendance', 'regularization', 'team'].includes(key)) return 'Attendance';
    if (['leaves', 'payroll', 'expenses'].includes(key)) return 'Workforce';
    if (['projects', 'timesheets', 'reports'].includes(key)) return 'Productivity';
    if (['admin', 'roles', 'audit', 'geofence'].includes(key)) return 'Admin Control';
    return 'Workspace';
  }

  getIcon(kind: string): SafeHtml {
    const icons: Record<string, string> = {
      dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="11" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M14 16h7M14 20h4"/></svg>',
      attendance: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/><path d="m9 16 2 2 4-4"/></svg>',
      leaves: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 22c6 0 10-3 14-8 2-3 4-8 6-12-6 0-10 3-14 8-2 3-4 8-6 12Z"/><path d="M12 12c.5-1.5 2.5-1.5 3 0s-1 3.5-3 3.5-3.5-2.5-0-3.5Z"/></svg>',
      reports: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>',
      projects: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 7h-7l-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z"/><path d="M3 11h18"/></svg>',
      expenses: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M12 15V9"/><path d="m9 12 3-3 3 3"/></svg>',
      payroll: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
      admin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="4"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16" r="1.5"/></svg>',
      roles: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><circle cx="12" cy="12" r="3"/><path d="M12 15v2"/></svg>',
      geofence: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><circle cx="12" cy="12" r="3"/></svg>',
      audit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3h8l5 5v13H3V3z"/><path d="M8 3v5h5"/><path d="m9 14 2 2 4-4"/></svg>',
      documents: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>',
      regularization: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/><path d="M3.5 12a8.5 8.5 0 1 1 1.7 5"/></svg>',
      team: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 5 2.87"/></svg>',
      timesheets: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18"/><path d="M9 14h6"/><path d="M9 18h4"/></svg>',
      settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
      benefit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><path d="M12 15v2"/><path d="M10 17h4"/></svg>',
      help: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>',
      notifications: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>',
      learning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>',
      profile: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M6.5 19a8 8 0 0 1 11 0"/></svg>',
      employees: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M6.5 19a8 8 0 0 1 11 0"/></svg>',
      announcements: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>',
      spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
    };

    return this.sanitizer.bypassSecurityTrustHtml(icons[kind] || icons['spark']);
  }
}
