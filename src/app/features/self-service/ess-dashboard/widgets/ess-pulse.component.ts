import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DashboardHighlight {
  id: string;
  name: string;
  message: string;
  tone: string;
}

@Component({
  selector: 'app-ess-pulse',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="app-glass-card h-full flex flex-col ring-1 ring-slate-100 hover:ring-indigo-100 transition-all shadow-sm hover:shadow-2xl overflow-hidden rounded-[32px]">
      <div class="p-6 border-b border-slate-100 bg-slate-50/40 flex items-center justify-between gap-6 shrink-0">
        <div>
          <h2 class="text-xl font-black text-slate-900 tracking-tight">Highlights</h2>
          <p class="text-xs font-medium text-slate-500 mt-1">Priority updates from attendance, leave, and worklogs.</p>
        </div>
        <div class="flex items-center gap-3 shrink-0">
          <div class="rounded-full bg-slate-100/80 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 ring-1 ring-slate-200/50">
            {{ highlights().length }} signals
          </div>
        </div>
      </div>
      <div class="flex-1 overflow-y-auto custom-scrollbar p-6 bg-white/30 shrink-0">
        <div class="grid grid-cols-1 gap-5">
        @for (item of highlights(); track item.id) {
          <div class="group relative rounded-[32px] border border-slate-100 p-6 transition-all hover:-translate-y-1 hover:shadow-2xl ring-1 ring-slate-100 hover:ring-indigo-300 bg-white backdrop-blur-sm flex flex-col" [ngClass]="item.tone">
            <div class="flex items-start justify-between gap-4 mb-5">
              <div class="h-14 w-14 flex items-center justify-center rounded-2xl bg-white shadow-md text-indigo-600 group-hover:scale-110 transition-transform duration-500 ring-4 ring-slate-50/50 shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m12 3 1.912 5.886h6.19l-5.007 3.637 1.912 5.887L12 14.775l-5.007 3.635 1.912-5.887L3.898 8.886h6.19L12 3z"/></svg>
              </div>
              <div class="shrink-0 pt-2">
                <div class="h-2 w-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(79,70,229,0.5)]"></div>
              </div>
            </div>
            <h3 class="text-lg font-black text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors">{{ item.name }}</h3>
            <p class="text-sm font-medium text-slate-500 mt-2 leading-relaxed group-hover:text-slate-600 transition-colors line-clamp-2">{{ item.message }}</p>
            <div class="mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0">
               <span>Learn More</span>
               <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
          </div>
        }
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; width: 100%; }
  `]
})
export class EssPulseComponent {
  highlights = input<DashboardHighlight[]>([]);
  unreadCount = input<number>(0);
}
