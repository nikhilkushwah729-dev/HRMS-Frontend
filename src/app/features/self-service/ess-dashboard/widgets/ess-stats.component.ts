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
    <div class="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
      @for (stat of stats(); track stat.label) {
        <div class="app-surface-card group relative flex h-full flex-col items-start overflow-hidden p-6 transition-all hover:-translate-y-1 hover:shadow-lg" [ngClass]="stat.tone">
          <!-- Floating Icon Context -->
          <div class="absolute top-5 right-5 flex h-12 w-12 items-center justify-center rounded-md bg-white shadow-sm ring-1 ring-slate-200/60 transition-colors duration-500 group-hover:scale-105 text-slate-800">
             <div class="h-6 w-6" [innerHTML]="sanitizeIcon(stat.icon)"></div>
          </div>

          <p class="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400 group-hover:text-indigo-600 transition-colors pr-16">{{ stat.label }}</p>
          
          <div class="mt-4 flex items-baseline gap-1">
            <p class="text-3xl font-black tracking-tighter text-slate-900 leading-none">{{ stat.value }}</p>
          </div>
          
          <p class="mt-3 text-[13px] font-medium leading-relaxed text-slate-500 line-clamp-1 group-hover:text-slate-600 transition-colors">{{ stat.description }}</p>
          
          <div class="mt-auto pt-8 w-full">
            <div class="h-1 w-full rounded-full bg-slate-100/50 overflow-hidden shadow-inner">
               <div class="h-full bg-indigo-500 rounded-full w-2/3 opacity-0 group-hover:opacity-100 transition-all duration-700 delay-100"></div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; width: 100%; }
  `]
})
export class EssStatsComponent {
  private sanitizer = inject(DomSanitizer);
  stats = input<InsightCard[]>([]);

  sanitizeIcon(svg: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }
}
