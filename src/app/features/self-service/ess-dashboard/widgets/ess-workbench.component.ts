import { Component, input, output, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';

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
    <div class="app-glass-card h-full flex flex-col overflow-hidden rounded-[32px] ring-1 ring-slate-100 shadow-sm transition-all hover:ring-indigo-100 hover:shadow-2xl">
      <div class="border-b border-slate-100 bg-slate-50/40 p-5">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-lg font-black tracking-tight text-slate-900">My Work</h2>
            <p class="mt-1.5 text-[10px] font-medium uppercase tracking-wider text-slate-500 opacity-70">Projects And Timesheets</p>
          </div>
          <div class="flex items-center rounded-2xl bg-slate-100/80 p-1.5 ring-1 ring-slate-200/50">
            <button
              type="button"
              (click)="activeTab.set('projects')"
              [ngClass]="activeTab() === 'projects' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
              class="rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all"
            >
              Projects
            </button>
            <button
              type="button"
              (click)="activeTab.set('timesheets')"
              [ngClass]="activeTab() === 'timesheets' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
              class="rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all"
            >
              Timesheets
            </button>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4 border-b border-slate-100 bg-slate-50/20 p-5">
        <div class="rounded-3xl border border-slate-100 bg-white p-4 ring-1 ring-slate-100/60">
          <p class="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Active Projects</p>
          <p class="mt-2 text-2xl font-black tracking-tight text-slate-900">{{ projects().length }}</p>
        </div>
        <div class="rounded-3xl border border-slate-100 bg-white p-4 ring-1 ring-slate-100/60">
          <p class="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Logged Hours</p>
          <p class="mt-2 text-2xl font-black tracking-tight text-slate-900">{{ totalTimesheetHours() }}h</p>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto p-5">
        @if (activeTab() === 'projects') {
          <div class="space-y-3">
            @for (project of projects(); track project.id) {
              <button
                type="button"
                (click)="navigate.emit('/projects')"
                class="group flex w-full items-start justify-between rounded-[28px] border border-slate-100 bg-white p-5 text-left shadow-sm ring-1 ring-slate-100/60 transition-all hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl"
              >
                <div class="min-w-0">
                  <p class="text-sm font-black text-slate-900 transition-colors group-hover:text-indigo-600">{{ project.name }}</p>
                  <div class="mt-2 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    <span>{{ project.statusLabel }}</span>
                    <span>Team {{ project.teamSize }}</span>
                    @if (project.deadline) {
                      <span>Due {{ project.deadline }}</span>
                    }
                  </div>
                  <div class="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div class="h-full rounded-full bg-gradient-to-r from-indigo-500 to-sky-500" [style.width.%]="project.progress"></div>
                  </div>
                </div>
                <span class="ml-4 rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-indigo-600">
                  {{ project.progress }}%
                </span>
              </button>
            }

            @if (projects().length === 0) {
              <div class="flex min-h-[220px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center">
                <p class="text-sm font-black text-slate-700">No active projects yet</p>
                <p class="mt-2 max-w-xs text-sm leading-6 text-slate-500">Project assignments and milestones will appear here when your workspace gets mapped.</p>
                <button type="button" (click)="navigate.emit('/projects')" class="mt-5 rounded-2xl bg-slate-900 px-5 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-indigo-600">
                  Open Projects
                </button>
              </div>
            }
          </div>
        } @else {
          <div class="space-y-3">
            @for (timesheet of timesheets(); track timesheet.id) {
              <button
                type="button"
                (click)="navigate.emit('/timesheets')"
                class="group flex w-full items-start justify-between rounded-[28px] border border-slate-100 bg-white p-5 text-left shadow-sm ring-1 ring-slate-100/60 transition-all hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl"
              >
                <div class="min-w-0">
                  <p class="text-sm font-black text-slate-900 transition-colors group-hover:text-emerald-600">{{ timesheet.projectName }}</p>
                  <p class="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{{ timesheet.description }}</p>
                  <div class="mt-3 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    <span>{{ timesheet.workDate | date:'dd MMM yyyy' }}</span>
                    <span>{{ timesheet.status }}</span>
                  </div>
                </div>
                <span class="ml-4 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600">
                  {{ timesheet.hours }}h
                </span>
              </button>
            }

            @if (timesheets().length === 0) {
              <div class="flex min-h-[220px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center">
                <p class="text-sm font-black text-slate-700">No timesheets logged yet</p>
                <p class="mt-2 max-w-xs text-sm leading-6 text-slate-500">Daily worklogs will show here once entries are submitted from the timesheet module.</p>
                <button type="button" (click)="navigate.emit('/timesheets')" class="mt-5 rounded-2xl bg-slate-900 px-5 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-emerald-600">
                  Open Timesheets
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
  projects = input<WorkbenchProject[]>([]);
  timesheets = input<WorkbenchTimesheet[]>([]);
  navigate = output<string>();

  activeTab = signal<'projects' | 'timesheets'>('projects');

  totalTimesheetHours(): number {
    return this.timesheets().reduce((sum, entry) => sum + (Number(entry.hours) || 0), 0);
  }
}
