import { Component, input, output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../../../../core/services/language.service';

@Component({
  selector: 'app-ess-network-hub',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="app-glass-card h-full flex flex-col ring-1 ring-slate-100 hover:ring-indigo-100 transition-all shadow-sm hover:shadow-2xl overflow-hidden rounded-md">
      <div class="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50/40 gap-3 shrink-0">
        <div>
          <h2 class="text-xl font-black text-slate-900 tracking-tight">{{ t('selfService.network.title') }}</h2>
          <p class="text-xs font-medium text-slate-500 mt-1">{{ t('selfService.network.subtitle') }}</p>
        </div>
        <div class="flex items-center bg-slate-100/80 p-1.5 rounded-md ring-1 ring-slate-200/50 shrink-0">
          <button (click)="teammateTab.set('teammates')" 
            [ngClass]="teammateTab() === 'teammates' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
            class="px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-md transition-all">{{ t('selfService.network.teammates') }}</button>
          @if (hasReportees()) {
            <button (click)="teammateTab.set('reportees')" 
              [ngClass]="teammateTab() === 'reportees' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
              class="px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-md transition-all">{{ t('selfService.network.reportees') }}</button>
          }
        </div>
      </div>
      
      <div class="flex-1 p-4 custom-scrollbar overflow-y-auto space-y-3 bg-white/50">
        @if (teammateTab() === 'teammates') {
          <div class="rounded-md border border-indigo-100 bg-gradient-to-r from-indigo-50 to-white p-4 lg:p-5">
            <div class="flex flex-col gap-4 lg:gap-5">
              <div class="flex items-start gap-3">
                <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-indigo-100 text-indigo-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M3 7h18"/><path d="M6 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2"/><path d="M6 7v6a2 2 0 0 0 2 2h3"/><path d="M18 7v3"/><path d="M15 21h6"/><path d="M18 18v6"/></svg>
                </div>
                <div class="min-w-0 max-w-2xl">
                  <p class="text-[11px] font-black uppercase tracking-[0.24em] text-indigo-500">{{ t('selfService.network.hierarchyTitle') }}</p>
                  <p class="mt-2 text-sm font-semibold leading-6 text-slate-800 lg:text-[15px]">{{ teammateHierarchySummary() }}</p>
                  <p class="mt-2 text-xs leading-5 text-slate-500">{{ t('selfService.network.peerCountLabel', { count: teammates().length }) }}</p>
                </div>
              </div>
              <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <div class="flex min-h-[120px] flex-col justify-between rounded-md border border-white/80 bg-white/90 p-4 shadow-sm ring-1 ring-indigo-100">
                  <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{{ t('selfService.network.managerLabel') }}</p>
                  <div class="mt-3 flex items-center gap-3.5">
                    <div class="flex h-11 min-w-[2.75rem] items-center justify-center rounded-md bg-indigo-100 px-2 text-sm font-black tracking-[0.08em] text-indigo-700">{{ initials(managerName() || t('selfService.network.managerLabel')) }}</div>
                    <div class="min-w-0">
                      <p class="truncate text-sm font-bold text-slate-900">{{ managerName() || t('selfService.network.sharedManager') }}</p>
                      <p class="mt-1 text-xs leading-5 text-slate-500">{{ t('selfService.network.reportingToManagerHelp') }}</p>
                    </div>
                  </div>
                </div>
                <div class="flex min-h-[120px] flex-col justify-between rounded-md border border-indigo-200 bg-indigo-600 p-4 text-white shadow-sm">
                  <p class="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">{{ t('selfService.network.youLabel') }}</p>
                  <div class="mt-3 flex items-center gap-3.5">
                    <div class="flex h-11 min-w-[2.75rem] items-center justify-center rounded-md bg-white/20 px-2 text-sm font-black tracking-[0.08em]">{{ initials(currentUserName() || t('selfService.network.youLabel')) }}</div>
                    <div class="min-w-0">
                      <p class="truncate text-sm font-black">{{ currentUserName() || t('selfService.network.youLabel') }}</p>
                      <p class="mt-1 text-xs text-white/80">{{ t('selfService.network.centerNodeHelp') }}</p>
                    </div>
                  </div>
                </div>
                <div class="flex min-h-[120px] flex-col justify-between rounded-md border border-white/80 bg-white/90 p-4 shadow-sm ring-1 ring-indigo-100">
                  <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{{ t('selfService.network.peersLabel') }}</p>
                  <div class="mt-3">
                    <p class="text-2xl font-black tracking-tight text-slate-900">{{ teammates().length }}</p>
                    <p class="mt-2 text-xs leading-5 text-slate-500">{{ t('selfService.network.peerPanelHelp') }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          @for (peer of teammates(); track peer.id) {
            <div class="group flex items-center justify-between rounded-md border border-slate-100 p-4 transition-all hover:border-indigo-300 hover:bg-indigo-50/30 hover:shadow-lg">
              <div class="flex items-center gap-4">
                <div class="flex h-full flex-col items-center self-stretch pt-1">
                  <span class="h-2.5 w-2.5 rounded-full bg-indigo-400 ring-4 ring-indigo-50"></span>
                  <span class="mt-2 w-px flex-1 bg-gradient-to-b from-indigo-200 to-transparent"></span>
                </div>
                <div class="h-12 w-12 overflow-hidden rounded-md border-4 border-white shadow-md bg-slate-50 group-hover:scale-105 transition-transform">
                  @if (peer.avatar) { <img [src]="peer.avatar" class="h-full w-full object-cover"> }
                  @else { <div class="flex h-full w-full items-center justify-center font-black text-indigo-300 text-lg capitalize bg-indigo-50">{{ peer.firstName[0] }}</div> }
                </div>
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <p class="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{{ peer.firstName }} {{ peer.lastName }}</p>
                    <span class="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-600">{{ t('selfService.network.peerBadge') }}</span>
                  </div>
                  <p class="mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{{ peer.designation?.name || t('selfService.network.collaborator') }}</p>
                  <p class="mt-1 text-xs font-medium text-slate-500">{{ teammateHierarchyLabel() }}</p>
                </div>
              </div>
              <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                <button class="h-10 w-10 flex items-center justify-center rounded-md bg-white border border-slate-200 text-slate-400 transition-all hover:text-indigo-600 hover:border-indigo-300 hover:shadow-sm"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg></button>
                <button class="h-10 w-10 flex items-center justify-center rounded-md bg-white border border-slate-200 text-slate-400 transition-all hover:text-indigo-600 hover:border-indigo-300 hover:shadow-sm"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></button>
              </div>
            </div>
          }
          @if (teammates().length === 0) {
            <div class="flex flex-col items-center justify-center h-48 text-center bg-slate-50/50 rounded-md border border-dashed border-slate-200 p-8">
              <div class="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6M23 11h-6"/></svg></div>
              <p class="text-sm font-bold text-slate-600">{{ t('selfService.network.noPeers') }}</p>
              <p class="text-xs text-slate-400 mt-1">{{ t('selfService.network.noPeersHelp') }}</p>
            </div>
          }
        } @else {
          <div class="rounded-md border border-emerald-100 bg-gradient-to-r from-emerald-50 to-white p-4 lg:p-5">
            <div class="flex flex-col gap-4 lg:gap-5">
              <div class="flex items-start gap-3">
                <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-emerald-100 text-emerald-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 5v14"/><path d="M5 12h14"/><path d="M19 5H9a4 4 0 0 0-4 4v10"/><path d="M19 19v-6a2 2 0 0 0-2-2h-5"/></svg>
                </div>
                <div class="min-w-0 max-w-2xl">
                  <p class="text-[11px] font-black uppercase tracking-[0.24em] text-emerald-600">{{ t('selfService.network.hierarchyTitle') }}</p>
                  <p class="mt-2 text-sm font-semibold leading-6 text-slate-800 lg:text-[15px]">{{ reporteeHierarchySummary() }}</p>
                  <p class="mt-2 text-xs leading-5 text-slate-500">{{ t('selfService.network.reporteeCountLabel', { count: reportees().length }) }}</p>
                </div>
              </div>
              <div class="grid gap-3 md:grid-cols-2">
                <div class="flex min-h-[120px] flex-col justify-between rounded-md border border-emerald-200 bg-emerald-600 p-4 text-white shadow-sm">
                  <p class="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">{{ t('selfService.network.youLeadLabel') }}</p>
                  <div class="mt-3 flex items-center gap-3.5">
                    <div class="flex h-11 min-w-[2.75rem] items-center justify-center rounded-md bg-white/20 px-2 text-sm font-black tracking-[0.08em]">{{ initials(currentUserName() || t('selfService.network.youLabel')) }}</div>
                    <div class="min-w-0">
                      <p class="truncate text-sm font-black">{{ currentUserName() || t('selfService.network.youLabel') }}</p>
                      <p class="mt-1 text-xs text-white/80">{{ t('selfService.network.leadNodeHelp') }}</p>
                    </div>
                  </div>
                </div>
                <div class="flex min-h-[120px] flex-col justify-between rounded-md border border-white/80 bg-white/90 p-4 shadow-sm ring-1 ring-emerald-100">
                  <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{{ t('selfService.network.reportsLabel') }}</p>
                  <div class="mt-3">
                    <p class="text-2xl font-black tracking-tight text-slate-900">{{ reportees().length }}</p>
                    <p class="mt-2 text-xs leading-5 text-slate-500">{{ t('selfService.network.reporteePanelHelp') }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          @for (rep of reportees(); track rep.id) {
            <div class="group flex items-center justify-between rounded-md border border-slate-100 p-4 transition-all hover:border-emerald-200 hover:bg-slate-50">
              <div class="flex items-center gap-4">
                <div class="flex h-full flex-col items-center self-stretch pt-1">
                  <span class="h-2.5 w-2.5 rounded-full bg-emerald-400 ring-4 ring-emerald-50"></span>
                  <span class="mt-2 w-px flex-1 bg-gradient-to-b from-emerald-200 to-transparent"></span>
                </div>
                <div class="h-12 w-12 overflow-hidden rounded-md border-2 border-white shadow-sm bg-slate-100">
                  @if (rep.avatar) { <img [src]="rep.avatar" class="h-full w-full object-cover"> }
                  @else { <div class="flex h-full w-full items-center justify-center font-black text-slate-400 capitalize">{{ rep.firstName[0] }}</div> }
                </div>
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <p class="text-sm font-extrabold text-slate-900">{{ rep.firstName }} {{ rep.lastName }}</p>
                    <span class="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600">{{ t('selfService.network.directReportBadge') }}</span>
                  </div>
                  <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{{ rep.designation?.name || t('selfService.network.reportee') }}</p>
                  <p class="mt-1 text-xs font-medium text-slate-500">{{ reporteeHierarchyLabel() }}</p>
                </div>
              </div>
              @if (canViewEmployeeProfiles() && hasValidEmployeeId(rep?.id)) {
                <button (click)="openEmployeeProfile(rep?.id)" class="text-xs font-extrabold text-indigo-600 px-3 py-1.5 rounded-md bg-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity">{{ t('selfService.network.viewPortfolio') }}</button>
              }
            </div>
          }
           @if (reportees().length === 0) {
            <div class="flex flex-col items-center justify-center h-48 text-center bg-slate-50/50 rounded-md border border-dashed border-slate-200 p-8">
              <div class="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
              <p class="text-sm font-bold text-slate-600">{{ t('selfService.network.noReportees') }}</p>
              <p class="text-xs text-slate-400 mt-1">{{ t('selfService.network.noReporteesHelp') }}</p>
            </div>
          }
        }
      </div>
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

  teammateHierarchyLabel(): string {
    const managerName = this.managerName().trim();
    if (managerName) {
      return this.t('selfService.network.reportsToPerson', { name: managerName });
    }

    return this.t('selfService.network.sharedManager');
  }

  reporteeHierarchyLabel(): string {
    const currentUserName = this.currentUserName().trim();
    if (currentUserName) {
      return this.t('selfService.network.reportsToPerson', { name: currentUserName });
    }

    return this.t('selfService.network.reportsToYou');
  }

  teammateHierarchySummary(): string {
    const managerName = this.managerName().trim();
    const currentUserName = this.currentUserName().trim();

    if (managerName && currentUserName) {
      return this.t('selfService.network.peerHierarchySummary', {
        user: currentUserName,
        manager: managerName
      });
    }

    return this.t('selfService.network.sharedManager');
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
    if (!this.canViewEmployeeProfiles()) {
      return;
    }

    const id = Number(value);
    if (!Number.isInteger(id) || id <= 0) {
      return;
    }

    this.navigate.emit(`/employees/view/${id}`);
  }
}
