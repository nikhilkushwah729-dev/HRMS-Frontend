import { Component, input, output } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';

@Component({
  selector: 'app-ess-requests-ledger',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="app-glass-card h-full flex flex-col ring-1 ring-slate-100 hover:ring-indigo-100 transition-all shadow-sm hover:shadow-2xl overflow-hidden rounded-[32px]">
      <div class="p-6 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
        <div>
          <h2 class="text-xl font-black text-slate-900 tracking-tight">My Requests</h2>
          <p class="text-xs font-medium text-slate-500 mt-1">Recent leave requests with live approval tracking.</p>
        </div>
        <button (click)="viewAll.emit()" class="text-[10px] font-black uppercase tracking-widest text-indigo-600 px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 transition-colors ring-1 ring-indigo-200/50">View All</button>
      </div>
      <div class="flex-1 overflow-x-auto">
        <table class="w-full text-left">
          <thead class="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-50/30 border-b border-slate-100">
            <tr>
              <th class="py-4 px-6">Leave Portfolio</th>
              <th class="py-4 px-6">Duration Range</th>
              <th class="py-4 px-6">Metric</th>
              <th class="py-4 px-6 text-center">Outcome</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            @for (req of requests(); track req.id) {
              <tr class="group hover:bg-slate-50 transition-colors">
                <td class="py-5 px-6">
                   <div class="flex items-center gap-3">
                      <div class="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-amber-100 group-hover:text-amber-600 transition-colors">
                         <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M2 22c6 0 10-3 14-8 2-3 4-8 6-12-6 0-10 3-14 8-2 3-4 8-6 12Z"/><path d="M8 16c2 0 5-1 8-4"/></svg>
                      </div>
                      <span class="text-sm font-bold text-slate-800">{{ req.leaveType?.typeName }}</span>
                   </div>
                </td>
                <td class="py-5 px-6 text-[11px] font-bold text-slate-400">
                  {{ req.startDate | date:'MMM dd' }} — {{ req.endDate | date:'MMM dd, yyyy' }}
                </td>
                <td class="py-5 px-6 font-black text-slate-900 font-mono text-sm">{{ req.totalDays }}D</td>
                <td class="py-5 px-6">
                  <div class="flex justify-center">
                    <span class="badge" 
                      [ngClass]="{
                        'badge-warning': req.status === 'pending',
                        'badge-success': req.status === 'approved',
                        'badge-error': req.status === 'rejected'
                      }">
                      {{ req.status }}
                    </span>
                  </div>
                </td>
              </tr>
            }
            @if (requests().length === 0) {
              <tr>
                <td colspan="4" class="py-12 text-center">
                   <div class="flex flex-col items-center justify-center p-8">
                     <p class="text-sm font-bold text-slate-400 italic">No active requests currently tracking.</p>
                   </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; width: 100%; }
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.625rem;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    .badge-warning { background: #fffbeb; color: #b45309; border: 1px solid #fef3c7; }
    .badge-success { background: #ecfdf5; color: #047857; border: 1px solid #d1fae5; }
    .badge-error { background: #fef2f2; color: #b91c1c; border: 1px solid #fee2e2; }
  `]
})
export class EssRequestsLedgerComponent {
  requests = input<any[]>([]);
  viewAll = output<void>();
}
