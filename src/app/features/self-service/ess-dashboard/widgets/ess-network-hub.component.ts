import { Component, input, output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../../../../core/services/language.service';

@Component({
  selector: 'app-ess-network-hub',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex h-full flex-col rounded-lg bg-white px-5 py-4 shadow-sm ring-1 ring-slate-200">
      <h2 class="border-b-2 border-slate-200 pb-2 text-lg font-semibold text-slate-900">
        {{ t('selfService.network.title') }}
      </h2>

      @if (teammateTab() === 'teammates') {
        <div class="mt-3 flex items-center justify-between gap-3">
          <div class="text-sm font-semibold text-slate-600">{{ t('selfService.network.managerLabel') }}</div>
          <div class="flex items-center gap-3">
            <div class="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-emerald-50 font-black text-emerald-700">
              {{ initials(managerName() || 'M') }}
            </div>
            <div class="min-w-0">
              <div class="truncate text-sm font-bold text-emerald-600">{{ managerName() || t('selfService.network.sharedManager') }}</div>
              <div class="text-xs text-slate-400">{{ t('selfService.network.hierarchyTitle') }}</div>
            </div>
          </div>
        </div>
      } @else {
        <div class="mt-3 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-slate-700">
          {{ reporteeHierarchySummary() }}
        </div>
      }

      <div class="mt-3 border-b border-slate-200">
        <nav class="flex gap-1" aria-label="Tabs">
          <button
            type="button"
            (click)="teammateTab.set('teammates')"
            class="border-b-2 px-4 py-3 text-sm font-semibold transition"
            [ngClass]="teammateTab() === 'teammates' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-400 hover:text-emerald-600'">
            {{ t('selfService.network.teammates') }}
          </button>
          @if (hasReportees()) {
            <button
              type="button"
              (click)="teammateTab.set('reportees')"
              class="border-b-2 px-4 py-3 text-sm font-semibold transition"
              [ngClass]="teammateTab() === 'reportees' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-400 hover:text-emerald-600'">
              {{ t('selfService.network.reportees') }}
            </button>
          }
        </nav>
      </div>

      @if (teammateTab() === 'teammates') {
        <div class="mt-3 h-64 overflow-y-auto pr-1">
          @if (!teammates().length) {
            <div class="flex h-full items-center justify-center text-sm font-semibold text-slate-400">
              {{ t('selfService.network.sharedManager') }}
            </div>
          } @else {
            @for (peer of teammates(); track peer.id) {
              <div class="flex items-center justify-between py-2">
                <div class="flex items-center gap-3">
                  <div class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
                    @if (peer.avatar) {
                      <img [src]="peer.avatar" class="h-full w-full object-cover">
                    } @else {
                      <span class="text-sm font-bold text-emerald-600">{{ peer.firstName[0] }}</span>
                    }
                  </div>
                  <div class="min-w-0">
                    <div class="truncate text-sm font-bold text-slate-900">{{ peer.firstName }} {{ peer.lastName }}</div>
                    <div class="text-xs text-slate-400">{{ peer.designation?.name || t('selfService.network.collaborator') }}</div>
                  </div>
                </div>
                <button class="rounded-lg bg-slate-50 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 transition hover:text-emerald-600">
                  View
                </button>
              </div>
            }
          }
        </div>
      } @else {
        <div class="mt-3 h-64 overflow-y-auto pr-1">
          @if (!reportees().length) {
            <div class="flex h-full items-center justify-center text-sm font-semibold text-slate-400">
              {{ t('selfService.network.reportsToYou') }}
            </div>
          } @else {
            @for (rep of reportees(); track rep.id) {
              <div class="flex items-center justify-between py-2">
                <div class="flex items-center gap-3">
                  <div class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
                    @if (rep.avatar) {
                      <img [src]="rep.avatar" class="h-full w-full object-cover">
                    } @else {
                      <span class="text-sm font-bold text-slate-600">{{ rep.firstName[0] }}</span>
                    }
                  </div>
                  <div class="min-w-0">
                    <div class="truncate text-sm font-bold text-slate-900">{{ rep.firstName }} {{ rep.lastName }}</div>
                    <div class="text-xs text-slate-400">{{ rep.designation?.name || t('selfService.network.reportee') }}</div>
                  </div>
                </div>
                @if (canViewEmployeeProfiles() && hasValidEmployeeId(rep?.id)) {
                  <button
                    (click)="openEmployeeProfile(rep?.id)"
                    class="rounded-lg bg-emerald-50 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700 transition hover:bg-emerald-100">
                    {{ t('selfService.network.viewPortfolio') }}
                  </button>
                }
              </div>
            }
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
  `]
})
export class EssNetworkHubComponent {
  private languageService = inject(LanguageService);
  teammates = input<any[]>([]);
  reportees = input<any[]>([]);
  currentUserName = input<string>('');
  managerName = input<string>('');
  canViewEmployeeProfiles = input<boolean>(false);
  teammateTab = signal<'teammates' | 'reportees'>('teammates');

  navigate = output<string>();
  readonly t = (key: string, params?: Record<string, string | number | null | undefined>) =>
    this.languageService.t(key, params);

  hasReportees(): boolean {
    return this.reportees().length > 0;
  }

  hasValidEmployeeId(value: unknown): boolean {
    const id = Number(value);
    return Number.isInteger(id) && id > 0;
  }

  reporteeHierarchySummary(): string {
    const currentUserName = this.currentUserName().trim();
    if (currentUserName) {
      return this.t('selfService.network.reporteeHierarchySummary', { user: currentUserName });
    }
    return this.t('selfService.network.reportsToYou');
  }

  initials(value: string): string {
    const pieces = value.trim().split(/\s+/).filter(Boolean).slice(0, 2);
    return pieces.length ? pieces.map((item) => item[0]?.toUpperCase() ?? '').join('') : 'NA';
  }

  openEmployeeProfile(value: unknown): void {
    if (!this.canViewEmployeeProfiles()) return;
    const id = Number(value);
    if (!Number.isInteger(id) || id <= 0) return;
    this.navigate.emit(`/employees/view/${id}`);
  }
}
