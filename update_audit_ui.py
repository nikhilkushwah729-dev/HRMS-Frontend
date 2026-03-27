import re

with open(r'd:\HRMS_FRONTEND\src\app\features\admin\audit-logs.component.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace Hero
content = re.sub(
    r'<div class="app-module-hero">.*?</div>\n      <div class="flex flex-wrap gap-3">',
    r'''<div class="rounded-3xl p-6 md:p-8 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl relative overflow-hidden">
    <div class="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute bottom-0 left-20 w-60 h-60 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
    <div class="relative flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
      <div>
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-teal-400 flex items-center justify-center shadow-lg shadow-teal-500/20 ring-4 ring-white/10">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
          </div>
          <div>
            <p class="text-[11px] font-black tracking-widest uppercase text-indigo-300 mb-1">Audit Center</p>
            <h1 class="text-2xl md:text-3xl font-black text-white tracking-tight">System Audit Trail</h1>
            <p class="text-indigo-100/70 text-sm mt-1.5 max-w-xl leading-relaxed">Track security activity, data mutations, and user actions with complete searchable visibility.</p>
          </div>
        </div>
      </div>
      <div class="flex flex-wrap gap-3">''',
    content,
    flags=re.DOTALL
)

# Replace Auto Refresh button
content = content.replace(
    '''[ngClass]="autoRefreshEnabled()
            ? 'bg-green-100 text-green-700 border-2 border-green-200 hover:bg-green-200'
            : 'bg-slate-50 text-slate-600 border-2 border-slate-200 hover:bg-slate-100'">''',
    '''[ngClass]="autoRefreshEnabled()
            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]'
            : 'bg-white/10 text-slate-300 border border-white/10 hover:bg-white/20 hover:text-white'">'''
)
content = content.replace('''class="px-4 py-2.5 rounded-md font-bold text-sm flex items-center gap-2 transition-all duration-200"''', '''class="px-5 py-2.5 rounded-full font-bold text-sm flex items-center gap-2.5 transition-all duration-300 backdrop-blur-md"''')

# Replace Export CSV Button
content = content.replace(
    '''class="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-2 border-emerald-200 px-4 py-2.5 rounded-md font-bold text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-sm">''',
    '''class="bg-white/10 text-white hover:bg-white/20 border border-white/20 px-5 py-2.5 rounded-full font-bold text-sm flex items-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 backdrop-blur-md hover:shadow-lg hover:shadow-white/5">'''
)

# Replace Refresh Button
content = content.replace(
    '''class="bg-primary-600 text-white hover:bg-primary-700 px-5 py-2.5 rounded-md font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg hover:shadow-primary-500/25">''',
    '''class="bg-indigo-500 text-white hover:bg-indigo-400 px-6 py-2.5 rounded-full font-bold text-sm flex items-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-indigo-500/25">'''
)

# Replace Stats Summary Wrapper
content = re.sub(
    r'<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">.*?</div>\n  </div>\n\n  <!-- Filters Section -->',
    r'''<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10 relative">
      <div class="bg-white/5 backdrop-blur-sm rounded-2xl p-4 md:p-5 border border-white/10 hover:bg-white/10 transition-colors">
        <div class="flex items-center gap-3.5">
          <div class="w-11 h-11 rounded-xl bg-blue-500/20 flex items-center justify-center ring-1 ring-blue-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div>
            <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total Logs</p>
            <p class="text-xl md:text-2xl font-black text-white tracking-tight mt-0.5">{{ totalItems() | number }}</p>
          </div>
        </div>
      </div>
      <div class="bg-white/5 backdrop-blur-sm rounded-2xl p-4 md:p-5 border border-white/10 hover:bg-white/10 transition-colors">
        <div class="flex items-center gap-3.5">
          <div class="w-11 h-11 rounded-xl bg-emerald-500/20 flex items-center justify-center ring-1 ring-emerald-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <div>
            <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Today</p>
            <p class="text-xl md:text-2xl font-black text-white tracking-tight mt-0.5">{{ todayCount }}</p>
          </div>
        </div>
      </div>
      <div class="bg-white/5 backdrop-blur-sm rounded-2xl p-4 md:p-5 border border-white/10 hover:bg-white/10 transition-colors">
        <div class="flex items-center gap-3.5">
          <div class="w-11 h-11 rounded-xl bg-amber-500/20 flex items-center justify-center ring-1 ring-amber-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>
          </div>
          <div>
            <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">This Week</p>
            <p class="text-xl md:text-2xl font-black text-white tracking-tight mt-0.5">{{ weekCount }}</p>
          </div>
        </div>
      </div>
      <div class="bg-white/5 backdrop-blur-sm rounded-2xl p-4 md:p-5 border border-white/10 hover:bg-white/10 transition-colors">
        <div class="flex items-center gap-3.5">
          <div class="w-11 h-11 rounded-xl bg-purple-500/20 flex items-center justify-center ring-1 ring-purple-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div>
            <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Active</p>
            <p class="text-xl md:text-2xl font-black text-white tracking-tight mt-0.5">{{ uniqueUsers }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Filters Section -->''',
    content,
    flags=re.DOTALL
)

# Filters Block
content = content.replace(
    '''<div class="bg-white p-5 rounded-md border border-slate-100 shadow-sm">''',
    '''<div class="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm shadow-slate-200/50">'''
)
content = content.replace('''class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-md text-sm focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all"''', '''class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-medium"''')

content = content.replace('''<select
          [(ngModel)]="selectedModule"
          (change)="applyFilters()"
          class="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-md text-sm focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 cursor-pointer transition-all">''', '''<select
          [(ngModel)]="selectedModule"
          (change)="applyFilters()"
          class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 cursor-pointer transition-all font-medium">''')

content = content.replace('''<select
          [(ngModel)]="selectedAction"
          (change)="applyFilters()"
          class="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-md text-sm focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 cursor-pointer transition-all">''', '''<select
          [(ngModel)]="selectedAction"
          (change)="applyFilters()"
          class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 cursor-pointer transition-all font-medium">''')

content = content.replace('''<input
          type="date"
          [(ngModel)]="startDate"
          (change)="applyFilters()"
          class="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-md text-sm focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all">''', '''<input
          type="date"
          [(ngModel)]="startDate"
          (change)="applyFilters()"
          class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-medium">''')

content = content.replace('''<input
          type="date"
          [(ngModel)]="endDate"
          (change)="applyFilters()"
          class="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-md text-sm focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all">''', '''<input
          type="date"
          [(ngModel)]="endDate"
          (change)="applyFilters()"
          class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-medium">''')


# Table Info & Pagination Controls
content = content.replace(
    '''<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-md border border-slate-100">''',
    '''<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm">'''
)

# Table Wrapper
content = content.replace(
    '''<div class="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">''',
    '''<div class="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm">'''
)

# User Avatar Fallback
content = content.replace(
    '''<div
                    class="w-10 h-10 rounded-md flex items-center justify-center text-sm font-black flex-shrink-0"''',
    '''<div
                    class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 shadow-sm ring-2 ring-white"'''
)

# Details button
content = content.replace(
    '''class="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200 transition-all">''',
    '''class="px-4 py-1.5 bg-white border border-slate-200 rounded-full text-[11px] font-bold tracking-wide uppercase text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm">'''
)


# Modal Wrapper
content = content.replace(
    '''<div class="relative inline-block align-bottom bg-white rounded-md text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">''',
    '''<div class="relative inline-block align-bottom bg-white rounded-3xl text-left overflow-hidden shadow-2xl shadow-indigo-900/10 transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full border border-slate-100">'''
)

# Modal Header
content = content.replace(
    '''<div class="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4 flex items-center justify-between">''',
    '''<div class="bg-slate-900 px-6 py-5 flex items-center justify-between border-b border-white/10">'''
)

# Modal Body Cards
content = content.replace('''class="bg-slate-50 rounded-md p-4"''', '''class="bg-slate-50/70 rounded-2xl p-4 border border-slate-100"''')
content = content.replace('''class="bg-slate-50 rounded-md p-4 mb-4"''', '''class="bg-slate-50/70 rounded-2xl p-5 mb-4 border border-slate-100"''')
content = content.replace('''class="bg-red-50 rounded-md p-4 mb-4 border border-red-100"''', '''class="bg-red-50/70 rounded-2xl p-5 mb-4 border border-red-100"''')
content = content.replace('''class="bg-emerald-50 rounded-md p-4 mb-4 border border-emerald-100"''', '''class="bg-emerald-50/70 rounded-2xl p-5 mb-4 border border-emerald-100"''')

content = content.replace('''class="mt-4 bg-slate-900 rounded-md overflow-hidden h-40 relative group border border-slate-800"''', '''class="mt-4 bg-slate-900 rounded-2xl overflow-hidden h-44 relative group border border-slate-800 shadow-inner"''')

content = content.replace('''<!-- No Changes Message -->
        <div *ngIf="!selectedLog()?.oldValues && !selectedLog()?.newValues" class="bg-slate-50 rounded-md p-6 text-center">''', '''<!-- No Changes Message -->
        <div *ngIf="!selectedLog()?.oldValues && !selectedLog()?.newValues" class="bg-slate-50 rounded-2xl p-6 border border-slate-100 text-center">''')


with open(r'd:\HRMS_FRONTEND\src\app\features\admin\audit-logs.component.html', 'w', encoding='utf-8') as f:
    f.write(content)
