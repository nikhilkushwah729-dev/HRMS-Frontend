import { Component, Input, forwardRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-ui-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiInputComponent),
      multi: true
    }
  ],
  template: `
    <div class="relative">
      @if (label) {
        <label class="block text-sm font-semibold text-slate-700 mb-2">
          {{ label }}
          @if (required) {
            <span class="text-red-500">*</span>
          }
        </label>
      }
      <div class="relative">
        @if (icon) {
          <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <span [class]="iconClass">{{ icon }}</span>
          </div>
        }
        <input
          [type]="type"
          [placeholder]="placeholder"
          [disabled]="disabled"
          [readonly]="readonly"
          [value]="value"
          (input)="onInput($event)"
          (blur)="onTouched()"
          [class]="inputClass()"
        />
        @if (suffix) {
          <div class="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
            <span class="text-slate-400 text-sm">{{ suffix }}</span>
          </div>
        }
      </div>
      @if (error) {
        <p class="mt-1.5 text-sm text-red-500">{{ error }}</p>
      }
      @if (hint && !error) {
        <p class="mt-1.5 text-xs text-slate-500">{{ hint }}</p>
      }
    </div>
  `
})
export class UiInputComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() placeholder = '';
  @Input() type = 'text';
  @Input() icon = '';
  @Input() iconClass = 'text-slate-400';
  @Input() suffix = '';
  @Input() error = '';
  @Input() hint = '';
  @Input() required = false;
  @Input() disabled = false;
  @Input() readonly = false;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() variant: 'default' | 'filled' | 'outline' = 'default';

  value = '';

  private onChange: (value: string) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(value: string): void {
    this.value = value || '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.value = val;
    this.onChange(val);
  }

  inputClass(): string {
    const base = 'w-full rounded-md transition-all duration-200 font-medium';
    const sizes: Record<string, string> = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-3 text-sm',
      lg: 'px-5 py-4 text-base'
    };
    const variants: Record<string, string> = {
      default: 'bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
      filled: 'bg-slate-50 border border-transparent text-slate-900 placeholder-slate-400 focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
      outline: 'bg-transparent border-2 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:ring-0'
    };
    const iconClass = this.icon ? 'pl-11' : '';
    const suffixClass = this.suffix ? 'pr-11' : '';
    const errorClass = this.error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : '';
    const disabledClass = this.disabled ? 'bg-slate-100 cursor-not-allowed opacity-60' : '';

    return `${base} ${sizes[this.size]} ${variants[this.variant]} ${iconClass} ${suffixClass} ${errorClass} ${disabledClass}`.trim();
  }
}

