import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

export interface ReportItem {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  isFavorite: boolean;
}

@Component({
  selector: 'app-reports-center',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="mx-auto max-w-7xl space-y-8 pb-12 animate-in fade-in duration-500">
      <section class="app-module-hero">
        <div>
          <p class="app-module-kicker">Analytics Hub</p>
          <h1 class="app-module-title">Reports center</h1>
          <p class="app-module-text max-w-2xl">Explore attendance, payroll, employee, and leave insights from a single reporting workspace inspired by a more premium HR analytics flow.</p>
        </div>

        <div class="app-module-highlight">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Available reports</p>
          <p class="mt-3 text-3xl font-black text-slate-900">{{ reports().length }}</p>
          <p class="mt-2 text-sm text-slate-600">Favorites: {{ favoriteReports().length }} | Categories: {{ filteredCategories().length }}</p>
        </div>
      </section>

      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div class="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-200">
          <span class="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
          Report workspace ready
        </div>

        <div class="relative w-full lg:w-[22rem]">
          <input
            type="text"
            [ngModel]="searchQuery()"
            (ngModelChange)="searchQuery.set($event)"
            placeholder="Search for a report..."
            class="w-full rounded-md border border-slate-200 bg-white px-12 py-3 text-sm outline-none transition-all focus:border-slate-900 focus:ring-4 focus:ring-slate-200"
          >
          <svg class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        </div>
      </div>

      @if (favoriteReports().length > 0 && !searchQuery()) {
        <section>
          <div class="mb-5 flex items-center gap-3">
            <span class="inline-flex h-9 w-9 items-center justify-center rounded-md bg-amber-100 text-amber-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.75l-6.172 3.245 1.179-6.873-4.993-4.867 6.9-1.002L12 2l3.086 6.253 6.9 1.002-4.993 4.867 1.179 6.873z"/></svg>
            </span>
            <div>
              <p class="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Favorite Reports</p>
              <h2 class="text-xl font-black text-slate-900">Quick access shortcuts</h2>
            </div>
          </div>

          <div class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            @for (report of favoriteReports(); track report.id) {
              <article class="app-surface-card flex items-start gap-4 transition hover:-translate-y-1">
                <div class="flex h-12 w-12 items-center justify-center rounded-md bg-slate-100 text-slate-700">
                  <svg [innerHTML]="report.icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"></svg>
                </div>
                <div class="flex-1">
                  <div class="flex items-start justify-between gap-3">
                    <h3 class="text-lg font-black text-slate-900">{{ report.name }}</h3>
                    <button (click)="toggleFavorite(report)" class="text-amber-400 transition hover:scale-110">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.75l-6.172 3.245 1.179-6.873-4.993-4.867 6.9-1.002L12 2l3.086 6.253 6.9 1.002-4.993 4.867 1.179 6.873z"/></svg>
                    </button>
                  </div>
                  <p class="mt-2 text-sm leading-7 text-slate-600">{{ report.description }}</p>
                  <a [routerLink]="reportRoute(report)" [queryParams]="reportQueryParams(report)" class="mt-4 inline-flex items-center gap-2 text-sm font-bold text-slate-900 transition hover:gap-3">
                    Generate report
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                  </a>
                </div>
              </article>
            }
          </div>
        </section>
      }

      @for (category of filteredCategories(); track category.name) {
        <section class="space-y-5">
          <div class="flex items-center gap-3">
            <span class="h-2.5 w-2.5 rounded-full bg-slate-900"></span>
            <h2 class="text-xl font-black text-slate-900">{{ category.name }}</h2>
          </div>

          <div class="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            @for (report of category.reports; track report.id) {
              <article class="app-surface-card transition hover:-translate-y-1">
                <div class="mb-5 flex items-start justify-between gap-3">
                  <div class="flex h-11 w-11 items-center justify-center rounded-md bg-slate-100 text-slate-700">
                    <svg [innerHTML]="report.icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"></svg>
                  </div>
                  <button (click)="toggleFavorite(report)" [class.text-amber-400]="report.isFavorite" [class.text-slate-300]="!report.isFavorite" class="transition hover:scale-110 hover:text-amber-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.75l-6.172 3.245 1.179-6.873-4.993-4.867 6.9-1.002L12 2l3.086 6.253 6.9 1.002-4.993 4.867 1.179 6.873z"/></svg>
                  </button>
                </div>
                <h3 class="text-lg font-black leading-tight text-slate-900">{{ report.name }}</h3>
                <p class="mt-2 text-sm leading-7 text-slate-600">{{ report.description }}</p>
                <a [routerLink]="reportRoute(report)" [queryParams]="reportQueryParams(report)" class="mt-5 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-700 transition hover:gap-3">
                  Open report
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </a>
              </article>
            }
          </div>
        </section>
      }

      @if (filteredCategories().length === 0) {
        <div class="app-surface-card py-16 text-center">
          <div class="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
            <svg class="text-slate-300" xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </div>
          <h3 class="mt-6 text-xl font-black text-slate-900">No reports found</h3>
          <p class="mx-auto mt-2 max-w-md text-sm leading-7 text-slate-600">We could not find any reports matching "{{ searchQuery() }}". Try another keyword or clear the search.</p>
          <button (click)="searchQuery.set('')" class="mt-6 rounded-md bg-slate-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-800">Clear search</button>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; padding: 1rem; }
  `]
})
export class ReportsCenterComponent implements OnInit {
  searchQuery = signal('');

  reports = signal<ReportItem[]>([
    { id: 'daily-attendance', name: 'Daily Attendance', category: 'Attendance', description: 'Summary of daily check-ins, check-outs, and absenteeism.', icon: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/>', isFavorite: true },
    { id: 'monthly-summary', name: 'Monthly Summary', category: 'Attendance', description: 'Monthly working hours, overtime, and attendance percentages.', icon: '<path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>', isFavorite: false },
    { id: 'late-arrivals', name: 'Late Arrivals', category: 'Attendance', description: 'List of employees arriving after their scheduled shift time.', icon: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>', isFavorite: false },
    { id: 'salary-register', name: 'Salary Register', category: 'Payroll', description: 'Detailed breakdown of earnings, deductions, and net pay.', icon: '<rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>', isFavorite: true },
    { id: 'tax-summary', name: 'Tax Summary', category: 'Payroll', description: 'Summary of TDS and other statutory tax deductions.', icon: '<path d="M4 22h16"/><path d="M4 14h16"/><path d="M4 6h16"/><path d="M12 2v20"/><path d="m17 7-5 5-5-5"/>', isFavorite: false },
    { id: 'employee-directory', name: 'Staff Directory', category: 'Employee', description: 'Master list of all employees with contact and department details.', icon: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>', isFavorite: false },
    { id: 'turnover-report', name: 'Attrition Rate', category: 'Employee', description: 'Analysis of employee exits and retention trends.', icon: '<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>', isFavorite: false },
    { id: 'leave-utilization', name: 'Leave Utilization', category: 'Leaves', description: 'Department-wise analysis of leave usage and trends.', icon: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6.5 18H20"/>', isFavorite: false },
    { id: 'balance-report', name: 'Balance Audit', category: 'Leaves', description: 'Real-time audit of remaining leave balances for all staff.', icon: '<path d="M12 3v19"/><path d="M5 8h14"/><path d="M15 21a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6Z"/>', isFavorite: false }
  ]);

  favoriteReports = computed(() => this.reports().filter(r => r.isFavorite));

  filteredCategories = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const reports = this.reports();

    const filtered = query
      ? reports.filter(r => r.name.toLowerCase().includes(query) || r.category.toLowerCase().includes(query))
      : reports;

    const groups: { name: string; reports: ReportItem[] }[] = [];
    const categories = Array.from(new Set(filtered.map(r => r.category)));

    categories.forEach(cat => {
      groups.push({
        name: cat,
        reports: filtered.filter(r => r.category === cat)
      });
    });

    return groups.sort((a, b) => a.name.localeCompare(b.name));
  });

  ngOnInit() {}

  toggleFavorite(report: ReportItem) {
    this.reports.update(items => items.map(i =>
      i.id === report.id ? { ...i, isFavorite: !i.isFavorite } : i
    ));
  }

  reportRoute(report: ReportItem): string[] {
    return ['/reports'];
  }

  reportQueryParams(report: ReportItem): Record<string, string> {
    const presetMap: Record<string, string> = {
      'daily-attendance': 'daily',
      'monthly-summary': 'monthly',
      'late-arrivals': 'late',
      'salary-register': 'monthly',
      'tax-summary': 'monthly',
      'employee-directory': 'monthly',
      'turnover-report': 'monthly',
      'leave-utilization': 'monthly',
      'balance-report': 'monthly'
    };

    return {
      preset: presetMap[report.id] ?? 'daily',
      source: report.id
    };
  }
}
