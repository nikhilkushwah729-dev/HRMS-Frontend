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
    <div class="flex h-full flex-col overflow-hidden rounded-[2.5rem] bg-white shadow-sm ring-1 ring-slate-100 transition-all hover:shadow-2xl hover:shadow-slate-200/40">
      <div class="flex flex-col shrink-0 gap-4 p-8 border-b border-slate-50 bg-slate-50/20 sm:flex-row sm:items-center justify-between">
        <div class="flex items-center gap-4">
           <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
             <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/><path d="m2 8 10-6 10 6v10"/><path d="m2 8 10 6 10-6"/><path d="M12 22v-8"/></svg>
           </div>
           <div>
             <h2 class="text-2xl font-black text-slate-900 tracking-tight">{{ t('selfService.workflow.title') }}</h2>
             <p class="text-sm font-bold text-slate-500 mt-1">{{ t('selfService.workflow.subtitle') }}</p>
           </div>
        </div>
      </div>

      <div class="flex-1 p-8 overflow-y-auto custom-scrollbar">
        <div class="space-y-4">
          @for (workflow of workflows(); track workflow.key) {
            <button
              type="button"
              (click)="navigate.emit(workflow.route)"
              class="group flex w-full flex-col rounded-[2rem] bg-slate-50 p-6 transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/40 ring-1 ring-transparent hover:ring-slate-100"
            >
              <div class="flex w-full items-start justify-between">
                 <div class="flex-1">
                    <h3 class="text-lg font-black text-slate-900 transition-colors group-hover:text-emerald-600">{{ workflow.title }}</h3>
                    <p class="mt-2 text-sm font-bold text-slate-500 line-clamp-2">{{ workflow.description }}</p>
                 </div>
                 <span class="ml-4 rounded-xl bg-white px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 shadow-sm ring-1 ring-slate-100">
                    {{ workflow.badge }}
                 </span>
              </div>
              
              <div class="mt-6 flex w-full items-center justify-between border-t border-slate-200/50 pt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                 <span class="text-[10px] font-black uppercase tracking-widest text-slate-400">Manage Workflow</span>
                 <div class="h-8 w-8 flex items-center justify-center rounded-xl bg-slate-900 text-white shadow-lg transition-transform group-hover:scale-110">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                 </div>
              </div>
            </button>
          }

          @if (workflows().length === 0) {
            <div class="flex h-full flex-col items-center justify-center text-center py-10">
               <div class="mb-6 h-16 w-16 flex items-center justify-center rounded-3xl bg-slate-50 text-slate-300">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
               </div>
               <p class="text-sm font-bold text-slate-400">{{ t('selfService.workflow.emptyTitle') }}</p>
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
