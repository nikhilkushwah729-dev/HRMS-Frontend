import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

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
    <div class="app-glass-card h-full flex flex-col ring-1 ring-slate-100 hover:ring-indigo-100 transition-all shadow-sm hover:shadow-2xl overflow-hidden rounded-[32px]">
      <div class="border-b border-slate-100 bg-slate-50/40 p-5 flex items-center gap-4">
        <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-sm ring-1 ring-indigo-100/50">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/><path d="m2 8 10-6 10 6v10"/><path d="m2 8 10 6 10-6"/><path d="M12 22v-8"/></svg>
        </div>
        <div>
          <h2 class="text-lg font-black text-slate-900 tracking-tight leading-none">Approvals & Actions</h2>
          <p class="text-[10px] font-medium text-slate-500 mt-1.5 uppercase tracking-wider opacity-70">Role Based Operations</p>
        </div>
      </div>
      <div class="flex-1 p-6 flex flex-col justify-center shrink-0">
        <div class="grid gap-4">
          @for (workflow of workflows(); track workflow.key) {
            <button
              type="button"
              (click)="navigate.emit(workflow.route)"
              class="group rounded-[32px] border border-slate-100 p-6 text-left transition-all hover:-translate-y-1 hover:border-indigo-300 hover:shadow-2xl ring-1 ring-slate-100 hover:ring-indigo-300 bg-white flex flex-col h-full"
              [ngClass]="workflow.tone"
            >
              <div class="flex items-start justify-between gap-6">
                <div class="min-w-0">
                  <h3 class="text-base font-black tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors truncate">{{ workflow.title }}</h3>
                  <p class="mt-2 text-sm font-medium leading-relaxed text-slate-500 group-hover:text-slate-600 transition-colors line-clamp-2">{{ workflow.description }}</p>
                </div>
                <div class="shrink-0">
                  <span class="rounded-full bg-white/90 px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 shadow-sm ring-1 ring-slate-200">
                    {{ workflow.badge }}
                  </span>
                </div>
              </div>
              <div class="mt-4 pt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0">
                <span>Access Module</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </div>
            </button>
          }

          @if (workflows().length === 0) {
            <div class="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 p-10 text-center">
              <div class="h-16 w-16 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm mb-6 flex"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>
              <p class="text-sm font-black text-slate-700">No extra workflows visible</p>
              <p class="mt-2 text-sm text-slate-500 max-w-xs">Advanced tools appear here based on your role and permissions.</p>
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
  workflows = input<WorkflowCenterCard[]>([]);
  navigate = output<string>();
}
