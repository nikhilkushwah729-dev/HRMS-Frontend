import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  AnnouncementService,
  Announcement,
} from '../../core/services/announcement.service';
import { ToastService } from '../../core/services/toast.service';
import { ModalService } from '../../core/services/modal.service';
import { ConfirmModalComponent } from '../../core/components/modal/confirm-modal.component';
import {
  OrganizationService,
  Department,
} from '../../core/services/organization.service';

@Component({
  selector: 'app-announcements',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ConfirmModalComponent],
  template: `
    <div class="max-w-5xl mx-auto py-8">
      <header
        class="app-module-hero mb-10 flex flex-col xl:flex-row xl:items-end xl:justify-between gap-5"
      >
        <div class="max-w-2xl">
          <p class="app-module-kicker">Administration</p>
          <h1 class="app-module-title mt-3">Announcements</h1>
          <p class="app-module-text mt-3">
            Create, manage, and publish organization-wide announcements for
            employees.
          </p>
        </div>
        <div class="app-module-highlight min-w-[240px]">
          <span class="app-module-highlight-label">Total announcements</span>
          <div class="app-module-highlight-value mt-3">
            {{ announcements().length }}
          </div>
          <p class="mt-2 text-sm text-white/80">
            Active announcements visible to employees.
          </p>
        </div>
      </header>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div
          class="lg:col-span-1 bg-white border border-slate-100 rounded-md p-6 shadow-sm"
        >
          <h3 class="text-lg font-bold text-slate-900 mb-4">
            {{ editingId() ? 'Edit Announcement' : 'Create Announcement' }}
          </h3>
          <form
            [formGroup]="announcementForm"
            (ngSubmit)="onSubmit()"
            class="space-y-4"
          >
            <div class="space-y-1.5">
              <label class="app-field-label">Title</label>
              <input
                formControlName="title"
                type="text"
                class="app-field"
                placeholder="Announcement title"
              />
            </div>
            <div class="space-y-1.5">
              <label class="app-field-label">Content</label>
              <textarea
                formControlName="content"
                rows="4"
                class="app-field resize-none"
                placeholder="Write the announcement content..."
              ></textarea>
            </div>
            <div class="space-y-1.5">
              <label class="app-field-label">Target</label>
              <select formControlName="target" class="app-field">
                <option value="all">All Employees</option>
                <option value="department">Specific Department</option>
                <option value="role">Specific Role</option>
              </select>
            </div>
            @if (announcementForm.value.target === 'department') {
              <div class="space-y-1.5">
                <label class="app-field-label">Department</label>
                <select formControlName="target_id" class="app-field">
                  <option [ngValue]="null">Select Department</option>
                  @for (dept of departments(); track dept.id) {
                    <option [ngValue]="dept.id">{{ dept.name }}</option>
                  }
                </select>
              </div>
            }
            @if (announcementForm.value.target === 'role') {
              <div class="space-y-1.5">
                <label class="app-field-label">Role</label>
                <select formControlName="target_id" class="app-field">
                  <option [ngValue]="null">Select Role</option>
                  <option [ngValue]="1">Super Admin</option>
                  <option [ngValue]="2">Organization Admin</option>
                  <option [ngValue]="3">HR Manager</option>
                  <option [ngValue]="4">Manager</option>
                  <option [ngValue]="5">Employee</option>
                </select>
              </div>
            }
            <div class="space-y-1.5">
              <label class="app-field-label">Published At</label>
              <input
                formControlName="published_at"
                type="datetime-local"
                class="app-field"
              />
            </div>
            <div class="space-y-1.5">
              <label class="app-field-label">Expires At (Optional)</label>
              <input
                formControlName="expires_at"
                type="datetime-local"
                class="app-field"
              />
            </div>
            <div class="flex gap-3">
              <button
                type="submit"
                [disabled]="announcementForm.invalid || saving()"
                class="flex-1 bg-primary-600 text-white py-2.5 rounded-lg font-bold hover:bg-primary-700 disabled:opacity-50"
              >
                {{ saving() ? 'Saving...' : editingId() ? 'Update' : 'Create' }}
              </button>
              @if (editingId()) {
                <button
                  type="button"
                  (click)="cancelEdit()"
                  class="px-4 py-2.5 rounded-lg font-bold border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
              }
            </div>
          </form>
        </div>

        <div
          class="lg:col-span-2 bg-white border border-slate-100 rounded-md overflow-hidden"
        >
          <div class="px-6 py-4 border-b border-slate-100">
            <h3 class="text-lg font-bold text-slate-900">
              All Announcements ({{ announcements().length }})
            </h3>
          </div>
          <div class="divide-y divide-slate-50">
            @for (announcement of announcements(); track announcement.id) {
              <div class="px-6 py-4">
                <div class="flex items-start justify-between gap-3">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <p class="font-semibold text-slate-900 truncate">
                        {{ announcement.title }}
                      </p>
                      <span
                        class="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md"
                        [ngClass]="{
                          'bg-blue-50 text-blue-600':
                            announcement.target === 'all',
                          'bg-purple-50 text-purple-600':
                            announcement.target === 'department',
                          'bg-amber-50 text-amber-600':
                            announcement.target === 'role',
                        }"
                      >
                        {{ getTargetLabel(announcement) }}
                      </span>
                    </div>
                    <p class="text-sm text-slate-500 line-clamp-2">
                      {{ announcement.content }}
                    </p>
                    <div class="flex items-center gap-3 mt-2">
                      <span class="text-xs text-slate-400">
                        {{ announcement.published_at | date: 'mediumDate' }}
                      </span>
                      @if (announcement.expires_at) {
                        <span class="text-xs text-slate-400">
                          Expires:
                          {{ announcement.expires_at | date: 'mediumDate' }}
                        </span>
                      }
                    </div>
                  </div>
                  <div class="flex items-center gap-2 shrink-0">
                    <button
                      (click)="editAnnouncement(announcement)"
                      class="p-2 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                      title="Edit"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path
                          d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                        />
                        <path
                          d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                        />
                      </svg>
                    </button>
                    <button
                      (click)="confirmDelete(announcement)"
                      class="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path
                          d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                        />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            } @empty {
              <div class="px-6 py-12 text-center text-slate-400 font-medium">
                @if (loading()) {
                  <div class="flex items-center justify-center">
                    <div
                      class="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"
                    ></div>
                  </div>
                } @else {
                  No announcements found. Create your first announcement.
                }
              </div>
            }
          </div>
        </div>
      </div>

      <app-confirm-modal></app-confirm-modal>
    </div>
  `,
  styles: [],
})
export class AnnouncementsComponent implements OnInit {
  private announcementService = inject(AnnouncementService);
  private orgService = inject(OrganizationService);
  private toastService = inject(ToastService);
  private modalService = inject(ModalService);
  private fb = inject(FormBuilder);

  announcements = signal<Announcement[]>([]);
  departments = signal<Department[]>([]);
  loading = signal<boolean>(true);
  saving = signal<boolean>(false);
  editingId = signal<number | null>(null);

  announcementForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    content: ['', [Validators.required, Validators.minLength(10)]],
    target: ['all'],
    target_id: [null as number | null],
    published_at: [''],
    expires_at: [''],
  });

  ngOnInit() {
    this.fetchAnnouncements();
    this.fetchDepartments();
  }

  fetchAnnouncements() {
    this.loading.set(true);
    this.announcementService.getAnnouncements().subscribe({
      next: (items) => {
        this.announcements.set(items);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load announcements', err);
        this.toastService.error('Failed to load announcements');
        this.loading.set(false);
      },
    });
  }

  fetchDepartments() {
    this.orgService.getDepartments().subscribe({
      next: (depts) => this.departments.set(depts),
      error: () => {},
    });
  }

  onSubmit() {
    if (this.announcementForm.invalid) return;
    this.saving.set(true);

    const formValue = this.announcementForm.value;
    const target = (formValue.target || 'all') as 'all' | 'department' | 'role';

    const payload: Partial<Announcement> = {
      title: (formValue.title || '').trim(),
      content: (formValue.content || '').trim(),
      target,
      target_id: target === 'all' ? null : (formValue.target_id ?? null),
      published_at: formValue.published_at
        ? new Date(formValue.published_at).toISOString()
        : null,
      expires_at: formValue.expires_at
        ? new Date(formValue.expires_at).toISOString()
        : null,
    };

    if (this.editingId()) {
      this.announcementService
        .updateAnnouncement(this.editingId()!, payload)
        .subscribe({
          next: (updated) => {
            this.announcements.update((list) =>
              list.map((a) => (a.id === this.editingId() ? updated : a)),
            );
            this.toastService.success('Announcement updated successfully');
            this.cancelEdit();
          },
          error: (err) => {
            console.error('Failed to update announcement', err);
            this.toastService.error('Failed to update announcement');
          },
          complete: () => this.saving.set(false),
        });
    } else {
      this.announcementService.createAnnouncement(payload).subscribe({
        next: (created) => {
          this.announcements.update((list) => [created, ...list]);
          this.resetForm();
          this.toastService.success('Announcement created successfully');
        },
        error: (err) => {
          console.error('Failed to create announcement', err);
          this.toastService.error('Failed to create announcement');
        },
        complete: () => this.saving.set(false),
      });
    }
  }

  editAnnouncement(announcement: Announcement) {
    this.editingId.set(announcement.id);
    this.announcementForm.patchValue({
      title: announcement.title,
      content: announcement.content || '',
      target: announcement.target,
      target_id: announcement.target_id,
      published_at: announcement.published_at
        ? this.toLocalDatetime(announcement.published_at)
        : '',
      expires_at: announcement.expires_at
        ? this.toLocalDatetime(announcement.expires_at)
        : '',
    });
  }

  cancelEdit() {
    this.editingId.set(null);
    this.resetForm();
  }

  resetForm() {
    this.announcementForm.reset({
      title: '',
      content: '',
      target: 'all',
      target_id: null,
      published_at: '',
      expires_at: '',
    });
  }

  async confirmDelete(announcement: Announcement) {
    const confirmed = await this.modalService.confirm({
      title: 'Delete Announcement',
      message: `Are you sure you want to delete "${announcement.title}"? This action cannot be undone.`,
      confirmText: 'Delete',
      type: 'danger',
    });

    if (confirmed) {
      this.deleteAnnouncement(announcement);
    }
  }

  deleteAnnouncement(announcement: Announcement) {
    this.announcementService.deleteAnnouncement(announcement.id).subscribe({
      next: () => {
        this.announcements.update((list) =>
          list.filter((a) => a.id !== announcement.id),
        );
        this.toastService.success('Announcement deleted successfully');
      },
      error: (err) => {
        console.error('Failed to delete announcement', err);
        this.toastService.error('Failed to delete announcement');
      },
    });
  }

  getTargetLabel(announcement: Announcement): string {
    if (announcement.target === 'all') return 'All';
    if (announcement.target === 'department') {
      const dept = this.departments().find(
        (d) => d.id === announcement.target_id,
      );
      return dept ? dept.name : 'Department';
    }
    if (announcement.target === 'role') {
      const roles: Record<number, string> = {
        1: 'Super Admin',
        2: 'Organization Admin',
        3: 'HR Manager',
        4: 'Manager',
        5: 'Employee',
      };
      return announcement.target_id
        ? roles[announcement.target_id] || 'Role'
        : 'Role';
    }
    return announcement.target;
  }

  private toLocalDatetime(isoString: string): string {
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }
}
