import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ess-leave-balance',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="app-glass-card h-full flex flex-col ring-1 ring-slate-100 hover:ring-indigo-100 transition-all shadow-sm hover:shadow-2xl overflow-hidden rounded-md">
      <div class="border-b border-slate-100 bg-slate-50/30 p-5">
        <h2 class="text-xl font-black text-slate-900 tracking-tight">Leave Balance</h2>
        <p class="text-xs font-medium text-slate-500 mt-1">Available time-off buckets for your role.</p>
      </div>
      <div class="flex flex-1 flex-col gap-5 overflow-hidden p-5">
        <div class="custom-scrollbar flex-1 space-y-4 overflow-y-auto pr-1">
          @for (balance of balances(); track balance.id) {
            <div class="group flex items-center justify-between rounded-md border border-slate-100 bg-white p-4 transition-all hover:border-indigo-200 hover:shadow-lg ring-1 ring-slate-100">
              <div class="flex items-center gap-4">
                <div class="h-3 w-3 rounded-full shadow-sm" [style.backgroundColor]="balance.color"></div>
                <span class="text-sm font-black text-slate-700 group-hover:text-indigo-600 transition-colors">{{ balance.typeName }}</span>
              </div>
              <div class="flex items-baseline gap-1.5">
                <span class="text-xl font-black text-slate-900 tracking-tight">{{ balance.remaining }}</span>
                <span class="text-[9px] font-black uppercase tracking-widest text-slate-400">Available</span>
              </div>
            </div>
          }
        </div>
        
        <button (click)="requestLeave.emit()" class="shrink-0 w-full rounded-md border-2 border-dashed border-slate-200 py-3.5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 transition-all shadow-sm ring-1 ring-indigo-50/10 hover:border-indigo-400 hover:bg-indigo-50/50 hover:text-indigo-600">
          Request New Leave
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
  `]
})
export class EssLeaveBalanceComponent {
  balances = input<any[]>([]);
  requestLeave = output<void>();
}
