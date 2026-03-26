import { Component, Input, Output, EventEmitter, forwardRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

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
      multi: true
    }
  ],
  template: `
    <div class="relative w-full" #selectContainer>
      @if (label) {
        <label class="block text-sm font-semibold text-slate-700 mb-1.5">
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
        @if (selectedOption()?.avatar) {
          <img 
            [src]="selectedOption()?.avatar" 
            [alt]="selectedOption()?.label"
            class="w-5 h-5 rounded-full bg-slate-100 object-cover"
          />
        } @else if (selectedOption()?.icon) {
          <span class="text-slate-400" [innerHTML]="selectedOption()?.icon"></span>
        }
        
        <span class="truncate flex-1 text-left" [class.text-slate-400]="!selectedOption()">
          @if (selectedOption()) {
            {{ selectedOption()?.label }}
            @if (selectedOption()?.description) {
              <span class="text-slate-400 text-xs ml-1">- {{ selectedOption()?.description }}</span>
            }
          } @else {
            {{ placeholder }}
          }
        </span>
        
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          stroke-width="2" 
          class="text-slate-400 transition-transform duration-200"
          [class.rotate-180]="isOpen()"
        >
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>

      <!-- Dropdown Panel -->
      @if (isOpen()) {
        <div 
          class="absolute z-50 w-full mt-2 bg-white rounded-md border border-slate-200 shadow-lg overflow-hidden"
          [class.max-h-72]="!fullHeight"
        >
          <!-- Search -->
          @if (searchable) {
            <div class="p-2 border-b border-slate-100 bg-slate-50">
              <div class="relative">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                </svg>
                <input
                  type="text"
                  [placeholder]="searchPlaceholder"
                  [(ngModel)]="searchQuery"
                  (ngModelChange)="onSearch($event)"
                  (click)="$event.stopPropagation()"
                  class="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md bg-white focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10"
                />
              </div>
            </div>
          }

          <!-- Options List -->
          <div class="overflow-y-auto" [class.max-h-48]="!fullHeight" [class.p-1]="dense">
            @if (filteredOptions().length === 0) {
              <div class="px-4 py-8 text-center text-slate-400 text-sm">
                {{ noResultsText }}
              </div>
            } @else {
              @for (option of filteredOptions(); track option.value; let i = $index) {
                <button
                  type="button"
                  [disabled]="option.disabled"
                  (click)="selectOption(option)"
                  (mouseenter)="hoveredIndex = i"
                  (mouseleave)="hoveredIndex = -1"
                  [class]="getOptionClass(option, i)"
                >
                  @if (option.avatar) {
                    <img 
                      [src]="option.avatar" 
                      [alt]="option.label"
                      class="w-5 h-5 rounded-full bg-slate-100 object-cover"
                    />
                  } @else if (option.icon) {
                    <span class="text-slate-400" [innerHTML]="option.icon"></span>
                  } @else if (showRadio) {
                    <div class="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                      [class.border-primary-600]="value === option.value"
                      [class.border-slate-300]="value !== option.value"
                    >
                      @if (value === option.value) {
                        <div class="w-2 h-2 rounded-full bg-primary-600"></div>
                      }
                    </div>
                  }
                  
                  <div class="flex-1 text-left">
                    <div class="font-medium">{{ option.label }}</div>
                    @if (option.description) {
                      <div class="text-xs text-slate-400">{{ option.description }}</div>
                    }
                  </div>

                  @if (value === option.value && !showRadio) {
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-primary-600">
                      <path d="M20 6 9 17l-5-5"/>
                    </svg>
                  }
                </button>
              }
            }
          </div>

          <!-- Footer -->
          @if (showFooter) {
            <div class="p-2 border-t border-slate-100 bg-slate-50 text-xs text-slate-500 flex justify-between">
              <span>{{ filteredOptions().length }} {{ filteredOptions().length === 1 ? 'option' : 'options' }}</span>
              @if (allowClear && value) {
                <button 
                  type="button"
                  (click)="clearValue(); $event.stopPropagation()"
                  class="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Clear
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
  styles: [`
    :host {
      display: block;
    }
  `]
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

  selectedOption = computed(() => {
    return this.options.find(o => o.value === this.value) || null;
  });

  ngOnInit() {
    this.filteredOptions.set(this.options);
    this.setupClickOutside();
  }

  ngOnChanges() {
    this.onSearch(this.searchQuery);
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
        this.options.filter(opt => 
          opt.label.toLowerCase().includes(lowerQuery) ||
          opt.description?.toLowerCase().includes(lowerQuery)
        )
      );
    }
  }

  selectOption(option: SelectOption) {
    if (option.disabled) return;
    this.value = option.value;
    this.onChange(option.value);
    this.close();
  }

  clearValue() {
    this.value = null;
    this.onChange(null);
  }

  triggerClass(): string {
    const sizes: Record<string, string> = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-2.5 text-sm',
      lg: 'px-4 py-3 text-base'
    };
    
    const base = 'w-full rounded-md transition-all duration-200 font-medium flex items-center gap-3 bg-white border';
    const errorClass = this.error ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-primary-500';
    const disabledClass = this.disabled ? 'bg-slate-100 cursor-not-allowed opacity-60' : 'hover:border-slate-300 focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500';
    
    return `${base} ${errorClass} ${disabledClass} ${sizes[this.size]}`.trim();
  }

  getOptionClass(option: SelectOption, index: number): string {
    const isSelected = this.value === option.value;
    const isHovered = this.hoveredIndex === index;
    
    let base = 'w-full text-left px-3 py-2.5 text-sm transition-colors flex items-center gap-3 rounded-md';
    
    if (isSelected) {
      base += ' bg-primary-50 text-primary-700';
    } else if (isHovered) {
      base += ' bg-slate-50 text-slate-900';
    } else {
      base += ' text-slate-700';
    }
    
    if (option.disabled) {
      base += ' opacity-50 cursor-not-allowed';
    } else {
      base += ' cursor-pointer';
    }
    
    return base;
  }
}

