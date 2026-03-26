import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-otp-popup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (isOpen) {
      <div 
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        (click)="allowOutsideClick && closePopup()"
      >
        <div 
          class="w-full max-w-md mx-4 bg-white rounded-xl shadow-2xl overflow-hidden"
          (click)="$event.stopPropagation()"
        >

          <div class="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-5">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <div>
                  <h3 class="text-lg font-bold text-white">Verify Your Identity</h3>
                  <p class="text-xs text-primary-100">Enter the 6-digit code</p>
                </div>
              </div>
              <button (click)="closePopup()" class="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
          </div>

          <div class="p-6">
            <div class="flex items-center justify-center gap-2 mb-6 p-3 bg-slate-50 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-slate-400"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              <span class="text-sm font-medium text-slate-700">{{ maskedEmail }}</span>
            </div>

            <div class="mb-4">
              <label class="block text-xs font-semibold text-slate-700 mb-2">Verification Code</label>
              <div class="flex gap-2 justify-between">
                @for (i of [0,1,2,3,4,5]; track i) {
                  <input
                    #otpInput
                    type="text"
                    maxlength="1"
                    inputmode="numeric"
                    class="otp-input w-12 h-12 text-center text-lg font-bold rounded-lg border-2 border-slate-200 focus:border-primary-500 outline-none transition-all"
                    [class.border-red-500]="otpError"
                    [value]="otpDigits[i]"
                    (input)="onOtpInput($event, i)"
                  />
                }
              </div>
              @if (otpError) {
                <p class="text-xs text-red-500 mt-2">{{ otpError }}</p>
              }
            </div>

            <div class="flex items-center justify-between text-xs mb-6">
              @if (resendTimer > 0) {
                <span class="text-slate-500">Resend in <span class="font-semibold text-primary-600">{{ resendTimer }}s</span></span>
              } @else {
                <span></span>
              }
              <button type="button" (click)="resendOtp()" [disabled]="resendTimer > 0 || resending" class="text-primary-600 font-semibold hover:text-primary-700 disabled:text-slate-400">
                @if (resending) { Sending... } @else { Resend OTP }
              </button>
            </div>

            <div class="flex gap-3">
              <button type="button" (click)="closePopup()" class="flex-1 h-11 rounded-lg border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50">Cancel</button>
              <button type="button" (click)="verifyOtp()" [disabled]="otpDigits.join('').length < 6 || verifying" class="flex-1 h-11 rounded-lg bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold text-sm disabled:opacity-50">
                @if (verifying) { Verifying... } @else { Verify }
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; }
    .otp-input { caret-color: transparent; }
    .otp-input::-webkit-outer-spin-button, .otp-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
    .otp-input[type=number] { -moz-appearance: textfield; }
  `]
})
export class OtpPopupComponent implements OnInit, OnDestroy {
  @Input() isOpen = false;
  @Input() email = '';
  @Input() allowOutsideClick = true;
  @Input() showLoader = false;
  
  @Output() otpVerified = new EventEmitter<string>();
  @Output() otpResent = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  @ViewChild('otpInput') otpInputRefs!: ElementRef<HTMLInputElement>;

  otpDigits: string[] = ['', '', '', '', '', ''];
  otpError = '';
  resendTimer = 0;
  resending = false;
  verifying = false;
  maskedEmail = '';
  private timerInterval: any;

  ngOnInit() {
    this.updateMaskedEmail();
    this.startTimer();
  }

  ngOnDestroy() {
    this.clearTimer();
  }

  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  ngOnChanges(value: any) {
    if (value.isOpen && value.isOpen.currentValue === true) {
      // Focus first input when popup opens
      setTimeout(() => {
        const inputs = document.querySelectorAll('.otp-input') as NodeListOf<HTMLInputElement>;
        inputs[0]?.focus();
      }, 100);
    }
  }

  updateMaskedEmail() {
    if (this.email) {
      const [local, domain] = this.email.split('@');
      if (local && domain) {
        const maskedLocal = local.length > 2 ? local.substring(0, 2) + '*'.repeat(local.length - 2) : local;
        this.maskedEmail = `${maskedLocal}@${domain}`;
      }
    }
  }

  startTimer() {
    this.resendTimer = 60;
    this.timerInterval = setInterval(() => {
      if (this.resendTimer > 0) this.resendTimer--;
      else this.clearTimer();
    }, 1000);
  }

  clearTimer() {
    if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = null; }
  }

  onOtpInput(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '');
    this.otpDigits[index] = value ? value.slice(-1) : '';
    this.otpError = '';
    if (value && index < 5) {
      const nextInput = document.querySelectorAll('.otp-input')[index + 1] as HTMLInputElement;
      nextInput?.focus();
    }
    if (this.otpDigits.join('').length === 6) setTimeout(() => this.verifyOtp(), 300);
  }

  verifyOtp() {
    const otp = this.otpDigits.join('');
    if (otp.length < 6) { this.otpError = 'Please enter the complete 6-digit code'; return; }
    this.verifying = true;
    this.otpError = '';
    this.otpVerified.emit(otp);
  }

  resendOtp() {
    if (this.resendTimer > 0 || this.resending) return;
    this.resending = true;
    this.otpResent.emit();
    setTimeout(() => {
      this.resending = false;
      this.startTimer();
      this.otpDigits = ['', '', '', '', '', ''];
      this.otpError = '';
      // Focus first input after resend
      setTimeout(() => {
        const inputs = document.querySelectorAll('.otp-input') as NodeListOf<HTMLInputElement>;
        inputs[0]?.focus();
      }, 100);
    }, 1500);
  }

  closePopup() {
    this.closed.emit();
    this.otpDigits = ['', '', '', '', '', ''];
    this.otpError = '';
  }

  setError(message: string) {
    this.otpError = message;
    this.verifying = false;
  }
}

