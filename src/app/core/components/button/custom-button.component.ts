import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-custom-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [type]="typeAttr"
      [disabled]="disabled"
      [class]="getButtonClass()"
      (click)="onClick($event)"
    >
      <ng-content></ng-content>
    </button>
  `,
  styles: [`
    :host { display: inline-block; width: 100%; }
  `]
})
export class CustomButtonComponent {
  @Input() typeAttr: 'button' | 'submit' | 'reset' = 'button';
  @Input() type: 'primary' | 'secondary' | 'red-solid' | 'primary-outline' = 'primary';
  @Input() disabled: boolean = false;
  @Output() btnClick = new EventEmitter<MouseEvent>();

  getButtonClass(): string {
    const base = 'w-full px-6 py-2.5 rounded-md font-bold text-sm transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2';
    
    switch (this.type) {
      case 'secondary':
        return `${base} bg-slate-100 text-slate-700 hover:bg-slate-200`;
      case 'red-solid':
        return `${base} bg-rose-600 text-white hover:bg-rose-700 shadow-lg shadow-rose-500/20`;
      case 'primary-outline':
        return `${base} border border-primary-500 text-primary-500 hover:bg-primary-50`;
      default:
        return `${base} bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-500/20`;
    }
  }

  onClick(event: MouseEvent) {
    if (!this.disabled) {
      this.btnClick.emit(event);
    }
  }
}
