import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FaceProfileApproval, KioskService } from '../../../../core/services/kiosk.service';

@Component({
  selector: 'app-face-profile-approvals',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-6xl mx-auto py-8 space-y-6">
      <header class="app-module-hero">
        <p class="app-module-kicker">Kiosk Management</p>
        <h1 class="app-module-title mt-3">Face Profile Approvals</h1>
      </header>

      <div class="grid gap-4">
        @for (profile of profiles(); track profile.id) {
          <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 class="text-xl font-semibold text-slate-900">
                  {{ employeeLabel(profile) }}
                </h2>
                <p class="mt-2 text-sm text-slate-500">
                  Submitted {{ profile.createdAt | date: 'medium' }}
                </p>
              </div>
              <div class="flex gap-3">
                <button
                  type="button"
                  (click)="approve(profile)"
                  class="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Approve
                </button>
                <button
                  type="button"
                  (click)="reject(profile)"
                  class="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700 hover:bg-rose-100"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        } @empty {
          <div class="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
            No pending face profiles are waiting for review.
          </div>
        }
      </div>
    </div>
  `,
})
export class FaceProfileApprovalsComponent implements OnInit {
  private kioskService = inject(KioskService);

  profiles = signal<FaceProfileApproval[]>([]);

  ngOnInit() {
    this.load();
  }

  load() {
    this.kioskService
      .getPendingFaceProfiles()
      .subscribe((profiles) => this.profiles.set(profiles));
  }

  approve(profile: FaceProfileApproval) {
    this.kioskService.approveFaceProfile(profile.id).subscribe(() => this.load());
  }

  reject(profile: FaceProfileApproval) {
    this.kioskService.rejectFaceProfile(profile.id).subscribe(() => this.load());
  }

  employeeLabel(profile: FaceProfileApproval) {
    const firstName = profile.employee?.firstName ?? '';
    const lastName = profile.employee?.lastName ?? '';
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || profile.employee?.employeeCode || `Employee #${profile.employee?.id ?? profile.id}`;
  }
}
