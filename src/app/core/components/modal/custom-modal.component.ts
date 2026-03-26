import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-custom-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (openModal) {
      <div class="fixed inset-0 z-[10001] flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" 
             (click)="clickOutside ? closeModal.emit(true) : null"></div>
        
        <!-- Modal Content -->
        <div [class]="'relative bg-white w-full rounded-md shadow-2xl border border-slate-100 overflow-hidden animate-zoom-fade max-h-[90vh] ' + maxWidth">
          <!-- Cross Button -->
          @if (crossButton) {
            <button (click)="closeModal.emit(true)" class="absolute right-4 top-4 text-slate-400 hover:text-slate-600 z-10">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          }

          <div class="p-8 text-center">
            <ng-content></ng-content>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: contents; }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes zoomFade {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
    .animate-zoom-fade { animation: zoomFade 0.3s ease-out forwards; }
  `]
})
export class CustomModalComponent {
  @Input() openModal: boolean = false;
  @Input() maxWidth: string = 'max-w-md';
  @Input() clickOutside: boolean = true;
  @Input() crossButton: boolean = true;
  @Output() closeModal = new EventEmitter<boolean>();
}
