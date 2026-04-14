import { NgClass } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { generateRandomString } from '../../../utils/utils';

@Component({
  selector: 'app-custom-button',
  standalone: true,
  imports: [NgClass],
  templateUrl: './custom-button.component.html',
  styleUrl: './custom-button.component.css'
})
export class CustomButtonComponent {
  @Input() type: 'primary-solid' | 'primary-outline' | 'active-outline' | 'active-solid' | 'secondary-solid' | 'secondary-outline' | 'orange-outline' | 'orange-solid' | 'amber-solid' | 'link-solid' | 'no-background' | 'red-solid' | 'primary-solid-rounded' | 'yellow-solid' = 'primary-solid'
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() btnType: 'submit' | 'button' | 'menu' | 'reset' = 'button';
  @Input() disabled: boolean = false;
  @Input() addClass: string = '';
  @Input() showLoader: boolean = false;
  @Input() alignLeft: boolean = false;
  @Input() isDropDown: boolean = false;
  @Output() btnClick = new EventEmitter<MouseEvent>();

  id = '';
  rippleId: any = '';

  private baseClasses = 'focus:outline-none box-border transition-all duration-200 active:scale-95 inline-flex items-center gap-2';
  private typeClasses: { [key: string]: string } = {
    'primary-solid': 'rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-100 disabled:bg-indigo-300',
    'primary-solid-rounded': 'rounded-full font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-100 disabled:bg-indigo-300',
    'primary-outline': 'rounded-xl font-bold text-indigo-600 bg-transparent hover:bg-indigo-50 border-2 border-indigo-600 disabled:border-indigo-200 disabled:text-indigo-200',
    'active-solid': 'rounded-xl font-bold text-white bg-gradient-to-br from-indigo-600 to-violet-600 hover:shadow-lg hover:shadow-indigo-200 disabled:from-indigo-300 disabled:to-violet-300',
    'secondary-solid': 'rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-300',
    'secondary-outline': 'rounded-xl font-bold text-slate-600 bg-transparent hover:bg-slate-50 border-2 border-slate-200',
    'red-solid': 'rounded-xl font-bold text-white bg-rose-500 hover:bg-rose-600 shadow-sm shadow-rose-100',
    'amber-solid': 'rounded-xl font-bold text-white bg-amber-500 hover:bg-amber-600 shadow-sm shadow-amber-100',
    'no-background': 'rounded-xl font-bold text-slate-600 hover:bg-slate-50',
  };

  private sizeClasses = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-5 py-3 text-sm',
    lg: 'px-6 py-4 text-base'
  };

  constructor() {
    this.id = generateRandomString(10);
  }

  createRipple(event: MouseEvent) {
    const button = event.currentTarget as HTMLElement;
    const ripple = button.querySelector('.ripple') as HTMLElement;
    if (ripple) {
      ripple.classList.remove('animate-ripple');
      clearTimeout(this.rippleId);
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = event.clientX - rect.left - size / 2;
      const y = event.clientY - rect.top - size / 2;

      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      ripple.classList.add('animate-ripple');

      this.rippleId = setTimeout(() => {
        ripple.classList.remove('animate-ripple');
      }, 600);
    }
  }

  get buttonClasses(): string {
    return [
      this.baseClasses,
      this.sizeClasses[this.size],
      this.typeClasses[this.type] || this.typeClasses['primary-solid'],
      this.disabled ? 'opacity-50 cursor-not-allowed' : '',
      this.alignLeft ? 'justify-start' : 'justify-center',
      this.addClass
    ].join(' ');
  }

  onInternalClick(event: MouseEvent): void {
    if (!this.disabled && !this.showLoader) {
      this.createRipple(event);
      this.btnClick.emit(event);
    }
  }
}
