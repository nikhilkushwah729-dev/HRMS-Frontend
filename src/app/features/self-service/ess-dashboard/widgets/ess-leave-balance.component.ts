import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ess-leave-balance',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex h-full flex-col overflow-hidden rounded-[2.5rem] bg-white shadow-sm ring-1 ring-slate-100 transition-all hover:shadow-2xl hover:shadow-slate-200/40">
      <div class="flex flex-col shrink-0 gap-4 p-8 border-b border-slate-50 bg-slate-50/20 sm:flex-row sm:items-center justify-between">
        <div>
          <h2 class="text-2xl font-black text-slate-900 tracking-tight">Leave Balance</h2>
          <p class="text-sm font-bold text-slate-500 mt-1">Available time-off buckets.</p>
        </div>
      </div>
      <div class="flex flex-1 flex-col gap-6 overflow-hidden p-8">
        <div class="custom-scrollbar flex-1 space-y-3 overflow-y-auto pr-1">
          @for (balance of balances(); track balance.id) {
            <div class="group flex items-center justify-between rounded-3xl bg-slate-50 p-5 transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/40 ring-1 ring-transparent hover:ring-slate-100">
              <div class="flex items-center gap-4">
                <div class="h-4 w-4 rounded-full shadow-sm" [style.backgroundColor]="balance.color"></div>
                <span class="text-sm font-black text-slate-700 group-hover:text-emerald-600 transition-colors">{{ balance.typeName }}</span>
              </div>
              <div class="flex items-baseline gap-2">
                <span class="text-2xl font-black text-slate-900 tracking-tight">{{ balance.remaining }}</span>
                <span class="text-[10px] font-black uppercase tracking-widest text-slate-400">Available</span>
              </div>
            </div>
          }
        </div>
        
        <button (click)="requestLeave.emit()" class="shrink-0 w-full rounded-2xl border-2 border-dashed border-slate-200 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 transition-all hover:border-emerald-400 hover:bg-emerald-50/50 hover:text-emerald-600">
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
