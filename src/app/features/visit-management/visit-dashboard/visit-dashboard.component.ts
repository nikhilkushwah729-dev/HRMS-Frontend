import { Component, inject, signal } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { VisitManagementService, Visitor } from '../../../core/services/visit-management.service';

@Component({
  selector: 'app-visit-dashboard',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="space-y-6">
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="card p-6">
          <div class="flex items-center">
            <div class="p-3 rounded-full bg-green-100">
              <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-slate-600">Today's Visitors</p>
              <p class="text-3xl font-bold text-slate-900">{{ stats().today }}</p>
            </div>
          </div>
        </div>
        
        <div class="card p-6">
          <div class="flex items-center">
            <div class="p-3 rounded-full bg-blue-100">
              <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-slate-600">Active Visitors</p>
              <p class="text-3xl font-bold text-slate-900">{{ stats().active }}</p>
            </div>
          </div>
        </div>

        <div class="card p-6">
          <div class="flex items-center">
            <div class="p-3 rounded-full bg-orange-100">
              <svg class="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-slate-600">Pending Invites</p>
              <p class="text-3xl font-bold text-slate-900">{{ stats().pending }}</p>
            </div>
          </div>
        </div>

        <div class="card p-6">
          <div class="flex items-center">
            <div class="p-3 rounded-full bg-purple-100">
              <svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-slate-600">Total Visitors</p>
              <p class="text-3xl font-bold text-slate-900">{{ stats().total }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Visitors Table -->
      <div class="card">
        <div class="p-6 border-b border-slate-200">
          <h2 class="text-xl font-bold text-slate-900">Recent Visitors</h2>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-slate-50">
              <tr>
                <th class="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Name</th>
                <th class="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Company</th>
                <th class="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Host</th>
                <th class="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
                <th class="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Check In</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr *ngFor="let visitor of recentVisitors()" class="hover:bg-slate-50">
                <td class="px-6 py-4">
                  <div class="flex items-center">
                    <div class="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                      <span class="text-sm font-semibold text-slate-900">{{ visitor.name | slice:0:1 | uppercase }}</span>
                    </div>
                    <div class="ml-3">
                      <p class="font-semibold text-slate-900">{{ visitor.name }}</p>
                      <p class="text-sm text-slate-500">{{ visitor.email }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span class="px-2 py-1 bg-slate-100 text-xs font-medium rounded-full text-slate-700">{{ visitor.company }}</span>
                </td>
                <td class="px-6 py-4">
                  <span class="font-medium text-slate-900">{{ visitor.hostName }}</span>
                </td>
                <td class="px-6 py-4">
                  <span class="px-3 py-1 rounded-full text-xs font-bold" 
                        [ngClass]="{
                          'bg-green-100 text-green-800': visitor.status === 'checked-in',
                          'bg-blue-100 text-blue-800': visitor.status === 'pending',
                          'bg-slate-100 text-slate-800': visitor.status === 'checked-out'
                        }">
                    {{ visitor.status | titlecase }}
                  </span>
                </td>
                <td class="px-6 py-4 text-sm text-slate-600">
                  {{ visitor.checkInTime | date:'short' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card {
      @apply bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden;
    }
  `]
})
export class VisitDashboardComponent {
  visitService = inject(VisitManagementService);

  stats = signal({ today: 23, active: 5, pending: 12, total: 156 });
  recentVisitors = signal<Visitor[]>([]);
}
