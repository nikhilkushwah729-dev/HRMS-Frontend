import {
  Component,
  ElementRef,
  ViewChild,
  inject,
  OnInit,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import * as AuthActions from '../../core/state/auth/auth.actions';
import { AuthService } from '../../core/services/auth.service';
import { EmployeeService } from '../../core/services/employee.service';
import { ToastService } from '../../core/services/toast.service';
import { OrganizationService } from '../../core/services/organization.service';
import { UiSelectAdvancedComponent } from '../../core/components/ui';
import { SelectOption } from '../../core/components/ui/ui-select-advanced.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, UiSelectAdvancedComponent],
  template: `
    <div class="mx-auto max-w-7xl space-y-6 px-1 py-2">
      <!-- Experience Modal -->
      <div
        *ngIf="showExperienceModal()"
        class="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-slate-950/55 px-2 py-3 backdrop-blur-sm sm:px-4 sm:py-6"
      >
        <div
          class="relative w-full max-w-2xl overflow-hidden rounded-md border border-slate-200 bg-white shadow-2xl flex flex-col max-h-full"
        >
          <div
            class="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 px-4 py-3 sm:px-6"
          >
            <h3 class="text-xl font-black text-slate-900">
              {{ isEditing() ? 'Edit' : 'Add' }} Experience
            </h3>
            <button
              (click)="closeModals()"
              class="text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>
          <div class="flex-1 overflow-y-auto p-4 sm:p-6">
            <form [formGroup]="experienceForm" class="grid gap-4">
              <div class="grid gap-4 sm:grid-cols-2">
                <div class="flex flex-col gap-1.5">
                  <label
                    class="text-[10px] font-bold uppercase tracking-wider text-slate-500"
                    >Company Name</label
                  >
                  <input
                    type="text"
                    formControlName="companyName"
                    class="app-field"
                    placeholder="e.g. Google"
                  />
                </div>
                <div class="flex flex-col gap-1.5">
                  <label
                    class="text-[10px] font-bold uppercase tracking-wider text-slate-500"
                    >Role</label
                  >
                  <input
                    type="text"
                    formControlName="role"
                    class="app-field"
                    placeholder="e.g. Senior Engineer"
                  />
                </div>
              </div>
              <div class="flex flex-col gap-1.5">
                <label
                  class="text-[10px] font-bold uppercase tracking-wider text-slate-500"
                  >Location</label
                >
                <input
                  type="text"
                  formControlName="location"
                  class="app-field"
                  placeholder="e.g. Remote, NY"
                />
              </div>
              <div class="grid gap-4 sm:grid-cols-2">
                <div class="flex flex-col gap-1.5">
                  <label
                    class="text-[10px] font-bold uppercase tracking-wider text-slate-500"
                    >Start Date</label
                  >
                  <input
                    type="date"
                    formControlName="startDate"
                    class="app-field"
                  />
                </div>
                <div class="flex flex-col gap-1.5">
                  <label
                    class="text-[10px] font-bold uppercase tracking-wider text-slate-500"
                    >End Date</label
                  >
                  <input
                    type="date"
                    formControlName="endDate"
                    class="app-field"
                    [disabled]="!!experienceForm.get('isCurrent')?.value"
                  />
                </div>
              </div>
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  formControlName="isCurrent"
                  class="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <span class="text-sm font-semibold text-slate-700"
                  >I am currently working here</span
                >
              </label>
              <div class="flex flex-col gap-1.5">
                <label
                  class="text-[10px] font-bold uppercase tracking-wider text-slate-500"
                  >Description</label
                >
                <textarea
                  formControlName="description"
                  rows="3"
                  class="app-field resize-none"
                  placeholder="Brief about your contribution..."
                ></textarea>
              </div>
            </form>
          </div>
          <div
            class="shrink-0 flex justify-end gap-3 border-t border-slate-100 p-4 sm:p-6 bg-slate-50"
          >
            <button
              (click)="closeModals()"
              class="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              (click)="saveExperience()"
              [disabled]="experienceForm.invalid || saving()"
              class="rounded-md bg-slate-900 px-5 py-2 text-sm font-bold text-white shadow-lg transition hover:bg-slate-800 disabled:opacity-50"
            >
              {{ saving() ? 'Saving...' : 'Save Record' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Education Modal -->
      <div
        *ngIf="showEducationModal()"
        class="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-slate-950/55 px-2 py-3 backdrop-blur-sm sm:px-4 sm:py-6"
      >
        <div
          class="relative w-full max-w-2xl overflow-hidden rounded-md border border-slate-200 bg-white shadow-2xl flex flex-col max-h-full"
        >
          <div
            class="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 px-4 py-3 sm:px-6"
          >
            <h3 class="text-xl font-black text-slate-900">
              {{ isEditing() ? 'Edit' : 'Add' }} Education
            </h3>
            <button
              (click)="closeModals()"
              class="text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>
          <div class="flex-1 overflow-y-auto p-4 sm:p-6">
            <form [formGroup]="educationForm" class="grid gap-4">
              <div class="flex flex-col gap-1.5">
                <label
                  class="text-[10px] font-bold uppercase tracking-wider text-slate-500"
                  >Institution / School</label
                >
                <input
                  type="text"
                  formControlName="institution"
                  class="app-field"
                  placeholder="e.g. Stanford University"
                />
              </div>
              <div class="grid gap-4 sm:grid-cols-2">
                <div class="flex flex-col gap-1.5">
                  <label
                    class="text-[10px] font-bold uppercase tracking-wider text-slate-500"
                    >Degree</label
                  >
                  <input
                    type="text"
                    formControlName="degree"
                    class="app-field"
                    placeholder="e.g. Master of CS"
                  />
                </div>
                <div class="flex flex-col gap-1.5">
                  <label
                    class="text-[10px] font-bold uppercase tracking-wider text-slate-500"
                    >Field of Study</label
                  >
                  <input
                    type="text"
                    formControlName="fieldOfStudy"
                    class="app-field"
                    placeholder="e.g. Artificial Intelligence"
                  />
                </div>
              </div>
              <div class="grid gap-4 sm:grid-cols-2">
                <div class="flex flex-col gap-1.5">
                  <label
                    class="text-[10px] font-bold uppercase tracking-wider text-slate-500"
                    >Start Date</label
                  >
                  <input
                    type="date"
                    formControlName="startDate"
                    class="app-field"
                  />
                </div>
                <div class="flex flex-col gap-1.5">
                  <label
                    class="text-[10px] font-bold uppercase tracking-wider text-slate-500"
                    >End Date</label
                  >
                  <input
                    type="date"
                    formControlName="endDate"
                    class="app-field"
                  />
                </div>
              </div>
              <div class="flex flex-col gap-1.5">
                <label
                  class="text-[10px] font-bold uppercase tracking-wider text-slate-500"
                  >Grade / GPA</label
                >
                <input
                  type="text"
                  formControlName="grade"
                  class="app-field"
                  placeholder="e.g. 3.9 GPA or 85%"
                />
              </div>
              <div class="flex flex-col gap-1.5">
                <label
                  class="text-[10px] font-bold uppercase tracking-wider text-slate-500"
                  >Description</label
                >
                <textarea
                  formControlName="description"
                  rows="3"
                  class="app-field resize-none"
                  placeholder="Honors, thesis, etc."
                ></textarea>
              </div>
            </form>
          </div>
          <div
            class="shrink-0 flex justify-end gap-3 border-t border-slate-100 p-4 sm:p-6 bg-slate-50"
          >
            <button
              (click)="closeModals()"
              class="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              (click)="saveEducation()"
              [disabled]="educationForm.invalid || saving()"
              class="rounded-md bg-slate-900 px-5 py-2 text-sm font-bold text-white shadow-lg transition hover:bg-slate-800 disabled:opacity-50"
            >
              {{ saving() ? 'Saving...' : 'Save Record' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Document Modal -->
      <div
        *ngIf="showDocumentModal()"
        class="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-slate-950/55 px-2 py-3 backdrop-blur-sm sm:px-4 sm:py-6"
      >
        <div
          class="relative w-full max-w-lg overflow-hidden rounded-md border border-slate-200 bg-white shadow-2xl flex flex-col max-h-full"
        >
          <div
            class="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 px-4 py-3 sm:px-6"
          >
            <h3 class="text-xl font-black text-slate-900">Upload Document</h3>
            <button
              (click)="closeModals()"
              class="text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>
          <div class="flex-1 overflow-y-auto p-4 sm:p-6">
            <form [formGroup]="documentForm" class="grid gap-5">
              <div class="flex flex-col gap-1.5">
                <label
                  class="text-[10px] font-bold uppercase tracking-wider text-slate-500"
                  >Document Title</label
                >
                <input
                  type="text"
                  formControlName="title"
                  class="app-field"
                  placeholder="e.g. PhD Certificate"
                />
              </div>
              <div class="flex flex-col gap-2">
                <label
                  class="text-[10px] font-bold uppercase tracking-wider text-slate-500"
                  >Select File</label
                >
                <div
                  class="relative flex items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 p-6 transition hover:bg-slate-100"
                >
                  <input
                    type="file"
                    (change)="onFileSelected($event)"
                    class="absolute inset-0 cursor-pointer opacity-0"
                  />
                  <div class="text-center">
                    <p class="text-sm font-bold text-slate-900">
                      {{
                        selectedFile
                          ? selectedFile.name
                          : 'Click to select or drag file'
                      }}
                    </p>
                    <p class="mt-1 text-xs text-slate-500">
                      {{
                        selectedFile
                          ? (selectedFile.size / 1024 | number: '1.0-2') + ' KB'
                          : 'PDF, DOCX, JPG (Max 5MB)'
                      }}
                    </p>
                  </div>
                </div>
              </div>
            </form>
          </div>
          <div
            class="shrink-0 flex justify-end gap-3 border-t border-slate-100 p-4 sm:p-6 bg-slate-50"
          >
            <button
              (click)="closeModals()"
              class="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              (click)="uploadNewDocument()"
              [disabled]="documentForm.invalid || !selectedFile || saving()"
              class="rounded-md bg-slate-900 px-5 py-2 text-sm font-bold text-white shadow-lg transition hover:bg-slate-800 disabled:opacity-50"
            >
              {{ saving() ? 'Uploading...' : 'Upload Now' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Crop Modal -->
      <div
        *ngIf="showCropModal()"
        class="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-slate-950/55 px-2 py-3 backdrop-blur-sm sm:px-4 sm:py-6"
      >
        <div
          class="relative w-full max-w-4xl overflow-hidden rounded-md border border-slate-200 bg-white shadow-2xl flex flex-col max-h-full"
        >
          <div
            class="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 px-4 py-2.5 sm:px-6 sm:py-3.5"
          >
            <div>
              <p
                class="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500"
              >
                Profile Image
              </p>
              <h3 class="mt-0.5 text-base font-black text-slate-900 sm:text-xl">
                Crop preview
              </h3>
            </div>
            <button
              type="button"
              (click)="cancelCrop()"
              class="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Close
            </button>
          </div>

          <div class="flex-1 overflow-y-auto p-3 sm:p-6">
            <div class="grid gap-5 lg:grid-cols-[1fr_300px]">
              <div class="space-y-4">
                <div
                  class="rounded-md border border-slate-200 bg-slate-100 p-3 sm:p-5"
                >
                  <div
                    class="mx-auto w-full max-w-[240px] sm:max-w-[320px] lg:max-w-[360px]"
                  >
                    <div
                      class="relative aspect-square overflow-hidden rounded-md border border-white bg-white shadow-sm"
                    >
                      <img
                        *ngIf="cropSource()"
                        [src]="cropSource()"
                        alt="Crop source"
                        class="absolute left-1/2 top-1/2 max-w-none cursor-move select-none"
                        [style.width.%]="cropZoom()"
                        (mousedown)="startCropDrag($event)"
                        (touchstart)="startCropDrag($event)"
                        [style.transform]="
                          'translate(calc(-50% + ' +
                          cropOffsetX() +
                          'px), calc(-50% + ' +
                          cropOffsetY() +
                          'px))'
                        "
                      />
                      <div
                        class="pointer-events-none absolute inset-0 border-[3px] border-white/90 shadow-[inset_0_0_0_9999px_rgba(15,23,42,0.28)]"
                      ></div>
                    </div>
                  </div>
                </div>

                <div
                  class="hidden sm:block rounded-md border border-slate-200 bg-slate-50 p-4"
                >
                  <p
                    class="text-xs font-bold uppercase tracking-[0.12em] text-slate-500"
                  >
                    Preview compare
                  </p>
                  <div class="mt-3 grid grid-cols-2 gap-3">
                    <div
                      class="rounded-md border border-slate-200 bg-white p-2 sm:p-3"
                    >
                      <p
                        class="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400"
                      >
                        Current
                      </p>
                      <div
                        class="mt-2 flex h-16 w-full items-center justify-center overflow-hidden rounded-md border border-slate-100 bg-slate-50 sm:h-20"
                      >
                        <img
                          *ngIf="currentAvatarSnapshot()"
                          [src]="currentAvatarSnapshot()"
                          class="h-full w-full object-contain"
                          alt="Current preview"
                        />
                        <div
                          *ngIf="!currentAvatarSnapshot()"
                          class="flex h-full w-full items-center justify-center text-lg font-black uppercase text-slate-400"
                        >
                          {{ userInitials() }}
                        </div>
                      </div>
                    </div>
                    <div
                      class="rounded-md border border-slate-200 bg-white p-2 sm:p-3"
                    >
                      <p
                        class="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400"
                      >
                        New
                      </p>
                      <div
                        class="mt-2 flex h-16 w-full items-center justify-center overflow-hidden rounded-md border border-slate-100 bg-slate-50 sm:h-20"
                      >
                        <img
                          *ngIf="croppedPreview()"
                          [src]="croppedPreview()"
                          class="h-full w-full object-contain"
                          alt="Cropped preview"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div
                class="flex flex-col gap-4 rounded-md border border-slate-200 bg-slate-50 p-4 sm:p-5"
              >
                <div class="space-y-4">
                  <div>
                    <div class="flex items-center justify-between gap-4">
                      <label
                        class="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500"
                        >Zoom</label
                      >
                      <span class="text-[10px] font-bold text-slate-400"
                        >{{ cropZoom() }}%</span
                      >
                    </div>
                    <input
                      type="range"
                      min="100"
                      max="220"
                      step="1"
                      [value]="cropZoom()"
                      (input)="onCropZoomChange($event)"
                      class="mt-2 w-full accent-slate-900"
                    />
                  </div>
                  <div>
                    <label
                      class="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500"
                      >Horizontal</label
                    >
                    <input
                      type="range"
                      min="-120"
                      max="120"
                      step="1"
                      [value]="cropOffsetX()"
                      (input)="onCropOffsetXChange($event)"
                      class="mt-2 w-full accent-slate-900"
                    />
                  </div>
                  <div>
                    <label
                      class="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500"
                      >Vertical</label
                    >
                    <input
                      type="range"
                      min="-120"
                      max="120"
                      step="1"
                      [value]="cropOffsetY()"
                      (input)="onCropOffsetYChange($event)"
                      class="mt-2 w-full accent-slate-900"
                    />
                  </div>
                </div>

                <div class="mt-auto space-y-3 pt-2">
                  <div
                    class="rounded-md bg-white p-3 text-[11px] font-medium leading-4 text-slate-600 shadow-sm ring-1 ring-slate-200/60"
                  >
                    Adjust positioning and zoom to perfectly fit the frame.
                  </div>

                  <div class="flex flex-col gap-2.5">
                    <button
                      type="button"
                      (click)="applyCrop()"
                      [disabled]="avatarSaving()"
                      class="w-full rounded-md bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-slate-800 disabled:opacity-50"
                    >
                      {{ avatarSaving() ? 'Saving...' : 'Apply Crop' }}
                    </button>
                    <button
                      type="button"
                      (click)="cancelCrop()"
                      class="w-full rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section class="app-module-hero overflow-hidden !p-0">
        <div class="grid gap-0 lg:grid-cols-[1.25fr_0.75fr]">
          <div class="relative overflow-hidden p-8 lg:p-10">
            <div
              class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.14),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(245,158,11,0.14),_transparent_28%)]"
            ></div>
            <div class="relative">
              <p class="app-module-kicker">Self Service</p>
              <h1 class="app-module-title">Profile workspace</h1>
              <p class="app-module-text max-w-2xl">
                Review and update your identity, contact details, and emergency
                profile from one responsive self-service workspace.
              </p>

              <div class="mt-8 flex flex-col gap-5 sm:flex-row sm:items-end">
                <button
                  type="button"
                  (click)="triggerAvatarUpload()"
                  class="group relative h-28 w-28 overflow-hidden rounded-md border border-white/60 bg-white shadow-xl ring-4 ring-white/70"
                >
                  <img
                    *ngIf="avatarPreview()"
                    [src]="avatarPreview()"
                    class="h-full w-full object-cover"
                    alt="Profile photo"
                  />
                  <div
                    *ngIf="!avatarPreview()"
                    class="flex h-full w-full items-center justify-center bg-slate-100 text-3xl font-black uppercase text-slate-500"
                  >
                    {{ userInitials() }}
                  </div>
                  <div
                    class="absolute inset-0 flex items-center justify-center bg-slate-950/0 transition group-hover:bg-slate-950/35"
                  >
                    <span
                      class="flex h-10 w-10 items-center justify-center rounded-md bg-white/95 text-slate-900 opacity-0 shadow transition group-hover:opacity-100"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          d="M17.414 2.586a2 2 0 010 2.828l-8.5 8.5A2 2 0 018.086 14H5a1 1 0 01-1-1v-3.086a2 2 0 01.586-1.414l8.5-8.5a2 2 0 012.828 0zM5 15a1 1 0 100 2h10a1 1 0 100-2H5z"
                        />
                      </svg>
                    </span>
                  </div>
                  <div
                    class="absolute right-3 top-3 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500"
                  ></div>
                </button>

                <div>
                  <h2 class="text-3xl font-black tracking-tight text-slate-900">
                    {{ fullName() }}
                  </h2>
                  <div
                    class="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600"
                  >
                    <span class="font-semibold text-slate-700">{{
                      user()?.designation?.name || 'Designation pending'
                    }}</span>
                    <span class="h-1 w-1 rounded-full bg-slate-300"></span>
                    <span>{{
                      user()?.department?.name || 'Department pending'
                    }}</span>
                    <span class="h-1 w-1 rounded-full bg-slate-300"></span>
                    <span
                      class="rounded-full bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-700 ring-1 ring-slate-200"
                      >{{ user()?.employeeCode || 'No Code' }}</span
                    >
                  </div>
                </div>
              </div>

              <div class="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  (click)="currentTab.set('personal')"
                  class="rounded-md bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Edit Profile
                </button>
                <button
                  type="button"
                  (click)="downloadIdCard()"
                  class="rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Download ID Card
                </button>
                <button
                  type="button"
                  (click)="refreshProfile()"
                  class="rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Refresh
                </button>
                <input
                  #avatarInput
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                  class="hidden"
                  (change)="onAvatarSelected($event)"
                />
              </div>
            </div>
          </div>

          <div
            class="border-t border-slate-200/70 bg-slate-50/70 p-8 lg:border-l lg:border-t-0 lg:p-10"
          >
            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div
                class="rounded-md border border-white bg-white p-5 shadow-sm"
              >
                <p
                  class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500"
                >
                  Profile completion
                </p>
                <p class="mt-3 text-3xl font-black text-slate-900">
                  {{ profileCompletion() }}%
                </p>
                <p class="mt-2 text-sm text-slate-600">
                  Core identity, contact, and emergency details are now editable
                  here.
                </p>
              </div>
              <div
                class="rounded-md border border-white bg-white p-5 shadow-sm"
              >
                <p
                  class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500"
                >
                  Account status
                </p>
                <p class="mt-3 text-xl font-black capitalize text-slate-900">
                  {{ user()?.status || 'active' }}
                </p>
                <p class="mt-2 text-sm text-slate-600">
                  Email: {{ user()?.email || 'Not available' }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div class="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside class="app-surface-card h-fit p-3 lg:sticky lg:top-8">
          <p
            class="px-3 pb-3 pt-1 text-[11px] font-black uppercase tracking-[0.24em] text-slate-400"
          >
            Profile Sections
          </p>
          <div class="space-y-1.5">
            <button
              *ngFor="let tab of tabs"
              (click)="currentTab.set(tab.id)"
              [class.bg-slate-900]="currentTab() === tab.id"
              [class.text-white]="currentTab() === tab.id"
              class="flex w-full items-center gap-3 rounded-md px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              <span
                class="flex h-10 w-10 items-center justify-center rounded-md"
                [ngClass]="
                  currentTab() === tab.id
                    ? 'bg-white/15 text-white'
                    : 'bg-white text-slate-700'
                "
              >
                {{ tab.short }}
              </span>
              <span class="flex-1">{{ tab.label }}</span>
            </button>
          </div>
        </aside>

        <section class="space-y-6">
          <div
            *ngIf="loading()"
            class="app-surface-card px-5 py-16 text-center sm:px-6"
          >
            <div
              class="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900"
            ></div>
            <p class="mt-4 text-sm text-slate-500">Loading live profile...</p>
          </div>

          <div
            *ngIf="!loading() && currentTab() === 'personal'"
            class="app-surface-card p-5 sm:p-6"
          >
            <div class="mb-6 flex items-center justify-between gap-4">
              <div>
                <p
                  class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500"
                >
                  Personal Details
                </p>
                <h3 class="mt-2 text-2xl font-black text-slate-900">
                  Identity and contact information
                </h3>
              </div>
              <span
                class="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800"
                >Live profile</span
              >
            </div>

            <div
              class="mb-6 grid gap-4 rounded-md border border-slate-200 bg-slate-50 p-4 sm:grid-cols-[96px_minmax(0,1fr)] sm:p-5"
            >
              <button
                type="button"
                (click)="triggerAvatarUpload()"
                class="group relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-white"
              >
                <img
                  *ngIf="avatarPreview()"
                  [src]="avatarPreview()"
                  class="h-full w-full object-cover"
                  alt="Profile preview"
                />
                <span
                  *ngIf="!avatarPreview()"
                  class="text-2xl font-black uppercase text-slate-500"
                  >{{ userInitials() }}</span
                >
                <div
                  class="absolute inset-0 flex items-center justify-center bg-slate-950/0 transition group-hover:bg-slate-950/35"
                >
                  <span
                    class="flex h-9 w-9 items-center justify-center rounded-md bg-white/95 text-slate-900 opacity-0 shadow transition group-hover:opacity-100"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-4.5 w-4.5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        d="M17.414 2.586a2 2 0 010 2.828l-8.5 8.5A2 2 0 018.086 14H5a1 1 0 01-1-1v-3.086a2 2 0 01.586-1.414l8.5-8.5a2 2 0 012.828 0zM5 15a1 1 0 100 2h10a1 1 0 100-2H5z"
                      />
                    </svg>
                  </span>
                </div>
              </button>
              <div class="min-w-0">
                <p class="text-sm font-semibold text-slate-900">
                  Profile image
                </p>
                <p class="mt-1 text-sm leading-6 text-slate-600">
                  Image par click karke change karo. Crop apply karte hi image
                  save ho jayegi.
                </p>
                <div class="mt-4 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    *ngIf="avatarPreview()"
                    (click)="openCropForCurrentImage()"
                    class="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    Crop Current Image
                  </button>
                  <button
                    type="button"
                    *ngIf="avatarPreview()"
                    (click)="removeAvatar()"
                    class="rounded-md border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                  >
                    Remove Photo
                  </button>
                </div>
                <p
                  *ngIf="avatarError()"
                  class="mt-3 text-sm font-medium text-rose-600"
                >
                  {{ avatarError() }}
                </p>
              </div>
            </div>

            <form [formGroup]="profileForm" class="grid gap-5 md:grid-cols-2">
              <div class="flex flex-col gap-2">
                <label
                  class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
                  >First Name</label
                >
                <input
                  type="text"
                  formControlName="firstName"
                  class="app-field"
                  placeholder="First name"
                />
              </div>
              <div class="flex flex-col gap-2">
                <label
                  class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
                  >Last Name</label
                >
                <input
                  type="text"
                  formControlName="lastName"
                  class="app-field"
                  placeholder="Last name"
                />
              </div>
              <div class="flex flex-col gap-2 md:col-span-2">
                <label
                  class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
                  >Email Address</label
                >
                <input
                  type="email"
                  formControlName="email"
                  class="app-field bg-slate-100"
                  readonly
                />
              </div>
              <div class="flex flex-col gap-2">
                <label
                  class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
                  >Phone Number</label
                >
                <input
                  type="text"
                  formControlName="phone"
                  class="app-field"
                  placeholder="Phone number"
                />
              </div>
              <div class="flex flex-col gap-2">
                <app-ui-select-advanced
                  formControlName="gender"
                  label="Gender"
                  placeholder="Select gender"
                  [options]="genderOptions"
                ></app-ui-select-advanced>
              </div>
              <div class="flex flex-col gap-2">
                <label
                  class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
                  >Date of Birth</label
                >
                <input
                  type="date"
                  formControlName="dateOfBirth"
                  class="app-field"
                />
              </div>
              <div class="flex flex-col gap-2 md:col-span-2">
                <label
                  class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
                  >Address</label
                >
                <textarea
                  rows="4"
                  formControlName="address"
                  class="app-field min-h-28 resize-y"
                  placeholder="Current address"
                ></textarea>
              </div>
            </form>

            <div
              class="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end"
            >
              <button
                type="button"
                (click)="resetForm()"
                class="rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Reset
              </button>
              <button
                type="button"
                (click)="saveProfile()"
                [disabled]="profileForm.invalid || saving()"
                class="rounded-md bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
              >
                {{ saving() ? 'Saving...' : 'Save Profile' }}
              </button>
            </div>
          </div>

          <div
            *ngIf="!loading() && currentTab() === 'employment'"
            class="app-surface-card p-5 sm:p-6"
          >
            <div class="mb-6">
              <p
                class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500"
              >
                Employment Details
              </p>
              <h3 class="mt-2 text-2xl font-black text-slate-900">
                Role, department, and organization context
              </h3>
            </div>

            <div class="grid gap-4 md:grid-cols-2">
              <div
                class="rounded-md bg-slate-50 p-5"
                *ngFor="let item of employmentDetails()"
              >
                <p
                  class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
                >
                  {{ item.label }}
                </p>
                <p class="mt-3 text-base font-semibold text-slate-900">
                  {{ item.value }}
                </p>
              </div>
            </div>
          </div>

          <div
            *ngIf="!loading() && currentTab() === 'contact'"
            class="app-surface-card p-5 sm:p-6"
          >
            <div class="mb-6">
              <p
                class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500"
              >
                Emergency Contact
              </p>
              <h3 class="mt-2 text-2xl font-black text-slate-900">
                Support details and quick reach-out info
              </h3>
            </div>

            <form [formGroup]="profileForm" class="grid gap-5 md:grid-cols-2">
              <div class="flex flex-col gap-2">
                <label
                  class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
                  >Emergency Contact Name</label
                >
                <input
                  type="text"
                  formControlName="emergencyContact"
                  class="app-field"
                  placeholder="Contact person"
                />
              </div>
              <div class="flex flex-col gap-2">
                <label
                  class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
                  >Emergency Phone</label
                >
                <input
                  type="text"
                  formControlName="emergencyPhone"
                  class="app-field"
                  placeholder="Emergency number"
                />
              </div>
            </form>

            <div
              class="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end"
            >
              <button
                type="button"
                (click)="resetForm()"
                class="rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Reset
              </button>
              <button
                type="button"
                (click)="saveProfile()"
                [disabled]="profileForm.invalid || saving()"
                class="rounded-md bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
              >
                {{ saving() ? 'Saving...' : 'Save Contact' }}
              </button>
            </div>
          </div>

          <div
            *ngIf="!loading() && currentTab() === 'security'"
            class="app-surface-card p-5 sm:p-6"
          >
            <div class="mb-6">
              <p
                class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500"
              >
                Account & Security
              </p>
              <h3 class="mt-2 text-2xl font-black text-slate-900">
                Verification and login snapshot
              </h3>
            </div>

            <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div
                class="rounded-md bg-slate-50 p-5"
                *ngFor="let item of securityDetails()"
              >
                <p
                  class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
                >
                  {{ item.label }}
                </p>
                <p
                  class="mt-3 break-words text-base font-semibold text-slate-900"
                >
                  {{ item.value }}
                </p>
              </div>
            </div>
          </div>

          <div
            *ngIf="!loading() && currentTab() === 'bank'"
            class="app-surface-card p-5 sm:p-6"
          >
            <div class="mb-6 flex items-center justify-between gap-4">
              <div>
                <p
                  class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500"
                >
                  Bank & Payment
                </p>
                <h3 class="mt-2 text-2xl font-black text-slate-900">
                  Payroll account configuration
                </h3>
              </div>
              <span
                class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
                >Secure data</span
              >
            </div>

            <form [formGroup]="profileForm" class="grid gap-5 md:grid-cols-2">
              <div class="flex flex-col gap-2">
                <label
                  class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
                  >Bank Name</label
                >
                <input
                  type="text"
                  formControlName="bankName"
                  class="app-field"
                  placeholder="Full bank name"
                />
              </div>
              <div class="flex flex-col gap-2">
                <label
                  class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
                  >Account Number</label
                >
                <input
                  type="text"
                  formControlName="bankAccount"
                  class="app-field"
                  placeholder="10-18 digit account number"
                />
              </div>
              <div class="flex flex-col gap-2">
                <label
                  class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
                  >IFSC Code</label
                >
                <input
                  type="text"
                  formControlName="ifscCode"
                  class="app-field"
                  placeholder="11 character code"
                />
              </div>
              <div class="flex flex-col gap-2">
                <label
                  class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
                  >PAN Number</label
                >
                <input
                  type="text"
                  formControlName="panNumber"
                  class="app-field"
                  placeholder="Tax identity number"
                />
              </div>
              <div
                class="rounded-md bg-emerald-50 p-4 text-xs leading-5 text-emerald-800 md:col-span-2"
              >
                <p class="font-bold uppercase tracking-wider text-emerald-900">
                  Note for payroll
                </p>
                <p class="mt-1 opacity-90">
                  Please ensure these details are correct to avoid payroll
                  delays. Any changes will be audited for security compliance.
                </p>
              </div>
            </form>

            <div
              class="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end"
            >
              <button
                type="button"
                (click)="resetForm()"
                class="rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Reset
              </button>
              <button
                type="button"
                (click)="saveProfile()"
                [disabled]="profileForm.invalid || saving()"
                class="rounded-md bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
              >
                {{ saving() ? 'Saving...' : 'Save Payment Details' }}
              </button>
            </div>
          </div>

          <div
            *ngIf="!loading() && currentTab() === 'documents'"
            class="app-surface-card p-5 sm:p-6"
          >
            <div class="mb-6 flex items-center justify-between gap-4">
              <div>
                <p
                  class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500"
                >
                  Documents
                </p>
                <h3 class="mt-2 text-2xl font-black text-slate-900">
                  Official employment records
                </h3>
              </div>
              <button
                (click)="openAddDocument()"
                class="flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-bold text-slate-900 ring-1 ring-slate-200 transition hover:bg-slate-50"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Upload New
              </button>
            </div>

            <div class="space-y-3">
              <div
                *ngFor="let doc of documents()"
                class="group flex items-center gap-4 rounded-md border border-white bg-white p-4 shadow-sm ring-1 ring-slate-100 transition hover:bg-slate-50 hover:ring-slate-200"
              >
                <div
                  class="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-bold text-slate-900">
                    {{ doc.title || doc.name }}
                  </p>
                  <p class="mt-1 text-xs text-slate-500">
                    {{
                      doc.fileSizeKb
                        ? doc.fileSizeKb + ' KB'
                        : doc.size || 'Unknown size'
                    }}
                    • Captured on
                    {{ doc.createdAt || doc.date | date: 'mediumDate' }}
                  </p>
                </div>
                <div class="flex gap-2">
                  <button
                    class="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
                  >
                    Download
                  </button>
                  <button
                    (click)="deleteDocument(doc.id)"
                    class="rounded-md border border-rose-100 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div
                *ngIf="documents().length === 0"
                class="rounded-md border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500"
              >
                No documents uploaded yet.
              </div>
            </div>
          </div>

          <div
            *ngIf="!loading() && currentTab() === 'experience'"
            class="app-surface-card p-5 sm:p-6"
          >
            <div class="mb-8">
              <p
                class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500"
              >
                History & Background
              </p>
              <h3 class="mt-2 text-2xl font-black text-slate-900">
                Experience & Education
              </h3>
            </div>

            <div class="space-y-10">
              <div class="relative pl-8">
                <div
                  class="absolute left-[9px] top-6 h-full w-0.5 bg-slate-100"
                ></div>
                <div class="mb-6 flex items-center justify-between gap-4 pr-1">
                  <p
                    class="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400"
                  >
                    Professional Journey
                  </p>
                  <button
                    (click)="openAddExperience()"
                    class="text-xs font-black text-slate-900 transition hover:text-slate-600"
                  >
                    + Add
                  </button>
                </div>
                <div class="space-y-6">
                  <div *ngFor="let exp of experience()" class="group relative">
                    <div
                      class="absolute -left-[27px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-slate-900 ring-2 ring-slate-100"
                    ></div>
                    <div class="flex items-start justify-between gap-4">
                      <h4 class="text-sm font-black text-slate-900">
                        {{ exp.role }}
                      </h4>
                      <div class="flex gap-2">
                        <button
                          (click)="editExperience(exp)"
                          class="text-[10px] font-bold text-slate-500 opacity-0 transition group-hover:opacity-100 hover:text-slate-900"
                        >
                          Edit
                        </button>
                        <button
                          (click)="deleteExperience(exp.id)"
                          class="text-[10px] font-bold text-rose-500 opacity-0 transition group-hover:opacity-100 hover:text-rose-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <p class="mt-1 text-xs font-bold text-slate-600">
                      {{ exp.companyName || exp.company }} •
                      {{ exp.startDate | date: 'MMM yyyy' }} -
                      {{
                        exp.isCurrent
                          ? 'Present'
                          : (exp.endDate | date: 'MMM yyyy')
                      }}
                    </p>
                    <p class="mt-2 text-xs leading-5 text-slate-500">
                      {{ exp.description }}
                    </p>
                  </div>
                  <div
                    *ngIf="experience().length === 0"
                    class="text-xs italic text-slate-400"
                  >
                    No experience records found.
                  </div>
                </div>
              </div>

              <div class="relative pl-8 pt-2">
                <div class="mb-6 flex items-center justify-between gap-4 pr-1">
                  <p
                    class="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400"
                  >
                    Academic Background
                  </p>
                  <button
                    (click)="openAddEducation()"
                    class="text-xs font-black text-slate-900 transition hover:text-slate-600"
                  >
                    + Add
                  </button>
                </div>
                <div class="space-y-6">
                  <div *ngFor="let edu of education()" class="group relative">
                    <div
                      class="absolute -left-[27px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-slate-400 ring-2 ring-slate-100"
                    ></div>
                    <div class="flex items-start justify-between gap-4">
                      <h4 class="text-sm font-black text-slate-900">
                        {{ edu.degree }}
                      </h4>
                      <div class="flex gap-2">
                        <button
                          (click)="editEducation(edu)"
                          class="text-[10px] font-bold text-slate-500 opacity-0 transition group-hover:opacity-100 hover:text-slate-900"
                        >
                          Edit
                        </button>
                        <button
                          (click)="deleteEducation(edu.id)"
                          class="text-[10px] font-bold text-rose-500 opacity-0 transition group-hover:opacity-100 hover:text-rose-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <p class="mt-1 text-xs font-bold text-slate-600">
                      {{ edu.institution || edu.school }} •
                      {{ edu.startDate | date: 'yyyy' }} -
                      {{ edu.endDate | date: 'yyyy' }}
                    </p>
                    <p
                      *ngIf="edu.grade"
                      class="mt-1 text-xs font-medium text-emerald-600"
                    >
                      Grade: {{ edu.grade }}
                    </p>
                  </div>
                  <div
                    *ngIf="education().length === 0"
                    class="text-xs italic text-slate-400"
                  >
                    No education records found.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class ProfileComponent implements OnInit {
  @ViewChild('avatarInput') avatarInput?: ElementRef<HTMLInputElement>;

  private authService = inject(AuthService);
  private employeeService = inject(EmployeeService);
  private store = inject(Store);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);
  private orgService = inject(OrganizationService);

  user = signal<any>(null);
  loading = signal(true);
  saving = signal(false);
  avatarSaving = signal(false);
  currentTab = signal('personal');
  avatarPreview = signal<string>('');
  currentAvatarSnapshot = signal<string>('');
  avatarError = signal<string>('');
  showCropModal = signal(false);
  cropSource = signal<string>('');
  croppedPreview = signal<string>('');
  cropZoom = signal(100);
  cropOffsetX = signal(0);
  cropOffsetY = signal(0);
  orgName = signal<string>('');
  orgLogo = signal<string>('');

  // Experience and Education Modals
  showExperienceModal = signal(false);
  showEducationModal = signal(false);
  showDocumentModal = signal(false);
  isEditing = signal(false);
  currentIdInProgress = signal<number | null>(null);

  experienceForm = this.fb.group({
    companyName: ['', [Validators.required]],
    role: ['', [Validators.required]],
    location: [''],
    startDate: ['', [Validators.required]],
    endDate: [''],
    isCurrent: [false],
    description: [''],
  });

  educationForm = this.fb.group({
    institution: ['', [Validators.required]],
    degree: ['', [Validators.required]],
    fieldOfStudy: [''],
    startDate: [''],
    endDate: [''],
    grade: [''],
    description: [''],
  });

  documentForm = this.fb.group({
    title: ['', [Validators.required]],
  });
  selectedFile: File | null = null;
  education = signal<any[]>([]);
  experience = signal<any[]>([]);
  documents = signal<any[]>([]);

  private isDraggingCrop = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragOriginX = 0;
  private dragOriginY = 0;

  profileForm = this.fb.group({
    firstName: ['', [Validators.required]],
    lastName: [''],
    email: [''],
    phone: [''],
    gender: [''],
    dateOfBirth: [''],
    address: [''],
    emergencyContact: [''],
    emergencyPhone: [''],
    bankAccount: [''],
    bankName: [''],
    ifscCode: [''],
    panNumber: [''],
  });

  tabs = [
    { id: 'personal', label: 'Personal Information', short: 'PI' },
    { id: 'employment', label: 'Employment Details', short: 'ED' },
    { id: 'contact', label: 'Emergency Contact', short: 'EC' },
    { id: 'security', label: 'Account & Security', short: 'AS' },
    { id: 'bank', label: 'Bank & Payment', short: 'BP' },
    { id: 'documents', label: 'Documents', short: 'DO' },
    { id: 'experience', label: 'Experience & Education', short: 'EE' },
  ];

  genderOptions: SelectOption[] = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Other', value: 'other' },
    { label: 'Prefer not to say', value: 'prefer_not_to_say' },
  ];

  personalDetails = computed(() => {
    const user = this.user();
    return [
      { label: 'First Name', value: user?.firstName || '--' },
      { label: 'Last Name', value: user?.lastName || '--' },
      { label: 'Email Address', value: user?.email || '--' },
      { label: 'Phone Number', value: user?.phone || '--' },
      { label: 'Date of Birth', value: this.formatDate(user?.dateOfBirth) },
      { label: 'Gender', value: user?.gender || 'Not specified' },
    ];
  });

  employmentDetails = computed(() => {
    const user = this.user();
    return [
      { label: 'Employee ID', value: user?.employeeCode || '--' },
      { label: 'Department', value: user?.department?.name || 'Not assigned' },
      {
        label: 'Designation',
        value: user?.designation?.name || 'Not assigned',
      },
      {
        label: 'Role',
        value:
          typeof user?.role === 'string'
            ? user.role
            : user?.role?.name || (user?.roleId ? `Role ${user.roleId}` : '--'),
      },
      {
        label: 'Organization',
        value:
          user?.organizationName ||
          user?.companyName ||
          (user?.orgId ? `Org ${user.orgId}` : '--'),
      },
      { label: 'Status', value: user?.status || 'active' },
    ];
  });

  securityDetails = computed(() => {
    const user = this.user();
    return [
      {
        label: 'Email Verification',
        value: user?.emailVerified ? 'Verified' : 'Not verified',
      },
      {
        label: 'Phone Verification',
        value: user?.phoneVerified ? 'Verified' : 'Not verified',
      },
      { label: 'Login Type', value: user?.loginType || 'email' },
      { label: 'Account Access', value: user?.isLocked ? 'Locked' : 'Active' },
    ];
  });

  bankDetails = computed(() => {
    const user = this.user();
    return [
      {
        label: 'Salary',
        value: user?.salary ? String(user.salary) : 'Not available',
      },
      { label: 'Bank Account', value: user?.bankAccount || 'Not available' },
      { label: 'Bank Name', value: user?.bankName || 'Not available' },
      { label: 'IFSC Code', value: user?.ifscCode || 'Not available' },
      { label: 'PAN Number', value: user?.panNumber || 'Not available' },
      {
        label: 'Country',
        value: user?.countryName || user?.countryCode || 'Not available',
      },
    ];
  });

  ngOnInit() {
    this.refreshProfile();
    this.fetchOrganizationBranding();
  }

  fetchOrganizationBranding() {
    this.orgService.getOrganization().subscribe((org) => {
      this.orgName.set(org?.name || '');
      this.orgLogo.set(org?.logo || '');
    });
  }

  refreshProfile() {
    const fallbackUser = this.authService.getStoredUser();
    if (fallbackUser) {
      this.user.set(fallbackUser);
      this.patchForm(fallbackUser);
    }

    this.loading.set(true);
    this.authService.getMe().subscribe({
      next: (me) => {
        this.fetchOrganizationBranding();
        if (me?.id) {
          this.employeeService.getEmployeeById(me.id).subscribe({
            next: (employee) => {
              const mergedUser = this.mergeUserData(me, employee);
              this.user.set(mergedUser);
              this.authService.setStoredUser(mergedUser);
              this.patchForm(mergedUser);
              this.loading.set(false);
            },
            error: () => {
              this.user.set(me);
              this.authService.setStoredUser(me);
              this.patchForm(me);
              this.loading.set(false);
            },
          });
          return;
        }

        this.user.set(me);
        this.authService.setStoredUser(me);
        this.patchForm(me);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        if (!fallbackUser) {
          this.toastService.error('Failed to load profile');
        }
      },
    });

    this.loadDynamicData();
  }

  loadDynamicData() {
    this.employeeService
      .getDocuments()
      .subscribe((docs) => this.documents.set(docs));
    this.employeeService
      .getExperiences()
      .subscribe((exps) => this.experience.set(exps));
    this.employeeService
      .getEducation()
      .subscribe((edu) => this.education.set(edu));
  }

  // ============ MODAL HANDLERS ============

  openAddExperience() {
    this.isEditing.set(false);
    this.currentIdInProgress.set(null);
    this.experienceForm.reset({ isCurrent: false });
    this.showExperienceModal.set(true);
  }

  openAddEducation() {
    this.isEditing.set(false);
    this.currentIdInProgress.set(null);
    this.educationForm.reset();
    this.showEducationModal.set(true);
  }

  openAddDocument() {
    this.documentForm.reset();
    this.selectedFile = null;
    this.showDocumentModal.set(true);
  }

  closeModals() {
    this.showExperienceModal.set(false);
    this.showEducationModal.set(false);
    this.showDocumentModal.set(false);
  }

  // ============ SUBMIT HANDLERS ============

  editExperience(exp: any) {
    this.isEditing.set(true);
    this.currentIdInProgress.set(exp.id);
    this.experienceForm.patchValue({
      companyName: exp.companyName,
      role: exp.role,
      location: exp.location,
      startDate: this.normalizeDateInput(exp.startDate),
      endDate: this.normalizeDateInput(exp.endDate),
      isCurrent: exp.isCurrent,
      description: exp.description,
    });
    this.showExperienceModal.set(true);
  }

  saveExperience() {
    if (this.experienceForm.invalid) return;
    const data = this.experienceForm.value;
    this.saving.set(true);

    const obs =
      this.isEditing() && this.currentIdInProgress()
        ? this.employeeService.updateExperience(
            this.currentIdInProgress()!,
            data,
          )
        : this.employeeService.addExperience(data);

    obs.subscribe({
      next: () => {
        this.loadDynamicData();
        this.closeModals();
        this.saving.set(false);
        this.toastService.success(
          `Experience ${this.isEditing() ? 'updated' : 'added'} successfully`,
        );
      },
      error: () => {
        this.saving.set(false);
        this.toastService.error('Failed to save experience');
      },
    });
  }

  editEducation(edu: any) {
    this.isEditing.set(true);
    this.currentIdInProgress.set(edu.id);
    this.educationForm.patchValue({
      institution: edu.institution || edu.school,
      degree: edu.degree,
      fieldOfStudy: edu.fieldOfStudy || edu.field_of_study,
      startDate: this.normalizeDateInput(edu.startDate || edu.start_date),
      endDate: this.normalizeDateInput(edu.endDate || edu.end_date),
      grade: edu.grade,
      description: edu.description,
    });
    this.showEducationModal.set(true);
  }

  saveEducation() {
    if (this.educationForm.invalid) return;
    const data = this.educationForm.value;
    this.saving.set(true);

    const obs =
      this.isEditing() && this.currentIdInProgress()
        ? this.employeeService.updateEducation(
            this.currentIdInProgress()!,
            data,
          )
        : this.employeeService.addEducation(data);

    obs.subscribe({
      next: () => {
        this.loadDynamicData();
        this.closeModals();
        this.saving.set(false);
        this.toastService.success(
          `Education ${this.isEditing() ? 'updated' : 'added'} successfully`,
        );
      },
      error: () => {
        this.saving.set(false);
        this.toastService.error('Failed to save education');
      },
    });
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0] || null;
  }

  uploadNewDocument() {
    if (this.documentForm.invalid || !this.selectedFile) {
      this.toastService.error('Please provide a title and select a file');
      return;
    }

    this.saving.set(true);
    // Note: In a real scenario, this would be a FormData upload.
    // I'll simulate storing the metadata for now as per the API developed.
    const payload = {
      title: this.documentForm.get('title')?.value,
      fileUuid: 'temp-uuid-' + Math.random().toString(36).substring(7), // Simulate upload storage
      fileSizeKb: Math.round(this.selectedFile.size / 1024),
      mimeType: this.selectedFile.type,
    };

    this.employeeService.uploadDocument(payload).subscribe({
      next: () => {
        this.loadDynamicData();
        this.closeModals();
        this.saving.set(false);
        this.toastService.success('Document uploaded');
      },
      error: () => {
        this.saving.set(false);
        this.toastService.error('Upload failed');
      },
    });
  }

  deleteDocument(id: number) {
    if (!confirm('Are you sure you want to delete this document?')) return;
    this.employeeService.deleteDocument(id).subscribe(() => {
      this.documents.update((docs) => docs.filter((d) => d.id !== id));
      this.toastService.success('Document deleted');
    });
  }

  deleteExperience(id: number) {
    if (!confirm('Are you sure you want to delete this experience entry?'))
      return;
    this.employeeService.deleteExperience(id).subscribe(() => {
      this.experience.update((exps) => exps.filter((e) => e.id !== id));
      this.toastService.success('Experience deleted');
    });
  }

  deleteEducation(id: number) {
    if (!confirm('Are you sure you want to delete this education entry?'))
      return;
    this.employeeService.deleteEducation(id).subscribe(() => {
      this.education.update((edu) => edu.filter((e) => e.id !== id));
      this.toastService.success('Education deleted');
    });
  }

  patchForm(user: any) {
    this.avatarPreview.set(user?.avatar || '');
    this.currentAvatarSnapshot.set(user?.avatar || '');
    this.avatarError.set('');
    this.profileForm.patchValue(
      {
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
        phone: user?.phone || '',
        gender: user?.gender || '',
        dateOfBirth: this.normalizeDateInput(user?.dateOfBirth),
        address: user?.address || '',
        emergencyContact: user?.emergencyContact || '',
        emergencyPhone: user?.emergencyPhone || '',
        bankAccount: user?.bankAccount || '',
        bankName: user?.bankName || '',
        ifscCode: user?.ifscCode || '',
        panNumber: user?.panNumber || '',
      },
      { emitEvent: false },
    );
  }

  resetForm() {
    this.patchForm(this.user());
  }

  saveProfile() {
    const user = this.user();
    if (!user?.id) {
      this.toastService.error('Profile ID missing');
      return;
    }

    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      this.toastService.error('Please fill required profile details');
      return;
    }

    this.saving.set(true);
    const avatar = this.avatarPreview() || null;
    const payload = {
      firstName: this.profileForm.get('firstName')?.value?.trim(),
      lastName: this.profileForm.get('lastName')?.value?.trim(),
      phone: this.profileForm.get('phone')?.value?.trim(),
      avatar: avatar,
      profile_image: avatar,
      profileImage: avatar,
      gender: this.profileForm.get('gender')?.value || undefined,
      dateOfBirth: this.profileForm.get('dateOfBirth')?.value || undefined,
      address: this.profileForm.get('address')?.value?.trim() || undefined,
      emergencyContact:
        this.profileForm.get('emergencyContact')?.value?.trim() || undefined,
      emergencyPhone:
        this.profileForm.get('emergencyPhone')?.value?.trim() || undefined,
      bankAccount:
        this.profileForm.get('bankAccount')?.value?.trim() || undefined,
      bankName: this.profileForm.get('bankName')?.value?.trim() || undefined,
      ifscCode: this.profileForm.get('ifscCode')?.value?.trim() || undefined,
      panNumber: this.profileForm.get('panNumber')?.value?.trim() || undefined,
    };

    this.employeeService.updateEmployee(user.id, payload).subscribe({
      next: (updatedUser) => {
        const mergedUser = this.mergeUserData(user, {
          ...updatedUser,
          avatar: updatedUser?.avatar || avatar || user?.avatar,
        });
        this.user.set(mergedUser);
        this.authService.setStoredUser(mergedUser);
        this.patchForm(mergedUser);
        this.saving.set(false);
        this.toastService.success('Profile updated successfully');
      },
      error: (err) => {
        this.saving.set(false);
        this.toastService.error(
          err?.error?.message || 'Failed to update profile',
        );
      },
    });
  }

  triggerAvatarUpload() {
    this.avatarInput?.nativeElement.click();
  }

  onAvatarSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const allowedTypes = [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
      'image/svg+xml',
    ];
    if (!allowedTypes.includes(file.type)) {
      this.avatarError.set('Please upload PNG, JPG, WEBP, or SVG image.');
      input.value = '';
      return;
    }

    const maxSizeBytes = 2 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      this.avatarError.set('Please upload an image smaller than 2 MB.');
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const imageSource =
        typeof reader.result === 'string' ? reader.result : '';
      this.openCropModal(imageSource);
      this.avatarError.set('');
    };
    reader.onerror = () => {
      this.avatarError.set('Failed to read image. Please try another file.');
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  openCropForCurrentImage() {
    const currentImage = this.currentAvatarSnapshot() || this.avatarPreview();
    if (!currentImage) {
      this.toastService.error('No current image available to crop');
      return;
    }

    this.openCropModal(currentImage);
  }

  removeAvatar() {
    this.persistAvatarChange(null, 'Profile image removed successfully');
  }

  onCropZoomChange(event: Event) {
    const value = Number((event.target as HTMLInputElement).value || 100);
    this.cropZoom.set(value);
    this.renderCropPreview();
  }

  onCropOffsetXChange(event: Event) {
    const value = Number((event.target as HTMLInputElement).value || 0);
    this.cropOffsetX.set(value);
    this.renderCropPreview();
  }

  onCropOffsetYChange(event: Event) {
    const value = Number((event.target as HTMLInputElement).value || 0);
    this.cropOffsetY.set(value);
    this.renderCropPreview();
  }

  startCropDrag(event: MouseEvent | TouchEvent) {
    const point = this.getPointerPoint(event);
    if (!point) return;

    event.preventDefault();
    this.isDraggingCrop = true;
    this.dragStartX = point.x;
    this.dragStartY = point.y;
    this.dragOriginX = this.cropOffsetX();
    this.dragOriginY = this.cropOffsetY();

    window.addEventListener('mousemove', this.handleCropDragMove, {
      passive: false,
    });
    window.addEventListener('mouseup', this.handleCropDragEnd, {
      passive: true,
    });
    window.addEventListener('touchmove', this.handleCropDragMove, {
      passive: false,
    });
    window.addEventListener('touchend', this.handleCropDragEnd, {
      passive: true,
    });
  }

  cancelCrop() {
    this.showCropModal.set(false);
    this.cropSource.set('');
    this.croppedPreview.set('');
    this.stopCropDrag();
    if (this.avatarInput?.nativeElement) {
      this.avatarInput.nativeElement.value = '';
    }
  }

  applyCrop() {
    this.renderCropPreview(() => {
      const finalImage = this.croppedPreview() || this.cropSource();
      this.persistAvatarChange(
        finalImage,
        'Profile image updated successfully',
        true,
      );
    });
  }

  private openCropModal(imageSource: string) {
    this.cropSource.set(imageSource);
    this.cropZoom.set(100);
    this.cropOffsetX.set(0);
    this.cropOffsetY.set(0);
    this.croppedPreview.set(imageSource);
    this.showCropModal.set(true);
  }

  downloadIdCard() {
    const user = this.user();
    if (!user) {
      this.toastService.error('Profile not loaded yet');
      return;
    }

    const companyName =
      this.orgName() ||
      user.organizationName ||
      user.companyName ||
      user.organization?.name ||
      user.company?.name ||
      'Official ID Card';
    const companyLogo =
      this.orgLogo() ||
      user.organizationLogo ||
      user.companyLogo ||
      user.organization?.logo ||
      user.company?.logo ||
      '';

    const designation =
      user.designation?.name || user.designation || 'EMPLOYEE';
    const department = user.department?.name || user.department || 'GENERAL';
    const employeeId = user.employeeCode || 'E-0012345';
    const joinDate = this.formatDate(user.joinDate);

    const address = user.address || 'Corporate Headquarters';
    const emergencyContact = user.emergencyContact || '--';
    const emergencyPhone = user.emergencyPhone || '--';
    const phone = user.phone || '--';
    const email = user.email || '--';

    const photoMarkup = this.avatarPreview()
      ? `<img src="${this.avatarPreview()}" alt="Employee Photo" style="width:110px;height:110px;object-fit:cover;border-radius:20px;border:3px solid white;box-shadow: 0 4px 10px rgba(0,0,0,0.1);" />`
      : `<div style="width:110px;height:110px;border-radius:20px;background:#f8fafc;color:#cbd5e1;display:flex;align-items:center;justify-content:center;font-size:40px;font-weight:900;border:3px solid white;box-shadow: 0 4px 10px rgba(0,0,0,0.1);">${this.userInitials()}</div>`;

    const logoMarkup = companyLogo
      ? `<img src="${companyLogo}" style="height:32px;width:auto;max-width:140px;object-fit:contain;" />`
      : `<div style="height:32px;display:flex;align-items:center;font-weight:900;font-size:18px;letter-spacing:-0.03em;color:white;">${companyName.substring(0, 2).toUpperCase()}</div>`;

    const cardWindow = window.open('', '_blank', 'width=1000,height=900');
    if (!cardWindow) {
      this.toastService.error('Please allow popups to download the ID card');
      return;
    }

    const html = `
      <html>
        <head>
          <title>Official ID Card - ${this.fullName()}</title>
          <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; padding: 40px; font-family: 'Plus Jakarta Sans', sans-serif; background: #f8fafc; display: flex; flex-direction: column; align-items: center; gap: 40px; }
            
            /* CR80 Standard Size: 54mm x 86mm (Vertical) -> ~204pt x 325pt -> scaling up for display */
            .id-card-wrapper { display: flex; gap: 40px; flex-wrap: wrap; justify-content: center; }
            
            .card-side {
              width: 340px;
              height: 540px;
              background: white;
              border-radius: 20px;
              overflow: hidden;
              box-shadow: 0 25px 50px -12px rgba(0,0,0,0.15);
              border: 1px solid #e2e8f0;
              position: relative;
              display: flex;
              flex-direction: column;
            }

            /* FRONT SIDE */
            .front-header { height: 180px; background: #0f172a; position: relative; padding: 30px 20px; text-align: center; }
            .front-header::after { 
                content:''; position: absolute; bottom: 0; left: 0; width: 100%; height: 60px; 
                background: linear-gradient(transparent, rgba(255,255,255,0.05));
            }
            .logo-area { display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 5px; }
            .comp-label { color: white; font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; }
            .official-pill { display: inline-block; margin-top: 10px; padding: 4px 10px; background: #0a527b; color: #7dd3fc; font-size: 9px; font-weight: 800; text-transform: uppercase; border-radius: 100px; letter-spacing: 0.1em; }
            
            .front-photo { margin-top: -65px; display: flex; justify-content: center; position: relative; z-index: 10; }
            .front-body { flex: 1; padding: 15px 30px 30px; text-align: center; }
            .user-name { font-size: 26px; font-weight: 900; color: #0f172a; line-height: 1.1; margin-top: 10px; }
            .user-role { font-size: 13px; font-weight: 700; color: #0284c7; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 5px; }
            .id-box { margin-top: 25px; padding: 12px; background: #f1f5f9; border-radius: 12px; }
            .id-label { font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.15em; }
            .id-value { font-size: 18px; font-weight: 800; color: #1e293b; margin-top: 3px; font-family: monospace; letter-spacing: 0.2em; }
            .front-footer { margin-top: auto; padding-bottom: 25px; display: flex; flex-direction: column; align-items: center; }
            .barcode-strip { width: 180px; height: 35px; background: repeating-linear-gradient(90deg, #334155, #334155 2px, transparent 2px, transparent 6px); opacity: 0.6; }

            /* BACK SIDE */
            .back-header { background: #0f172a; height: 8px; }
            .back-body { flex: 1; padding: 35px 30px; }
            .section-title { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.1em; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 12px; display: flex; justify-content: space-between; }
            .data-item { margin-bottom: 18px; }
            .data-label { font-size: 9px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; }
            .data-value { font-size: 12px; font-weight: 700; color: #334155; margin-top: 4px; line-height: 1.4; }
            .qr-area { margin-top: auto; padding: 25px 30px; display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px dashed #e2e8f0; }
            .qr-code { width: 70px; height: 70px; background: #f1f5f9; border: 1px solid #e2e8f0; position: relative; display: flex; align-items: center; justify-content: center; }
            .qr-code::after { content:'QR Scan'; font-size: 8px; font-weight: 700; color: #cbd5e1; }
            .disclaimer { font-size: 9px; font-weight: 500; color: #94a3b8; width: 180px; line-height: 1.4; }
            .back-footer-accent { height: 12px; background: linear-gradient(90deg, #0369a1, #0f172a); }

            .action-bar { position: fixed; bottom: 40px; display: flex; gap: 20px; z-index: 1000; }
            .btn { padding: 15px 35px; border-radius: 100px; font-weight: 900; font-size: 15px; cursor: pointer; border: none; box-shadow: 0 10px 30px rgba(0,0,0,0.1); transition: all 0.2s; font-family: inherit; }
            .btn-blue { background: #0f172a; color: white; }
            .btn-blue:hover { transform: translateY(-3px); box-shadow: 0 15px 35px rgba(0,0,0,0.2); }
            
            @media print {
              body { background: white; padding: 0 !important; gap: 0; }
              .action-bar { display: none; }
              .id-card-wrapper { gap: 0; display: block; }
              .card-side { box-shadow: none; border-radius: 0; border: 1px solid #eee; break-after: page; margin: 0 auto; }
              .card-side:last-child { break-after: auto; margin-top: 40px; }
            }
          </style>
        </head>
        <body>
          <div class="id-card-wrapper">
            <!-- FRONT -->
            <div class="card-side">
              <div class="front-header">
                <div class="logo-area">
                  ${logoMarkup}
                  <span class="comp-label">${companyName}</span>
                </div>
                <div class="official-pill">Authorized Personnel</div>
              </div>
              <div class="front-photo">
                ${photoMarkup}
              </div>
              <div class="front-body">
                <div class="user-name">${this.fullName()}</div>
                <div class="user-role">${designation}</div>
                <div class="id-box">
                  <div class="id-label">Employee Identity Number</div>
                  <div class="id-value">${employeeId}</div>
                </div>
              </div>
              <div class="front-footer">
                <div class="barcode-strip"></div>
                <div style="font-size:10px;font-weight:700;color:#94a3b8;margin-top:8px;text-transform:uppercase;letter-spacing:0.1em;">Standard Workforce ID</div>
              </div>
            </div>

            <!-- BACK -->
            <div class="card-side">
              <div class="back-header"></div>
              <div class="back-body">
                <div class="section-title">Employment & Contact</div>
                
                <div class="data-item">
                  <div class="data-label">Department</div>
                  <div class="data-value">${department}</div>
                </div>

                <div class="data-item">
                  <div class="data-label">Permanent Address</div>
                  <div class="data-value">${address}</div>
                </div>

                <div class="data-item">
                  <div class="data-label">Contact Details</div>
                  <div class="data-value">${phone} / ${email}</div>
                </div>

                <div class="section-title" style="margin-top:30px;">Emergency Information</div>
                <div class="data-item">
                  <div class="data-label">Contact Person</div>
                  <div class="data-value">${emergencyContact}</div>
                </div>
                <div class="data-item">
                  <div class="data-label">Emergency Phone</div>
                  <div class="data-value" style="color:#e11d48">${emergencyPhone}</div>
                </div>
              </div>

              <div class="qr-area">
                <div class="disclaimer">If found, please return to any branch office of ${companyName}. This card is non-transferable and remains property of the org.</div>
                <div class="qr-code"></div>
              </div>
              <div class="back-footer-accent"></div>
            </div>
          </div>

          <div class="action-bar">
            <button class="btn btn-blue" onclick="window.print()">Download (Save as PDF)</button>
            <button id="shareBtn" class="btn" style="background:#0284c7; color:white; display:none;">Share Card</button>
            <button class="btn" style="background:white; color:#0f172a;" onclick="window.close()">Close Preview</button>
          </div>

          <script>
            if (navigator.share) {
              const shareBtn = document.getElementById('shareBtn');
              shareBtn.style.display = 'block';
              shareBtn.onclick = async () => {
                try {
                  await navigator.share({
                    title: 'Employee ID Card - ${this.fullName()}',
                    text: 'Official ID Card for ${this.fullName()} at ${companyName}',
                    url: window.location.href
                  });
                } catch (err) {
                  console.log('Error sharing:', err);
                }
              };
            }
          </script>
        </body>
      </html>
    `;

    cardWindow.document.open();
    cardWindow.document.write(html);
    cardWindow.document.close();
  }

  fullName(): string {
    const user = this.user();
    return (
      [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
      'Employee Profile'
    );
  }

  userInitials(): string {
    const user = this.user();
    return (
      `${user?.firstName?.charAt(0) || ''}${user?.lastName?.charAt(0) || ''}` ||
      'HR'
    );
  }

  profileCompletion(): number {
    const user = this.user() || {};
    const fields = [
      user.firstName,
      user.lastName,
      user.email,
      user.phone,
      user.address,
      user.employeeCode,
      user.designation?.name,
      user.department?.name,
      user.emergencyContact,
      user.emergencyPhone,
      user.bankAccount,
      user.bankName,
      user.ifscCode,
      user.panNumber,
      user.avatar,
    ];
    const completed = fields.filter(Boolean).length;
    return Math.round((completed / fields.length) * 100);
  }

  private normalizeDateInput(value?: string): string {
    if (!value) return '';
    return String(value).split('T')[0];
  }

  private formatDate(value?: string): string {
    if (!value) return '-- / -- / ----';
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? String(value)
      : date.toLocaleDateString('en-IN');
  }

  private renderCropPreview(onDone?: () => void) {
    const source = this.cropSource();
    if (!source) {
      return;
    }

    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const size = 320;
      canvas.width = size;
      canvas.height = size;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return;
      }

      ctx.clearRect(0, 0, size, size);

      const zoom = this.cropZoom() / 100;
      const baseScale = Math.max(size / image.width, size / image.height);
      const drawWidth = image.width * baseScale * zoom;
      const drawHeight = image.height * baseScale * zoom;
      const drawX = (size - drawWidth) / 2 + this.cropOffsetX();
      const drawY = (size - drawHeight) / 2 + this.cropOffsetY();

      ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
      this.croppedPreview.set(canvas.toDataURL('image/png'));
      onDone?.();
    };
    image.onerror = () => {
      this.avatarError.set(
        'Failed to prepare crop preview. Please try another image.',
      );
    };
    image.src = source;
  }

  private readonly handleCropDragMove = (event: MouseEvent | TouchEvent) => {
    if (!this.isDraggingCrop) return;

    const point = this.getPointerPoint(event);
    if (!point) return;

    event.preventDefault();
    this.cropOffsetX.set(
      this.clampCropOffset(this.dragOriginX + (point.x - this.dragStartX)),
    );
    this.cropOffsetY.set(
      this.clampCropOffset(this.dragOriginY + (point.y - this.dragStartY)),
    );
    this.renderCropPreview();
  };

  private readonly handleCropDragEnd = () => {
    this.stopCropDrag();
  };

  private stopCropDrag() {
    this.isDraggingCrop = false;
    window.removeEventListener('mousemove', this.handleCropDragMove);
    window.removeEventListener('mouseup', this.handleCropDragEnd);
    window.removeEventListener('touchmove', this.handleCropDragMove);
    window.removeEventListener('touchend', this.handleCropDragEnd);
  }

  private getPointerPoint(
    event: MouseEvent | TouchEvent,
  ): { x: number; y: number } | null {
    if (event instanceof MouseEvent) {
      return { x: event.clientX, y: event.clientY };
    }

    const touch = event.touches[0] ?? event.changedTouches[0];
    if (!touch) return null;
    return { x: touch.clientX, y: touch.clientY };
  }

  private clampCropOffset(value: number): number {
    return Math.max(-140, Math.min(140, value));
  }

  private mergeUserData(baseUser: any, incomingUser: any) {
    return {
      ...baseUser,
      ...incomingUser,
      avatar:
        incomingUser?.avatar || baseUser?.avatar || this.avatarPreview() || '',
      department: incomingUser?.department || baseUser?.department,
      designation: incomingUser?.designation || baseUser?.designation,
      organizationName:
        incomingUser?.organizationName ||
        baseUser?.organizationName ||
        baseUser?.organization?.name ||
        '',
      companyName:
        incomingUser?.companyName ||
        baseUser?.companyName ||
        baseUser?.organizationName ||
        baseUser?.organization?.name ||
        '',
      organizationLogo:
        incomingUser?.organizationLogo ||
        baseUser?.organizationLogo ||
        baseUser?.organization?.logo ||
        '',
      companyLogo:
        incomingUser?.companyLogo ||
        baseUser?.companyLogo ||
        baseUser?.organizationLogo ||
        baseUser?.organization?.logo ||
        '',
    };
  }

  private persistAvatarChange(
    avatar: string | null,
    successMessage: string,
    closeCrop = false,
  ) {
    const user = this.user();
    if (!user?.id) {
      this.toastService.error('Profile ID missing');
      return;
    }

    this.avatarSaving.set(true);
    const payload = {
      avatar,
      profile_image: avatar,
      profileImage: avatar,
      firstName:
        this.profileForm.get('firstName')?.value?.trim() || user?.firstName,
      lastName:
        this.profileForm.get('lastName')?.value?.trim() || user?.lastName,
    };

    this.employeeService.updateEmployee(user.id, payload).subscribe({
      next: (updatedUser) => {
        const mergedUser = this.mergeUserData(user, {
          ...updatedUser,
          avatar: updatedUser?.avatar || avatar,
        });
        this.user.set(mergedUser);
        this.authService.setStoredUser(mergedUser);
        this.store.dispatch(AuthActions.updateUser({ user: mergedUser }));
        this.avatarPreview.set(avatar || '');
        this.currentAvatarSnapshot.set(avatar || '');
        this.avatarError.set('');
        this.avatarSaving.set(false);

        if (closeCrop) {
          this.showCropModal.set(false);
          this.cropSource.set('');
          this.croppedPreview.set('');
        }

        if (this.avatarInput?.nativeElement) {
          this.avatarInput.nativeElement.value = '';
        }

        this.toastService.success(successMessage);
      },
      error: (err) => {
        this.avatarSaving.set(false);
        this.toastService.error(
          err?.error?.message || 'Failed to update profile image',
        );
      },
    });
  }
}
