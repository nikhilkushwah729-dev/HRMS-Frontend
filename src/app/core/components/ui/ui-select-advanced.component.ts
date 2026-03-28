import {
  Component,
  Input,
  Output,
  EventEmitter,
  forwardRef,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  FormsModule,
} from '@angular/forms';

export interface SelectOption {
  label: string;
  value: any;
  disabled?: boolean;
  icon?: string;
  avatar?: string;
  description?: string;
}

@Component({
  selector: 'app-ui-select-advanced',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiSelectAdvancedComponent),
      multi: true,
    },
  ],
  template: `
    <div class="relative w-full" #selectContainer>
      @if (label) {
        <label class="block text-sm font-medium text-slate-700 mb-1.5">
          {{ label }}
          @if (required) {
            <span class="text-red-500">*</span>
          }
        </label>
      }

      <!-- Trigger Button -->
      <button
        type="button"
        [disabled]="disabled"
        (click)="toggleDropdown()"
        [class]="triggerClass()"
      >
        <span class="flex items-center gap-3 flex-1 truncate">
          @if (selectedOption?.avatar) {
            <img
              [src]="selectedOption?.avatar"
              [alt]="selectedOption?.label"
              class="w-5 h-5 rounded-full bg-slate-100 object-cover"
            />
          } @else if (selectedOption?.icon) {
            <span
              class="text-slate-400 flex items-center"
              [innerHTML]="selectedOption?.icon"
            ></span>
          }

          <span
            class="truncate text-left"
            [class.text-slate-400]="!selectedOption"
          >
            @if (selectedOption) {
              {{ selectedOption?.label }}
            } @else {
              {{ placeholder }}
            }
          </span>
        </span>

        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          class="text-slate-400 transition-transform duration-300"
          [class.rotate-180]="isOpen()"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      <!-- Dropdown Panel -->
      @if (isOpen()) {
        <div
          class="absolute z-50 w-full mt-2 bg-white rounded-md border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden transform transition-all duration-200 origin-top animate-dropdown"
          [class.max-h-80]="!fullHeight"
        >
          <!-- Search -->
          @if (searchable) {
            <div class="p-3 border-b border-slate-100 bg-slate-50/50">
              <div class="relative group">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <input
                  type="text"
                  [placeholder]="searchPlaceholder"
                  [(ngModel)]="searchQuery"
                  (ngModelChange)="onSearch($event)"
                  (click)="$event.stopPropagation()"
                  class="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>
          }

          <!-- Options List -->
          <div
            class="overflow-y-auto py-1"
            [class.max-h-56]="!fullHeight"
            [class.p-1]="dense"
          >
            @if (filteredOptions().length === 0) {
              <div class="px-4 py-8 text-center text-slate-400 text-sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  class="mx-auto mb-2 opacity-20"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                {{ noResultsText }}
              </div>
            } @else {
              @for (
                option of filteredOptions();
                track option.value;
                let i = $index
              ) {
                <button
                  type="button"
                  [disabled]="option.disabled"
                  (click)="selectOption(option)"
                  (mouseenter)="hoveredIndex = i"
                  (mouseleave)="hoveredIndex = -1"
                  [class]="getOptionClass(option, i)"
                >
                  <div class="flex items-center gap-3 flex-1 min-w-0">
                    @if (option.avatar) {
                      <img
                        [src]="option.avatar"
                        [alt]="option.label"
                        class="w-6 h-6 rounded-full bg-slate-100 object-cover ring-1 ring-slate-100"
                      />
                    } @else if (option.icon) {
                      <span
                        class="text-slate-400"
                        [innerHTML]="option.icon"
                      ></span>
                    }

                    <div class="flex flex-col min-w-0">
                      <span
                        class="truncate font-medium transition-colors"
                        [class.text-primary-700]="value === option.value"
                      >
                        {{ option.label }}
                      </span>
                      @if (option.description) {
                        <span class="text-[11px] text-slate-400 truncate">{{
                          option.description
                        }}</span>
                      }
                    </div>
                  </div>

                  @if (value === option.value) {
                    <div
                      class="flex items-center justify-center w-5 h-5 rounded-full bg-primary-100 text-primary-600 animate-in zoom-in duration-200"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="3"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  }
                </button>
              }
            }
          </div>

          <!-- Footer -->
          @if (showFooter) {
            <div
              class="px-3 py-2 border-t border-slate-100 bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex justify-between items-center"
            >
              <span
                >{{ filteredOptions().length }}
                {{
                  filteredOptions().length === 1 ? 'option' : 'options'
                }}</span
              >
              @if (allowClear && value) {
                <button
                  type="button"
                  (click)="clearValue(); $event.stopPropagation()"
                  class="text-primary-600 hover:text-primary-700 hover:underline transition-all"
                >
                  Reset selection
                </button>
              }
            </div>
          }
        </div>
      }

      @if (error) {
        <p class="mt-1.5 text-sm text-red-500">{{ error }}</p>
      }
      @if (hint && !error) {
        <p class="mt-1.5 text-xs text-slate-500">{{ hint }}</p>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      @keyframes dropdown {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .animate-dropdown {
        animation: dropdown 0.2s cubic-bezier(0, 0, 0.2, 1);
      }
    `,
  ],
})
export class UiSelectAdvancedComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() placeholder = 'Select an option';
  @Input() options: SelectOption[] = [];
  @Input() error = '';
  @Input() hint = '';
  @Input() required = false;
  @Input() disabled = false;
  @Input() searchable = true;
  @Input() showRadio = false;
  @Input() showFooter = true;
  @Input() allowClear = true;
  @Input() fullHeight = false;
  @Input() dense = false;
  @Input() searchPlaceholder = 'Search...';
  @Input() noResultsText = 'No results found';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  value: any = null;
  isOpen = signal(false);
  searchQuery = '';
  hoveredIndex = -1;
  filteredOptions = signal<SelectOption[]>([]);

  private onChange: (value: any) => void = () => {};
  onTouched: () => void = () => {};

  selectedOption: SelectOption | null = null;

  private updateSelectedOption() {
    this.selectedOption =
      this.options.find((o) => o.value === this.value) || null;
  }

  ngOnInit() {
    this.filteredOptions.set(this.options);
    this.updateSelectedOption();
    this.setupClickOutside();
  }

  ngOnChanges() {
    this.onSearch(this.searchQuery);
    this.updateSelectedOption();
  }

  private setupClickOutside() {
    if (typeof document !== 'undefined') {
      setTimeout(() => {
        document.addEventListener('click', this.handleClickOutside.bind(this));
      }, 0);
    }
  }

  private handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('app-ui-select-advanced')) {
      this.close();
    }
  }

  writeValue(value: any): void {
    this.value = value;
    this.updateSelectedOption();
  }

  registerOnChange(fn: (value: any) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  toggleDropdown() {
    if (this.disabled) return;

    if (this.isOpen()) {
      this.close();
    } else {
      this.isOpen.set(true);
      this.searchQuery = '';
      this.onSearch('');
    }
  }

  close() {
    this.isOpen.set(false);
    this.onTouched();
  }

  onSearch(query: string) {
    this.searchQuery = query;
    if (!query.trim()) {
      this.filteredOptions.set(this.options);
    } else {
      const lowerQuery = query.toLowerCase();
      this.filteredOptions.set(
        this.options.filter(
          (opt) =>
            opt.label.toLowerCase().includes(lowerQuery) ||
            opt.description?.toLowerCase().includes(lowerQuery),
        ),
      );
    }
  }

  selectOption(option: SelectOption) {
    if (option.disabled) return;
    this.value = option.value;
    this.updateSelectedOption();
    this.onChange(option.value);
    this.close();
  }

  clearValue() {
    this.value = null;
    this.updateSelectedOption();
    this.onChange(null);
  }

  triggerClass(): string {
    const sizes: Record<string, string> = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-2.5 text-sm',
      lg: 'px-4 py-3 text-base',
    };

    const base =
      'w-full rounded-md transition-all duration-300 font-medium flex items-center justify-between gap-3 bg-white border shadow-sm hover:shadow-md active:scale-[0.99] outline-none';
    const errorClass = this.error
      ? 'border-red-500 ring-4 ring-red-500/10'
      : 'border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10';
    const disabledClass = this.disabled
      ? 'bg-slate-50 cursor-not-allowed opacity-60 grayscale shadow-none'
      : 'cursor-pointer';

    return `${base} ${errorClass} ${disabledClass} ${sizes[this.size]}`.trim();
  }

  getOptionClass(option: SelectOption, index: number): string {
    const isSelected = this.value === option.value;
    const isHovered = this.hoveredIndex === index;

    let base =
      'w-full text-left px-3 py-2.5 text-sm transition-all duration-200 flex items-center justify-between gap-3 rounded-lg mx-1 w-[calc(100%-8px)]';

    if (isSelected) {
      base +=
        ' bg-primary-50 text-primary-700 font-semibold ring-1 ring-primary-500/10 shadow-sm';
    } else if (isHovered) {
      base += ' bg-slate-50 text-slate-900 translate-x-1';
    } else {
      base += ' text-slate-600 hover:text-slate-900';
    }

    if (option.disabled) {
      base += ' opacity-40 cursor-not-allowed grayscale';
    } else {
      base += ' cursor-pointer';
    }

    return base;
  }
}
