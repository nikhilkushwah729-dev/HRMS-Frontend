import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ess-leave-balance',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <div class="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h2 class="text-lg font-black tracking-tight text-slate-900">Leave Balance</h2>
          <p class="mt-1 text-xs font-semibold text-slate-500 sm:text-sm">Available time-off buckets.</p>
        </div>
      </div>

      <div class="flex flex-1 flex-col gap-4 overflow-hidden p-4 sm:p-5">
        <div class="flex-1 space-y-3 overflow-y-auto">
          @for (balance of balances(); track balance.id) {
            <div class="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div class="flex items-center gap-4">
                <div class="h-3.5 w-3.5 rounded-full shadow-sm" [style.backgroundColor]="balance.color"></div>
                <span class="text-sm font-black text-slate-700">{{ balance.typeName }}</span>
              </div>
              <div class="flex items-baseline gap-2">
                <span class="text-xl font-black tracking-tight text-slate-900">{{ balance.remaining }}</span>
                <span class="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Available</span>
              </div>
            </div>
          }
        </div>
        
        <button (click)="requestLeave.emit()" class="h-11 shrink-0 w-full rounded-lg border border-slate-200 bg-slate-900 px-4 text-[11px] font-black uppercase tracking-[0.18em] text-white transition hover:bg-emerald-600">
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
