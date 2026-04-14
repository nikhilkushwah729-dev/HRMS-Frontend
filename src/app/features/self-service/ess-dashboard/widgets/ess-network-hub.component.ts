import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ess-network-hub',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="app-glass-card h-full flex flex-col ring-1 ring-slate-100 hover:ring-indigo-100 transition-all shadow-sm hover:shadow-2xl overflow-hidden rounded-[32px]">
      <div class="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50/40 gap-4 shrink-0">
        <div>
          <h2 class="text-xl font-black text-slate-900 tracking-tight">My Team</h2>
          <p class="text-xs font-medium text-slate-500 mt-1">People you collaborate with every day.</p>
        </div>
        <div class="flex items-center bg-slate-100/80 p-1.5 rounded-2xl ring-1 ring-slate-200/50 shrink-0">
          <button (click)="teammateTab.set('teammates')" 
            [ngClass]="teammateTab() === 'teammates' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
            class="px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all">Teammates</button>
          <button (click)="teammateTab.set('reportees')" 
            [ngClass]="teammateTab() === 'reportees' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
            class="px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all">Reportees</button>
        </div>
      </div>
      
      <div class="flex-1 p-6 custom-scrollbar overflow-y-auto space-y-3 bg-white/50">
        @if (teammateTab() === 'teammates') {
          @for (peer of teammates(); track peer.id) {
            <div class="group flex items-center justify-between rounded-2xl border border-slate-100 p-4 transition-all hover:border-indigo-300 hover:bg-indigo-50/30 hover:shadow-lg">
              <div class="flex items-center gap-4">
                <div class="h-12 w-12 overflow-hidden rounded-2xl border-4 border-white shadow-md bg-slate-50 group-hover:scale-105 transition-transform">
                  @if (peer.avatar) { <img [src]="peer.avatar" class="h-full w-full object-cover"> }
                  @else { <div class="flex h-full w-full items-center justify-center font-black text-indigo-300 text-lg capitalize bg-indigo-50">{{ peer.firstName[0] }}</div> }
                </div>
                <div>
                  <p class="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{{ peer.firstName }} {{ peer.lastName }}</p>
                  <p class="mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{{ peer.designation?.name || 'Collaborator' }}</p>
                </div>
              </div>
              <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                <button class="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 transition-all hover:text-indigo-600 hover:border-indigo-300 hover:shadow-sm"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg></button>
                <button class="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 transition-all hover:text-indigo-600 hover:border-indigo-300 hover:shadow-sm"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></button>
              </div>
            </div>
          }
          @if (teammates().length === 0) {
            <div class="flex flex-col items-center justify-center h-48 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 p-8">
              <div class="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6M23 11h-6"/></svg></div>
              <p class="text-sm font-bold text-slate-600">No Peers listed yet</p>
              <p class="text-xs text-slate-400 mt-1">Your network will grow as colleagues join your department.</p>
            </div>
          }
        } @else {
          @for (rep of reportees(); track rep.id) {
            <div class="group flex items-center justify-between rounded-xl border border-slate-100 p-4 transition-all hover:border-emerald-200 hover:bg-slate-50">
              <div class="flex items-center gap-4">
                <div class="h-12 w-12 overflow-hidden rounded-xl border-2 border-white shadow-sm bg-slate-100">
                  @if (rep.avatar) { <img [src]="rep.avatar" class="h-full w-full object-cover"> }
                  @else { <div class="flex h-full w-full items-center justify-center font-black text-slate-400 capitalize">{{ rep.firstName[0] }}</div> }
                </div>
                <div>
                  <p class="text-sm font-extrabold text-slate-900">{{ rep.firstName }} {{ rep.lastName }}</p>
                  <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{{ rep.designation?.name || 'Reportee' }}</p>
                </div>
              </div>
              <button (click)="navigate.emit('/employees/view/' + rep.id)" class="text-xs font-extrabold text-indigo-600 px-3 py-1.5 rounded-lg bg-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity">View Portfolio</button>
            </div>
          }
           @if (reportees().length === 0) {
            <div class="flex flex-col items-center justify-center h-48 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 p-8">
              <div class="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
              <p class="text-sm font-bold text-slate-600">No Direct Reportees</p>
              <p class="text-xs text-slate-400 mt-1">This module tracks hierarchy reporting for management roles.</p>
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
  teammates = input<any[]>([]);
  reportees = input<any[]>([]);
  teammateTab = signal<'teammates' | 'reportees'>('teammates');

  navigate = output<string>();
}
