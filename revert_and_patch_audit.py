import re

path = r'd:\HRMS_FRONTEND\src\app\features\admin\audit-logs.component.html'

with open(path, 'r', encoding='utf-8') as f:
    html = f.read()

# Replace the giant Hero block we added
hero_pattern = re.compile(
    r'<!-- Header -->\s*<div class="rounded-3xl p-6 md:p-8 bg-gradient-to-br from-slate-900.*?>.*?<!-- Filters Section -->', 
    re.DOTALL
)

new_hero = '''<!-- Header -->
  <div class="app-module-hero">
    <div class="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
      <div>
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-teal-500 flex items-center justify-center shadow-lg shadow-teal-500/25 ring-2 ring-white">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
          </div>
          <div>
            <p class="app-module-kicker">Audit Center</p>
            <h1 class="app-module-title mt-1.5">System audit trail and activity</h1>
            <p class="app-module-text mt-1.5 max-w-2xl">Track security activity, data mutations, and user actions with searchable audit visibility across the HRMS.</p>
          </div>
        </div>
      </div>
      <div class="flex flex-wrap gap-2.5">
        <!-- Auto Refresh Toggle -->
        <button
          (click)="toggleAutoRefresh()"
          class="px-5 py-2.5 rounded-full font-bold text-xs flex items-center gap-2 transition-all duration-200"
          [ngClass]="autoRefreshEnabled()
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 shadow-sm'
            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 shadow-sm'">
          <svg
            [class.animate-spin]="autoRefreshEnabled()"
            xmlns="http://www.w3.org/2000/svg" width="14" height="14"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
            <path d="M16 21v-5h5"/>
          </svg>
          {{ autoRefreshEnabled() ? 'Live Sync' : 'Auto-Refresh Off' }}
        </button>

        <!-- Export CSV -->
        <button
          (click)="exportCSV()"
          [disabled]="logs().length === 0"
          class="bg-white text-slate-700 hover:bg-slate-50 hover:text-indigo-600 border border-slate-200 px-5 py-2.5 rounded-full font-bold text-xs flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export CSV
        </button>

        <!-- Refresh -->
        <button
          (click)="refresh()"
          [disabled]="loading()"
          class="bg-indigo-600 text-white hover:bg-indigo-700 px-6 py-2.5 rounded-full font-bold text-xs flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-indigo-500/25">
          <svg
            [class.animate-spin]="loading()"
            xmlns="http://www.w3.org/2000/svg" width="14" height="14"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
            <path d="M16 21v-5h5"/>
          </svg>
          Reload
        </button>
      </div>
    </div>

    <!-- Stats Summary -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
      <div class="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:border-blue-200 transition-colors">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 ring-1 ring-blue-100">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div>
            <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total Logs</p>
            <p class="text-xl font-black text-slate-800">{{ totalItems() | number }}</p>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:border-emerald-200 transition-colors">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 ring-1 ring-emerald-100">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <div>
            <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Today</p>
            <p class="text-xl font-black text-slate-800">{{ todayCount }}</p>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:border-amber-200 transition-colors">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 ring-1 ring-amber-100">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>
          </div>
          <div>
            <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">This Week</p>
            <p class="text-xl font-black text-slate-800">{{ weekCount }}</p>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:border-purple-200 transition-colors">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 ring-1 ring-purple-100">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div>
            <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Active Users</p>
            <p class="text-xl font-black text-slate-800">{{ uniqueUsers }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Filters Section -->'''

html = hero_pattern.sub(new_hero, html)


# Replace Filter Blocks Pattern
filters_pattern = re.compile(
    r'<div class="flex flex-col lg:flex-row gap-4">.*?<!-- Active Filters Display -->',
    re.DOTALL
)

new_filters = '''<!-- Top Row: Search and Quick Dates -->
    <div class="flex flex-col lg:flex-row gap-6 mb-5">
      <!-- Search Input -->
      <div class="relative flex-1">
        <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Search Audit Trail</label>
        <div class="relative">
          <svg class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.3-4.3"/>
          </svg>
          <input
            #searchInput
            type="text"
            [(ngModel)]="searchQuery"
            (keyup.enter)="applyFilters()"
            (input)="onSearchInput($event)"
            placeholder="Search by name, action, or entity ID..."
            class="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 hover:border-indigo-300 rounded-2xl text-[15px] focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-semibold text-slate-800 shadow-sm placeholder:text-slate-400 placeholder:font-medium">
        </div>
      </div>

      <!-- Quick Date Filters -->
      <div class="w-full lg:w-auto">
        <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Quick Timeframes</label>
        <div class="flex flex-wrap gap-2">
          <button
            *ngFor="let date of quickDateFilters"
            (click)="applyQuickDate(date.value)"
            class="px-5 py-3 rounded-2xl text-[13px] font-bold transition-all duration-200"
            [ngClass]="selectedQuickDate === date.value
              ? 'bg-indigo-50 text-indigo-700 border-2 border-indigo-200 shadow-sm'
              : 'bg-slate-50 text-slate-500 border-2 border-slate-100 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-700'">
            {{ date.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- Bottom Row: Other dropdown filters -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Module Filter -->
      <div class="w-full">
        <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Module</label>
        <select
          [(ngModel)]="selectedModule"
          (change)="applyFilters()"
          class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 cursor-pointer transition-all font-semibold text-slate-700">
          <option value="">All Modules</option>
          <option value="auth">Authentication</option>
          <option value="employees">Employees</option>
          <option value="leaves">Leaves</option>
          <option value="attendance">Attendance</option>
          <option value="payroll">Payroll</option>
          <option value="projects">Projects</option>
          <option value="timesheets">Timesheets</option>
          <option value="expenses">Expenses</option>
          <option value="organization">Organization</option>
          <option value="settings">Settings</option>
        </select>
      </div>

      <!-- Action Filter -->
      <div class="w-full">
        <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Action Type</label>
        <select
          [(ngModel)]="selectedAction"
          (change)="applyFilters()"
          class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 cursor-pointer transition-all font-semibold text-slate-700">
          <option value="">All Actions</option>
          <option value="CREATE">Create</option>
          <option value="UPDATE">Update</option>
          <option value="DELETE">Delete</option>
          <option value="LOGIN">Login</option>
          <option value="LOGOUT">Logout</option>
          <option value="APPROVE">Approve</option>
          <option value="REJECT">Reject</option>
          <option value="VIEW">View</option>
          <option value="EXPORT">Export</option>
        </select>
      </div>

      <!-- From Date -->
      <div class="w-full">
        <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">From Date</label>
        <input
          type="date"
          [(ngModel)]="startDate"
          (change)="applyFilters()"
          class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-semibold text-slate-700">
      </div>

      <!-- To Date -->
      <div class="w-full">
        <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">To Date</label>
        <input
          type="date"
          [(ngModel)]="endDate"
          (change)="applyFilters()"
          class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-semibold text-slate-700">
      </div>
    </div>

    <!-- Active Filters Display -->'''

html = filters_pattern.sub(new_filters, html)

with open(path, 'w', encoding='utf-8') as f:
    f.write(html)
