import { Component, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

export interface InsightCard {
  label: string;
  value: string;
  description: string;
  tone: string;
  icon: string; // The raw SVG string
}

@Component({
  selector: 'app-ess-stats',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      @for (stat of stats(); track stat.label) {
        <div class="group relative flex flex-col items-start rounded-[2rem] bg-white p-7 shadow-sm ring-1 ring-slate-100 transition-all hover:shadow-2xl hover:shadow-slate-200/40 hover:-translate-y-1">
          <div class="flex w-full items-start justify-between">
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-800 transition-colors group-hover:bg-emerald-50 group-hover:text-emerald-600">
               <div class="h-6 w-6" [innerHTML]="sanitizeIcon(stat.icon)"></div>
            </div>
            <div class="flex h-6 items-center rounded-full bg-emerald-50 px-3 text-[10px] font-black uppercase tracking-wider text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
               Live
            </div>
          </div>

          <div class="mt-6 space-y-1">
            <p class="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{{ stat.label }}</p>
            <h3 class="text-3xl font-black tracking-tight text-slate-900">{{ stat.value }}</h3>
          </div>
          
          <p class="mt-3 text-sm font-bold text-slate-500">{{ stat.description }}</p>
          
          <div class="mt-8 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
             <div class="h-full rounded-full bg-emerald-500 transition-all duration-1000 ease-out group-hover:w-full" style="width: 40%"></div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; }
  `]
})
export class EssStatsComponent {
  private sanitizer = inject(DomSanitizer);
  stats = input<InsightCard[]>([]);

  sanitizeIcon(svg: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }
}
