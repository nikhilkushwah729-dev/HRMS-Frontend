import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  RequestAttachment,
  RequestPriority,
  RequestType,
  RequestWorkflowService,
} from '../../core/services/request-workflow.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-request-center-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="mx-auto max-w-5xl space-y-6">
      <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-[11px] font-black uppercase tracking-[0.24em] text-sky-600">Create Request</p>
            <h1 class="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Raise a new employee request</h1>
            <p class="mt-2 max-w-3xl text-sm text-slate-500">Choose the request type, add details, attach support, and submit it to the approval workflow.</p>
          </div>
          <a routerLink="/self-service/requests" class="rounded-xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50">Back</a>
        </div>
      </section>

      <section class="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
        <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div class="grid gap-4 md:grid-cols-2">
            <select [(ngModel)]="requestType" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 md:col-span-2">
              @for (option of requestTypes; track option.key) {
                <option [value]="option.key">{{ option.label }}</option>
              }
            </select>
            <input [(ngModel)]="title" placeholder="Request title" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 md:col-span-2" />
            <input [(ngModel)]="reason" placeholder="Reason / summary" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 md:col-span-2" />
            <div>
              <label class="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">Application Date</label>
              <input [(ngModel)]="requestDate" type="date" class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400" />
              <p class="mt-2 text-[11px] text-slate-500">This is the date when you are submitting the request.</p>
            </div>
            <div>
              <label class="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">Start Date</label>
              <input [(ngModel)]="startDate" type="date" class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400" />
              <p class="mt-2 text-[11px] text-slate-500">Use this when the request should start from a specific date.</p>
            </div>
            <div class="md:col-span-2">
              <label class="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">End Date</label>
              <input [(ngModel)]="endDate" type="date" class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400" />
              <p class="mt-2 text-[11px] text-slate-500">Use this when the request continues for more than one day. For a single-day request, keep start and end date the same.</p>
            </div>
            @if (requestType === 'time_off') {
              <input [(ngModel)]="startTime" type="time" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400" />
              <input [(ngModel)]="endTime" type="time" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400" />
            }
            <select [(ngModel)]="priority" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
            <select [(ngModel)]="mode" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400">
              <option value="pending">Submit for approval</option>
              <option value="draft">Save as draft</option>
            </select>
          </div>

          <textarea [(ngModel)]="description" rows="6" placeholder="Description, details, justification, or request notes" class="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400"></textarea>

          <div class="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div class="flex items-center justify-between gap-3">
              <h2 class="text-sm font-black text-slate-900">Attachments</h2>
              <button type="button" (click)="addAttachment()" class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-50">Add Attachment</button>
            </div>
            <div class="mt-4 space-y-3">
              @for (item of attachments(); track item.id) {
                <div class="grid gap-3 md:grid-cols-[1fr_auto]">
                  <div class="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <input type="file" (change)="onAttachmentSelected(item.id, $event)" class="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-xs file:font-black file:text-white hover:file:bg-slate-800" />
                    <p class="mt-2 text-sm font-black text-slate-900">{{ item.name || 'No file selected yet' }}</p>
                    <p class="mt-1 text-[11px] text-slate-500">{{ item.url ? 'Attachment ready to submit.' : 'Choose a file to attach with this request.' }}</p>
                  </div>
                  <button type="button" (click)="removeAttachment(item.id)" class="rounded-xl border border-rose-200 px-4 py-3 text-xs font-black text-rose-600 transition hover:bg-rose-50">Remove</button>
                </div>
              } @empty {
                <p class="text-sm text-slate-500">Add actual support files here. The first attachment is also sent to the backend when supported.</p>
              }
            </div>
          </div>

          <div class="mt-5 flex justify-end gap-3">
            <button type="button" (click)="save()" [disabled]="submitting() || !canPersist('draft')" class="rounded-xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
              Save Draft
            </button>
            <button type="button" (click)="submit()" [disabled]="submitting() || !canPersist('pending')" class="rounded-xl bg-slate-900 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
              Submit Request
            </button>
          </div>
        </article>

        <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 class="text-lg font-black text-slate-900">Workflow Preview</h2>
          <div class="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p class="text-sm font-black text-slate-900">{{ selectedType()?.label }}</p>
            <p class="mt-1 text-sm text-slate-500">{{ selectedType()?.description }}</p>
          </div>
          <div class="mt-4 space-y-3 text-sm text-slate-600">
            <div class="rounded-2xl border border-slate-200 px-4 py-3">
              <p class="font-black text-slate-900">Submission Mode</p>
              <p class="mt-1">{{ mode === 'draft' ? 'Draft only, no approval yet.' : 'Request goes into approval workflow immediately.' }}</p>
            </div>
            <div class="rounded-2xl border border-slate-200 px-4 py-3">
              <p class="font-black text-slate-900">Attachments</p>
              <p class="mt-1">{{ attachments().length }} support item(s) attached to this request.</p>
            </div>
            @if (requestType === 'time_off') {
              <div class="rounded-2xl border border-slate-200 px-4 py-3">
                <p class="font-black text-slate-900">Time Off Window</p>
                <p class="mt-1">{{ startTime || '--:--' }} to {{ endTime || '--:--' }}</p>
              </div>
            }
            <div class="rounded-2xl border border-slate-200 px-4 py-3">
              <p class="font-black text-slate-900">Timeline</p>
              <p class="mt-1">Each request automatically records create, submit, approve, reject, cancel, and send-back actions.</p>
            </div>
          </div>
        </article>
      </section>
    </div>
  `,
})
export class RequestCenterCreateComponent {
  private readonly requestService = inject(RequestWorkflowService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly attachments = signal<RequestAttachment[]>([]);
  readonly requestTypes = this.requestService.getRequestTypes();
  readonly submitting = signal(false);

  requestType: RequestType = 'leave';
  title = '';
  reason = '';
  description = '';
  requestDate = '';
  startDate = '';
  endDate = '';
  startTime = '';
  endTime = '';
  priority: RequestPriority = 'medium';
  mode: 'draft' | 'pending' = 'pending';

  private extractErrorMessage(error: any): string {
    return (
      error?.error?.message ||
      error?.error?.errors?.[0]?.message ||
      error?.message ||
      'Unable to save this request right now.'
    );
  }

  constructor() {
    const initialType = this.route.snapshot.queryParamMap.get('type') as RequestType | null;
    if (initialType) this.requestType = initialType;
  }

  selectedType() {
    return this.requestTypes.find((item) => item.key === this.requestType);
  }

  addAttachment(): void {
    this.attachments.update((items) => [
      ...items,
      { id: Date.now() + Math.floor(Math.random() * 1000), name: '' },
    ]);
  }

  onAttachmentSelected(id: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null;
      this.attachments.update((items) =>
        items.map((item) =>
          item.id === id
            ? {
                ...item,
                name: file.name,
                url: result,
              }
            : item,
        ),
      );
    };
    reader.readAsDataURL(file);
  }

  removeAttachment(id: number): void {
    this.attachments.update((items) => items.filter((item) => item.id !== id));
  }

  private needsDateRange(): boolean {
    return [
      'leave',
      'time_off',
      'work_from_home',
      'outdoor_duty',
      'short_day',
      'under_time',
      'overtime',
      'attendance_regularization',
    ].includes(this.requestType);
  }

  canPersist(status: 'draft' | 'pending'): boolean {
    if (!this.title.trim() || this.title.trim().length < 3) return false;
    if (!this.reason.trim() || this.reason.trim().length < 3) return false;
    if (!this.requestDate) return false;
    if (this.needsDateRange() && (!this.startDate || !this.endDate)) return false;
    if (this.startDate && this.endDate && this.endDate < this.startDate) return false;
    if (this.requestType === 'time_off') {
      if (!this.startTime || !this.endTime) return false;
      if (this.endTime <= this.startTime) return false;
    }
    if (status === 'pending' && this.description.trim().length > 0 && this.description.trim().length < 5) {
      return false;
    }
    return true;
  }

  private getValidationMessage(status: 'draft' | 'pending'): string | null {
    if (!this.title.trim()) return 'Request title is required.';
    if (this.title.trim().length < 3) return 'Request title must be at least 3 characters.';
    if (!this.reason.trim()) return 'Reason is required.';
    if (this.reason.trim().length < 3) return 'Reason must be at least 3 characters.';
    if (!this.requestDate) return 'Application date is required.';
    if (this.needsDateRange() && !this.startDate) return 'Start date is required for this request type.';
    if (this.needsDateRange() && !this.endDate) return 'End date is required for this request type.';
    if (this.startDate && this.endDate && this.endDate < this.startDate) {
      return 'End date cannot be earlier than start date.';
    }
    if (this.requestType === 'time_off' && !this.startTime) {
      return 'Start time is required for Time Off requests.';
    }
    if (this.requestType === 'time_off' && !this.endTime) {
      return 'End time is required for Time Off requests.';
    }
    if (this.requestType === 'time_off' && this.startTime && this.endTime && this.endTime <= this.startTime) {
      return 'End time must be later than start time.';
    }
    if (status === 'pending' && this.description.trim().length > 0 && this.description.trim().length < 5) {
      return 'Description should be at least 5 characters if provided.';
    }
    return null;
  }

  private persist(status: 'draft' | 'pending'): void {
    const validationMessage = this.getValidationMessage(status);
    if (validationMessage) {
      this.toastService.show(validationMessage, 'error');
      return;
    }
    if (this.submitting()) {
      return;
    }
    this.submitting.set(true);
    this.requestService
      .createRequest({
        requestType: this.requestType,
        title: this.title.trim(),
        reason: this.reason.trim(),
        description: this.description.trim() || null,
        requestDate: this.requestDate || this.startDate || this.endDate || null,
        startDate: this.startDate || null,
        endDate: this.endDate || null,
        startTime: this.startTime || null,
        endTime: this.endTime || null,
        priority: this.priority,
        status,
        attachments: this.attachments().filter((item) => item.name.trim() && item.url),
      })
      .subscribe({
        next: (request) => {
          this.submitting.set(false);
          this.toastService.show(
            status === 'draft'
              ? 'Request draft saved successfully.'
              : 'Request submitted successfully.',
            'success',
          );
          this.router.navigate(['/self-service/requests', request.id]);
        },
        error: (error) => {
          this.submitting.set(false);
          this.toastService.show(this.extractErrorMessage(error), 'error');
        },
      });
  }

  save(): void {
    this.persist('draft');
  }

  submit(): void {
    this.persist('pending');
  }
}
