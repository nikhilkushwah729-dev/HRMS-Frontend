import { Component, Input, Output, EventEmitter, forwardRef, signal, computed, inject, OnInit, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { COUNTRIES, CountryCodeData } from '../../constants/countries';

@Component({
  selector: 'app-ui-phone-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiPhoneInputComponent),
      multi: true
    }
  ],
  template: `
    <div class="relative w-full text-left font-sans">
      @if (label) {
        <label [class]="labelClass()">
          {{ label }}
          @if (required) {
            <span class="text-red-500 ml-1 font-bold">*</span>
          }
        </label>
      }

      <div [class]="containerClass()">
        
        <!-- Country Selector Trigger -->
        <div (click)="toggleDropdown($event)" [class]="triggerClass()">
          @if (getSelectedCountryFlagUrl()) {
            <img [src]="getSelectedCountryFlagUrl()" 
                 class="w-5 h-3.5 object-cover rounded-none shadow-sm border border-slate-100/10" 
                 [alt]="getSelectedCountry()?.name || 'flag'">
          }
          <span [class]="codeClass()">{{ getSelectedCountryCode() || '+0' }}</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" 
               class="text-slate-400 transition-transform duration-200" [class.rotate-180]="dropdownOpen()">
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </div>

        <!-- Phone Number Input -->
        <input
          type="tel"
          [placeholder]="placeholder"
          [disabled]="disabled"
          [value]="phoneNumber()"
          (input)="onPhoneInput($event)"
          (blur)="onBlur()"
          [class]="inputClass()"
        />

        <!-- Dropdown Panel -->
        @if (dropdownOpen()) {
          <div [class]="dropdownClass()">
            <!-- Search field inside dropdown -->
            <div class="px-3 pb-2 border-b border-slate-100/10">
              <div class="relative mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                </svg>
                 <input type="text" 
                        [ngModel]="searchQuery()"
                        (ngModelChange)="searchQuery.set($event)"
                        (click)="$event.stopPropagation()"
                        placeholder="Search country..."
                        [class]="searchClass()">
              </div>
            </div>

            <!-- Scrollable list of countries -->
            <div class="max-h-60 overflow-y-auto pt-1 custom-scrollbar">
              @for (c of filteredCountries(); track c.Id) {
                <div (click)="selectCountry(c.Id, $event)" 
                     [class]="itemClass(c.Id)">
                  <img [src]="'https://flagcdn.com/w40/' + c.flag.toLowerCase() + '.png'" 
                       class="w-5 h-3.5 object-cover rounded-none shadow-sm" [alt]="c.name">
                  <span class="text-sm font-medium transition-colors">{{ c.name }}</span>
                  <span class="ml-auto text-[10px] font-bold text-slate-400 tracking-tight group-hover/item:text-slate-500">+{{ c.code }}</span>
                </div>
              } @empty {
                <div class="px-4 py-3 text-xs text-slate-500 text-center">No countries found</div>
              }
            </div>
          </div>
        }
      </div>

      @if (error) {
        <p class="mt-1.5 text-xs text-red-500 font-medium">{{ error }}</p>
      }
      @if (hint && !error) {
        <p class="mt-1.5 text-[10px] text-slate-500 font-medium italic">{{ hint }}</p>
      }
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.2); border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(148, 163, 184, 0.4); }
  `]
})
export class UiPhoneInputComponent implements ControlValueAccessor, OnInit {
  private authService = inject(AuthService);
  private el = inject(ElementRef);

  @Input() label = '';
  @Input() placeholder = 'Enter phone number';
  @Input() required = false;
  @Input() hint = '';
  @Input() error = '';
  @Input() variant: 'default' | 'auth' = 'default';
  @Output() countryChange = new EventEmitter<CountryCodeData>();

  dropdownOpen = signal(false);
  searchQuery = signal('');
  countryCodes = signal<CountryCodeData[]>([...COUNTRIES]);
  disabled = false;

  phoneForm = {
    selectedCountryId: '93', // Default India in our list
  };
  
  phoneNumber = signal('');

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  labelClass(): string {
    return this.variant === 'auth' 
      ? 'block text-xs font-semibold text-slate-300 mb-2'
      : 'app-field-label block mb-2';
  }

  containerClass(): string {
    const base = 'country-picker-container relative flex items-center transition-all duration-300 group h-[46px]';
    let classes = this.variant === 'auth'
      ? `${base} bg-slate-900/60 border border-slate-700 rounded-md focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500/20`
      : `${base} bg-white border border-slate-200 rounded-md focus-within:border-primary-400 focus-within:ring-4 focus-within:ring-primary-500/10`;
    
    if (this.error) classes += ' border-red-500';
    if (this.disabled) {
      classes += ' opacity-60';
      classes += this.variant === 'auth' ? ' bg-slate-900/40' : ' bg-slate-50';
    }
    
    return classes;
  }

  triggerClass(): string {
    const base = 'flex items-center gap-2 px-3 h-full cursor-pointer transition-colors border-r';
    return this.variant === 'auth'
      ? `${base} border-slate-700 hover:bg-white/5 rounded-l-md min-w-[90px]`
      : `${base} border-slate-100 hover:bg-slate-50/80 rounded-l-md min-w-[90px]`;
  }

  codeClass(): string {
    return this.variant === 'auth'
      ? 'text-sm font-bold text-slate-200 whitespace-nowrap'
      : 'text-sm font-bold text-slate-700 whitespace-nowrap';
  }

  inputClass(): string {
    const base = 'flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium placeholder-slate-600 px-4 h-full outline-none';
    return this.variant === 'auth'
      ? `${base} text-slate-200`
      : `${base} text-slate-700`;
  }

  dropdownClass(): string {
    const base = 'absolute top-full left-0 mt-2 w-72 border shadow-2xl py-2 z-[100] animate-in fade-in zoom-in-95 duration-200 origin-top-left overflow-hidden';
    return this.variant === 'auth'
      ? `${base} bg-slate-800 border-slate-700 rounded-md`
      : `${base} bg-white border-slate-200 rounded-md`;
  }

  searchClass(): string {
    const base = 'w-full pl-9 pr-4 py-2 text-sm outline-none transition-all';
    return this.variant === 'auth'
      ? `${base} bg-slate-900/60 border border-slate-700 rounded-md text-slate-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 placeholder-slate-600`
      : `${base} bg-slate-50 border border-slate-100 rounded-md text-slate-700 focus:border-primary-400 focus:ring-1 focus:ring-primary-400/20 placeholder-slate-400`;
  }

  itemClass(id: string): string {
    const base = 'flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors group/item';
    const active = this.phoneForm.selectedCountryId === id;
    
    if (this.variant === 'auth') {
      return `${base} ${active ? 'bg-primary-500/10 text-primary-400' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`;
    } else {
      return `${base} ${active ? 'bg-primary-50 text-primary-600' : 'text-slate-700 hover:bg-slate-50'}`;
    }
  }

  filteredCountries = computed(() => {
    const search = this.searchQuery().toLowerCase().trim();
    const codes = this.countryCodes();
    if (!search) return codes;
    return codes.filter(c => 
      c.name.toLowerCase().includes(search) || 
      c.code.includes(search)
    );
  });

  ngOnInit() {
    this.loadCountries();
  }

  private loadCountries() {
    // Initial data is already set from COUNTRIES constant
    this.authService.getCountries().subscribe({
      next: (countries) => {
        if (countries && countries.length > 0) {
          // Merge API data if needed, but preserve our high-quality static list if possible
          const apiMapped = countries.map(c => ({
            Id: (c.id || c.Id).toString(),
            flag: c.flag || c.flagCode,
            code: c.code || c.countryCode,
            name: c.name,
            phoneNumberLength: c.phoneNumberLength || 10
          }));
          
          if (apiMapped.length > 0) {
             this.countryCodes.set(apiMapped);
          }
        }
        this.detectCountry();
      },
      error: () => {
        // Fallback to static data is already handled by initializing with COUNTRIES
        this.detectCountry();
      }
    });
  }

  private detectCountry() {
    this.authService.getUserCountry().subscribe({
      next: (res) => {
        if (res && res.country_code && !this.phoneNumber()) {
          const country = this.countryCodes().find(c => c.flag.toUpperCase() === res.country_code.toUpperCase());
          if (country) {
            this.phoneForm.selectedCountryId = country.Id;
            this.updateValue();
          }
        }
      }
    });
  }

  // ControlValueAccessor methods
  writeValue(value: string): void {
    if (!value) {
      this.phoneNumber.set('');
      return;
    }

    const trimmedValue = value.trim();
    if (trimmedValue.startsWith('+')) {
      const sorted = [...this.countryCodes()].sort((a,b) => b.code.length - a.code.length);
      const valWithoutPlus = trimmedValue.substring(1).replace(/\s/g, ''); // Remove spaces
      
      const country = sorted.find(c => valWithoutPlus.startsWith(c.code));
      if (country) {
        this.phoneForm.selectedCountryId = country.Id;
        this.phoneNumber.set(valWithoutPlus.substring(country.code.length));
      } else {
        this.phoneNumber.set(trimmedValue);
      }
    } else {
      this.phoneNumber.set(trimmedValue.replace(/\D/g, ''));
    }
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

  onPhoneInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const start = input.selectionStart;
    
    const val = input.value.replace(/\D/g, '');
    this.phoneNumber.set(val);
    this.updateValue();
    
    // Restore cursor position after Angular's built-in reset on model change
    if (start !== null) {
      setTimeout(() => {
        if (input) {
           const pos = Math.min(start, val.length);
           input.setSelectionRange(pos, pos);
        }
      });
    }
  }

  onBlur() {
    this.onTouched();
  }

  toggleDropdown(event: Event) {
    if (this.disabled) return;
    event.stopPropagation();
    this.dropdownOpen.update(v => !v);
    if (this.dropdownOpen()) {
      this.searchQuery.set('');
    }
  }

  selectCountry(id: string, event: Event) {
    event.stopPropagation();
    this.phoneForm.selectedCountryId = id;
    this.dropdownOpen.set(false);
    
    const country = this.getSelectedCountry();
    if (country) {
      this.countryChange.emit(country);
    }
    
    this.updateValue();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.country-picker-container')) {
      this.dropdownOpen.set(false);
    }
  }

  private updateValue() {
    const country = this.getSelectedCountry();
    // Emit only the raw phone digits without the country code prefix
    const val = this.phoneNumber();
    this.onChange(val);
    
    // Parent components like LoginComponent listen to countryChange to stay in sync
    if (country) {
      this.countryChange.emit(country);
    }
  }

  getSelectedCountry(): CountryCodeData | undefined {
    return this.countryCodes().find(c => c.Id === this.phoneForm.selectedCountryId);
  }

  getSelectedCountryCode(): string {
    const country = this.getSelectedCountry();
    return country ? `+${country.code}` : '';
  }

  getSelectedCountryFlagUrl(): string {
    const country = this.getSelectedCountry();
    if (!country) return '';
    return `https://flagcdn.com/w40/${country.flag.toLowerCase()}.png`;
  }
}
