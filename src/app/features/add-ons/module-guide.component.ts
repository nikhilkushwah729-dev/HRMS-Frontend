import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { OrganizationService } from '../../core/services/organization.service';
import { PermissionService } from '../../core/services/permission.service';

type GuideDefinition = {
  slug: string;
  title: string;
  duration: string;
  audience: string;
  summary: string;
  moduleRoute: string;
  steps: string[];
  benefitTitle?: string;
  benefitCopy?: string;
  valueTitle?: string;
  valueCopy?: string;
  fitTitle?: string;
  fitCopy?: string;
};

@Component({
  selector: 'app-module-guide',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-full p-2">
      <div class="mx-auto max-w-[1500px] space-y-6">
        <section class="overflow-hidden rounded-[28px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.16),_transparent_30%),linear-gradient(135deg,#ffffff_0%,#f8fafc_48%,#ecfeff_100%)] p-6 shadow-sm sm:p-8">
          <div class="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div class="max-w-3xl">
              <p class="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">Module Guide</p>
              <h1 class="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">{{ guide().title }}</h1>
              <p class="mt-4 text-sm leading-7 text-slate-600">
                {{ guide().summary }}
              </p>
            </div>
            <div class="grid grid-cols-3 gap-3 sm:min-w-[340px]">
              <div class="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                <p class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Duration</p>
                <p class="mt-2 text-lg font-black text-slate-900">{{ guide().duration }}</p>
              </div>
              <div class="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                <p class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Audience</p>
                <p class="mt-2 text-lg font-black text-slate-900">{{ guide().audience }}</p>
              </div>
              <div class="rounded-2xl border px-4 py-4" [ngClass]="isActive() ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'">
                <p class="text-[10px] font-black uppercase tracking-[0.18em]" [ngClass]="isActive() ? 'text-emerald-700' : 'text-amber-700'">Status</p>
                <p class="mt-2 text-lg font-black" [ngClass]="isActive() ? 'text-emerald-900' : 'text-amber-900'">{{ isActive() ? 'Live' : 'Premium' }}</p>
              </div>
            </div>
          </div>
        </section>

        <section class="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <article class="rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#0f172a_0%,#111827_55%,#1e293b_100%)] p-6 text-white shadow-sm">
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100/80">Experience Preview</p>
                <h2 class="mt-2 text-2xl font-black">How this module works in your HRMS</h2>
              </div>
              <span class="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100">Guided flow</span>
            </div>

            <div class="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <div class="rounded-[24px] border border-white/10 bg-white/5 p-4">
                <p class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-300">Main workspace</p>
                <h3 class="mt-2 text-xl font-black">{{ guide().title }}</h3>
                <div class="mt-5 space-y-3">
                  <div class="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                    <p class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-300">Primary action</p>
                    <p class="mt-2 text-lg font-black text-white">{{ primaryActionLabel() }}</p>
                    <p class="mt-2 text-xs leading-5 text-slate-300">Users start from a clear CTA, then move through the workflow with status and helper information visible.</p>
                  </div>
                  <div class="grid grid-cols-2 gap-3">
                    <div class="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
                      <p class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-300">UI Type</p>
                      <p class="mt-2 text-sm font-black text-white">Guided Workspace</p>
                    </div>
                    <div class="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
                      <p class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-300">Ideal For</p>
                      <p class="mt-2 text-sm font-black text-white">{{ guide().audience }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div class="rounded-[24px] border border-white/10 bg-white/10 p-4">
                <p class="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100/80">Step walkthrough</p>
                <div class="mt-4 space-y-3">
                  @for (step of guide().steps; track step; let idx = $index) {
                    <div class="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                      <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-300 text-[10px] font-black text-slate-950">{{ idx + 1 }}</span>
                      <div>
                        <p class="text-sm font-black text-white">{{ step }}</p>
                        <p class="mt-1 text-xs leading-5 text-slate-300">{{ stepCaption(idx) }}</p>
                      </div>
                    </div>
                  }
                </div>
              </div>
            </div>
          </article>

          <article class="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <p class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Next Actions</p>
            <h2 class="mt-2 text-2xl font-black tracking-tight text-slate-900">Continue with the right path</h2>
            <p class="mt-3 text-sm leading-6 text-slate-500">
              Use this page like a training preview. After understanding the workflow, users can open the live module or move into the upgrade journey.
            </p>

            <div class="mt-6 space-y-3">
              <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">For this module</p>
                <p class="mt-2 text-base font-black text-slate-900">{{ isActive() ? 'Module is active and ready to use.' : 'Module is locked, so billing will guide the purchase journey.' }}</p>
              </div>
              <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Suggested route</p>
                <p class="mt-2 text-base font-black text-slate-900">{{ guide().moduleRoute }}</p>
              </div>
            </div>

            <div class="mt-6 grid gap-3">
              <button type="button" (click)="openPrimaryAction()" class="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-slate-800">
                {{ isActive() ? 'Open Module Now' : 'Open Buy Flow' }}
              </button>
              <button type="button" (click)="openBilling()" class="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black uppercase tracking-[0.16em] text-slate-700 transition hover:bg-slate-50">
                Review Upgrade & Pricing
              </button>
              <button type="button" (click)="router.navigateByUrl('/add-ons')" class="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black uppercase tracking-[0.16em] text-slate-700 transition hover:bg-slate-50">
                Back To Add-ons
              </button>
            </div>
          </article>
        </section>

        <section class="grid gap-6 lg:grid-cols-3">
          <article class="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <p class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">What users get</p>
            <h3 class="mt-2 text-xl font-black tracking-tight text-slate-900">{{ guide().benefitTitle || 'A guided day-one experience' }}</h3>
            <p class="mt-3 text-sm leading-6 text-slate-500">
              {{ guide().benefitCopy || 'Users can understand where to click, what the workflow looks like, and how results are tracked before they enter the live module.' }}
            </p>
          </article>

          <article class="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <p class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Why this matters</p>
            <h3 class="mt-2 text-xl font-black tracking-tight text-slate-900">{{ guide().valueTitle || 'Less confusion, faster adoption' }}</h3>
            <p class="mt-3 text-sm leading-6 text-slate-500">
              {{ guide().valueCopy || 'Instead of opening random screens, teams get a clear explanation page first, then move into the module or billing with confidence.' }}
            </p>
          </article>

          <article class="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <p class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Best fit</p>
            <h3 class="mt-2 text-xl font-black tracking-tight text-slate-900">{{ guide().fitTitle || (guide().audience + ' teams and managers') }}</h3>
            <p class="mt-3 text-sm leading-6 text-slate-500">
              {{ guide().fitCopy || 'This guide page is designed for people who want to learn quickly, validate the module workflow, and then move into live usage or purchase.' }}
            </p>
          </article>
        </section>
      </div>
    </div>
  `,
})
export class ModuleGuideComponent {
  readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly organizationService = inject(OrganizationService);
  private readonly permissionService = inject(PermissionService);

  private readonly guideMap: Record<string, GuideDefinition> = {
    attendance: {
      slug: 'attendance',
      title: 'Attendance daily workflow',
      duration: '2 min',
      audience: 'Employee',
      summary: 'See how users clock in, review today status, and track attendance history before moving into the real workspace.',
      moduleRoute: '/attendance',
      steps: ['Open attendance workspace', 'Review today status and shift', 'Complete check-in or check-out', 'Verify history before leaving'],
      benefitTitle: 'Daily routine made simple',
      benefitCopy: 'Employees get one reliable place to check status, punch in, and confirm their workday without confusion.',
      valueTitle: 'Why teams enable it',
      valueCopy: 'Attendance becomes easier to adopt because the workflow is visible, guided, and fast for daily use.',
      fitTitle: 'Best fit for workforce operations',
      fitCopy: 'Strong choice for organizations that want cleaner self-service attendance discipline.',
    },
    leave: {
      slug: 'leave',
      title: 'Leave request walkthrough',
      duration: '3 min',
      audience: 'ESS',
      summary: 'Understand how leave balances, request submission, attachments, and approval tracking work in the live module.',
      moduleRoute: '/leaves',
      steps: ['Open leave workspace', 'Choose date range and reason', 'Submit request with attachment if needed', 'Track approval status from requests'],
      benefitTitle: 'Leave requests with clarity',
      benefitCopy: 'Users can see balances, request properly, and understand approval progress without calling HR for every update.',
      valueTitle: 'Why teams enable it',
      valueCopy: 'It reduces back-and-forth by making leave workflows transparent and easier to trust.',
      fitTitle: 'Best fit for ESS-heavy teams',
      fitCopy: 'Ideal for organizations that want employees to handle leave independently and correctly.',
    },
    leaves: {
      slug: 'leaves',
      title: 'Leave request walkthrough',
      duration: '3 min',
      audience: 'ESS',
      summary: 'Understand how leave balances, request submission, attachments, and approval tracking work in the live module.',
      moduleRoute: '/leaves',
      steps: ['Open leave workspace', 'Choose date range and reason', 'Submit request with attachment if needed', 'Track approval status from requests'],
      benefitTitle: 'Leave requests with clarity',
      benefitCopy: 'Users can see balances, request properly, and understand approval progress without calling HR for every update.',
      valueTitle: 'Why teams enable it',
      valueCopy: 'It reduces back-and-forth by making leave workflows transparent and easier to trust.',
      fitTitle: 'Best fit for ESS-heavy teams',
      fitCopy: 'Ideal for organizations that want employees to handle leave independently and correctly.',
    },
    'visit-management': {
      slug: 'visit-management',
      title: 'Visit Management quick guide',
      duration: '3 min',
      audience: 'Manager',
      summary: 'Review how scheduled visits, check-ins, and follow-ups work so teams know exactly what the premium module delivers.',
      moduleRoute: '/visit-management',
      steps: ['Open visit dashboard', 'Review planned and active visits', 'Check-in using visit actions', 'Track follow-up and completion'],
      benefitTitle: 'Field activity with visibility',
      benefitCopy: 'Teams understand how planned visits, live check-ins, and follow-up tracking work before investing in the module.',
      valueTitle: 'Why teams enable it',
      valueCopy: 'Visit Management helps managers track execution, proof of work, and client-facing activity in one system.',
      fitTitle: 'Best fit for client and field teams',
      fitCopy: 'Strong for organizations handling site visits, employee movement, or client meeting workflows.',
    },
    payroll: {
      slug: 'payroll',
      title: 'Payroll access preview',
      duration: '2 min',
      audience: 'Admin',
      summary: 'Preview payroll summaries, salary workspace behavior, and how premium activation unlocks the full payroll flow.',
      moduleRoute: '/payroll',
      steps: ['Open payroll workspace', 'Review summary cards', 'Check processed periods or slips', 'Use billing when module is locked'],
      benefitTitle: 'Payroll with guided visibility',
      benefitCopy: 'Finance and HR can understand payroll workspace behavior before they move into premium activation.',
      valueTitle: 'Why teams enable it',
      valueCopy: 'It brings salary operations, records, and processing context into one organized system.',
      fitTitle: 'Best fit for finance-led operations',
      fitCopy: 'Useful when payroll needs a more controlled, premium operational workspace.',
    },
  };

  addons = signal<any[]>([]);

  readonly guide = computed<GuideDefinition>(() => {
    const slug = String(this.route.snapshot.paramMap.get('slug') || 'attendance').toLowerCase();
    return this.guideMap[slug] || this.guideMap['attendance'];
  });

  constructor() {
    this.organizationService.getAddons().subscribe({
      next: (addons) => this.addons.set(addons || []),
      error: () => this.addons.set([]),
    });
  }

  isActive(): boolean {
    const slug = this.guide().slug;
    return this.addons().some((addon) => this.normalize(addon?.slug || addon?.name) === this.normalize(slug) && Boolean(addon?.isActive));
  }

  primaryActionLabel(): string {
    return this.isActive() ? 'Open the module and begin the workflow' : 'Review the module, then continue to billing';
  }

  stepCaption(index: number): string {
    const captions = [
      'The workspace opens with context, live data, and important summary cards.',
      'The UI keeps the primary task visible so users know what to do next.',
      'Form or action flow stays guided with status and helper feedback.',
      'Users can confirm the outcome and track history from the same module.',
    ];
    return captions[index] || 'The workflow stays clear from start to finish.';
  }

  openPrimaryAction(): void {
    if (this.isActive()) {
      const route = this.guide().moduleRoute;
      const user = this.authService.getStoredUser();
      if (this.permissionService.canAccessRoute(user, route)) {
        this.router.navigateByUrl(route);
        return;
      }

      this.router.navigateByUrl('/add-ons');
      return;
    }

    this.openBilling();
  }

  openBilling(): void {
    this.router.navigate(['/billing'], {
      queryParams: {
        source: 'guide',
        addon: this.guide().slug,
        mode: 'upgrade',
      },
    });
  }

  private normalize(value: string): string {
    return (value || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
  }
}
