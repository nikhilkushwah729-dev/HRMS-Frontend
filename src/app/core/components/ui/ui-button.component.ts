import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonType = 'button' | 'submit' | 'reset';

@Component({
  selector: 'app-ui-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [type]="type"
      [disabled]="disabled || loading"
      [class]="buttonClass()"
      (click)="handleClick($event)"
    >
      <!-- Loading Spinner -->
      @if (loading) {
        <svg class="animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" [class]="spinnerClass()">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      }

      <!-- Left Icon -->
      @if (iconLeft && !loading) {
        <span [class]="iconClass()">
          <span [innerHTML]="iconLeft"></span>
        </span>
      }

      <!-- Button Text -->
      <span [class.textClass()]>
        @if (!iconLeft && !iconRight && loading) {
          {{ loadingText || 'Loading...' }}
        } @else {
          <ng-content></ng-content>
        }
      </span>

      <!-- Right Icon -->
      @if (iconRight && !loading) {
        <span [class]="iconClass()">
          <span [innerHTML]="iconRight"></span>
        </span>
      }
    </button>
  `,
  styles: [`
    :host {
      display: inline-block;
    }
  `]
})
export class UiButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() type: ButtonType = 'button';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() loadingText = '';
  @Input() fullWidth = false;
  @Input() iconLeft = '';
  @Input() iconRight = '';
  @Input() iconOnly = false;

  @Output() onClick = new EventEmitter<MouseEvent>();

  handleClick(event: MouseEvent) {
    if (!this.disabled && !this.loading) {
      this.onClick.emit(event);
    }
  }

  buttonClass(): string {
    const base = 'inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    // Size classes
    const sizes: Record<ButtonSize, string> = {
      sm: this.iconOnly ? 'w-8 h-8' : 'h-8 px-3 text-xs',
      md: this.iconOnly ? 'w-10 h-10' : 'h-11 px-4 text-sm',
      lg: this.iconOnly ? 'w-12 h-12' : 'h-12 px-6 text-base',
    };

    // Variant classes
    const variants: Record<ButtonVariant, string> = {
      primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-sm shadow-primary-500/25',
      secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 focus:ring-slate-500',
      success: 'bg-success text-white hover:bg-green-600 focus:ring-green-500 shadow-sm shadow-success/25',
      warning: 'bg-warning text-white hover:bg-amber-600 focus:ring-amber-500 shadow-sm shadow-warning/25',
      error: 'bg-error text-white hover:bg-red-600 focus:ring-red-500 shadow-sm shadow-error/25',
      info: 'bg-info text-white hover:bg-blue-600 focus:ring-blue-500 shadow-sm shadow-info/25',
      outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 focus:ring-primary-500',
      ghost: 'text-slate-600 hover:bg-slate-100 focus:ring-slate-500',
    };

    const widthClass = this.fullWidth ? 'w-full' : '';

    return `${base} ${sizes[this.size]} ${variants[this.variant]} ${widthClass}`.trim();
  }

  spinnerClass(): string {
    const sizes: Record<ButtonSize, string> = {
      sm: 'w-3.5 h-3.5',
      md: 'w-4 h-4',
      lg: 'w-5 h-5',
    };
    return sizes[this.size];
  }

  iconClass(): string {
    const sizes: Record<ButtonSize, string> = {
      sm: 'w-3.5 h-3.5',
      md: 'w-4 h-4',
      lg: 'w-5 h-5',
    };
    return `${sizes[this.size]} flex-shrink-0`;
  }

  textClass(): string {
    if (this.iconOnly) return 'sr-only';
    if (this.iconLeft) return 'ml-2';
    if (this.iconRight) return 'mr-2';
    return '';
  }
}

