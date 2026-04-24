import { Component, input, output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../../../../core/services/language.service';

@Component({
  selector: 'app-ess-network-hub',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex h-full flex-col overflow-hidden rounded-[2.5rem] bg-white shadow-sm ring-1 ring-slate-100 transition-all hover:shadow-2xl hover:shadow-slate-200/40">
      <div class="flex flex-col shrink-0 gap-4 p-8 border-b border-slate-50 bg-slate-50/20 sm:flex-row sm:items-center justify-between">
        <div>
          <h2 class="text-2xl font-black text-slate-900 tracking-tight">{{ t('selfService.network.title') }}</h2>
          <p class="text-sm font-bold text-slate-500 mt-1">{{ t('selfService.network.subtitle') }}</p>
        </div>
        <div class="flex items-center gap-1 rounded-2xl bg-slate-100/60 p-1.5 shrink-0">
          <button (click)="teammateTab.set('teammates')" 
            [ngClass]="teammateTab() === 'teammates' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
            class="px-6 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all">{{ t('selfService.network.teammates') }}</button>
          @if (hasReportees()) {
            <button (click)="teammateTab.set('reportees')" 
              [ngClass]="teammateTab() === 'reportees' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
              class="px-6 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all">{{ t('selfService.network.reportees') }}</button>
          }
        </div>
      </div>
      
      <div class="flex-1 p-6 custom-scrollbar overflow-y-auto space-y-4">
        @if (teammateTab() === 'teammates') {
          <div class="rounded-[2rem] bg-slate-50 p-6">
            <div class="flex flex-col gap-6">
              <div class="flex items-start gap-4">
                <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                </div>
                <div class="min-w-0">
                  <p class="text-[11px] font-black uppercase tracking-[0.24em] text-emerald-600">{{ t('selfService.network.hierarchyTitle') }}</p>
                  <p class="mt-2 text-base font-bold leading-relaxed text-slate-800">{{ teammateHierarchySummary() }}</p>
                </div>
              </div>

              <div class="grid gap-4 md:grid-cols-3">
                 <div class="flex flex-col justify-between rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                    <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">{{ t('selfService.network.managerLabel') }}</p>
                    <div class="mt-4 flex items-center gap-3">
                       <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 font-black">{{ initials(managerName() || 'M') }}</div>
                       <p class="truncate text-sm font-black text-slate-900">{{ managerName() || t('selfService.network.sharedManager') }}</p>
                    </div>
                 </div>
                 <div class="flex flex-col justify-between rounded-3xl bg-emerald-600 p-5 shadow-lg shadow-emerald-100 text-white">
                    <p class="text-[10px] font-black uppercase tracking-widest text-white/70">{{ t('selfService.network.youLabel') }}</p>
                    <div class="mt-4 flex items-center gap-3">
                       <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 font-black text-white">{{ initials(currentUserName() || 'Y') }}</div>
                       <p class="truncate text-sm font-black text-white">{{ currentUserName() || t('selfService.network.youLabel') }}</p>
                    </div>
                 </div>
                 <div class="flex flex-col justify-between rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                    <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">{{ t('selfService.network.peersLabel') }}</p>
                    <p class="mt-4 text-2xl font-black text-slate-900">{{ teammates().length }}</p>
                 </div>
              </div>
            </div>
          </div>

          <div class="space-y-3">
             @for (peer of teammates(); track peer.id) {
               <div class="group flex items-center justify-between rounded-[1.5rem] p-4 transition-all hover:bg-slate-50">
                 <div class="flex items-center gap-4">
                   <div class="h-12 w-12 overflow-hidden rounded-full border-2 border-white shadow-md bg-white transition-transform group-hover:scale-105">
                     @if (peer.avatar) { <img [src]="peer.avatar" class="h-full w-full object-cover"> }
                     @else { <div class="flex h-full w-full items-center justify-center font-black text-emerald-300 text-lg capitalize bg-emerald-50">{{ peer.firstName[0] }}</div> }
                   </div>
                   <div class="min-w-0">
                     <p class="text-sm font-black text-slate-900 group-hover:text-emerald-600 transition-colors">{{ peer.firstName }} {{ peer.lastName }}</p>
                     <p class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{{ peer.designation?.name || t('selfService.network.collaborator') }}</p>
                   </div>
                 </div>
                 <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                   <button class="h-10 w-10 flex items-center justify-center rounded-xl bg-white text-slate-400 hover:text-emerald-600 hover:shadow-md transition-all"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg></button>
                 </div>
               </div>
             }
          </div>
        } @else {
          <!-- Reportees Tab Content -->
          <div class="rounded-[2rem] bg-emerald-50/50 p-6">
            <div class="flex flex-col gap-6">
              <div class="flex items-start gap-4">
                <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/><path d="M19 5H9a4 4 0 0 0-4 4v10"/><path d="M19 19v-6a2 2 0 0 0-2-2h-5"/></svg>
                </div>
                <div class="min-w-0">
                  <p class="text-[11px] font-black uppercase tracking-[0.24em] text-emerald-600">{{ t('selfService.network.hierarchyTitle') }}</p>
                  <p class="mt-2 text-base font-bold leading-relaxed text-slate-800">{{ reporteeHierarchySummary() }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="space-y-3">
             @for (rep of reportees(); track rep.id) {
               <div class="group flex items-center justify-between rounded-[1.5rem] p-4 transition-all hover:bg-emerald-50/30">
                 <div class="flex items-center gap-4">
                   <div class="h-12 w-12 overflow-hidden rounded-full border-2 border-white shadow-md bg-white transition-transform group-hover:scale-105">
                     @if (rep.avatar) { <img [src]="rep.avatar" class="h-full w-full object-cover"> }
                     @else { <div class="flex h-full w-full items-center justify-center font-black text-slate-400 capitalize bg-slate-50">{{ rep.firstName[0] }}</div> }
                   </div>
                   <div class="min-w-0">
                     <p class="text-sm font-black text-slate-900">{{ rep.firstName }} {{ rep.lastName }}</p>
                     <p class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{{ rep.designation?.name || t('selfService.network.reportee') }}</p>
                   </div>
                 </div>
                 @if (canViewEmployeeProfiles() && hasValidEmployeeId(rep?.id)) {
                   <button (click)="openEmployeeProfile(rep?.id)" class="text-[11px] font-black text-emerald-600 px-4 py-2 rounded-xl bg-emerald-50 opacity-0 group-hover:opacity-100 transition-all">{{ t('selfService.network.viewPortfolio') }}</button>
                 }
               </div>
             }
          </div>
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
