import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  RequestAttachment,
  RequestPriority,
  RequestWorkflowService,
} from '../../core/services/request-workflow.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-request-time-off-apply',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="mx-auto max-w-5xl space-y-6">
      <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-[11px] font-black uppercase tracking-[0.24em] text-rose-600">Apply Time Off</p>
            <h1 class="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Create a dedicated time off request</h1>
            <p class="mt-2 max-w-3xl text-sm text-slate-500">This flow follows the Angular_Web pattern more closely with application date, time off date, requested start time, requested end time, and reason.</p>
          </div>
          <a routerLink="/self-service/requests/time-off" class="rounded-xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50">Back</a>
        </div>
      </section>

      <section class="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
        <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div class="grid gap-4 md:grid-cols-2">
            <input [(ngModel)]="title" placeholder="Request title" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 md:col-span-2" />
            <input [(ngModel)]="reason" placeholder="Reason / summary" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 md:col-span-2" />
            <div>
              <label class="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">Application Date</label>
              <input [(ngModel)]="requestDate" type="date" class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400" />
            </div>
            <div>
              <label class="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">Time Off Date</label>
              <input [(ngModel)]="timeOffDate" type="date" class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400" />
            </div>
            <div>
              <label class="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">Requested Time From</label>
              <input [(ngModel)]="startTime" type="time" class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400" />
            </div>
            <div>
              <label class="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">Requested Time To</label>
              <input [(ngModel)]="endTime" type="time" class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400" />
            </div>
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

          <textarea [(ngModel)]="description" rows="6" placeholder="Add supporting details for this time off request" class="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400"></textarea>

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
                    <p class="mt-1 text-[11px] text-slate-500">{{ item.url ? 'Attachment ready to submit.' : 'Choose a file to attach with this time off request.' }}</p>
                  </div>
                  <button type="button" (click)="removeAttachment(item.id)" class="rounded-xl border border-rose-200 px-4 py-3 text-xs font-black text-rose-600 transition hover:bg-rose-50">Remove</button>
                </div>
              } @empty {
                <p class="text-sm text-slate-500">Add actual support files here. The first attachment is also sent to the backend when supported.</p>
              }
            </div>
          </div>

          <div class="mt-5 flex justify-end gap-3">
            <button type="button" (click)="save()" [disabled]="submitting() || !canPersist('draft')" class="rounded-xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">Save Draft</button>
            <button type="button" (click)="submit()" [disabled]="submitting() || !canPersist('pending')" class="rounded-xl bg-slate-900 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">Submit Time Off</button>
          </div>
        </article>

        <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 class="text-lg font-black text-slate-900">Time Off Summary</h2>
          <div class="mt-4 space-y-3 text-sm text-slate-600">
            <div class="rounded-2xl border border-slate-200 px-4 py-3">
              <p class="font-black text-slate-900">Application Date</p>
              <p class="mt-1">{{ requestDate || 'Not selected yet' }}</p>
            </div>
            <div class="rounded-2xl border border-slate-200 px-4 py-3">
              <p class="font-black text-slate-900">Time Off Date</p>
              <p class="mt-1">{{ timeOffDate || 'Not selected yet' }}</p>
            </div>
            <div class="rounded-2xl border border-slate-200 px-4 py-3">
              <p class="font-black text-slate-900">Requested Time Window</p>
              <p class="mt-1">{{ startTime || '--:--' }} to {{ endTime || '--:--' }}</p>
            </div>
            <div class="rounded-2xl border border-slate-200 px-4 py-3">
              <p class="font-black text-slate-900">Submission Mode</p>
              <p class="mt-1">{{ mode === 'draft' ? 'Draft only, no approval yet.' : 'Request goes into approval workflow immediately.' }}</p>
            </div>
          </div>
        </article>
      </section>
    </div>
  `,
})
export class RequestTimeOffApplyComponent {
  private readonly requestService = inject(RequestWorkflowService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  readonly attachments = signal<RequestAttachment[]>([]);
  readonly submitting = signal(false);

  title = '';
  reason = '';
  description = '';
  requestDate = '';
  timeOffDate = '';
  startTime = '';
  endTime = '';
  priority: RequestPriority = 'medium';
  mode: 'draft' | 'pending' = 'pending';

  private extractErrorMessage(error: any): string {
    return (
      error?.error?.message ||
      error?.error?.errors?.[0]?.message ||
      error?.message ||
      'Unable to save this time off request right now.'
    );
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

  canPersist(status: 'draft' | 'pending'): boolean {
    if (!this.title.trim() || this.title.trim().length < 3) return false;
    if (!this.reason.trim() || this.reason.trim().length < 3) return false;
    if (!this.requestDate) return false;
    if (!this.timeOffDate) return false;
    if (!this.startTime || !this.endTime) return false;
    if (this.endTime <= this.startTime) return false;
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
    if (!this.timeOffDate) return 'Time off date is required.';
    if (!this.startTime) return 'Requested start time is required.';
    if (!this.endTime) return 'Requested end time is required.';
    if (this.endTime <= this.startTime) return 'Requested end time must be later than start time.';
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
        requestType: 'time_off',
        title: this.title.trim(),
        reason: this.reason.trim(),
        description: this.description.trim() || null,
        requestDate: this.requestDate || this.timeOffDate,
        startDate: this.timeOffDate,
        endDate: this.timeOffDate,
        startTime: this.startTime,
        endTime: this.endTime,
        priority: this.priority,
        status,
        attachments: this.attachments().filter((item) => item.name.trim() && item.url),
      })
      .subscribe({
        next: (request) => {
          this.submitting.set(false);
          this.toastService.show(
            status === 'draft'
              ? 'Time off draft saved successfully.'
              : 'Time off request submitted successfully.',
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
