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
    <div class="mx-auto max-w-[1400px] space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <section class="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-8 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.04)]">
        <div class="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-slate-50 opacity-50 blur-3xl"></div>
        <div class="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-blue-50 opacity-50 blur-3xl"></div>
        
        <div class="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div class="max-w-2xl">
            <div class="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">
              <span class="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse"></span>
              Analytics Hub v2.0
            </div>
            <h1 class="mt-4 text-4xl font-[900] tracking-tight text-slate-900 md:text-5xl lg:text-6xl" style="font-family: 'Sora', sans-serif;">
              Reports <span class="text-blue-600">Center</span>
            </h1>
            <p class="mt-6 text-lg leading-relaxed text-slate-500">
              Unlock powerful workforce insights with our redesigned reporting workspace. Track attendance, monitor payroll trends, and analyze employee growth from a single, high-fidelity interface.
            </p>
          </div>

          <div class="grid grid-cols-2 gap-4 rounded-[1.5rem] bg-slate-50 p-6 ring-1 ring-slate-100">
            <div class="space-y-1">
              <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Reports</p>
              <p class="text-3xl font-black text-slate-900" style="font-family: 'Sora', sans-serif;">{{ reports().length }}</p>
            </div>
            <div class="space-y-1">
              <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Active Categories</p>
              <p class="text-3xl font-black text-slate-900" style="font-family: 'Sora', sans-serif;">{{ filteredCategories().length }}</p>
            </div>
          </div>
        </div>
      </section>

      <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div class="relative flex-1 lg:max-w-md">
          <input
            type="text"
            [ngModel]="searchQuery()"
            (ngModelChange)="searchQuery.set($event)"
            placeholder="Search reports by name or category..."
            class="w-full rounded-2xl border border-slate-200 bg-white px-14 py-4 text-sm font-medium transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none"
          >
          <svg class="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        </div>

        <div class="flex items-center gap-3 overflow-x-auto pb-2 lg:pb-0">
          <button class="whitespace-nowrap rounded-full bg-slate-900 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800">All Analytics</button>
          <button class="whitespace-nowrap rounded-full bg-white px-6 py-2.5 text-sm font-bold text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50">Custom Builder</button>
          <button class="whitespace-nowrap rounded-full bg-white px-6 py-2.5 text-sm font-bold text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50">Export Logs</button>
        </div>
      </div>

      @if (favoriteReports().length > 0 && !searchQuery()) {
        <section class="space-y-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-500 ring-1 ring-amber-100">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.75l-6.172 3.245 1.179-6.873-4.993-4.867 6.9-1.002L12 2l3.086 6.253 6.9 1.002-4.993 4.867 1.179 6.873z"/></svg>
              </div>
              <h2 class="text-2xl font-[900] text-slate-900" style="font-family: 'Sora', sans-serif;">Starred Workspaces</h2>
            </div>
          </div>

          <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            @for (report of favoriteReports(); track report.id) {
              <article class="group relative overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-200/50">
                <div class="flex items-start justify-between">
                  <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-900 transition-colors group-hover:bg-slate-900 group-hover:text-white">
                    <svg [innerHTML]="report.icon" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"></svg>
                  </div>
                  <button (click)="toggleFavorite(report)" class="text-amber-400 transition hover:scale-125">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.75l-6.172 3.245 1.179-6.873-4.993-4.867 6.9-1.002L12 2l3.086 6.253 6.9 1.002-4.993 4.867 1.179 6.873z"/></svg>
                  </button>
                </div>
                
                <div class="mt-6">
                  <p class="text-[10px] font-black uppercase tracking-widest text-blue-600">{{ report.category }}</p>
                  <h3 class="mt-1 text-xl font-black text-slate-900">{{ report.name }}</h3>
                  <p class="mt-3 text-sm leading-relaxed text-slate-500 line-clamp-2">{{ report.description }}</p>
                </div>

                <div class="mt-8 flex items-center justify-between">
                  <a [routerLink]="reportRoute(report)" [queryParams]="reportQueryParams(report)" class="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-600">
                    Launch Report
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                  </a>
                  <span class="text-[10px] font-bold text-slate-300">Ready to export</span>
                </div>
              </article>
            }
          </div>
        </section>
      }

      @for (category of filteredCategories(); track category.name) {
        <section class="space-y-6">
          <div class="flex items-center gap-3">
            <div class="h-1.5 w-8 rounded-full bg-slate-900"></div>
            <h2 class="text-xl font-black tracking-tight text-slate-900" style="font-family: 'Sora', sans-serif;">{{ category.name }} Reports</h2>
          </div>

          <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            @for (report of category.reports; track report.id) {
              <article class="group rounded-[1.25rem] border border-slate-100 bg-white p-5 transition-all hover:border-slate-200 hover:shadow-xl">
                <div class="flex items-start justify-between">
                  <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 text-slate-600 transition-colors group-hover:bg-blue-50 group-hover:text-blue-600">
                    <svg [innerHTML]="report.icon" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"></svg>
                  </div>
                  <button (click)="toggleFavorite(report)" [class.text-amber-400]="report.isFavorite" [class.text-slate-200]="!report.isFavorite" class="transition hover:scale-110 hover:text-amber-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.75l-6.172 3.245 1.179-6.873-4.993-4.867 6.9-1.002L12 2l3.086 6.253 6.9 1.002-4.993 4.867 1.179 6.873z"/></svg>
                  </button>
                </div>
                <h3 class="mt-5 text-lg font-black leading-tight text-slate-900 group-hover:text-blue-600 transition-colors">{{ report.name }}</h3>
                <p class="mt-2 text-sm leading-relaxed text-slate-500 line-clamp-2">{{ report.description }}</p>
                <a [routerLink]="reportRoute(report)" [queryParams]="reportQueryParams(report)" class="mt-6 flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-slate-400 transition hover:text-slate-900">
                  <span>Explore Metrics</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </a>
              </article>
            }
          </div>
        </section>
      }

      @if (filteredCategories().length === 0) {
        <div class="rounded-[2.5rem] border border-dashed border-slate-200 bg-white py-24 text-center">
          <div class="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-slate-50 text-slate-200">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </div>
          <h3 class="mt-8 text-2xl font-black text-slate-900" style="font-family: 'Sora', sans-serif;">Search yielded no results</h3>
          <p class="mx-auto mt-3 max-w-md text-slate-500">We couldn't find any reports matching "{{ searchQuery() }}". Try using more general keywords like "Attendance" or "Salary".</p>
          <button (click)="searchQuery.set('')" class="mt-10 rounded-full bg-slate-900 px-10 py-4 text-sm font-black text-white transition hover:bg-slate-800">Reset Search Workspace</button>
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
