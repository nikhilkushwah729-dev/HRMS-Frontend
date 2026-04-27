import { Component, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../../../../core/services/language.service';

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
    <div class="flex h-full flex-col rounded-lg bg-white px-5 py-4 shadow-sm ring-1 ring-slate-200">
      <div class="flex items-center justify-between gap-3 border-b-2 border-slate-200 pb-2">
        <h2 class="text-lg font-semibold text-slate-900">{{ t('selfService.pulse.title') }}</h2>
        <div class="rounded-lg bg-emerald-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">
          {{ highlights().length }}
        </div>
      </div>

      <div class="mt-3 h-64 overflow-y-auto pr-1">
        @if (highlights().length) {
          @for (item of highlights(); track item.id) {
            <div class="flex items-start gap-3 py-2">
              <div class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 ring-1 ring-slate-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-emerald-600"><path d="m12 3 1.912 5.886h6.19l-5.007 3.637 1.912 5.887L12 14.775l-5.007 3.635 1.912-5.887L3.898 8.886h6.19L12 3z"/></svg>
              </div>
              <div class="text-sm leading-6 text-slate-700">
                <span class="font-bold text-emerald-600">{{ item.name }}</span>
                <span> {{ item.message }}</span>
              </div>
            </div>
          }
        } @else {
          <div class="flex h-full items-center justify-center text-sm font-semibold text-slate-400">
            {{ t('selfService.pulse.subtitle') }}
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; width: 100%; }
  `]
})
export class EssPulseComponent {
  private languageService = inject(LanguageService);
  highlights = input<DashboardHighlight[]>([]);
  unreadCount = input<number>(0);
  readonly t = (key: string, params?: Record<string, string | number | null | undefined>) =>
    this.languageService.t(key, params);
}
