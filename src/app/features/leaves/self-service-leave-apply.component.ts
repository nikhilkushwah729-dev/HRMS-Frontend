import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  LeaveApplyPayload,
  LeaveService,
  LeaveTypeBalance,
} from '../../core/services/leave.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-self-service-leave-apply',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="mx-auto max-w-6xl space-y-6">
      <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p class="text-[11px] font-black uppercase tracking-[0.24em] text-emerald-600">Apply Leave</p>
            <h1 class="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Create a new leave request</h1>
            <p class="mt-2 max-w-2xl text-sm text-slate-500">
              Choose leave type, duration, dates, attachment, and request reason. This page is dedicated to employee self-service only.
            </p>
          </div>
          <a
            routerLink="/self-service/leave"
            class="inline-flex items-center justify-center rounded-xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
          >
            Back to My Leave
          </a>
        </div>
      </section>

      <section class="grid gap-5 xl:grid-cols-[1fr_0.7fr]">
        <form [formGroup]="form" (ngSubmit)="submit()" class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div class="grid gap-5 md:grid-cols-2">
            <div class="md:col-span-2">
              <label class="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">Leave Type</label>
              <select formControlName="leaveTypeId" class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400">
                <option [ngValue]="null">Select leave type</option>
                @for (type of leaveTypes(); track type.id) {
                  <option [ngValue]="type.id">{{ type.typeName }} ({{ type.remaining }} left)</option>
                }
              </select>
            </div>

            <div>
              <label class="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">Duration</label>
              <select formControlName="durationType" class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400">
                <option value="full_day">Full day</option>
                <option value="half_day">Half day</option>
              </select>
            </div>

            <div>
              <label class="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">Request Mode</label>
              <select formControlName="requestKind" class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400">
                <option value="leave">Leave</option>
                <option value="short-day">Short Day</option>
                <option value="under-time">Under-time</option>
                <option value="wfh">WFH</option>
                <option value="outdoor-duty">Outdoor Duty</option>
              </select>
            </div>

            <div>
              <label class="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">Start Date</label>
              <input type="date" formControlName="startDate" class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400" />
            </div>

            <div>
              <label class="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">End Date</label>
              <input type="date" formControlName="endDate" class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400" />
            </div>

            @if (form.value.durationType === 'half_day') {
              <div class="md:col-span-2">
                <label class="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">Half Day Session</label>
                <div class="grid gap-3 sm:grid-cols-2">
                  <label class="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700">
                    <input type="radio" formControlName="halfDaySession" value="first_half" />
                    First Half
                  </label>
                  <label class="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700">
                    <input type="radio" formControlName="halfDaySession" value="second_half" />
                    Second Half
                  </label>
                </div>
              </div>
            }

            <div class="md:col-span-2">
              <label class="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">Reason / Description</label>
              <textarea formControlName="reason" rows="5" class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400" placeholder="Explain the leave reason, travel plan, medical note, or manager context."></textarea>
            </div>

            <div class="md:col-span-2">
              <label class="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">Attachment</label>
              <label class="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-center transition hover:border-emerald-300 hover:bg-emerald-50/30">
                <span class="text-sm font-black text-slate-700">Upload supporting document</span>
                <span class="mt-1 text-xs text-slate-500">Sick leave certificate, approval note, or proof document</span>
                <input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" class="hidden" (change)="onFileSelected($event)" />
              </label>
              @if (attachmentName()) {
                <p class="mt-2 text-sm font-semibold text-slate-600">Attached: {{ attachmentName() }}</p>
              }
            </div>
          </div>

          <div class="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <a routerLink="/self-service/leave" class="inline-flex items-center justify-center rounded-xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50">
              Cancel
            </a>
            <button type="submit" [disabled]="form.invalid || submitting()" class="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-100 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">
              {{ submitting() ? 'Submitting...' : 'Submit Leave Request' }}
            </button>
          </div>
        </form>

        <div class="space-y-5">
          <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 class="text-lg font-black text-slate-900">Available Leave Balance</h2>
            <p class="mt-1 text-sm text-slate-500">Pick a leave type with enough remaining balance before you apply.</p>
            <div class="mt-4 space-y-3">
              @for (balance of leaveTypes(); track balance.id) {
                <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div class="flex items-center justify-between gap-3">
                    <div>
                      <p class="text-sm font-black text-slate-900">{{ balance.typeName }}</p>
                      <p class="mt-1 text-xs text-slate-500">{{ balance.isPaid ? 'Paid' : 'Unpaid' }} • {{ balance.carryForward ? 'Carry forward enabled' : 'No carry forward' }}</p>
                    </div>
                    <span class="rounded-full px-3 py-1 text-xs font-black" [style.background]="balance.color + '18'" [style.color]="balance.color">
                      {{ balance.remaining }} left
                    </span>
                  </div>
                </div>
              }
            </div>
          </article>

          <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 class="text-lg font-black text-slate-900">Request Guidance</h2>
            <div class="mt-4 space-y-3 text-sm text-slate-500">
              <p>Use full day for planned absence and half day when you need only one session off.</p>
              <p>Attach a supporting document for medical or exceptional requests whenever needed.</p>
              <p>Pending requests can be cancelled from your leave history before approval.</p>
              <p>WFH, outdoor duty, short day, and under-time are routed through the same employee request workflow but remain visible only to your approvers.</p>
            </div>
          </article>
        </div>
      </section>
    </div>
  `,
})
export class SelfServiceLeaveApplyComponent {
  private readonly fb = inject(FormBuilder);
  private readonly leaveService = inject(LeaveService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly leaveTypes = signal<LeaveTypeBalance[]>([]);
  readonly submitting = signal(false);
  readonly attachmentName = signal('');
  private attachmentData: string | null = null;

  readonly form = this.fb.group({
    leaveTypeId: [null as number | null, Validators.required],
    durationType: ['full_day' as 'full_day' | 'half_day', Validators.required],
    halfDaySession: ['first_half' as 'first_half' | 'second_half'],
    requestKind: ['leave' as LeaveApplyPayload['requestKind'], Validators.required],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    reason: ['', [Validators.required, Validators.minLength(6)]],
  });

  readonly selectedLeave = computed(() =>
    this.leaveTypes().find((item) => item.id === this.form.value.leaveTypeId) ?? null,
  );

  constructor() {
    const kind = (this.route.snapshot.queryParamMap.get('requestKind') as LeaveApplyPayload['requestKind']) || 'leave';
    this.form.patchValue({ requestKind: kind });
    this.load();
  }

  private load(): void {
    forkJoin({
      leaveTypes: this.leaveService.getLeaveTypes(),
    }).subscribe({
      next: ({ leaveTypes }) => {
        this.leaveTypes.set(leaveTypes.data);
      },
      error: () => this.toastService.show('Unable to load leave types.', 'error'),
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      this.attachmentData = null;
      this.attachmentName.set('');
      return;
    }

    this.attachmentName.set(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      this.attachmentData = typeof reader.result === 'string' ? reader.result : null;
    };
    reader.readAsDataURL(file);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const payload: LeaveApplyPayload = {
      leaveTypeId: Number(value.leaveTypeId),
      startDate: String(value.startDate),
      endDate: String(value.endDate),
      reason: String(value.reason),
      supportingDoc: this.attachmentData,
      durationType: value.durationType ?? 'full_day',
      halfDaySession: value.durationType === 'half_day' ? value.halfDaySession ?? 'first_half' : null,
      requestKind: value.requestKind ?? 'leave',
    };

    this.submitting.set(true);
    this.leaveService.applyLeave(payload).subscribe({
      next: () => {
        this.submitting.set(false);
        this.toastService.show('Leave request submitted successfully.', 'success');
        this.router.navigate(['/self-service/leave']);
      },
      error: () => {
        this.submitting.set(false);
        this.toastService.show('Unable to submit leave request right now.', 'error');
      },
    });
  }
}
