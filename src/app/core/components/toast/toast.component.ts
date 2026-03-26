import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastType } from '../../services/toast.service';

@Component({
    selector: 'app-toast',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="fixed top-3 right-2 left-2 sm:top-6 sm:right-6 sm:left-auto z-[9999] flex flex-col gap-3 pointer-events-none">
      @for (toast of toastService.toasts(); track toast.id) {
        <div 
          class="w-full sm:min-w-[320px] sm:max-w-md p-4 rounded-md shadow-2xl border backdrop-blur-xl flex items-start gap-4 animate-in slide-in-from-right-full duration-300 pointer-events-auto cursor-pointer sm:hover:scale-[1.02] transition-transform"
          [ngClass]="getStyles(toast.type)"
          (click)="toastService.remove(toast.id)"
        >
          <div class="mt-0.5">
            @if (toast.type === 'success') {
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-emerald-500"><polyline points="20 6 9 17 4 12"/></svg>
            } @else if (toast.type === 'error') {
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-rose-500"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            } @else {
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-blue-500"><circle cx="12" cy="12" r="10"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            }
          </div>
          <div class="flex-1">
            <p class="text-sm font-bold text-slate-900 leading-tight">{{ toast.message }}</p>
          </div>
          <button class="text-slate-400 hover:text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      }
    </div>
  `,
    styles: [`
    :host { display: contents; }
  `]
})
export class ToastComponent {
    toastService = inject(ToastService);

    getStyles(type: ToastType) {
        switch (type) {
            case 'success':
                return 'bg-emerald-50/90 border-emerald-100 shadow-emerald-500/10';
            case 'error':
                return 'bg-rose-50/90 border-rose-100 shadow-rose-500/10';
            case 'warning':
                return 'bg-amber-50/90 border-amber-100 shadow-amber-500/10';
            default:
                return 'bg-blue-50/90 border-blue-100 shadow-blue-500/10';
        }
    }
}

