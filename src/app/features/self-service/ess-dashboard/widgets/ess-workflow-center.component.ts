import { Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../../../../core/services/language.service';

export interface WorkflowCenterCard {
  key: string;
  title: string;
  description: string;
  route: string;
  tone: string;
  badge: string;
}

@Component({
  selector: 'app-ess-workflow-center',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="app-glass-card h-full flex flex-col ring-1 ring-slate-100 hover:ring-indigo-100 transition-all shadow-sm hover:shadow-2xl overflow-hidden rounded-md">
      <div class="flex items-center gap-3 border-b border-slate-100 bg-slate-50/40 p-4 sm:gap-4 sm:p-5">
        <div class="flex h-10 w-10 items-center justify-center rounded-md bg-indigo-50 text-indigo-600 shadow-sm ring-1 ring-indigo-100/50 sm:h-11 sm:w-11">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/><path d="m2 8 10-6 10 6v10"/><path d="m2 8 10 6 10-6"/><path d="M12 22v-8"/></svg>
        </div>
        <div class="min-w-0">
          <h2 class="text-base font-black leading-none tracking-tight text-slate-900 sm:text-lg">{{ t('selfService.workflow.title') }}</h2>
          <p class="mt-1.5 text-[10px] font-medium uppercase tracking-wider text-slate-500 opacity-70">{{ t('selfService.workflow.subtitle') }}</p>
        </div>
      </div>
      <div class="flex flex-1 shrink-0 flex-col justify-center p-4 sm:p-4 lg:p-5">
        <div class="mb-4 rounded-md border border-slate-200 bg-white/80 px-4 py-3 shadow-sm">
          <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{{ t('selfService.workflow.title') }}</p>
          <p class="mt-1 text-sm font-medium text-slate-500">{{ t('selfService.workflow.subtitle') }}</p>
        </div>
        <div class="grid gap-3">
          @for (workflow of workflows(); track workflow.key) {
            <button
              type="button"
              (click)="navigate.emit(workflow.route)"
              class="group flex h-full flex-col rounded-md border border-slate-100 bg-white p-4 text-left ring-1 ring-slate-100 transition-all hover:-translate-y-1 hover:border-indigo-300 hover:ring-indigo-300 hover:shadow-2xl sm:p-4 lg:p-5"
              [ngClass]="workflow.tone"
            >
              <div class="flex items-start justify-between gap-4 sm:gap-6">
                <div class="min-w-0">
                  <h3 class="text-sm font-black tracking-tight text-slate-900 transition-colors group-hover:text-indigo-600 sm:text-base">{{ workflow.title }}</h3>
                  <p class="mt-2 text-[13px] font-medium leading-relaxed text-slate-500 transition-colors group-hover:text-slate-600 sm:text-sm">{{ workflow.description }}</p>
                </div>
                <div class="shrink-0">
                  <span class="rounded-full bg-white/90 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 shadow-sm ring-1 ring-slate-200 sm:px-4">
                    {{ workflow.badge }}
                  </span>
                </div>
              </div>
              <div class="mt-4 flex items-center justify-between border-t border-white/70 pt-3 sm:pt-4">
                <div class="text-[10px] font-black uppercase tracking-widest text-indigo-600 opacity-0 transition-all translate-x-[-10px] group-hover:translate-x-0 group-hover:opacity-100">
                  {{ t('selfService.workflow.accessModule') }}
                </div>
                <div class="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-400 shadow-sm transition-all group-hover:bg-indigo-600 group-hover:text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </div>
              </div>
            </button>
          }

          @if (workflows().length === 0) {
            <div class="flex flex-col items-center justify-center rounded-md border border-dashed border-slate-200 bg-slate-50/70 p-10 text-center">
              <div class="h-16 w-16 items-center justify-center rounded-md bg-white text-slate-400 shadow-sm mb-6 flex"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>
              <p class="text-sm font-black text-slate-700">{{ t('selfService.workflow.emptyTitle') }}</p>
              <p class="mt-2 text-sm text-slate-500 max-w-xs">{{ t('selfService.workflow.emptySubtitle') }}</p>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
  `]
})
export class EssWorkflowCenterComponent {
  private languageService = inject(LanguageService);
  workflows = input<WorkflowCenterCard[]>([]);
  navigate = output<string>();
  readonly t = (key: string, params?: Record<string, string | number | null | undefined>) =>
    this.languageService.t(key, params);
}
