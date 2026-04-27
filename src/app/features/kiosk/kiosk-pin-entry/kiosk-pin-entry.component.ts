import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-kiosk-pin-entry',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="mx-auto w-full max-w-xl rounded-[2rem] border border-white/15 bg-slate-950/70 p-8 text-white shadow-2xl backdrop-blur">
      <div class="flex items-center justify-between gap-4">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
            Secure Entry
          </p>
          <h2 class="mt-3 text-3xl font-semibold">Employee ID / PIN</h2>
        </div>
        <button
          type="button"
          (click)="cancel.emit()"
          class="rounded-2xl border border-white/10 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10"
        >
          Back
        </button>
      </div>

      <form
        [formGroup]="form"
        (ngSubmit)="submit()"
        class="mt-8 space-y-5"
      >
        <label class="block">
          <span class="mb-2 block text-sm font-medium text-white/70">
            Employee Code
          </span>
          <input
            formControlName="employeeCode"
            class="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-lg outline-none transition placeholder:text-white/30 focus:border-sky-300/70 focus:bg-white/10"
            placeholder="Enter employee code"
          />
        </label>

        <label class="block">
          <span class="mb-2 block text-sm font-medium text-white/70">
            Secure PIN
          </span>
          <input
            formControlName="pin"
            type="password"
            inputmode="numeric"
            class="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-lg outline-none transition placeholder:text-white/30 focus:border-sky-300/70 focus:bg-white/10"
            placeholder="Enter kiosk PIN"
          />
        </label>

        <button
          type="submit"
          [disabled]="form.invalid"
          class="w-full rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-400 px-6 py-4 text-lg font-semibold text-slate-950 transition hover:from-sky-400 hover:to-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Mark Attendance
        </button>
      </form>
    </section>
  `,
})
export class KioskPinEntryComponent {
  private fb = inject(FormBuilder);

  @Output() submitted = new EventEmitter<{
    employeeCode: string;
    pin: string;
  }>();
  @Output() cancel = new EventEmitter<void>();

  form = this.fb.nonNullable.group({
    employeeCode: ['', [Validators.required]],
    pin: ['', [Validators.required, Validators.minLength(4)]],
  });

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitted.emit(this.form.getRawValue());
  }
}
