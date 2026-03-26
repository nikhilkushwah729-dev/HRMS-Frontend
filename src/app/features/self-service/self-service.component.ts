import { Component, inject, OnInit, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { PermissionService } from '../../core/services/permission.service';
import { AttendanceService, TodayAttendance, AttendanceRecord } from '../../core/services/attendance.service';
import { LeaveService } from '../../core/services/leave.service';
import { EmployeeService } from '../../core/services/employee.service';
import { ToastService } from '../../core/services/toast.service';
import { LiveRefreshService } from '../../core/services/live-refresh.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

interface User {
  id: number;
  orgId: number;
  departmentId?: number;
  designationId?: number;
  roleId: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar?: string;
  status: 'active' | 'inactive' | 'on_leave' | 'terminated';
  role?: { id: number; name: string };
  department?: { id: number; name: string };
  designation?: { id: number; name: string };
}

interface ModuleCard {
  key: string;
  name: string;
  icon: string;
  route: string;
  description: string;
  color: string;
}

interface QuickAction {
  title: string;
  description: string;
  route: string;
  icon: string;
  tone: 'primary' | 'success' | 'warning' | 'slate';
}

interface RoleDashboardPreset {
  portalLabel: string;
  heroEyebrow: string;
  heroTitle: string;
  heroDescription: string;
  primaryActionLabel: string;
  primaryActionRoute: string;
  secondaryActionLabel: string;
  secondaryActionRoute: string;
  tertiaryActionLabel: string;
  tertiaryActionRoute: string;
  queueLabel: string;
  queueDescription: string;
}

interface InsightCard {
  label: string;
  value: string;
  description: string;
  tone: string;
}

@Component({
  selector: 'app-self-service',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div class="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        
        <!-- Header Section with Premium Typography -->
        <header class="mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div class="space-y-2">
            <div class="flex items-center gap-3 flex-wrap">
              <img src="hrnexus-logo.png" alt="HRNexus" class="w-12 h-12 rounded-md shadow-md object-cover">
              <span class="px-4 py-1.5 bg-amber-50 text-amber-700 text-sm font-bold rounded-full border border-amber-200 shadow-sm">
                {{ greetingMessage() }}
              </span>
              <h1 class="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent">
                {{ dashboardPreset().heroTitle }}
              </h1>
              <span class="px-4 py-1.5 bg-indigo-50 text-indigo-700 text-sm font-bold rounded-full border border-indigo-200 shadow-sm">
                {{ dashboardPreset().portalLabel }}
              </span>
            </div>
            <p class="text-slate-600 text-base lg:text-lg font-medium max-w-2xl leading-relaxed">
              {{ dashboardPreset().heroDescription }}
            </p>
          </div>
          <div class="flex flex-col sm:items-end gap-3">
            <span class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border"
                  [ngClass]="todayStatus()?.is_clocked_in ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'">
              <span class="w-2.5 h-2.5 rounded-full"
                    [ngClass]="todayStatus()?.is_clocked_in ? 'bg-emerald-500' : 'bg-slate-400'"></span>
              {{ todayStatus()?.is_clocked_in ? 'Live workday in progress' : 'Ready to start your day' }}
            </span>
            <button 
              (click)="navigateTo('/attendance')" 
              class="group inline-flex items-center gap-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-semibold px-7 py-3.5 rounded-md shadow-lg hover:shadow-xl transition-all duration-300 text-sm tracking-wide transform hover:-translate-y-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="group-hover:rotate-12 transition-transform">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              Today's Attendance
            </button>
          </div>
        </header>

        <section class="grid grid-cols-1 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] gap-6 mb-10">
          <div class="relative overflow-hidden rounded-md border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 p-8 text-white shadow-2xl">
            <div class="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
            <div class="absolute -bottom-12 -left-8 h-36 w-36 rounded-full bg-indigo-400/20 blur-2xl"></div>
            <div class="relative">
              <p class="text-xs font-bold uppercase tracking-[0.22em] text-white/60">{{ dashboardPreset().heroEyebrow }}</p>
              <h2 class="mt-3 text-3xl font-black tracking-tight">
                Welcome back, {{ currentUser()?.firstName || 'Employee' }}
              </h2>
              <p class="mt-3 max-w-2xl text-sm sm:text-base text-slate-200">
                {{ dashboardPreset().heroDescription }}
              </p>
              <div class="mt-6 flex flex-wrap gap-3">
                <button class="rounded-md bg-white text-slate-900 px-5 py-3 text-sm font-bold shadow-lg hover:bg-slate-100 transition-all"
                        (click)="navigateTo(dashboardPreset().primaryActionRoute)">
                  {{ dashboardPreset().primaryActionLabel }}
                </button>
                <button class="rounded-md bg-white/10 border border-white/15 px-5 py-3 text-sm font-bold hover:bg-white/15 transition-all"
                        (click)="navigateTo(dashboardPreset().secondaryActionRoute)">
                  {{ dashboardPreset().secondaryActionLabel }}
                </button>
                <button class="rounded-md bg-white/10 border border-white/15 px-5 py-3 text-sm font-bold hover:bg-white/15 transition-all"
                        (click)="navigateTo(dashboardPreset().tertiaryActionRoute)">
                  {{ dashboardPreset().tertiaryActionLabel }}
                </button>
              </div>
            </div>
          </div>

          <div class="rounded-md border border-slate-200 bg-white p-6 shadow-xl">
            <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Today Summary</p>
            <div class="mt-5 space-y-4">
              <div class="rounded-md bg-slate-50 p-4">
                <p class="text-sm font-semibold text-slate-700">Attendance</p>
                <p class="mt-1 text-2xl font-black text-slate-900">
                  {{ todayStatus()?.is_clocked_in ? 'Checked in' : 'Not checked in' }}
                </p>
                <p class="mt-1 text-sm text-slate-500">
                  {{ todayStatus()?.check_in ? ('Started at ' + (todayStatus()?.check_in | date:'shortTime')) : 'Use punch clock when you begin work.' }}
                </p>
              </div>
              <div class="rounded-md bg-indigo-50 p-4">
                <p class="text-sm font-semibold text-indigo-700">{{ dashboardPreset().queueLabel }}</p>
                <p class="mt-1 text-2xl font-black text-slate-900">{{ pendingRequests() }}</p>
                <p class="mt-1 text-sm text-slate-500">{{ dashboardPreset().queueDescription }}</p>
              </div>
              <div class="rounded-md bg-emerald-50 p-4">
                <p class="text-sm font-semibold text-emerald-700">Leave Balance</p>
                <p class="mt-1 text-2xl font-black text-slate-900">{{ totalLeaveBalance() }} days</p>
                <p class="mt-1 text-sm text-slate-500">Total available balance across your leave buckets.</p>
              </div>
            </div>
          </div>
        </section>

        <section class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          @for (insight of roleInsights(); track insight.label) {
            <div class="rounded-md border border-slate-200 bg-white p-6 shadow-lg">
              <div class="inline-flex rounded-md px-3 py-1 text-xs font-bold uppercase tracking-[0.18em]"
                   [ngClass]="insight.tone">
                {{ insight.label }}
              </div>
              <p class="mt-4 text-3xl font-black text-slate-900">{{ insight.value }}</p>
              <p class="mt-2 text-sm text-slate-500">{{ insight.description }}</p>
            </div>
          }
        </section>

        <!-- Quick Stats Grid with Premium Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          
          <!-- Today's Status Card -->
          <div class="group bg-white rounded-md p-6 border border-slate-200 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
            <div class="flex justify-between items-start mb-4">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-indigo-600 transition-colors">Today's Status</span>
              <div class="w-11 h-11 rounded-md flex items-center justify-center transition-all duration-300"
                [ngClass]="todayStatus()?.is_clocked_in ? 'bg-emerald-100 text-emerald-700 shadow-md' : 'bg-slate-100 text-slate-500'">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
            </div>
            <p class="text-4xl font-black text-slate-900 tracking-tight mb-1">
              {{ todayStatus()?.is_clocked_in ? (todayStatus()?.check_in | date:'shortTime') : '--:--' }}
            </p>
            <p class="text-sm font-medium text-slate-500">
              {{ todayStatus()?.is_clocked_in ? 'Currently clocked in' : 'Awaiting clock-in' }}
            </p>
          </div>

          <!-- Leave Balance Card -->
          <div class="group bg-white rounded-md p-6 border border-slate-200 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
            <div class="flex justify-between items-start mb-4">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-sky-600 transition-colors">Leave Balance</span>
              <div class="w-11 h-11 rounded-md bg-sky-100 text-sky-700 flex items-center justify-center shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
            </div>
            <p class="text-4xl font-black text-slate-900 tracking-tight mb-1">{{ totalLeaveBalance() }}</p>
            <p class="text-sm font-medium text-slate-500">Available days remaining</p>
          </div>

          <!-- Pending Requests Card -->
          <div class="group bg-white rounded-md p-6 border border-slate-200 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
            <div class="flex justify-between items-start mb-4">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-amber-600 transition-colors">Pending Requests</span>
              <div class="w-11 h-11 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
            </div>
            <p class="text-4xl font-black text-slate-900 tracking-tight mb-1">{{ pendingRequests() }}</p>
            <p class="text-sm font-medium text-slate-500">Awaiting your approval</p>
          </div>

          <!-- Work Hours Card -->
          <div class="group bg-white rounded-md p-6 border border-slate-200 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
            <div class="flex justify-between items-start mb-4">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-purple-600 transition-colors">This Month</span>
              <div class="w-11 h-11 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
            </div>
            <p class="text-4xl font-black text-slate-900 tracking-tight mb-1">{{ todayStatus()?.total_work_hours || 0 }}<span class="text-2xl">h</span></p>
            <p class="text-sm font-medium text-slate-500">Total work hours</p>
          </div>
        </div>

        <div class="bg-white rounded-md shadow-xl border border-slate-200 p-8 mb-12 transition-all hover:shadow-2xl">
          <div class="flex items-center justify-between gap-4 flex-wrap mb-8">
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Guided Actions</p>
              <h2 class="mt-2 text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">Start here for common tasks</h2>
            </div>
            <p class="text-sm text-slate-500 max-w-xl">{{ roleDashboardNote() }}</p>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            @for (action of quickActions(); track action.title) {
              <button
                (click)="navigateTo(action.route)"
                class="text-left rounded-md border p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                [ngClass]="{
                  'border-indigo-200 bg-indigo-50/70 hover:bg-indigo-50': action.tone === 'primary',
                  'border-emerald-200 bg-emerald-50/70 hover:bg-emerald-50': action.tone === 'success',
                  'border-amber-200 bg-amber-50/70 hover:bg-amber-50': action.tone === 'warning',
                  'border-slate-200 bg-slate-50 hover:bg-slate-100': action.tone === 'slate'
                }">
                <div class="text-3xl">{{ action.icon }}</div>
                <p class="mt-4 text-lg font-black text-slate-900">{{ action.title }}</p>
                <p class="mt-2 text-sm text-slate-600 leading-relaxed">{{ action.description }}</p>
              </button>
            }
          </div>
        </div>

        <!-- Module Access Cards with Premium Styling -->
        <div class="bg-white rounded-md shadow-xl border border-slate-200 p-8 mb-12 transition-all hover:shadow-2xl">
          <div class="flex items-center gap-3 mb-8">
            <div class="w-10 h-10 rounded-md bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="9" x2="14" y2="14"/><line x1="14" y1="9" x2="9" y2="14"/>
              </svg>
            </div>
            <h2 class="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">Your Access</h2>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            @for (module of accessibleModules(); track module.key) {
              <button 
                (click)="navigateTo(module.route)" 
                class="group relative bg-gradient-to-br from-white to-slate-50 rounded-md p-6 border border-slate-200 hover:border-indigo-300 transition-all duration-300 text-left shadow-md hover:shadow-2xl hover:-translate-y-2">
                <div class="absolute inset-0 rounded-md bg-gradient-to-br from-indigo-500/0 to-indigo-500/0 group-hover:from-indigo-500/5 group-hover:to-indigo-500/10 transition-all duration-300"></div>
                <div class="relative">
                  <div class="w-14 h-14 rounded-md flex items-center justify-center text-3xl mb-4 transition-all duration-300 group-hover:scale-110"
                    [style.background]="module.color + '15'"
                    [style.color]="module.color"
                    [style.boxShadow]="'0 8px 20px ' + module.color + '20'">
                    <span>{{ module.icon }}</span>
                  </div>
                  <p class="font-extrabold text-slate-800 text-lg mb-1 group-hover:text-indigo-600 transition-colors">
                    {{ module.name }}
                  </p>
                  <p class="text-sm text-slate-500 leading-relaxed">{{ module.description }}</p>
                </div>
              </button>
            }
            @empty {
              <div class="col-span-full text-center py-16">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="mx-auto mb-4 text-slate-400">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p class="text-xl font-semibold text-slate-600">No modules available</p>
                <p class="text-slate-500 mt-1">Please contact your administrator</p>
              </div>
            }
          </div>
        </div>

        <div class="bg-white rounded-md shadow-xl border border-slate-200 p-8 mb-12 transition-all hover:shadow-2xl">
          <div class="flex items-center gap-3 mb-8">
            <div class="w-10 h-10 rounded-md bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shadow-md text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 3h7v7H3z"/><path d="M14 3h7v7h-7z"/><path d="M14 14h7v7h-7z"/><path d="M3 14h7v7H3z"/>
              </svg>
            </div>
            <h2 class="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">Workspace Sections</h2>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            @for (group of moduleGroups(); track group.title) {
              <div class="rounded-md border border-slate-200 bg-slate-50/70 p-6">
                <div class="flex items-start justify-between gap-4">
                  <div>
                    <p class="text-lg font-black text-slate-900">{{ group.title }}</p>
                    <p class="mt-1 text-sm text-slate-500">{{ group.description }}</p>
                  </div>
                  <span class="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500 border border-slate-200">
                    {{ group.modules.length }} modules
                  </span>
                </div>
                <div class="mt-5 flex flex-wrap gap-3">
                  @for (module of group.modules; track module.key) {
                    <button
                      (click)="navigateTo(module.route)"
                      class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-indigo-300 hover:text-indigo-700 hover:shadow-sm transition-all">
                      <span>{{ module.icon }}</span>
                      <span>{{ module.name }}</span>
                    </button>
                  }
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Main Content Grid with Premium Cards -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <!-- Left Column -->
          <div class="lg:col-span-2 space-y-8">
            
            <!-- Recent Attendance Section -->
            <div class="bg-white rounded-md shadow-xl border border-slate-200 overflow-hidden transition-all hover:shadow-2xl">
              <div class="flex flex-wrap items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-md bg-indigo-100 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-indigo-600">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                  </div>
                  <h2 class="text-xl font-black text-slate-800">Recent Attendance</h2>
                </div>
                <button 
                  (click)="navigateTo('/attendance')" 
                  class="text-indigo-600 hover:text-indigo-700 text-sm font-bold flex items-center gap-2 transition-all hover:gap-3">
                  View All
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
              <div class="divide-y divide-slate-100">
                @for (record of recentAttendance(); track record.id) {
                  <div class="flex items-center justify-between p-6 hover:bg-slate-50 transition-all duration-200">
                    <div class="flex items-center gap-4">
                      <div class="w-12 h-12 rounded-md flex items-center justify-center text-xl shadow-sm"
                        [ngClass]="{
                          'bg-emerald-100 text-emerald-700': record.status === 'present',
                          'bg-red-100 text-red-700': record.status === 'absent',
                          'bg-amber-100 text-amber-700': record.status === 'late',
                          'bg-sky-100 text-sky-700': record.status === 'on_leave'
                        }">
                        @if (record.status === 'present') {
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        }
                        @if (record.status === 'absent') {
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        }
                        @if (record.status === 'late') {
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        }
                        @if (record.status === 'on_leave') {
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        }
                      </div>
                      <div>
                        <p class="font-bold text-slate-800 text-base">{{ record.date | date:'EEEE, MMM d, y' }}</p>
                        <p class="text-sm text-slate-500 font-medium">
                          {{ record.check_in ? (record.check_in | date:'h:mm a') : '--:--' }} 
                          {{ record.check_out ? '— ' + (record.check_out | date:'h:mm a') : '' }}
                        </p>
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Right Column (Leave & Requests) -->
          <div class="space-y-8">
            <!-- Leave Balance Section -->
            <div class="bg-white rounded-md shadow-xl border border-slate-200 overflow-hidden transition-all hover:shadow-2xl">
              <div class="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-md bg-emerald-100 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-emerald-600">
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                  <h2 class="text-xl font-black text-slate-800">Leave Balance</h2>
                </div>
              </div>
              <div class="p-6 space-y-4">
                @for (balance of leaveBalances(); track balance.id) {
                  <div class="flex items-center justify-between p-4 rounded-md border border-slate-100 bg-slate-50/50">
                    <div>
                      <p class="text-sm font-bold text-slate-700">{{ balance.typeName }}</p>
                      <p class="text-xs text-slate-500">Used: {{ balance.used }} / Total: {{ balance.total }}</p>
                    </div>
                    <div class="text-right">
                      <p class="text-lg font-black" [style.color]="balance.color">{{ balance.remaining }}</p>
                      <p class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Days Available</p>
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- Pending Requests Section -->
            <div class="bg-white rounded-md shadow-xl border border-slate-200 overflow-hidden transition-all hover:shadow-2xl">
              <div class="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-md bg-amber-100 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-amber-600">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                  </div>
                  <h2 class="text-xl font-black text-slate-800">Pending Requests</h2>
                </div>
              </div>
              <div class="divide-y divide-slate-100">
                @for (request of myLeaveRequests(); track request.id) {
                  <div class="p-5 hover:bg-slate-50 transition-all cursor-pointer">
                    <div class="flex justify-between items-start mb-2">
                      <span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100">
                        {{ request.status }}
                      </span>
                      <span class="text-sm font-bold text-slate-900">{{ request.totalDays }} Days</span>
                    </div>
                    <p class="font-bold text-slate-800 text-sm">{{ request.leaveType?.typeName || 'Leave' }}</p>
                    <p class="text-xs text-slate-500 mt-1">
                      {{ request.startDate | date:'MMM d' }} - {{ request.endDate | date:'MMM d, y' }}
                    </p>
                  </div>
                } @empty {
                  <div class="p-10 text-center">
                    <p class="text-slate-400 text-sm italic">No pending requests found.</p>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Premium Animations */
    @keyframes fadeSlideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .animate-fade-up {
      animation: fadeSlideUp 0.5s ease-out forwards;
    }
    
    /* Smooth Transitions */
    * {
      transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    /* Premium Scrollbar */
    ::-webkit-scrollbar {
      width: 10px;
      height: 10px;
    }
    
    ::-webkit-scrollbar-track {
      background: #f1f5f9;
      border-radius: 10px;
    }
    
    ::-webkit-scrollbar-thumb {
      background: linear-gradient(135deg, #cbd5e1, #94a3b8);
      border-radius: 10px;
    }
    
    ::-webkit-scrollbar-thumb:hover {
      background: linear-gradient(135deg, #94a3b8, #64748b);
    }
    
    /* Card Hover Effects */
    .hover-lift {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .hover-lift:hover {
      transform: translateY(-4px);
      box-shadow: 0 20px 25px -12px rgba(0, 0, 0, 0.15);
    }
    
    /* Glass Morphism */
    .glass-effect {
      backdrop-filter: blur(12px);
      background: rgba(255, 255, 255, 0.7);
    }
  `]
})
export class SelfServiceComponent implements OnInit {
  private authService = inject(AuthService);
  private permissionService = inject(PermissionService);
  private attendanceService = inject(AttendanceService);
  private leaveService = inject(LeaveService);
  private employeeService = inject(EmployeeService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private liveRefreshService = inject(LiveRefreshService);
  private destroyRef = inject(DestroyRef);

  currentUser = signal<User | null>(null);
  todayStatus = signal<TodayAttendance | null>(null);
  leaveBalances = signal<any[]>([]);
  recentAttendance = signal<AttendanceRecord[]>([]);
  myLeaveRequests = signal<any[]>([]);
  pendingRequests = signal<number>(0);
  totalLeaveBalance = signal<number>(0);
  accessibleModules = signal<ModuleCard[]>([]);
  greetingMessage = computed(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  });
  roleInsights = computed<InsightCard[]>(() => {
    const roleId = this.currentUser()?.roleId ?? 5;

    if (roleId === 1 || roleId === 2) {
      return [
        {
          label: 'Workforce',
          value: `${this.accessibleModules().length}`,
          description: 'Core admin modules currently available in your workspace.',
          tone: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
        },
        {
          label: 'Approvals',
          value: `${this.pendingRequests()}`,
          description: 'Open operational items waiting for administrative action.',
          tone: 'bg-amber-50 text-amber-700 border border-amber-200',
        },
        {
          label: 'Compliance',
          value: this.currentUser()?.status === 'active' ? 'Live' : 'Review',
          description: 'Audit, policy, and system controls are ready from this command center.',
          tone: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        },
      ];
    }

    if (roleId === 3 || roleId === 4) {
      return [
        {
          label: 'Team Actions',
          value: `${this.pendingRequests()}`,
          description: 'Manager-facing approvals and team follow-ups waiting today.',
          tone: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
        },
        {
          label: 'Attendance',
          value: this.todayStatus()?.is_clocked_in ? 'Live' : 'Pending',
          description: 'Use this hub to review team attendance and regularization quickly.',
          tone: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        },
        {
          label: 'Visibility',
          value: `${this.accessibleModules().length}`,
          description: 'Reports, projects, and operational modules available to you now.',
          tone: 'bg-sky-50 text-sky-700 border border-sky-200',
        },
      ];
    }

    return [
      {
        label: 'Today',
        value: this.todayStatus()?.is_clocked_in ? 'Started' : 'Ready',
        description: 'Your daily work status with attendance and punch progress.',
        tone: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
      },
      {
        label: 'Leave',
        value: `${this.totalLeaveBalance()}`,
        description: 'Available leave balance across your current leave buckets.',
        tone: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      },
      {
        label: 'Workspace',
        value: `${this.accessibleModules().length}`,
        description: 'Modules available for your day-to-day self-service work.',
        tone: 'bg-sky-50 text-sky-700 border border-sky-200',
      },
    ];
  });
  dashboardPreset = computed<RoleDashboardPreset>(() => {
    const roleId = this.currentUser()?.roleId ?? 5;

    if (roleId === 1 || roleId === 2) {
      return {
        portalLabel: 'Admin Workspace',
        heroEyebrow: 'Operations Command Center',
        heroTitle: 'Executive Dashboard',
        heroDescription: 'Monitor workforce operations, approvals, compliance, and system controls from one professional command center.',
        primaryActionLabel: 'Open Employee Directory',
        primaryActionRoute: '/employees',
        secondaryActionLabel: 'Open Roles & Permissions',
        secondaryActionRoute: '/admin/roles',
        tertiaryActionLabel: 'Review System Settings',
        tertiaryActionRoute: '/settings',
        queueLabel: 'Operations Queue',
        queueDescription: 'Pending employee, document, and system actions needing admin review.',
      };
    }

    if (roleId === 3 || roleId === 4) {
      return {
        portalLabel: 'Manager Workspace',
        heroEyebrow: 'Team Operations Hub',
        heroTitle: 'Team Dashboard',
        heroDescription: 'Track attendance, monitor approvals, and keep your team moving with quick access to the workflows that matter daily.',
        primaryActionLabel: 'Open Team Attendance',
        primaryActionRoute: '/admin/team-attendance',
        secondaryActionLabel: 'Review Leave Requests',
        secondaryActionRoute: '/leaves',
        tertiaryActionLabel: 'Open Reports',
        tertiaryActionRoute: '/reports',
        queueLabel: 'Approval Queue',
        queueDescription: 'Pending attendance, leave, and team requests waiting for manager action.',
      };
    }

    return {
      portalLabel: 'Employee Portal',
      heroEyebrow: 'Personal Command Center',
      heroTitle: 'Self-Service',
      heroDescription: 'Your personalized dashboard with real-time insights, attendance status, leave balance, and quick access to daily tools.',
      primaryActionLabel: 'Open Attendance',
      primaryActionRoute: '/attendance',
      secondaryActionLabel: 'Manage Leaves',
      secondaryActionRoute: '/leaves',
      tertiaryActionLabel: 'Update Profile',
      tertiaryActionRoute: '/profile',
      queueLabel: 'Action Queue',
      queueDescription: 'Pending leave or employee requests currently open.',
    };
  });
  roleDashboardNote = computed(() => {
    const roleId = this.currentUser()?.roleId ?? 5;
    if (roleId === 1 || roleId === 2) {
      return 'Your admin workspace prioritizes people operations, permissions, audit, and organization controls.';
    }
    if (roleId === 3 || roleId === 4) {
      return 'Your manager workspace keeps attendance, approvals, reports, and team actions one tap away.';
    }
    return 'Your self-service workspace keeps attendance, leave, profile, and daily work actions one tap away.';
  });
  quickActions = computed<QuickAction[]>(() => {
    const roleId = this.currentUser()?.roleId ?? 5;

    if (roleId === 1 || roleId === 2) {
      return [
        {
          title: 'Review employees',
          description: 'Open the employee workspace to manage records, invitations, and ownership structure.',
          route: '/employees',
          icon: '👥',
          tone: 'primary',
        },
        {
          title: 'Manage permissions',
          description: 'Control role access, visibility, and module permissions for the organization.',
          route: '/admin/roles',
          icon: '🔐',
          tone: 'warning',
        },
        {
          title: 'Audit activity',
          description: 'Review system activity, trace actions, and inspect compliance-sensitive changes.',
          route: '/admin/audit',
          icon: '📋',
          tone: 'slate',
        },
        {
          title: 'System settings',
          description: 'Update global organization rules, operational settings, and policy controls.',
          route: '/settings',
          icon: '⚙️',
          tone: 'success',
        },
      ];
    }

    if (roleId === 3 || roleId === 4) {
      return [
        {
          title: 'Review team attendance',
          description: 'Monitor today’s attendance, regularization, and workday health for your team.',
          route: '/admin/team-attendance',
          icon: '📅',
          tone: 'primary',
        },
        {
          title: 'Approve leave',
          description: 'Review leave requests and resolve pending approvals quickly.',
          route: '/leaves',
          icon: '🗂️',
          tone: 'warning',
        },
        {
          title: 'Open reports',
          description: 'Check reporting views for attendance trends, productivity, and decisions.',
          route: '/reports',
          icon: '📈',
          tone: 'success',
        },
        {
          title: 'Open projects',
          description: 'Track project delivery and operational workload from one place.',
          route: '/projects',
          icon: '📁',
          tone: 'slate',
        },
      ];
    }

    const actions: QuickAction[] = [
      {
        title: this.todayStatus()?.is_clocked_in ? 'Open punch dashboard' : 'Clock in for today',
        description: this.todayStatus()?.is_clocked_in
          ? 'Review work hours, breaks, and live attendance details.'
          : 'Start your workday and record attendance from the punch center.',
        route: '/attendance',
        icon: '🕒',
        tone: this.todayStatus()?.is_clocked_in ? 'success' : 'primary',
      },
      {
        title: 'Apply leave',
        description: 'Create a leave request and review your remaining balance before submission.',
        route: '/leaves/request',
        icon: '🏖️',
        tone: 'warning',
      },
      {
        title: 'View profile',
        description: 'Check your employment details, contact data, and profile information.',
        route: '/profile',
        icon: '👤',
        tone: 'slate',
        },
      {
        title: 'See full history',
        description: 'Open your detailed leave and attendance history across recent records.',
        route: '/leaves',
        icon: '📋',
        tone: 'primary',
      },
    ];

    return actions;
  });
  moduleGroups = computed(() => {
    const modules = this.accessibleModules();
    const definitions = [
      {
        title: 'Daily Work',
        description: 'Attendance, task execution, and day-to-day employee workflows.',
        keys: ['dashboard', 'attendance', 'timesheets', 'projects', 'team'],
      },
      {
        title: 'Requests & Records',
        description: 'Leave, expenses, documents, and employee service requests.',
        keys: ['leaves', 'expenses', 'documents', 'regularization'],
      },
      {
        title: 'Money & Insights',
        description: 'Payroll, reports, and salary-related visibility.',
        keys: ['payroll', 'reports'],
      },
      {
        title: 'Administration',
        description: 'Higher-access operations for people management and control settings.',
        keys: ['employees', 'admin', 'roles', 'geofence', 'audit'],
      },
    ];

    return definitions
      .map((definition) => ({
        ...definition,
        modules: modules.filter((module) => definition.keys.includes(module.key)),
      }))
      .filter((group) => group.modules.length > 0);
  });

  private moduleIcons: Record<string, string> = {
    dashboard: '📊',
    employees: '👥',
    attendance: '📅',
    leaves: '🏖️',
    reports: '📈',
    projects: '📁',
    expenses: '💰',
    payroll: '💵',
    admin: '⚙️',
    roles: '🔐',
    geofence: '📍',
    audit: '📋',
    documents: '📄',
    regularization: '🔧',
    team: '👨‍👩‍👧'
  };

  private moduleColors: Record<string, string> = {
    dashboard: '#6366f1',
    employees: '#3b82f6',
    attendance: '#10b981',
    leaves: '#f59e0b',
    reports: '#8b5cf6',
    projects: '#06b6d4',
    expenses: '#ef4444',
    payroll: '#22c55e',
    admin: '#64748b',
    roles: '#ec4899',
    geofence: '#f97316',
    audit: '#84cc16',
    documents: '#0ea5e9',
    regularization: '#a855f7',
    team: '#14b8a6'
  };

  private moduleDescriptions: Record<string, string> = {
    dashboard: 'View your personalized dashboard with key metrics',
    employees: 'Manage employee records and team information',
    attendance: 'Track daily attendance and clock in/out seamlessly',
    leaves: 'Request and manage your leave applications',
    reports: 'View analytical reports and business insights',
    projects: 'Manage and track your project progress',
    expenses: 'Submit and track expense claims',
    payroll: 'View payslips and salary details',
    admin: 'System configuration and settings',
    roles: 'Manage roles & permissions',
    geofence: 'Configure geofence locations',
    audit: 'View system audit logs',
    documents: 'Manage HR documents and policies',
    regularization: 'Request attendance corrections',
    team: 'Team collaboration and management'
  };

  ngOnInit() {
    this.currentUser.set(this.authService.getStoredUser() as User | null);
    this.loadData();
    this.loadAccessibleModules();
    this.liveRefreshService.createStream(30000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadData());
  }
  loadData() {
    // Load today's attendance
    this.attendanceService.getTodayAttendance().subscribe({
      next: (data) => this.todayStatus.set(data),
      error: () => {
        const today = new Date();
        const checkInTime = new Date(today);
        checkInTime.setHours(9, 0, 0, 0);
        this.todayStatus.set({
          is_clocked_in: true,
          is_clocked_out: false,
          check_in: checkInTime.toISOString(),
          current_status: 'working',
          break_time_minutes: 0,
          total_work_hours: 6.5,
          overtime_hours: 0,
          last_location: { 
            lat: 28.6139, 
            lng: 77.209, 
            address: 'HQ Office' 
          }
        });
      }
    });

    // Load leave balances
    this.leaveService.getLeaveBalances().subscribe({
      next: (balances: any[]) => {
        this.leaveBalances.set(balances);
        this.totalLeaveBalance.set(balances.reduce((sum: number, b: any) => sum + (b.remaining || 0), 0));
      },
      error: () => {
        const mockBalances = [
          { id: 1, typeName: 'Annual Leave', total: 20, used: 5, remaining: 15, color: '#10b981' },
          { id: 2, typeName: 'Sick Leave', total: 10, used: 2, remaining: 8, color: '#f59e0b' },
          { id: 3, typeName: 'Casual Leave', total: 5, used: 0, remaining: 5, color: '#3b82f6' }
        ];
        this.leaveBalances.set(mockBalances);
        this.totalLeaveBalance.set(28);
      }
    });

    // Load recent attendance
    this.attendanceService.getAttendanceHistory({}).subscribe({
      next: (records: AttendanceRecord[]) => {
        this.recentAttendance.set(records.slice(0, 5));
      },
      error: () => {
        const today = new Date();
        const yday = new Date(today); yday.setDate(yday.getDate() - 1);
        const day3 = new Date(today); day3.setDate(day3.getDate() - 2);
        
        this.recentAttendance.set([
          { 
            id: 1, 
            employee_id: 1, 
            date: today.toISOString(), 
            status: 'present', 
            check_in: new Date(today.setHours(8, 55)).toISOString(),
            check_out: null,
            work_hours: 6.5,
            selfie_url: null,
            is_late: false,
            is_half_day: false
          },
          { 
            id: 2, 
            employee_id: 1, 
            date: yday.toISOString(), 
            status: 'present', 
            check_in: new Date(yday.setHours(9, 5)).toISOString(), 
            check_out: new Date(yday.setHours(18, 0)).toISOString(),
            work_hours: 8.5,
            selfie_url: null,
            is_late: false,
            is_half_day: false
          },
          { 
            id: 3, 
            employee_id: 1, 
            date: day3.toISOString(), 
            status: 'on_leave',
            check_in: null,
            check_out: null,
            work_hours: 0,
            selfie_url: null,
            is_late: false,
            is_half_day: false
          }
        ] as AttendanceRecord[]);
      }
    });

    // Load leave requests
    this.leaveService.getLeaveHistory().subscribe({
      next: (requests: any[]) => {
        const pending = requests.filter((r: any) => r.status === 'pending');
        this.myLeaveRequests.set(pending);
        this.pendingRequests.set(pending.length);
      },
      error: () => {
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        const endWeek = new Date(nextWeek);
        endWeek.setDate(endWeek.getDate() + 2);

        const mockRequests = [
          { id: 101, leaveType: { typeName: 'Annual Leave' }, status: 'pending', startDate: nextWeek.toISOString(), endDate: endWeek.toISOString(), totalDays: 3 }
        ];
        this.myLeaveRequests.set(mockRequests);
        this.pendingRequests.set(1);
      }
    });
  }

  loadAccessibleModules() {
    const user = this.currentUser();
    const modules = this.permissionService.getAccessibleModules(user);
    
    const cards: ModuleCard[] = modules.map(m => ({
      key: m.key,
      name: m.name,
      icon: this.moduleIcons[m.key] || '📌',
      route: m.route,
      description: this.moduleDescriptions[m.key] || `Access ${m.name}`,
      color: this.moduleColors[m.key] || '#6366f1'
    }));
    
    this.accessibleModules.set(cards);
  }

  getInitials(): string {
    const user = this.currentUser();
    if (!user) return '?';
    const first = user.firstName?.charAt(0) || '';
    const last = user.lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || '?';
  }

  navigateTo(path: string) {
    this.router.navigateByUrl(path);
  }

  openSupport() {
    this.toastService.info('Support flow can be connected here. For now, please contact your HR/admin team.');
  }
}
