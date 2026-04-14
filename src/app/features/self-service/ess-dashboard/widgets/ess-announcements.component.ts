import { Component, input } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';

@Component({
  selector: 'app-ess-announcements',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="app-glass-card overflow-hidden h-full flex flex-col ring-1 ring-slate-100 hover:ring-indigo-100 transition-all shadow-sm hover:shadow-2xl rounded-[32px]">
      <div class="p-5 border-b border-slate-100 bg-slate-50/40 flex items-center gap-4">
        <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-sm ring-1 ring-indigo-100/50">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>
        </div>
        <div>
          <h2 class="text-lg font-black tracking-tight text-slate-900 leading-none">Announcements</h2>
          <p class="text-[10px] font-medium text-slate-500 mt-1.5 uppercase tracking-wider opacity-70">Official company updates</p>
        </div>
      </div>

      @if (announcement()) {
        <div class="flex-1 p-6 flex flex-col justify-center gap-6">
          <div class="flex-1 rounded-[32px] border border-indigo-100 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/50 p-6 ring-1 ring-indigo-200/50 shadow-sm relative overflow-hidden group flex flex-col justify-center">
            <div class="flex items-start justify-between gap-6 relative z-10">
              <div class="flex-1">
                <div class="inline-flex rounded-full border border-indigo-200 bg-white px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 shadow-sm">
                  {{ announcement().target === 'all' ? 'Organization Alert' : 'Targeted Notice' }}
                </div>
                <h3 class="mt-6 text-2xl font-black tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">{{ announcement().title }}</h3>
                <p class="mt-4 text-sm font-medium leading-relaxed text-slate-600 line-clamp-4">{{ announcement().content }}</p>
              </div>
              <div class="hidden h-16 w-16 items-center justify-center rounded-2xl bg-white text-indigo-500 shadow-lg sm:flex border border-indigo-50 ring-4 ring-indigo-50/30 group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>
              </div>
            </div>

            <div class="mt-8 flex flex-wrap gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 relative z-10 items-center">
              <span class="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>
                {{ announcement().published_at ? (announcement().published_at | date:'dd MMM yyyy') : 'Recently' }}
              </span>
              @if (announcement().expires_at) {
                <span class="flex items-center gap-2 text-rose-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
                  Expires {{ announcement().expires_at | date:'dd MMM yyyy' }}
                </span>
              }
            </div>
            
            <div class="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-indigo-500/5 blur-3xl group-hover:scale-125 transition-transform duration-700"></div>
          </div>
          
          <button class="w-full py-4 rounded-2xl border-2 border-dashed border-slate-200 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all">
            View All Announcements
          </button>
        </div>
      }
      @else {
        <div class="flex-1 p-8 flex flex-col justify-center">
          <div class="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 p-10 text-center">
            <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-indigo-400 shadow-md mb-6 ring-4 ring-indigo-50">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>
            </div>
            <h3 class="text-lg font-black text-slate-900">No announcements right now</h3>
            <p class="mt-3 text-sm leading-6 text-slate-500 max-w-xs">Organization notices and communication from admin will appear here automatically.</p>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
  `]
})
export class EssAnnouncementsComponent {
  announcement = input<any>(null);
}
