import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-approval-center-placeholder',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="p-4 sm:p-5">
      <div class="mb-5 border-b border-slate-200 pb-4">
        <h2 class="text-[2rem] font-medium tracking-tight text-slate-900">{{ title() }}</h2>
        <p class="mt-2 max-w-2xl text-sm text-slate-500">{{ subtitle() }}</p>
      </div>

      <div class="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-8">
        <div class="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p class="text-sm font-semibold text-slate-900">No active approvals in this queue</p>
            <p class="mt-2 text-sm text-slate-500">
              This workflow now has its own dedicated Approval Center route and category, so it stays separate from leave
              and attendance queues. When live requests are available for this module, they should load here directly.
            </p>
          </div>

          <a
            routerLink="/admin/approvals/leave"
            class="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Back to Leave Queue
          </a>
        </div>
      </div>
    </div>
  `,
})
export class ApprovalCenterPlaceholderComponent {
  private readonly route = inject(ActivatedRoute);

  readonly title = computed(
    () => this.route.snapshot.data['title'] || 'Approval Queue',
  );

  readonly subtitle = computed(
    () =>
      this.route.snapshot.data['subtitle'] ||
      'Review and process requests assigned to this workflow.',
  );
}
