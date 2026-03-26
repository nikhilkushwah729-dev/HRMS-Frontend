import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalService } from '../../services/modal.service';

@Component({
    selector: 'app-confirm-modal',
    standalone: true,
    imports: [CommonModule],
    template: `
    @if (modalService.isOpen()) {
      <div class="fixed inset-0 z-[10000] flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" (click)="modalService.handleCancel()"></div>
        
        <!-- Modal Content -->
        <div class="relative bg-white w-full max-w-md rounded-md shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 fade-in duration-300 max-h-[90vh]">
          <div class="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-92px)]">
            <div class="flex items-start gap-4">
              <div 
                class="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                [ngClass]="modalService.options()?.type === 'danger' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'"
              >
                @if (modalService.options()?.type === 'danger') {
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                } @else {
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                }
              </div>
              <div class="flex-1">
                <h3 class="text-xl font-bold text-slate-900 leading-tight mb-2">{{ modalService.options()?.title }}</h3>
                <p class="text-slate-500 text-sm leading-relaxed">{{ modalService.options()?.message }}</p>
              </div>
            </div>
          </div>
          
          <div class="bg-slate-50/50 p-4 sm:px-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 border-t border-slate-100 mt-2">
            <button 
              type="button" 
              (click)="modalService.handleCancel()"
              class="px-5 py-2.5 rounded-md border border-slate-200 font-bold text-slate-600 hover:bg-white transition-all text-sm"
            >
              {{ modalService.options()?.cancelText }}
            </button>
            <button 
              type="button" 
              (click)="modalService.handleConfirm()"
              class="px-5 py-2.5 rounded-md font-bold text-white transition-all text-sm shadow-lg active:scale-95"
              [ngClass]="modalService.options()?.type === 'danger' ? 'bg-error hover:bg-red-600 shadow-red-500/20' : 'bg-primary-600 hover:bg-primary-700 shadow-primary-500/20'"
            >
              {{ modalService.options()?.confirmText }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
    styles: [`
    :host { display: contents; }
  `]
})
export class ConfirmModalComponent {
    modalService = inject(ModalService);
}

