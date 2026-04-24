import { Component, input, output, signal, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { LanguageService } from '../../../../core/services/language.service';

export interface WorkbenchProject {
  id: number;
  name: string;
  progress: number;
  statusLabel: string;
  deadline: string | null;
  teamSize: number;
}

export interface WorkbenchTimesheet {
  id: number;
  projectName: string;
  workDate: string;
  hours: number;
  description: string;
  status: string;
}

@Component({
  selector: 'app-ess-workbench',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="flex h-full flex-col overflow-hidden rounded-[2.5rem] bg-white shadow-sm ring-1 ring-slate-100 transition-all hover:shadow-2xl hover:shadow-slate-200/40">
      <div class="flex flex-col shrink-0 gap-6 p-8 border-b border-slate-50 bg-slate-50/20 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 class="text-2xl font-black text-slate-900 tracking-tight">{{ t('selfService.workbench.title') }}</h2>
          <p class="text-sm font-bold text-slate-500 mt-1">{{ t('selfService.workbench.subtitle') }}</p>
        </div>
        <div class="flex items-center rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-slate-100">
          <button
            type="button"
            (click)="activeTab.set('projects')"
            [ngClass]="activeTab() === 'projects' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'"
            class="rounded-xl px-6 py-2 text-[11px] font-black uppercase tracking-widest transition-all"
          >
            {{ t('selfService.workbench.projects') }}
          </button>
          <button
            type="button"
            (click)="activeTab.set('timesheets')"
            [ngClass]="activeTab() === 'timesheets' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'"
            class="rounded-xl px-6 py-2 text-[11px] font-black uppercase tracking-widest transition-all"
          >
            {{ t('selfService.workbench.timesheets') }}
          </button>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4 border-b border-slate-50 p-8">
        <div class="rounded-3xl bg-slate-50 p-6 ring-1 ring-slate-100 transition-all hover:shadow-md">
          <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">{{ t('selfService.workbench.activeProjects') }}</p>
          <p class="mt-3 text-3xl font-black text-slate-900">{{ projects().length }}</p>
        </div>
        <div class="rounded-3xl bg-emerald-50 p-6 ring-1 ring-emerald-100/50 transition-all hover:shadow-md">
          <p class="text-[10px] font-black uppercase tracking-widest text-emerald-600">{{ t('selfService.workbench.loggedHours') }}</p>
          <p class="mt-3 text-3xl font-black text-slate-900">{{ totalTimesheetHours() }}h</p>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto p-8 custom-scrollbar">
        @if (activeTab() === 'projects') {
          <div class="space-y-4">
            @for (project of projects(); track project.id) {
              <button
                type="button"
                (click)="navigate.emit('/projects')"
                class="group flex w-full flex-col rounded-[2rem] bg-slate-50 p-6 transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/40 ring-1 ring-transparent hover:ring-slate-100"
              >
                <div class="flex w-full items-start justify-between">
                  <div>
                    <h3 class="text-lg font-black text-slate-900 transition-colors group-hover:text-emerald-600">{{ project.name }}</h3>
                    <div class="mt-3 flex flex-wrap gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      <span>{{ project.statusLabel }}</span>
                      <span>{{ t('selfService.workbench.teamCount', { count: project.teamSize }) }}</span>
                      @if (project.deadline) {
                        <span>{{ t('selfService.workbench.dueDate', { date: project.deadline }) }}</span>
                      }
                    </div>
                  </div>
                  <span class="rounded-xl bg-white px-4 py-1.5 text-[11px] font-black text-emerald-600 shadow-sm ring-1 ring-slate-100">
                    {{ project.progress }}%
                  </span>
                </div>
                <div class="mt-6 w-full h-3 overflow-hidden rounded-full bg-slate-200/50">
                  <div class="h-full rounded-full bg-emerald-500 transition-all duration-1000 group-hover:bg-emerald-600 shadow-[0_0_8px_rgba(16,185,129,0.4)]" [style.width.%]="project.progress"></div>
                </div>
              </button>
            }

            @if (projects().length === 0) {
              <div class="flex flex-col items-center justify-center p-10 text-center">
                 <div class="mb-6 h-16 w-16 flex items-center justify-center rounded-3xl bg-slate-50 text-slate-300">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v20"/><path d="M2 12h20"/><path d="m15 5 2-2 4 4"/><path d="m5 15-2 2 4 4"/></svg>
                 </div>
                 <p class="text-sm font-bold text-slate-400">{{ t('selfService.workbench.noProjects') }}</p>
                 <button (click)="navigate.emit('/projects')" class="mt-6 rounded-2xl bg-slate-900 px-8 py-3.5 text-[11px] font-black uppercase tracking-widest text-white hover:bg-emerald-600 transition-all">
                    {{ t('selfService.workbench.openProjects') }}
                 </button>
              </div>
            }
          </div>
        } @else {
          <div class="space-y-4">
            @for (timesheet of timesheets(); track timesheet.id) {
              <button
                type="button"
                (click)="navigate.emit('/timesheets')"
                class="group flex w-full items-start justify-between rounded-[2rem] bg-slate-50 p-6 transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/40 ring-1 ring-transparent hover:ring-slate-100"
              >
                <div class="min-w-0 flex-1 pr-6">
                  <h3 class="text-lg font-black text-slate-900 transition-colors group-hover:text-emerald-600">{{ timesheet.projectName }}</h3>
                  <p class="mt-2 text-sm font-bold text-slate-500 line-clamp-1">{{ timesheet.description }}</p>
                  <div class="mt-4 flex flex-wrap gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <span>{{ timesheet.workDate | date:'dd MMM yyyy' }}</span>
                    <span class="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-600">{{ timesheet.status }}</span>
                  </div>
                </div>
                <div class="flex flex-col items-end gap-2">
                   <span class="text-2xl font-black text-slate-900">{{ timesheet.hours }}h</span>
                   <span class="text-[9px] font-black uppercase tracking-widest text-slate-400">Duration</span>
                </div>
              </button>
            }

            @if (timesheets().length === 0) {
              <div class="flex flex-col items-center justify-center p-10 text-center">
                 <div class="mb-6 h-16 w-16 flex items-center justify-center rounded-3xl bg-slate-50 text-slate-300">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                 </div>
                 <p class="text-sm font-bold text-slate-400">{{ t('selfService.workbench.noTimesheets') }}</p>
                 <button (click)="navigate.emit('/timesheets')" class="mt-6 rounded-2xl bg-slate-900 px-8 py-3.5 text-[11px] font-black uppercase tracking-widest text-white hover:bg-emerald-600 transition-all">
                    {{ t('selfService.workbench.openTimesheets') }}
                 </button>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
  `]
})
export class EssWorkbenchComponent {
  private languageService = inject(LanguageService);
  projects = input<WorkbenchProject[]>([]);
  timesheets = input<WorkbenchTimesheet[]>([]);
  navigate = output<string>();

  activeTab = signal<'projects' | 'timesheets'>('projects');
  readonly t = (key: string, params?: Record<string, string | number | null | undefined>) =>
    this.languageService.t(key, params);

  totalTimesheetHours(): number {
    return this.timesheets().reduce((sum, entry) => sum + (Number(entry.hours) || 0), 0);
  }
}
