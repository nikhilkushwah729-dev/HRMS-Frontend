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
      <section class="rounded-xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p class="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Apply Leave</p>
            <h1 class="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Create a new leave request</h1>
            <p class="mt-1 max-w-2xl text-xs text-slate-500">
              Select your leave type, duration, dates, optional attachment, and reason.
            </p>
          </div>
          <a
            routerLink="/self-service/leave"
            class="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 shadow-xs"
          >
            Back to My Leaves
          </a>
        </div>
      </section>

      <section class="grid gap-6 xl:grid-cols-[1fr_360px]">
        <form [formGroup]="form" (ngSubmit)="submit()" class="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
          <div class="grid gap-5 md:grid-cols-2">
            <div class="md:col-span-2">
              <label class="mb-1.5 block text-xs font-bold text-slate-700">Leave Type <span class="text-rose-500">*</span></label>
              <select formControlName="leaveTypeId" class="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10">
                <option [ngValue]="null">Select leave type</option>
                @for (type of leaveTypes(); track type.id) {
                  <option [ngValue]="type.id">{{ type.typeName }} ({{ type.remaining }} days left)</option>
                }
              </select>
              @if (form.get('leaveTypeId')?.touched && form.get('leaveTypeId')?.invalid) {
                <p class="mt-1 text-[11px] font-semibold text-rose-500">Please select a valid leave type.</p>
              }
            </div>

            <div>
              <label class="mb-1.5 block text-xs font-bold text-slate-700">Duration</label>
              <select formControlName="durationType" class="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10">
                <option value="full_day">Full day</option>
                <option value="half_day">Half day</option>
              </select>
            </div>

            <div>
              <label class="mb-1.5 block text-xs font-bold text-slate-700">Request Mode</label>
              <select formControlName="requestKind" class="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10">
                <option value="leave">Leave</option>
                <option value="short-day">Short Day</option>
                <option value="under-time">Under-time</option>
                <option value="wfh">WFH</option>
                <option value="outdoor-duty">Outdoor Duty</option>
              </select>
            </div>

            <div>
              <label class="mb-1.5 block text-xs font-bold text-slate-700">Start Date <span class="text-rose-500">*</span></label>
              <input type="date" formControlName="startDate" class="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10" />
              @if (form.get('startDate')?.touched && form.get('startDate')?.invalid) {
                <p class="mt-1 text-[11px] font-semibold text-rose-500">Start date is required.</p>
              }
            </div>

            <div>
              <label class="mb-1.5 block text-xs font-bold text-slate-700">End Date <span class="text-rose-500">*</span></label>
              <input type="date" formControlName="endDate" class="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10" />
              @if (form.get('endDate')?.touched && form.get('endDate')?.invalid) {
                <p class="mt-1 text-[11px] font-semibold text-rose-500">End date is required.</p>
              }
            </div>

            @if (form.value.durationType === 'half_day') {
              <div class="md:col-span-2">
                <label class="mb-1.5 block text-xs font-bold text-slate-700">Half Day Session</label>
                <div class="grid gap-3 sm:grid-cols-2">
                  <label class="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-50">
                    <input type="radio" formControlName="halfDaySession" value="first_half" class="text-indigo-600 focus:ring-indigo-500" />
                    First Half (Morning)
                  </label>
                  <label class="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-50">
                    <input type="radio" formControlName="halfDaySession" value="second_half" class="text-indigo-600 focus:ring-indigo-500" />
                    Second Half (Afternoon)
                  </label>
                </div>
              </div>
            }

            <div class="md:col-span-2">
              <label class="mb-1.5 block text-xs font-bold text-slate-700">Reason / Description <span class="text-rose-500">*</span></label>
              <textarea formControlName="reason" rows="4" class="w-full rounded-lg border border-slate-200 p-3 text-xs font-medium text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 placeholder:text-slate-400" placeholder="Explain the leave reason, travel plan, medical note, or manager context."></textarea>
              @if (form.get('reason')?.touched && form.get('reason')?.invalid) {
                <p class="mt-1 text-[11px] font-semibold text-rose-500">Reason is required (at least 6 characters).</p>
              }
            </div>

            <div class="md:col-span-2">
              <label class="mb-1.5 block text-xs font-bold text-slate-700">Supporting Attachment</label>
              <label class="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50/50 p-5 text-center transition hover:border-indigo-400 hover:bg-indigo-50/30">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-slate-400 mb-1"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <span class="text-xs font-semibold text-slate-700">Upload document or image</span>
                <span class="mt-0.5 text-[10px] text-slate-400">PDF, PNG, JPG up to 5MB</span>
                <input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" class="hidden" (change)="onFileSelected($event)" />
              </label>
              @if (attachmentName()) {
                <p class="mt-2 text-xs font-semibold text-indigo-600">Attached: {{ attachmentName() }}</p>
              }
            </div>
          </div>

          <div class="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <a routerLink="/self-service/leave" class="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              Cancel
            </a>
            <button type="submit" [disabled]="form.invalid || submitting()" class="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">
              @if (submitting()) {
                <svg class="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                Submitting...
              } @else {
                Submit Leave Request
              }
            </button>
          </div>
        </form>

        <div class="space-y-5">
          <article class="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <h2 class="text-sm font-bold text-slate-900">Available Leave Balances</h2>
            <p class="mt-0.5 text-xs text-slate-400">Your current balance for the active calendar year.</p>
            <div class="mt-4 space-y-2.5">
              @for (balance of leaveTypes(); track balance.id) {
                <div class="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                  <div class="flex items-center justify-between gap-3">
                    <div>
                      <p class="text-xs font-bold text-slate-800">{{ balance.typeName }}</p>
                      <p class="mt-0.5 text-[10px] text-slate-400">{{ balance.isPaid ? 'Paid' : 'Unpaid' }} • {{ balance.daysAllowed }} days total</p>
                    </div>
                    <span class="rounded-full px-2.5 py-0.5 text-[11px] font-bold" [style.background]="balance.color + '15'" [style.color]="balance.color">
                      {{ balance.remaining }} left
                    </span>
                  </div>
                </div>
              }
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
